namespace SmartMeeting.Application.Auth.Responses;

public sealed record CurrentUserResponse(string UserId, string Email, string DisplayName, bool IsGlobalManager, bool CanCreateMeetings);
