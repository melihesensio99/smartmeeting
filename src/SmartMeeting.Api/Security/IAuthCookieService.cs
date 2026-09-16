namespace SmartMeeting.Api.Security;

public interface IAuthCookieService
{
    void Write(string token, DateTimeOffset expiresAt);
    void Delete();
}
