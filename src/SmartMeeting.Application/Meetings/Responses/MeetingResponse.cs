using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Responses;

public sealed record MeetingResponse(Guid Id, string Title, string OrganizerId, DateTimeOffset StartsAt, DateTimeOffset? EndsAt, MeetingStatus Status, string? Transcript, string? Notes, IReadOnlyCollection<ParticipantResponse> Participants, MeetingSummaryResponse? Summary, string? OrganizerEmail = null)
{
    public static MeetingResponse From(Meeting meeting) => new(meeting.Id, meeting.Title, meeting.OrganizerId, meeting.StartsAt, meeting.EndsAt, meeting.Status, meeting.Transcript, meeting.Notes, meeting.Participants.Select(x => new ParticipantResponse(x.Id, x.UserId, x.DisplayName, x.Email, x.CanManageMeeting, x.SpeakerLabel, x.SpeakerMappingStatus.ToString(), x.SpeakerConfidence)).ToList(),
        meeting.Summary is null ? null : new(meeting.Summary.Overview, meeting.Summary.Decisions, meeting.Summary.ActionItems.Select(x => new ActionItemResponse(x.Id, x.Description, x.Assignee, x.AssigneeUserId, x.AssigneeUserIds, x.DueAt, x.Priority, x.Completed)).ToList()));
}
