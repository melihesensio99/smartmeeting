namespace SmartMeeting.Application.Auth.Contracts;

public sealed record AuthenticatedUser(string UserId, string Email, string DisplayName, string AccessToken, DateTimeOffset ExpiresAt);
