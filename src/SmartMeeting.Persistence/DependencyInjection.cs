using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SmartMeeting.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<MeetingDbContext>(options => options.UseSqlite(configuration.GetConnectionString("Default") ?? "Data Source=smartmeeting.db"));
        services.AddScoped<Application.Abstractions.IApplicationDbContext>(sp => sp.GetRequiredService<MeetingDbContext>());
        return services;
    }
}
