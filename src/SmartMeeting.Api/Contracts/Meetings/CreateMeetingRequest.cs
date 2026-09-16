namespace SmartMeeting.Api.Contracts.Meetings;

public sealed record CreateMeetingRequest(string Title, DateTimeOffset StartsAt, DateTimeOffset? EndsAt);
