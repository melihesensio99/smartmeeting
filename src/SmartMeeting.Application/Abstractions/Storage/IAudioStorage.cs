namespace SmartMeeting.Application.Abstractions.Storage;

public interface IAudioStorage
{
    Task<string> SaveAsync(Stream audio, string originalFileName, string contentType, CancellationToken cancellationToken);
    Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken);
}
