namespace SmartMeeting.Infrastructure.Ai.Contracts;

internal sealed record MistralSummaryResponse(string Overview, IReadOnlyCollection<string> Decisions, IReadOnlyCollection<MistralActionItemResponse> ActionItems);
