using System.Security.Claims;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Api.Security;

public sealed class HttpCurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal User => httpContextAccessor.HttpContext?.User ?? new ClaimsPrincipal();
    public bool IsAuthenticated => User.Identity?.IsAuthenticated == true;
    public bool IsGlobalManager => User.IsInRole("GlobalManager");
    public string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
}
