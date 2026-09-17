namespace SmartMeeting.Api.Contracts.Meetings;

public sealed record AddParticipantRequest(string UserId, string DisplayName, string Email, bool CanManageMeeting = false);
