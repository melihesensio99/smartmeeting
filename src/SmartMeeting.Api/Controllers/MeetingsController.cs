using MediatR;
using Microsoft.AspNetCore.Mvc;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Commands.CreateMeeting;
using SmartMeeting.Application.Meetings.Queries.GetMeetings;
using SmartMeeting.Application.Meetings.Commands.StartRecording;
using SmartMeeting.Application.Meetings.Commands.CompleteRecording;
using SmartMeeting.Application.Meetings.Commands.UploadMeetingAudio;
using SmartMeeting.Application.Meetings.Commands.RetryMeetingProcessing;
using SmartMeeting.Application.Meetings.Commands.CompleteActionItem;
using SmartMeeting.Application.Meetings.Commands.CreateActionItem;
using SmartMeeting.Application.Meetings.Commands.UpdateMeetingNotes;
using SmartMeeting.Application.Meetings.Commands.AddParticipant;
using SmartMeeting.Application.Meetings.Commands.MapSpeaker;
using SmartMeeting.Application.Meetings.Commands.SendMeetingSummaryEmail;
using SmartMeeting.Application.Meetings.Commands.UpdateActionItem;
using SmartMeeting.Application.Meetings.Queries.GetMeeting;
using SmartMeeting.Application.Meetings.Commands.UpdateParticipantPermission;
using SmartMeeting.Application.Meetings.Commands.RemoveParticipant;
using SmartMeeting.Application.Meetings.Commands.LeaveMeeting;
using SmartMeeting.Application.Meetings.Commands.CompleteMeeting;
using SmartMeeting.Application.Meetings.Commands.ConfirmSpeakerMapping;
using SmartMeeting.Application.Meetings.Commands.RejectSpeakerMapping;
using SmartMeeting.Api.Contracts.Meetings;

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
        var result = await sender.Send(new CreateMeetingCommand(request.Title, request.StartsAt, request.EndsAt), cancellationToken);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return CreatedAtAction(nameof(Get), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPost("{meetingId:guid}/recording/start")]
    public async Task<IActionResult> StartRecording(Guid meetingId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new StartRecordingCommand(meetingId), cancellationToken));

    [HttpPost("{meetingId:guid}/complete")]
    public async Task<IActionResult> CompleteMeeting(Guid meetingId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new CompleteMeetingCommand(meetingId), cancellationToken));

    [HttpPost("{meetingId:guid}/action-items/{actionItemId:guid}/complete")]
    public async Task<IActionResult> CompleteActionItem(Guid meetingId, Guid actionItemId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new CompleteActionItemCommand(meetingId, actionItemId), cancellationToken));

    [HttpPut("{meetingId:guid}/action-items/{actionItemId:guid}")]
    public async Task<IActionResult> UpdateActionItem(Guid meetingId, Guid actionItemId, UpdateActionItemRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new UpdateActionItemCommand(meetingId, actionItemId, request.AssigneeUserId, request.DueAt, request.Priority), cancellationToken));

    [HttpPost("{meetingId:guid}/action-items")]
    public async Task<IActionResult> CreateActionItem(Guid meetingId, CreateActionItemRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new CreateActionItemCommand(meetingId, request.Description, request.AssigneeUserId, request.DueAt, request.Priority), cancellationToken));

    [HttpPut("{meetingId:guid}/notes")]
    public async Task<IActionResult> UpdateNotes(Guid meetingId, UpdateNotesRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new UpdateMeetingNotesCommand(meetingId, request.Notes), cancellationToken));

    [HttpPost("{meetingId:guid}/participants")]
    public async Task<IActionResult> AddParticipant(Guid meetingId, AddParticipantRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new AddParticipantCommand(meetingId, request.UserId, request.DisplayName, request.Email, request.CanManageMeeting), cancellationToken));

    [HttpPut("{meetingId:guid}/participants/{participantId:guid}/management-permission")]
    public async Task<IActionResult> UpdateParticipantPermission(Guid meetingId, Guid participantId, UpdateParticipantPermissionRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new UpdateParticipantPermissionCommand(meetingId, participantId, request.CanManageMeeting), cancellationToken));

    [HttpDelete("{meetingId:guid}/participants/{participantId:guid}")]
    public async Task<IActionResult> RemoveParticipant(Guid meetingId, Guid participantId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new RemoveParticipantCommand(meetingId, participantId), cancellationToken));

    [HttpDelete("{meetingId:guid}/participants/me")]
    public async Task<IActionResult> LeaveMeeting(Guid meetingId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new LeaveMeetingCommand(meetingId), cancellationToken));

    [HttpPut("{meetingId:guid}/participants/{participantId:guid}/speaker")]
    public async Task<IActionResult> MapSpeaker(Guid meetingId, Guid participantId, MapSpeakerRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new MapSpeakerCommand(meetingId, participantId, request.SpeakerLabel), cancellationToken));

    [HttpPost("{meetingId:guid}/participants/{participantId:guid}/speaker/confirm")]
    public async Task<IActionResult> ConfirmSpeakerMapping(Guid meetingId, Guid participantId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new ConfirmSpeakerMappingCommand(meetingId, participantId), cancellationToken));

    [HttpDelete("{meetingId:guid}/participants/{participantId:guid}/speaker")]
    public async Task<IActionResult> RejectSpeakerMapping(Guid meetingId, Guid participantId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new RejectSpeakerMappingCommand(meetingId, participantId), cancellationToken));

    [HttpPost("{meetingId:guid}/summary/email")]
    public async Task<IActionResult> SendSummaryEmail(Guid meetingId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new SendMeetingSummaryEmailCommand(meetingId), cancellationToken));

    [HttpPost("{meetingId:guid}/recording/complete")]
    public async Task<IActionResult> CompleteRecording(Guid meetingId, CompleteRecordingRequest request, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new CompleteRecordingCommand(meetingId, request.AudioFilePath), cancellationToken));

    [HttpPost("{meetingId:guid}/processing/retry")]
    public async Task<IActionResult> RetryProcessing(Guid meetingId, CancellationToken cancellationToken)
        => ToActionResult(await sender.Send(new RetryMeetingProcessingCommand(meetingId), cancellationToken));

    [HttpPost("{meetingId:guid}/audio")]
    [RequestSizeLimit(524_288_000)]
    public async Task<IActionResult> UploadAudio(Guid meetingId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0) return BadRequest(new { code = "empty_file", message = "Ses dosyası boş olamaz." });
        await using var stream = file.OpenReadStream();
        var result = await sender.Send(new UploadMeetingAudioCommand(meetingId, stream, file.FileName, file.ContentType), cancellationToken);
        return ToActionResult(result);
    }

    private IActionResult ToActionResult(Result<IReadOnlyCollection<MeetingResponse>> result)
        => result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);

    private IActionResult ToActionResult(Result<MeetingResponse> result)
        => result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);

    private IActionResult ToActionResult(Result result)
        => result.IsSuccess ? NoContent() : BadRequest(result.Error);
}
