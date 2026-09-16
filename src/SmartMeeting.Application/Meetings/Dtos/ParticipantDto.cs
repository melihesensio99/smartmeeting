namespace SmartMeeting.Application.Meetings.Dtos;

public sealed record ParticipantDto(Guid Id, string UserId, string DisplayName, string Email, string? SpeakerLabel);
