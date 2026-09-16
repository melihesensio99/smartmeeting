using Microsoft.AspNetCore.SignalR;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Api.Hubs;

public sealed class MeetingStatusHub : Hub
{
    public Task JoinMeeting(string meetingId) => Groups.AddToGroupAsync(Context.ConnectionId, meetingId);
}

public sealed class SignalRMeetingStatusPublisher(IHubContext<MeetingStatusHub> hub) : IMeetingStatusPublisher
{
    public Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken)
        => hub.Clients.Group(meetingId.ToString()).SendAsync("meetingStatusChanged", new { meetingId, status }, cancellationToken);
}
