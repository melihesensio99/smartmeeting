namespace SmartMeeting.Persistence.Serialization;

internal sealed record SummaryData(string Overview, IReadOnlyCollection<string> Decisions, IReadOnlyCollection<ActionData> ActionItems);
