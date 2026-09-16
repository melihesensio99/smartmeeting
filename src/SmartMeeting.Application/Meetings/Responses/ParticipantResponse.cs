namespace SmartMeeting.Application.Meetings.Responses;

public sealed record ParticipantResponse(Guid Id, string UserId, string DisplayName, string Email, string? SpeakerLabel);
