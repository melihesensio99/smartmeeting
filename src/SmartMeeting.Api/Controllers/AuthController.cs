using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SmartMeeting.Api.Security;
using SmartMeeting.Application.Auth.Commands.Login;
using SmartMeeting.Application.Auth.Commands.Register;
using SmartMeeting.Application.Auth.Queries.GetCurrentUser;
using SmartMeeting.Api.Contracts.Auth;

namespace SmartMeeting.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(ISender sender, IAuthCookieService authCookieService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RegisterCommand(request.Email, request.Password, request.DisplayName), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new LoginCommand(request.Email, request.Password), cancellationToken);
        if (!result.IsSuccess) return Unauthorized(result.Error);
        var user = result.Value!;
        authCookieService.Write(user.AccessToken, user.ExpiresAt);
        return Ok(new { expiresAt = user.ExpiresAt, userId = user.UserId, displayName = user.DisplayName });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        authCookieService.Delete();
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCurrentUserQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }
}
