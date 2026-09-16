namespace SmartMeeting.Domain.Common;

public abstract class Entity
{
    private readonly List<IDomainEvent> _domainEvents = [];
    public Guid Id { get; protected init; }
    public DateTimeOffset CreatedAt { get; protected init; }
    public DateTimeOffset UpdatedAt { get; protected set; }
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected Entity(Guid id)
    {
        Id = id;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
    }

    protected void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

public interface IDomainEvent
{
    DateTimeOffset OccurredAt { get; }
}
