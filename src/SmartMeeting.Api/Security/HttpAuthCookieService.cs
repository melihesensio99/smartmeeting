using Microsoft.Extensions.Options;
using SmartMeeting.Infrastructure.Security;

namespace SmartMeeting.Api.Security;

public sealed class HttpAuthCookieService(IHttpContextAccessor httpContextAccessor, IOptions<JwtOptions> options) : IAuthCookieService
{
    public void Write(string token, DateTimeOffset expiresAt)
    {
        var context = httpContextAccessor.HttpContext ?? throw new InvalidOperationException("HTTP context is unavailable.");
        context.Response.Cookies.Append(options.Value.CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = context.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = expiresAt,
            IsEssential = true,
            Path = "/"
        });
    }

    public void Delete()
    {
        var context = httpContextAccessor.HttpContext ?? throw new InvalidOperationException("HTTP context is unavailable.");
        context.Response.Cookies.Delete(options.Value.CookieName, new CookieOptions { HttpOnly = true, SameSite = SameSiteMode.Lax, Path = "/" });
    }
}
