using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Persistence.Serialization;

internal sealed record ActionData(Guid Id, string Description, string? Assignee, string? AssigneeUserId, DateTimeOffset? DueAt, ActionPriority? Priority, bool Completed);
