namespace SmartMeeting.Application.Abstractions.Identity;

public interface ICurrentUserService
{
    string? UserId { get; }
    bool IsAuthenticated { get; }
    bool CanAccess(string organizerId) => !IsAuthenticated || UserId == organizerId;
}
