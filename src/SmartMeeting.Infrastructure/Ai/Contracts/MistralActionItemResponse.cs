namespace SmartMeeting.Infrastructure.Ai.Contracts;

internal sealed record MistralActionItemResponse(string Description, string? Assignee, string? DueAt);
