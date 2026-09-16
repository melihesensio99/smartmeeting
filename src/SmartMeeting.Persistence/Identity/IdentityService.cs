using Microsoft.AspNetCore.Identity;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Auth.Contracts;

namespace SmartMeeting.Persistence.Identity;

public sealed class IdentityService(UserManager<ApplicationUser> userManager, IJwtTokenService jwtTokenService) : IIdentityService
{
    public async Task<Result<RegisteredUser>> RegisterAsync(string email, string password, string displayName, CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim();
        var user = new ApplicationUser { UserName = normalizedEmail, Email = normalizedEmail, DisplayName = displayName.Trim() };
        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            return Result<RegisteredUser>.Failure("registration_failed", string.Join(" ", result.Errors.Select(error => error.Description)));
        return Result<RegisteredUser>.Success(new RegisteredUser(user.Id, user.Email!, user.DisplayName));
    }

    public async Task<Result<AuthenticatedUser>> LoginAsync(string email, string password, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email.Trim());
        if (user is null || !await userManager.CheckPasswordAsync(user, password))
            return Result<AuthenticatedUser>.Failure("invalid_credentials", "E-posta veya şifre hatalı.");
        var token = jwtTokenService.CreateToken(user.Id, user.Email!, user.DisplayName);
        return Result<AuthenticatedUser>.Success(new AuthenticatedUser(user.Id, user.Email!, user.DisplayName, token.Value, token.ExpiresAt));
    }

    public async Task<RegisteredUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is null ? null : new RegisteredUser(user.Id, user.Email!, user.DisplayName);
    }
}
