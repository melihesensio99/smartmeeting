namespace SmartMeeting.Application.Meetings.Responses;

public sealed record ActionItemResponse(Guid Id, string Description, string? Assignee, DateTimeOffset? DueAt, bool Completed);
