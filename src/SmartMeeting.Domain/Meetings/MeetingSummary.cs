namespace SmartMeeting.Domain.Meetings;

public sealed class MeetingSummary
{
    private MeetingSummary() { }
    private MeetingSummary(string overview, IEnumerable<string> decisions, IEnumerable<ActionItem> actionItems)
    {
        Overview = overview; Decisions = decisions.ToList().AsReadOnly(); ActionItems = actionItems.ToList().AsReadOnly();
    }
    public string Overview { get; private set; } = string.Empty;
    public IReadOnlyCollection<string> Decisions { get; private set; } = [];
    public IReadOnlyCollection<ActionItem> ActionItems { get; private set; } = [];
    public static MeetingSummary Create(string overview, IEnumerable<string> decisions, IEnumerable<ActionItem> actionItems)
        => new(overview.Trim(), decisions, actionItems);
}

public sealed class ActionItem
{
    private ActionItem() { }
    public ActionItem(string description, string? assignee, DateTimeOffset? dueAt, Guid? id = null)
    { Id = id ?? Guid.NewGuid(); Description = description.Trim(); Assignee = assignee?.Trim(); DueAt = dueAt; }
    public Guid Id { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string? Assignee { get; private set; }
    public DateTimeOffset? DueAt { get; private set; }
    public bool Completed { get; private set; }
    public void Complete() => Completed = true;
}
