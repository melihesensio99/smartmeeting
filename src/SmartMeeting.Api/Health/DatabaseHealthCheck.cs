using Microsoft.Extensions.Diagnostics.HealthChecks;
using SmartMeeting.Persistence;

namespace SmartMeeting.Api.Health;

public sealed class DatabaseHealthCheck(MeetingDbContext dbContext) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await dbContext.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("Veritabanı bağlantısı hazır.")
                : HealthCheckResult.Unhealthy("Veritabanına bağlanılamadı.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Veritabanı sağlık kontrolü başarısız.", exception);
        }
    }
}
