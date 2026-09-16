using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Infrastructure.Ai;

public sealed class MistralSpeechToTextService(HttpClient httpClient, IOptions<MistralOptions> options) : ISpeechToTextService
{
    public async Task<string> TranscribeAsync(Stream audio, string fileName, CancellationToken cancellationToken)
    {
        var configuration = options.Value;
        if (string.IsNullOrWhiteSpace(configuration.ApiKey)) throw new InvalidOperationException("Mistral API anahtarı yapılandırılmamış.");
        using var request = new HttpRequestMessage(HttpMethod.Post, "audio/transcriptions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", configuration.ApiKey);
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(configuration.TranscriptionModel), "model");
        var audioContent = new StreamContent(audio);
        audioContent.Headers.ContentType = new MediaTypeHeaderValue(ContentTypeFor(fileName));
        form.Add(audioContent, "file", fileName);
        request.Content = form;
        using var response = await httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(body);
        return document.RootElement.GetProperty("text").GetString() ?? throw new InvalidOperationException("Mistral boş transkript döndürdü.");
    }

    private static string ContentTypeFor(string fileName) => Path.GetExtension(fileName).ToLowerInvariant() switch
    {
        ".wav" => "audio/wav",
        ".mp3" => "audio/mpeg",
        ".m4a" => "audio/mp4",
        ".ogg" => "audio/ogg",
        _ => "audio/webm"
    };
}
