using SmartMeeting.Application.Processing.Contracts;

namespace SmartMeeting.Application.Abstractions.Processing;

public interface IMeetingProcessingQueue
{
    ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken);
    ValueTask<QueuedMeeting> DequeueAsync(CancellationToken cancellationToken);
    ValueTask CompleteAsync(QueuedMeeting message, bool requeue, CancellationToken cancellationToken);
}
