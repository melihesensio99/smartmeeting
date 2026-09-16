namespace SmartMeeting.Application.Auth.Contracts;

public sealed record AuthToken(string Value, DateTimeOffset ExpiresAt);
