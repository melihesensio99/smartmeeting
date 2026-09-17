using SmartMeeting.Domain.Users;

namespace SmartMeeting.Persistence.Identity;

internal static class ApplicationUserMapping
{
    public static User ToDomain(this ApplicationUser user)
        => User.Create(user.Id, user.Email!, user.DisplayName);
}
