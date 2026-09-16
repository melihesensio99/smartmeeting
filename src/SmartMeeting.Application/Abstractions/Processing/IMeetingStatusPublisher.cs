namespace SmartMeeting.Application.Abstractions.Processing;

public interface IMeetingStatusPublisher
{
    Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken);
}
