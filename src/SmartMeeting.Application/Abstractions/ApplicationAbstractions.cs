using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Abstractions;

public interface IApplicationDbContext
{
    void AddMeeting(Meeting meeting);
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

public interface IMeetingProcessingQueue
{
    ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken);
    ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken);
}
