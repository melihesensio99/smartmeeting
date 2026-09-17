using SmartMeeting.Application.Auth.Contracts;

namespace SmartMeeting.Application.Abstractions.Identity;

public interface IJwtTokenService
{
    AuthToken CreateToken(string userId, string email, string displayName, IReadOnlyCollection<string>? roles = null);
}
