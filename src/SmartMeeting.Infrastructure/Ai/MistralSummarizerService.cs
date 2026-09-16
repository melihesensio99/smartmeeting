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
                        dueAt = new { type = new[] { "string", "null" } }
                    },
                    required = new[] { "description", "assignee", "dueAt" },
                    additionalProperties = false
                }
            }
        },
        required = new[] { "overview", "decisions", "actionItems" },
        additionalProperties = false
    };

    public async Task<MeetingSummary> SummarizeAsync(string transcript, CancellationToken cancellationToken)
    {
        var configuration = options.Value;
        if (string.IsNullOrWhiteSpace(configuration.ApiKey)) throw new InvalidOperationException("Mistral API anahtarı yapılandırılmamış.");
        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", configuration.ApiKey);
        request.Content = JsonContent.Create(new
        {
            model = configuration.Model,
            temperature = 0.1,
            messages = new object[]
            {
                new { role = "system", content = "Toplantı transkriptini Türkçe olarak özetle. Yalnızca istenen JSON şemasına uygun çıktı üret. dueAt bilinmiyorsa null kullan." },
                new { role = "user", content = transcript }
            },
            response_format = new { type = "json_schema", json_schema = new { name = "meeting_summary", schema = ResponseSchema, strict = true } }
        });
        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(responseBody);
        var content = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        if (string.IsNullOrWhiteSpace(content)) throw new InvalidOperationException("Mistral boş özet döndürdü.");
        var result = JsonSerializer.Deserialize<MistralSummaryResponse>(content, JsonOptions) ?? throw new InvalidOperationException("Mistral structured output okunamadı.");
        return MeetingSummary.Create(result.Overview, result.Decisions, result.ActionItems.Select(x => new ActionItem(x.Description, x.Assignee, ParseDate(x.DueAt))));
    }

    private static DateTimeOffset? ParseDate(string? value) => DateTimeOffset.TryParse(value, out var date) ? date : null;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}
