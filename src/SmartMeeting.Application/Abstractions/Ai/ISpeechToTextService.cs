namespace SmartMeeting.Application.Abstractions.Ai;

public interface ISpeechToTextService
{
    Task<string> TranscribeAsync(Stream audio, string fileName, CancellationToken cancellationToken);
}
