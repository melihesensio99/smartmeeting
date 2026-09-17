using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Domain.Meetings;
using SmartMeeting.Infrastructure.Ai.Contracts;

namespace SmartMeeting.Infrastructure.Ai;

public sealed class MistralSummarizerService(HttpClient httpClient, IOptions<MistralOptions> options) : IAiSummarizerService
{
    private const string SystemPrompt = """
        Sen kurumsal toplantı kayıtlarını Türkçe olarak raporlayan bir toplantı analistisin.

        Genel yazım kuralları:
        - Türkiye Türkçesinin güncel yazım, noktalama ve büyük/küçük harf kurallarına uy.
        - Anlatımı doğal, profesyonel, açık ve yönetici seviyesinde okunabilir tut.
        - Kişi adlarını, kurum/ürün adlarını, marka adlarını ve teknik terimleri transkriptte geçtiği biçimiyle koru; anlamını değiştirme.
        - Transkriptte bulunmayan hiçbir bilgi, karar, tarih, kişi, sorumlu, risk veya sonuç uydurma.
        - Belirsiz veya doğrulanamayan bilgileri kesinleşmiş gibi yazma. Sorumlu ya da tarih açıkça belirtilmiyorsa null kullan.
        - Konuşmacı etiketleri varsa bunları doğru kişi adlarıyla eşleştir; eşleşme yoksa Speaker 1 gibi etiketi olduğu gibi bırak.
        - Kullanıcı notlarını yardımcı bağlam olarak değerlendir; transkriptle çelişen veya kanıtlanamayan notları gerçek kabul etme.

        Raporlama kuralları:
        - overview alanını tam bir yönetici toplantı raporu olarak hazırla. Toplantının amacı/bağlamı, öne çıkan görüşmeler, ulaşılan sonuç, açık kalan konular ve varsa riskleri akıcı bir metin içinde kapsa.
        - overview kısa bir slogan veya tek cümle olmasın; gereksiz tekrar yapmadan yeterli ayrıntı içersin. Bilgi yoksa ilgili bölümü uydurma ve metni doğal biçimde kısalt.
        - decisions alanına yalnızca toplantıda açıkça alınmış veya üzerinde uzlaşılmış kararları, her biri anlaşılır ve eylem odaklı ayrı bir madde olarak yaz.
        - actionItems alanına yalnızca takip gerektiren somut işleri ekle. description net ve uygulanabilir olsun.
        - assignee sadece açıkça belirtilen kişi/rol ise doldurulmalı; tahmin edilmemeli.
        - dueAt yalnızca açıkça belirtilen bir tarih veya son teslim zamanı varsa ISO 8601 biçiminde yazılmalı; bilinmiyorsa null olmalı.
        - priority aciliyet açıkça anlaşılıyorsa low, medium veya high değerlerinden biri olmalı; aksi durumda medium kullan.

        Teknik çıktı kuralları:
        - Yalnızca istenen JSON şemasına uygun tek bir nesne döndür.
        - Markdown, kod bloğu, açıklama, önsöz veya şema dışında ek alan döndürme.
        - JSON içindeki tüm metinler Türkçe ve doğru noktalama işaretleriyle yazılmalı.
        """;

    private static readonly object ResponseSchema = new
    {
        type = "object",
        properties = new
        {
            overview = new { type = "string" },
            decisions = new { type = "array", items = new { type = "string" } },
            actionItems = new
            {
                type = "array",
                items = new
                {
                    type = "object",
                    properties = new
                    {
                        description = new { type = "string" },
                        assignee = new { type = new[] { "string", "null" } },
                        dueAt = new { type = new[] { "string", "null" } },
                        priority = new { type = "string", @enum = new[] { "low", "medium", "high" } }
                    },
                    required = new[] { "description", "assignee", "dueAt", "priority" },
                    additionalProperties = false
                }
            }
        },
        required = new[] { "overview", "decisions", "actionItems" },
        additionalProperties = false
    };

    public async Task<MeetingSummary> SummarizeAsync(string transcript, string? notes, CancellationToken cancellationToken)
    {
        var configuration = options.Value;
        if (string.IsNullOrWhiteSpace(configuration.ApiKey)) throw new InvalidOperationException("Mistral API anahtarı yapılandırılmamış.");
        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", configuration.ApiKey);
        var meetingContent = string.IsNullOrWhiteSpace(notes)
            ? transcript
            : $"TOPLANTI TRANSKRİPTİ:\n{transcript}\n\nKULLANICI NOTLARI:\n{notes}";
        request.Content = JsonContent.Create(new
        {
            model = configuration.Model,
            temperature = 0.1,
            messages = new object[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = meetingContent }
            },
            response_format = new { type = "json_schema", json_schema = new { name = "meeting_summary", schema = ResponseSchema, strict = true } }
        });
        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var safeBody = responseBody.Length > 1000 ? responseBody[..1000] : responseBody;
            throw new InvalidOperationException($"Mistral özetleme çağrısı başarısız oldu ({(int)response.StatusCode}): {safeBody}");
        }
        using var document = JsonDocument.Parse(responseBody);
        var content = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        if (string.IsNullOrWhiteSpace(content)) throw new InvalidOperationException("Mistral boş özet döndürdü.");
        var result = JsonSerializer.Deserialize<MistralSummaryResponse>(content, JsonOptions) ?? throw new InvalidOperationException("Mistral structured output okunamadı.");
        // AI yalnızca aday aksiyon metni üretir. Gerçek sorumlu ataması toplantıdaki kayıtlı
        // katılımcılar arasından yönetici tarafından yapılmalıdır; serbest metin isimleri güvenilir kimlik değildir.
        return MeetingSummary.Create(result.Overview, result.Decisions, result.ActionItems.Select(x => new ActionItem(x.Description, assignee: null, dueAt: ParseDate(x.DueAt), priority: ParsePriority(x.Priority))));
    }

    private static DateTimeOffset? ParseDate(string? value) => DateTimeOffset.TryParse(value, out var date) ? date : null;
    private static ActionPriority ParsePriority(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "high" => ActionPriority.High,
        "low" => ActionPriority.Low,
        _ => ActionPriority.Medium
    };
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}
