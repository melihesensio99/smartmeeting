using SmartMeeting.Application.Users.Responses;

namespace SmartMeeting.Application.Abstractions.Identity;

public interface IUserDirectoryService
{
    Task<IReadOnlyCollection<UserResponse>> SearchAsync(string search, CancellationToken cancellationToken);
}
