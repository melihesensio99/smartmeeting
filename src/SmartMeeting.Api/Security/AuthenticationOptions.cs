namespace SmartMeeting.Api.Security;

public sealed class AuthenticationOptions
{
    public bool Enabled { get; init; }
    public bool RequireAuthentication { get; init; }
    public string? Authority { get; init; }
    public string? Audience { get; init; }
    public string? Issuer { get; init; }
    public string? SigningKey { get; init; }
    public string CookieName { get; init; } = "smartmeeting.auth";
}
