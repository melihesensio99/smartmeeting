using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Abstractions;

public interface IApplicationDbContext
{
    void AddMeeting(Meeting meeting);
    Task<Meeting?> GetMeetingAsync(Guid meetingId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ISpeechToTextService
{
    Task<string> TranscribeAsync(string audioFilePath, CancellationToken cancellationToken);
}

public interface IAiSummarizerService
{
    Task<MeetingSummary> SummarizeAsync(string transcript, CancellationToken cancellationToken);
}

public interface IAudioStorage
{
    Task<string> SaveAsync(Stream audio, string originalFileName, string contentType, CancellationToken cancellationToken);
}

public interface IMeetingProcessingQueue
{
    ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken);
    ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken);
}

public interface IMeetingStatusPublisher
{
    Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken);
}
