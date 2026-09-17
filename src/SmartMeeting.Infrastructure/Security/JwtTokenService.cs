using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Auth.Contracts;

namespace SmartMeeting.Infrastructure.Security;

public sealed class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    public AuthToken CreateToken(string userId, string email, string displayName, IReadOnlyCollection<string>? roles = null)
    {
        var configuration = options.Value;
        if (string.IsNullOrWhiteSpace(configuration.SigningKey))
            throw new InvalidOperationException("Authentication:SigningKey yapılandırılmamış.");
        var expiresAt = DateTimeOffset.UtcNow.AddHours(configuration.LifetimeHours);
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Name, displayName)
        };
        claims.AddRange((roles ?? []).Select(role => new Claim(ClaimTypes.Role, role)));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(configuration.Issuer, configuration.Audience, claims, expires: expiresAt.UtcDateTime, signingCredentials: credentials);
        return new AuthToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
