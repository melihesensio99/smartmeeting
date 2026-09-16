using MediatR;
using Microsoft.AspNetCore.Mvc;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Commands.CreateMeeting;
using SmartMeeting.Application.Meetings.Queries.GetMeetings;

namespace SmartMeeting.Api.Controllers;

[ApiController]
[Route("api/meetings")]
public sealed class MeetingsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? organizerId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new GetMeetingsQuery(organizerId), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(CreateMeetingRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateMeetingCommand(request.Title, request.OrganizerId, request.StartsAt, request.EndsAt), cancellationToken);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Get), new { id = result.Value!.Id }, result.Value);
    }

    private IActionResult ToActionResult(Result<IReadOnlyCollection<Application.Meetings.Dtos.MeetingDto>> result)
        => result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
}

public sealed record CreateMeetingRequest(string Title, string OrganizerId, DateTimeOffset StartsAt, DateTimeOffset? EndsAt);
