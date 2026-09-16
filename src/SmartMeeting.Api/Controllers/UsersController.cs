using MediatR;
using Microsoft.AspNetCore.Mvc;
using SmartMeeting.Application.Users.Queries.SearchUsers;

namespace SmartMeeting.Api.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string search, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SearchUsersQuery(search), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
