using Microsoft.Extensions.Options;
using SmartMeeting.Infrastructure.Processing;

namespace SmartMeeting.Infrastructure.Tests;

public sealed class RabbitMqMeetingProcessingQueueTests
{
    [Fact]
    [Trait("Category", "Integration")]
    public async Task RabbitMq_queue_round_trips_a_meeting_message()
    {
        var password = Environment.GetEnvironmentVariable("SMARTMEETING_RABBIT_PASSWORD");
        if (string.IsNullOrWhiteSpace(password)) return;

        await using var queue = new RabbitMqMeetingProcessingQueue(Options.Create(new RabbitMqOptions
        {
            Host = "localhost",
            Port = 5672,
            Username = "smartmeeting",
            Password = password,
            QueueName = "smartmeeting.meeting-processing"
        }));
        var meetingId = Guid.NewGuid();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));

        await queue.EnqueueAsync(meetingId, timeout.Token);
        var message = await queue.DequeueAsync(timeout.Token);

        Assert.Equal(meetingId, message.MeetingId);
        await queue.CompleteAsync(message, false, timeout.Token);
    }
}
