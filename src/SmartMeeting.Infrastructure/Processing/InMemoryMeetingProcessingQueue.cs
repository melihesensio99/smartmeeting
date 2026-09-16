using System.Threading.Channels;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Infrastructure.Processing;

public sealed class InMemoryMeetingProcessingQueue : IMeetingProcessingQueue
{
    private readonly Channel<QueuedMeeting> _queue = Channel.CreateUnbounded<QueuedMeeting>();
    public ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken) => _queue.Writer.WriteAsync(new QueuedMeeting(meetingId, string.Empty), cancellationToken);
    public ValueTask<QueuedMeeting> DequeueAsync(CancellationToken cancellationToken) => _queue.Reader.ReadAsync(cancellationToken);
    public ValueTask CompleteAsync(QueuedMeeting message, bool requeue, CancellationToken cancellationToken) => ValueTask.CompletedTask;
}
