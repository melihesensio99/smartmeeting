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
        var actionItem = new ActionItem(description, assignee is null ? [] : [assignee], dueAt, priority: priority, assigneeUserIds: assigneeUserId is null ? [] : [assigneeUserId]);
        _actionItems.Add(actionItem);
        return actionItem;
    }
}

public sealed class ActionItem
{
    private ActionItem() { }
    public ActionItem(string description, string? assignee, DateTimeOffset? dueAt, Guid? id = null, ActionPriority priority = ActionPriority.Medium, string? assigneeUserId = null)
        : this(description, assignee is null ? [] : [assignee], dueAt, id, priority, assigneeUserId is null ? [] : [assigneeUserId]) { }
    public ActionItem(string description, IEnumerable<string> assignees, DateTimeOffset? dueAt, Guid? id = null, ActionPriority priority = ActionPriority.Medium, IEnumerable<string>? assigneeUserIds = null)
    {
        Id = id ?? Guid.NewGuid(); Description = description.Trim();
        AssigneeNames = assignees.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList().AsReadOnly();
        AssigneeUserIds = (assigneeUserIds ?? []).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList().AsReadOnly();
        Assignee = AssigneeNames.Count == 0 ? null : string.Join(", ", AssigneeNames); AssigneeUserId = AssigneeUserIds.FirstOrDefault(); DueAt = dueAt; Priority = priority;
    }
    public Guid Id { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string? Assignee { get; private set; }
    public string? AssigneeUserId { get; private set; }
    public IReadOnlyCollection<string> AssigneeNames { get; private set; } = [];
    public IReadOnlyCollection<string> AssigneeUserIds { get; private set; } = [];
    public DateTimeOffset? DueAt { get; private set; }
    public ActionPriority Priority { get; private set; }
    public bool Completed { get; private set; }
    public void Complete() => Completed = true;

    public void UpdateDetails(IEnumerable<string> assigneeUserIds, IEnumerable<string> assignees, DateTimeOffset? dueAt, ActionPriority priority)
    {
        AssigneeUserIds = assigneeUserIds.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList().AsReadOnly();
        AssigneeNames = assignees.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList().AsReadOnly();
        AssigneeUserId = AssigneeUserIds.FirstOrDefault();
        Assignee = AssigneeNames.Count == 0 ? null : string.Join(", ", AssigneeNames);
        DueAt = dueAt;
        Priority = priority;
    }
}
