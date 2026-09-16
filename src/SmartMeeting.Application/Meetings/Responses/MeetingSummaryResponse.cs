namespace SmartMeeting.Application.Meetings.Responses;

public sealed record MeetingSummaryResponse(string Overview, IReadOnlyCollection<string> Decisions, IReadOnlyCollection<ActionItemResponse> ActionItems);
