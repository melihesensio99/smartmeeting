using Microsoft.AspNetCore.Identity;

namespace SmartMeeting.Persistence.Identity;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
}
