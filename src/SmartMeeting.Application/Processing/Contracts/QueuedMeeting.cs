namespace SmartMeeting.Application.Processing.Contracts;

public sealed record QueuedMeeting(Guid MeetingId, string Receipt);
