using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace SmartMeeting.Persistence.Identity;

public static class DevelopmentDataSeeder
{
    public const string MelihEmail = "melih.demo@example.com";
    public const string AdaEmail = "ada.demo@example.com";
    public const string DemoPassword = "Demo1234!";

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        await EnsureUserAsync(userManager, MelihEmail, "Melih", cancellationToken);
        await EnsureUserAsync(userManager, AdaEmail, "Ada", cancellationToken);
    }

    private static async Task EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string displayName,
        CancellationToken cancellationToken)
    {
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser is not null)
            return;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, DemoPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(error => error.Description));
            throw new InvalidOperationException($"Development seed user could not be created ({email}): {errors}");
        }
    }
}
