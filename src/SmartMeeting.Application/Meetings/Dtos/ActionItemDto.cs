namespace SmartMeeting.Application.Meetings.Dtos;

public sealed record ActionItemDto(Guid Id, string Description, string? Assignee, DateTimeOffset? DueAt, bool Completed);
