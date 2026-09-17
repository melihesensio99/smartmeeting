using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Api.Contracts.Meetings;

public sealed record UpdateActionItemRequest(string? Assignee, DateTimeOffset? DueAt, ActionPriority Priority = ActionPriority.Medium);
