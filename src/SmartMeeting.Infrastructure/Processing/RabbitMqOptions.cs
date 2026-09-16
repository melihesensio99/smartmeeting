namespace SmartMeeting.Infrastructure.Processing;

public sealed class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";
    public bool Enabled { get; init; } = true;
    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 5672;
    public string Username { get; init; } = "smartmeeting";
    public string Password { get; init; } = string.Empty;
    public string QueueName { get; init; } = "smartmeeting.meeting-processing";
}
