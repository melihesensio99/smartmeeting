using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using SmartMeeting.Application.Abstractions.Ai;
using SmartMeeting.Application.Abstractions.Persistence;
using SmartMeeting.Application.Abstractions.Processing;
using SmartMeeting.Application.Abstractions.Storage;
using SmartMeeting.Application.Processing.Contracts;
using SmartMeeting.Domain.Meetings;
using SmartMeeting.Infrastructure.Processing;

namespace SmartMeeting.Infrastructure.Tests;

public sealed class MeetingProcessingWorkerTests
{
    [Fact]
    public async Task Worker_transcribes_summarizes_persists_and_publishes_ready()
    {
        var meeting = CreateProcessingMeeting();
        var queue = new TestQueue(new QueuedMeeting(meeting.Id, "receipt-1"));
        var context = new TestDbContext(meeting);
        var publisher = new TestStatusPublisher();
        using var provider = BuildProvider(queue, context, publisher, new TestSpeechToTextService("transcript"), new TestSummarizerService());
        using var cancellation = new CancellationTokenSource();
        var worker = new MeetingProcessingWorker(queue, provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<MeetingProcessingWorker>.Instance);

        await worker.StartAsync(cancellation.Token);
        await publisher.Ready.Task.WaitAsync(TimeSpan.FromSeconds(2));
        await cancellation.CancelAsync();
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal("transcript", meeting.Transcript);
        Assert.NotNull(meeting.Summary);
        Assert.Equal(["Processing", "Ready"], publisher.Statuses);
        Assert.Contains(queue.Completed, message => message.Receipt == "receipt-1");
    }

    [Fact]
    public async Task Worker_publishes_failed_and_acknowledges_message_when_processing_fails()
    {
        var meeting = CreateProcessingMeeting();
        var queue = new TestQueue(new QueuedMeeting(meeting.Id, "receipt-2"));
        var context = new TestDbContext(meeting);
        var publisher = new TestStatusPublisher();
        using var provider = BuildProvider(queue, context, publisher, new TestSpeechToTextService(exception: new InvalidOperationException("STT unavailable")), new TestSummarizerService());
        using var cancellation = new CancellationTokenSource();
        var worker = new MeetingProcessingWorker(queue, provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<MeetingProcessingWorker>.Instance);

        await worker.StartAsync(cancellation.Token);
        await publisher.Failed.Task.WaitAsync(TimeSpan.FromSeconds(2));
        await cancellation.CancelAsync();
        await worker.StopAsync(CancellationToken.None);

        Assert.Contains("Failed", publisher.Statuses);
        Assert.Contains(queue.Completed, message => message.Receipt == "receipt-2");
    }

    private static ServiceProvider BuildProvider(TestQueue queue, TestDbContext context, TestStatusPublisher publisher, TestSpeechToTextService speechToText, TestSummarizerService summarizer)
    {
        var services = new ServiceCollection();
        services.AddScoped<IApplicationDbContext>(_ => context);
        services.AddScoped<IAudioStorage, TestAudioStorage>();
        services.AddScoped<ISpeechToTextService>(_ => speechToText);
        services.AddScoped<IAiSummarizerService>(_ => summarizer);
        services.AddScoped<IMeetingStatusPublisher>(_ => publisher);
        return services.BuildServiceProvider();
    }

    private static Meeting CreateProcessingMeeting()
    {
        var meeting = Meeting.Create("Worker testi", "organizer", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("audio.webm");
        return meeting;
    }

    private sealed class TestQueue(QueuedMeeting message) : IMeetingProcessingQueue
    {
        private int readCount;
        public List<QueuedMeeting> Completed { get; } = [];
        public ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken) => ValueTask.CompletedTask;
        public async ValueTask<QueuedMeeting> DequeueAsync(CancellationToken cancellationToken)
        {
            if (Interlocked.Exchange(ref readCount, 1) == 0) return message;
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            throw new OperationCanceledException(cancellationToken);
        }
        public ValueTask CompleteAsync(QueuedMeeting value, bool requeue, CancellationToken cancellationToken) { Completed.Add(value); return ValueTask.CompletedTask; }
    }

    private sealed class TestDbContext(Meeting meeting) : IApplicationDbContext
    {
        public void AddMeeting(Meeting value) => throw new NotImplementedException();
        public Task<Meeting?> GetMeetingAsync(Guid meetingId, CancellationToken cancellationToken) => Task.FromResult<Meeting?>(meeting.Id == meetingId ? meeting : null);
        public Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyCollection<Meeting>>([meeting]);
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken) => Task.FromResult(1);
    }

    private sealed class TestAudioStorage : IAudioStorage
    {
        public Task<string> SaveAsync(Stream audio, string originalFileName, string contentType, CancellationToken cancellationToken) => Task.FromResult("audio.webm");
        public Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken) => Task.FromResult<Stream>(new MemoryStream([1, 2, 3]));
    }

    private sealed class TestSpeechToTextService(string? transcript = null, Exception? exception = null) : ISpeechToTextService
    {
        public Task<string> TranscribeAsync(Stream audio, string fileName, CancellationToken cancellationToken) => exception is null ? Task.FromResult(transcript!) : Task.FromException<string>(exception);
    }

    private sealed class TestSummarizerService : IAiSummarizerService
    {
        public Task<MeetingSummary> SummarizeAsync(string transcript, string? notes, CancellationToken cancellationToken) => Task.FromResult(MeetingSummary.Create("Özet", [], []));
    }

    private sealed class TestStatusPublisher : IMeetingStatusPublisher
    {
        public List<string> Statuses { get; } = [];
        public TaskCompletionSource<bool> Ready { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource<bool> Failed { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken)
        {
            Statuses.Add(status);
            if (status == "Ready") Ready.TrySetResult(true);
            if (status == "Failed") Failed.TrySetResult(true);
            return Task.CompletedTask;
        }
    }
}
