using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using SmartMeeting.Persistence.Identity;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Abstractions.Identity;

namespace SmartMeeting.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration["Database:Provider"] ?? "Postgres";
        var connectionString = configuration.GetConnectionString("Default");
        services.AddDbContext<MeetingDbContext>(options =>
        {
            if (provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase) || provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
                options.UseNpgsql(connectionString ?? throw new InvalidOperationException("PostgreSQL connection string is required."));
            else
                throw new InvalidOperationException($"Unsupported database provider: {provider}.");
        });
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireNonAlphanumeric = false;
        }).AddEntityFrameworkStores<MeetingDbContext>();
        services.AddScoped<IdentityService>();
        services.AddScoped<IIdentityService>(sp => sp.GetRequiredService<IdentityService>());
        services.AddScoped<IUserDirectoryService>(sp => sp.GetRequiredService<IdentityService>());
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<MeetingDbContext>());
        return services;
    }
}
