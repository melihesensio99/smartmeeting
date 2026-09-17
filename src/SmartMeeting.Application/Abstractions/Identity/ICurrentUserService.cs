namespace SmartMeeting.Application.Abstractions.Identity;

using SmartMeeting.Domain.Meetings;

public interface ICurrentUserService
{
    string? UserId { get; }
    bool IsAuthenticated { get; }
    bool IsGlobalManager => false;
    bool CanAccess(string organizerId) => IsAuthenticated && UserId == organizerId;
    bool CanAccess(Meeting meeting) => IsGlobalManager || meeting.CanAccess(UserId);
    bool CanManage(Meeting meeting) => IsGlobalManager || meeting.CanManage(UserId);
}
