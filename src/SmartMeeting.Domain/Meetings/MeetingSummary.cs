namespace SmartMeeting.Domain.Meetings;

public sealed class MeetingSummary
{
    private readonly List<ActionItem> _actionItems = [];
    private MeetingSummary() { }
    private MeetingSummary(string overview, IEnumerable<string> decisions, IEnumerable<ActionItem> actionItems)
    {
        Overview = overview; Decisions = decisions.ToList().AsReadOnly(); _actionItems = actionItems.ToList();
    }
    public string Overview { get; private set; } = string.Empty;
    public IReadOnlyCollection<string> Decisions { get; private set; } = [];
    public IReadOnlyCollection<ActionItem> ActionItems => _actionItems.AsReadOnly();
    public static MeetingSummary Create(string overview, IEnumerable<string> decisions, IEnumerable<ActionItem> actionItems)
        => new(overview.Trim(), decisions, actionItems);

    public ActionItem AddActionItem(string description, string? assignee, string? assigneeUserId, DateTimeOffset? dueAt, ActionPriority priority)
    {
        var actionItem = new ActionItem(description, assignee, dueAt, priority: priority, assigneeUserId: assigneeUserId);
        _actionItems.Add(actionItem);
        return actionItem;
    }
}

public sealed class ActionItem
{
    private ActionItem() { }
    public ActionItem(string description, string? assignee, DateTimeOffset? dueAt, Guid? id = null, ActionPriority priority = ActionPriority.Medium, string? assigneeUserId = null)
    { Id = id ?? Guid.NewGuid(); Description = description.Trim(); Assignee = assignee?.Trim(); AssigneeUserId = assigneeUserId?.Trim(); DueAt = dueAt; Priority = priority; }
    public Guid Id { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string? Assignee { get; private set; }
    public string? AssigneeUserId { get; private set; }
    public DateTimeOffset? DueAt { get; private set; }
    public ActionPriority Priority { get; private set; }
    public bool Completed { get; private set; }
    public void Complete() => Completed = true;

    public void UpdateDetails(string? assigneeUserId, string? assignee, DateTimeOffset? dueAt, ActionPriority priority)
    {
        AssigneeUserId = assigneeUserId?.Trim();
        Assignee = assignee?.Trim();
        DueAt = dueAt;
        Priority = priority;
    }
}
