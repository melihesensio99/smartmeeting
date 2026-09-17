using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace SmartMeeting.Infrastructure.Processing;

public sealed class RabbitMqHealthCheck(IOptions<RabbitMqOptions> options) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var configuration = options.Value;
        if (!configuration.Enabled) return HealthCheckResult.Healthy("RabbitMQ devre dışı.");

        try
        {
            var factory = new ConnectionFactory
            {
                HostName = configuration.Host,
                Port = configuration.Port,
                UserName = configuration.Username,
                Password = configuration.Password
            };
            if (configuration.UseTls)
                factory.Ssl = new SslOption(configuration.TlsServerName ?? configuration.Host, string.Empty, true);

            await using var connection = await factory.CreateConnectionAsync(cancellationToken);
            return connection.IsOpen
                ? HealthCheckResult.Healthy("RabbitMQ bağlantısı hazır.")
                : HealthCheckResult.Unhealthy("RabbitMQ bağlantısı açık değil.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("RabbitMQ sağlık kontrolü başarısız.", exception);
        }
    }
}
