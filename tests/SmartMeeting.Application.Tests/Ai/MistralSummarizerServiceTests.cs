using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SmartMeeting.Domain.Meetings;
using SmartMeeting.Infrastructure.Ai;

namespace SmartMeeting.Application.Tests.Ai;

public sealed class MistralSummarizerServiceTests
{
    [Fact]
    public async Task SummarizeAsync_sends_json_schema_request_and_maps_response()
    {
        var handler = new StubHandler();
        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://api.mistral.ai/v1/") };
        var service = new MistralSummarizerService(client, Options.Create(new MistralOptions { ApiKey = "test-key" }));

        var summary = await service.SummarizeAsync("Toplantıda lansman tarihi 20 Eylül olarak kararlaştırıldı.", null, CancellationToken.None);

        Assert.Equal("Lansman tarihi belirlendi.", summary.Overview);
        Assert.Single(summary.Decisions);
        Assert.Equal("Lansman tarihini duyur", summary.ActionItems.Single().Description);
        Assert.Equal(ActionPriority.Medium, summary.ActionItems.Single().Priority);
        Assert.Equal("Bearer", handler.AuthorizationScheme);
        Assert.Contains("json_schema", handler.RequestBody);

        using var requestDocument = JsonDocument.Parse(handler.RequestBody);
        var systemPrompt = requestDocument.RootElement
            .GetProperty("messages")[0]
            .GetProperty("content")
            .GetString();

        Assert.NotNull(systemPrompt);
        Assert.Contains("Türkiye Türkçesinin güncel yazım, noktalama", systemPrompt);
        Assert.Contains("tam bir yönetici toplantı raporu", systemPrompt);
        Assert.Contains("hiçbir bilgi, karar, tarih, kişi, sorumlu, risk veya sonuç uydurma", systemPrompt);
        Assert.Contains("Yalnızca istenen JSON şemasına uygun tek bir nesne döndür", systemPrompt);
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public string AuthorizationScheme { get; private set; } = string.Empty;
        public string RequestBody { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            AuthorizationScheme = request.Headers.Authorization?.Scheme ?? string.Empty;
            RequestBody = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(new
                {
                    choices = new[] { new { message = new { content = "{\"overview\":\"Lansman tarihi belirlendi.\",\"decisions\":[\"20 Eylül\"],\"actionItems\":[{\"description\":\"Lansman tarihini duyur\",\"assignee\":null,\"dueAt\":null}]}" } } }
                })
            };
        }
    }
}
