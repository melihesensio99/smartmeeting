using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Dtos;

public sealed record MeetingDto(Guid Id, string Title, string OrganizerId, DateTimeOffset StartsAt, DateTimeOffset? EndsAt, MeetingStatus Status, string? Transcript, string? Notes, MeetingSummaryDto? Summary)
{
    public static MeetingDto From(Meeting meeting) => new(meeting.Id, meeting.Title, meeting.OrganizerId, meeting.StartsAt, meeting.EndsAt, meeting.Status, meeting.Transcript, meeting.Notes,
        meeting.Summary is null ? null : new(meeting.Summary.Overview, meeting.Summary.Decisions, meeting.Summary.ActionItems.Select(x => new ActionItemDto(x.Id, x.Description, x.Assignee, x.DueAt, x.Completed)).ToList()));
}
public sealed record MeetingSummaryDto(string Overview, IReadOnlyCollection<string> Decisions, IReadOnlyCollection<ActionItemDto> ActionItems);
public sealed record ActionItemDto(Guid Id, string Description, string? Assignee, DateTimeOffset? DueAt, bool Completed);
