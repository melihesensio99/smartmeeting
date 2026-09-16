namespace SmartMeeting.Api.Security;

public sealed class AuthenticationOptions
{
    public bool Enabled { get; init; }
    public bool RequireAuthentication { get; init; }
    public string? Authority { get; init; }
    public string? Audience { get; init; }
}
