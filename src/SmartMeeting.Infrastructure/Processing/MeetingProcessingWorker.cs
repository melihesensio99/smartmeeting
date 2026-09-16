using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Infrastructure.Processing;

public sealed class MeetingProcessingWorker(
    IMeetingProcessingQueue queue,
    ILogger<MeetingProcessingWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var meetingId in ReadQueue(stoppingToken))
            logger.LogInformation("Toplantı işleme kuyruğa alındı: {MeetingId}", meetingId);
    }

    private async IAsyncEnumerable<Guid> ReadQueue([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested) yield return await queue.DequeueAsync(cancellationToken);
    }
}
