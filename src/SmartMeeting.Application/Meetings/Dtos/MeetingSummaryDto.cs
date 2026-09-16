namespace SmartMeeting.Application.Meetings.Dtos;

public sealed record MeetingSummaryDto(string Overview, IReadOnlyCollection<string> Decisions, IReadOnlyCollection<ActionItemDto> ActionItems);
