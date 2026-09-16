using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Infrastructure.Processing;

public sealed class RabbitMqMeetingProcessingQueue(IOptions<RabbitMqOptions> options) : IMeetingProcessingQueue, IAsyncDisposable
{
    private readonly RabbitMqOptions configuration = options.Value;
    private readonly SemaphoreSlim connectionLock = new(1, 1);
    private readonly ConcurrentDictionary<string, ulong> deliveryTags = new();
    private IConnection? connection;
    private IChannel? channel;

    public async ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken)
    {
        var queueChannel = await GetChannelAsync(cancellationToken);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new { meetingId });
        await queueChannel.BasicPublishAsync(string.Empty, configuration.QueueName, false, new BasicProperties { Persistent = true, ContentType = "application/json" }, payload, cancellationToken);
    }

    public async ValueTask<QueuedMeeting> DequeueAsync(CancellationToken cancellationToken)
    {
        var queueChannel = await GetChannelAsync(cancellationToken);
        while (true)
        {
            var result = await queueChannel.BasicGetAsync(configuration.QueueName, false, cancellationToken);
            if (result is not null)
            {
                using var document = JsonDocument.Parse(result.Body.ToArray());
                var meetingId = document.RootElement.GetProperty("meetingId").GetGuid();
                var receipt = Guid.NewGuid().ToString("N");
                deliveryTags[receipt] = result.DeliveryTag;
                return new QueuedMeeting(meetingId, receipt);
            }
            await Task.Delay(TimeSpan.FromMilliseconds(250), cancellationToken);
        }
    }

    public async ValueTask CompleteAsync(QueuedMeeting message, bool requeue, CancellationToken cancellationToken)
    {
        if (!deliveryTags.TryRemove(message.Receipt, out var deliveryTag)) return;
        var queueChannel = await GetChannelAsync(cancellationToken);
        if (requeue) await queueChannel.BasicNackAsync(deliveryTag, false, true, cancellationToken);
        else await queueChannel.BasicAckAsync(deliveryTag, false, cancellationToken);
    }

    private async Task<IChannel> GetChannelAsync(CancellationToken cancellationToken)
    {
        if (channel is not null && channel.IsOpen) return channel;
        await connectionLock.WaitAsync(cancellationToken);
        try
        {
            if (channel is not null && channel.IsOpen) return channel;
            var factory = new ConnectionFactory { HostName = configuration.Host, Port = configuration.Port, UserName = configuration.Username, Password = configuration.Password };
            connection ??= await factory.CreateConnectionAsync(cancellationToken);
            channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);
            await channel.QueueDeclareAsync(configuration.QueueName, true, false, false, null, false, cancellationToken);
            await channel.BasicQosAsync(0, 1, false, cancellationToken);
            return channel;
        }
        finally { connectionLock.Release(); }
    }

    public async ValueTask DisposeAsync()
    {
        if (channel is not null) await channel.DisposeAsync();
        if (connection is not null) await connection.DisposeAsync();
        connectionLock.Dispose();
    }
}
