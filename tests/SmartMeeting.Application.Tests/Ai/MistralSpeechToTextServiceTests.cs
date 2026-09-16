using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using SmartMeeting.Infrastructure.Ai;

namespace SmartMeeting.Application.Tests.Ai;

public sealed class MistralSpeechToTextServiceTests
{
    [Fact]
    public async Task TranscribeAsync_posts_audio_multipart_and_returns_text()
    {
        var handler = new StubHandler();
        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://api.mistral.ai/v1/") };
        var service = new MistralSpeechToTextService(client, Options.Create(new MistralOptions { ApiKey = "test-key" }));
        await using var audio = new MemoryStream([1, 2, 3]);

        var result = await service.TranscribeAsync(audio, "meeting.webm", CancellationToken.None);

        Assert.Equal("Toplantı metni", result);
        Assert.Contains("voxtral-mini-latest", handler.RequestBody);
        Assert.Contains("meeting.webm", handler.RequestBody);
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public string RequestBody { get; private set; } = string.Empty;
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestBody = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = JsonContent.Create(new { text = "Toplantı metni" }) };
        }
    }
}
