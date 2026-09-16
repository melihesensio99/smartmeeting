using MediatR;
using Microsoft.AspNetCore.Mvc;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Commands.CreateMeeting;
using SmartMeeting.Application.Meetings.Queries.GetMeetings;
using SmartMeeting.Application.Meetings.Commands.StartRecording;
using SmartMeeting.Application.Meetings.Commands.CompleteRecording;
using SmartMeeting.Application.Meetings.Commands.UploadMeetingAudio;
using SmartMeeting.Application.Meetings.Commands.CompleteActionItem;
using SmartMeeting.Application.Meetings.Commands.UpdateMeetingNotes;
using SmartMeeting.Application.Meetings.Queries.GetMeeting;

namespace SmartMeeting.Api.Controllers;

[ApiController]
[Route("api/meetings")]
public sealed class MeetingsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? organizerId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new GetMeetingsQuery(organizerId), cancellationToken));

    [HttpGet("{meetingId:guid}")]
    public async Task<IActionResult> GetById(Guid meetingId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new GetMeetingQuery(meetingId), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(CreateMeetingRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateMeetingCommand(request.Title, request.OrganizerId, request.StartsAt, request.EndsAt), cancellationToken);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Get), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("{meetingId:guid}/recording/start")]
    public async Task<IActionResult> StartRecording(Guid meetingId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new StartRecordingCommand(meetingId), cancellationToken));

    [HttpPost("{meetingId:guid}/action-items/{actionItemId:guid}/complete")]
    public async Task<IActionResult> CompleteActionItem(Guid meetingId, Guid actionItemId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new CompleteActionItemCommand(meetingId, actionItemId), cancellationToken));

    [HttpPut("{meetingId:guid}/notes")]
    public async Task<IActionResult> UpdateNotes(Guid meetingId, UpdateNotesRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new UpdateMeetingNotesCommand(meetingId, request.Notes), cancellationToken));

    [HttpPost("{meetingId:guid}/recording/complete")]
    public async Task<IActionResult> CompleteRecording(Guid meetingId, CompleteRecordingRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new CompleteRecordingCommand(meetingId, request.AudioFilePath), cancellationToken));

    [HttpPost("{meetingId:guid}/audio")]
    [RequestSizeLimit(524_288_000)]
    public async Task<IActionResult> UploadAudio(Guid meetingId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0) return BadRequest(new { code = "empty_file", message = "Ses dosyası boş olamaz." });
        await using var stream = file.OpenReadStream();
        var result = await sender.Send(new UploadMeetingAudioCommand(meetingId, stream, file.FileName, file.ContentType), cancellationToken);
        return ToActionResult(result);
    }

    private IActionResult ToActionResult(Result<IReadOnlyCollection<Application.Meetings.Dtos.MeetingDto>> result)
        => result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);

    private IActionResult ToActionResult(Result<Application.Meetings.Dtos.MeetingDto> result)
        => result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
}

public sealed record CreateMeetingRequest(string Title, string OrganizerId, DateTimeOffset StartsAt, DateTimeOffset? EndsAt);
public sealed record CompleteRecordingRequest(string AudioFilePath);
public sealed record UpdateNotesRequest(string Notes);
