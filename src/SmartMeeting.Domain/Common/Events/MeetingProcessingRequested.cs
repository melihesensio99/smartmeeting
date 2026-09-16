namespace SmartMeeting.Domain.Common.Events;

public sealed record MeetingProcessingRequested(Guid MeetingId, DateTimeOffset OccurredAt) : IDomainEvent;
