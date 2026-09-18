using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Processing.Contracts;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Infrastructure.Processing;

public sealed class MeetingProcessingWorker(
    IMeetingProcessingQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<MeetingProcessingWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in ReadQueue(stoppingToken))
        {
            try
            {
                await ProcessAsync(message.MeetingId, stoppingToken);
                await queue.CompleteAsync(message, false, stoppingToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Toplantı işlenemedi: {MeetingId}", message.MeetingId);
                try
                {
                    await MarkFailedAsync(message.MeetingId, stoppingToken);
                }
                catch (Exception statusException)
                {
                    logger.LogError(statusException, "Toplantı başarısız duruma kaydedilemedi: {MeetingId}", message.MeetingId);
                }
                await queue.CompleteAsync(message, false, stoppingToken);
                await PublishAsync(message.MeetingId, "Failed", stoppingToken);
            }
        }
    }

    private async Task ProcessAsync(Guid meetingId, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var speechToText = scope.ServiceProvider.GetRequiredService<ISpeechToTextService>();
        var audioStorage = scope.ServiceProvider.GetRequiredService<IAudioStorage>();
        var summarizer = scope.ServiceProvider.GetRequiredService<IAiSummarizerService>();
        var meeting = await db.GetMeetingAsync(meetingId, cancellationToken) ?? throw new DomainException("Toplantı bulunamadı.");
        await PublishAsync(meetingId, "Processing", cancellationToken);
        var audioPath = meeting.AudioFilePath ?? throw new DomainException("Ses dosyası yolu bulunamadı.");
        await using var audio = await audioStorage.OpenReadAsync(audioPath, cancellationToken);
        var transcript = await speechToText.TranscribeAsync(audio, Path.GetFileName(audioPath), cancellationToken);
        transcript = SpeakerLabelResolver.Resolve(transcript, meeting.Participants);
        meeting.SetTranscript(transcript);
        var summary = await summarizer.SummarizeAsync(transcript, meeting.Notes, cancellationToken);
        meeting.SetSummary(summary);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(meetingId, "Ready", cancellationToken);
    }

    private async Task MarkFailedAsync(Guid meetingId, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var meeting = await db.GetMeetingAsync(meetingId, cancellationToken);
        if (meeting is null) return;
        meeting.MarkFailed();
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var publisher = scope.ServiceProvider.GetService<IMeetingStatusPublisher>();
        if (publisher is not null) await publisher.PublishAsync(meetingId, status, cancellationToken);
    }

    private async IAsyncEnumerable<QueuedMeeting> ReadQueue([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested) yield return await queue.DequeueAsync(cancellationToken);
    }
}
