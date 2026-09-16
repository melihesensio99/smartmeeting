using SmartMeeting.Domain.Meetings;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Abstractions;

public interface ICurrentUserService
{
    string? UserId { get; }
    bool IsAuthenticated { get; }
    bool CanAccess(string organizerId) => !IsAuthenticated || UserId == organizerId;
}

public interface IApplicationDbContext
{
    void AddMeeting(Meeting meeting);
    Task<Meeting?> GetMeetingAsync(Guid meetingId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ISpeechToTextService
{
    Task<string> TranscribeAsync(Stream audio, string fileName, CancellationToken cancellationToken);
}

public interface IAiSummarizerService
{
    Task<MeetingSummary> SummarizeAsync(string transcript, CancellationToken cancellationToken);
}

public interface IAudioStorage
{
    Task<string> SaveAsync(Stream audio, string originalFileName, string contentType, CancellationToken cancellationToken);
    Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken);
}

public interface IMeetingProcessingQueue
{
    ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken);
    ValueTask<QueuedMeeting> DequeueAsync(CancellationToken cancellationToken);
    ValueTask CompleteAsync(QueuedMeeting message, bool requeue, CancellationToken cancellationToken);
}

public sealed record QueuedMeeting(Guid MeetingId, string Receipt);

public interface IMeetingStatusPublisher
{
    Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken);
}

public interface IEmailService
{
    Task SendMeetingSummaryAsync(Meeting meeting, CancellationToken cancellationToken);
}

public interface IIdentityService
{
    Task<Result<RegisteredUser>> RegisterAsync(string email, string password, string displayName, CancellationToken cancellationToken);
    Task<Result<AuthenticatedUser>> LoginAsync(string email, string password, CancellationToken cancellationToken);
}

public interface IJwtTokenService
{
    AuthToken CreateToken(string userId, string email, string displayName);
}

public sealed record RegisteredUser(string UserId, string Email, string DisplayName);
public sealed record AuthenticatedUser(string UserId, string Email, string DisplayName, string AccessToken, DateTimeOffset ExpiresAt);
public sealed record AuthToken(string Value, DateTimeOffset ExpiresAt);
