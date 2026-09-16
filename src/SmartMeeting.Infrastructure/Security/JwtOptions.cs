namespace SmartMeeting.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Authentication";
    public bool Enabled { get; init; }
    public bool RequireAuthentication { get; init; }
    public string? Authority { get; init; }
    public string? Audience { get; init; }
    public string? Issuer { get; init; }
    public string? SigningKey { get; init; }
    public string CookieName { get; init; } = "smartmeeting.auth";
    public int LifetimeHours { get; init; } = 8;
}
