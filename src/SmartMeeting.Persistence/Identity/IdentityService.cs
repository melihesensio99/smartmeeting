using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Abstractions.Identity;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Auth.Contracts;
using SmartMeeting.Application.Users.Responses;
using SmartMeeting.Domain.Users;

namespace SmartMeeting.Persistence.Identity;

public sealed class IdentityService(UserManager<ApplicationUser> userManager, IJwtTokenService jwtTokenService, IConfiguration configuration) : IIdentityService, IUserDirectoryService
{
    public async Task<Result<RegisteredUser>> RegisterAsync(string email, string password, string displayName, CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim();
        var user = new ApplicationUser { UserName = normalizedEmail, Email = normalizedEmail, DisplayName = displayName.Trim() };
        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            return Result<RegisteredUser>.Failure("registration_failed", string.Join(" ", result.Errors.Select(error => error.Description)));
        var domainUser = user.ToDomain();
        return Result<RegisteredUser>.Success(new RegisteredUser(domainUser.Id, domainUser.Email, domainUser.DisplayName));
    }

    public async Task<Result<AuthenticatedUser>> LoginAsync(string email, string password, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email.Trim());
        if (user is null || !await userManager.CheckPasswordAsync(user, password))
            return Result<AuthenticatedUser>.Failure("invalid_credentials", "E-posta veya şifre hatalı.");
        var domainUser = user.ToDomain();
        var globalManagerEmails = ReadConfiguredEmails("Authorization:GlobalManagerEmails");
        var meetingCreatorEmails = ReadConfiguredEmails("Authorization:MeetingCreatorEmails");
        var isGlobalManager = globalManagerEmails.Any(configuredEmail => string.Equals(configuredEmail.Trim(), domainUser.Email, StringComparison.OrdinalIgnoreCase));
        var isMeetingCreator = meetingCreatorEmails.Any(configuredEmail => string.Equals(configuredEmail.Trim(), domainUser.Email, StringComparison.OrdinalIgnoreCase));
        var roles = new List<string>();
        if (isGlobalManager) roles.Add("GlobalManager");
        if (isGlobalManager || isMeetingCreator) roles.Add("MeetingCreator");
        var token = jwtTokenService.CreateToken(domainUser.Id, domainUser.Email, domainUser.DisplayName, roles);
        return Result<AuthenticatedUser>.Success(new AuthenticatedUser(domainUser.Id, domainUser.Email, domainUser.DisplayName, token.Value, token.ExpiresAt));
    }

    private string[] ReadConfiguredEmails(string sectionName)
        => Enumerable.Range(0, 32)
            .Select(index => configuration[$"{sectionName}:{index}"])
            .OfType<string>()
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .ToArray();

    public async Task<RegisteredUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return null;
        var domainUser = user.ToDomain();
        return new RegisteredUser(domainUser.Id, domainUser.Email, domainUser.DisplayName);
    }

    public async Task<IReadOnlyCollection<UserResponse>> SearchAsync(string search, CancellationToken cancellationToken)
    {
        var normalized = search.Trim().ToLowerInvariant();
        var users = await userManager.Users
            .Where(user => user.Email!.ToLower().Contains(normalized) || user.DisplayName.ToLower().Contains(normalized))
            .OrderBy(user => user.DisplayName)
            .Take(20)
            .ToListAsync(cancellationToken);
        return users.Select(user => user.ToDomain()).Select(user => new UserResponse(user.Id, user.DisplayName, user.Email)).ToList();
    }
}
