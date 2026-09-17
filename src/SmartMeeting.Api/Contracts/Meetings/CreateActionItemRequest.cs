using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Api.Contracts.Meetings;

public sealed record CreateActionItemRequest(string Description, string? AssigneeUserId, DateTimeOffset? DueAt, ActionPriority Priority = ActionPriority.Medium);
