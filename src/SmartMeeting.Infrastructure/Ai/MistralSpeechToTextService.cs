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
        form.Add(new StringContent(configuration.EnableDiarization ? "true" : "false"), "diarize");
        if (configuration.EnableDiarization)
        {
            form.Add(new StringContent("segment"), "timestamp_granularities[]");
        }
        var audioContent = new StreamContent(audio);
        audioContent.Headers.ContentType = new MediaTypeHeaderValue(ContentTypeFor(fileName));
        form.Add(audioContent, "file", fileName);
        request.Content = form;
        using var response = await httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var safeBody = body.Length > 1000 ? body[..1000] : body;
            throw new InvalidOperationException($"Mistral STT çağrısı başarısız oldu ({(int)response.StatusCode}): {safeBody}");
        }
        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        var text = root.GetProperty("text").GetString() ?? throw new InvalidOperationException("Mistral boş transkript döndürdü.");
        if (!configuration.EnableDiarization || !root.TryGetProperty("segments", out var segments) || segments.ValueKind != JsonValueKind.Array || segments.GetArrayLength() == 0) return text;
        var labeledSegments = segments.EnumerateArray().Select(segment => FormatSegment(segment)).Where(segment => segment is not null).Cast<string>().ToList();
        return labeledSegments.Count == 0 ? text : string.Join(Environment.NewLine, labeledSegments);
    }

    private static string ContentTypeFor(string fileName) => Path.GetExtension(fileName).ToLowerInvariant() switch
    {
        ".wav" => "audio/wav",
        ".mp3" => "audio/mpeg",
        ".m4a" => "audio/mp4",
        ".ogg" => "audio/ogg",
        _ => "audio/webm"
    };

    private static string? FormatSegment(JsonElement segment)
    {
        if (!segment.TryGetProperty("text", out var textElement)) return null;
        var text = textElement.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(text)) return null;
        var speaker = segment.TryGetProperty("speaker", out var speakerElement) ? speakerElement.GetString() : null;
        var start = segment.TryGetProperty("start", out var startElement) ? startElement.ToString() : null;
        var end = segment.TryGetProperty("end", out var endElement) ? endElement.ToString() : null;
        var time = start is not null && end is not null ? $" [{start}-{end}]" : string.Empty;
        return $"{speaker ?? "Konuşmacı"}{time}: {text}";
    }
}
