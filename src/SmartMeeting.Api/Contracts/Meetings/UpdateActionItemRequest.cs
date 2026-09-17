using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Api.Contracts.Meetings;

public sealed record UpdateActionItemRequest(IReadOnlyCollection<string>? AssigneeUserIds, DateTimeOffset? DueAt, ActionPriority Priority = ActionPriority.Medium);
