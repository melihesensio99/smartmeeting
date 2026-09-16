using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Infrastructure.Services;

public sealed class DemoSpeechToTextService : ISpeechToTextService
{
    public Task<string> TranscribeAsync(Stream audio, string fileName, CancellationToken cancellationToken)
        => Task.FromResult("Bu demo transkriptidir. Gerçek ortamda Whisper veya Azure Speech adapter'ı burada çalışır.");
}
