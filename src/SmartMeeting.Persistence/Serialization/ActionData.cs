namespace SmartMeeting.Persistence.Serialization;

internal sealed record ActionData(Guid Id, string Description, string? Assignee, DateTimeOffset? DueAt, bool Completed);
