using System.Threading.Channels;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Infrastructure.Processing;

public sealed class InMemoryMeetingProcessingQueue : IMeetingProcessingQueue
{
    private readonly Channel<Guid> _queue = Channel.CreateUnbounded<Guid>();
    public ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken) => _queue.Writer.WriteAsync(meetingId, cancellationToken);
    public ValueTask<Guid> DequeueAsync(CancellationToken cancellationToken) => _queue.Reader.ReadAsync(cancellationToken);
}
