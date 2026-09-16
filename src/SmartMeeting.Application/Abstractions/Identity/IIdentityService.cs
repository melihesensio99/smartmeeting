using SmartMeeting.Application.Auth.Contracts;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Abstractions.Identity;

public interface IIdentityService
{
    Task<Result<RegisteredUser>> RegisterAsync(string email, string password, string displayName, CancellationToken cancellationToken);
    Task<Result<AuthenticatedUser>> LoginAsync(string email, string password, CancellationToken cancellationToken);
}
