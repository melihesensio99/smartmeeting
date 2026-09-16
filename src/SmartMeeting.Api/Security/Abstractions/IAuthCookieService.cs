namespace SmartMeeting.Api.Security.Abstractions;

public interface IAuthCookieService
{
    void Write(string token, DateTimeOffset expiresAt);
    void Delete();
}
