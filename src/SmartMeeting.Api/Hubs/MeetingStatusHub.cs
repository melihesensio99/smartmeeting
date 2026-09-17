using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Abstractions.Identity;
using SmartMeeting.Application.Abstractions.Persistence;

namespace SmartMeeting.Api.Hubs;

public sealed record MeetingRoomParticipant(string UserId, string DisplayName, bool IsOrganizer, DateTimeOffset JoinedAt);

public sealed class MeetingStatusHub(
    IApplicationDbContext db,
    ICurrentUserService currentUser) : Hub
{
    public Task JoinMeeting(string meetingId) => Groups.AddToGroupAsync(Context.ConnectionId, meetingId);

    public async Task<IReadOnlyCollection<MeetingRoomParticipant>> JoinRoom(string meetingId)
    {
        if (!Guid.TryParse(meetingId, out var parsedMeetingId))
            throw new HubException("Geçersiz toplantı kimliği.");

        var meeting = await db.GetMeetingAsync(parsedMeetingId, Context.ConnectionAborted);
        if (meeting is null || !currentUser.CanAccess(meeting))
            throw new HubException("Bu toplantı odasına erişim yetkiniz yok.");

        var userId = currentUser.UserId;
        if (string.IsNullOrWhiteSpace(userId))
            throw new HubException("Odaya girmek için oturum açmanız gerekir.");

        var displayName = Context.User?.FindFirstValue(ClaimTypes.Name) ?? userId;
        var participant = new MeetingRoomParticipant(
            userId,
            displayName,
            meeting.OrganizerId == userId,
            DateTimeOffset.UtcNow);

        var room = Rooms.GetOrAdd(meetingId, _ => new ConcurrentDictionary<string, ConnectionPresence>());
        room.AddOrUpdate(userId,
            _ => new ConnectionPresence(participant, [Context.ConnectionId]),
            (_, existing) => existing with { ConnectionIds = existing.ConnectionIds.Append(Context.ConnectionId).ToHashSet() });
        ConnectionRooms.AddOrUpdate(Context.ConnectionId,
            _ => [meetingId],
            (_, existing) => existing.Append(meetingId).ToHashSet());

        var snapshot = Snapshot(meetingId);
        await Groups.AddToGroupAsync(Context.ConnectionId, meetingId);
        await Clients.Group(meetingId).SendAsync("roomPresenceChanged", snapshot, Context.ConnectionAborted);
        return snapshot;
    }

    public async Task LeaveRoom(string meetingId)
    {
        var snapshot = RemoveConnectionFromRoom(meetingId, Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, meetingId);
        await Clients.Group(meetingId).SendAsync("roomPresenceChanged", snapshot, Context.ConnectionAborted);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectionRooms.TryRemove(Context.ConnectionId, out var meetingIds))
        {
            foreach (var meetingId in meetingIds)
            {
                var snapshot = RemoveConnectionFromRoom(meetingId, Context.ConnectionId);
                await Clients.Group(meetingId).SendAsync("roomPresenceChanged", snapshot);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    private IReadOnlyCollection<MeetingRoomParticipant> Snapshot(string meetingId)
        => Rooms.TryGetValue(meetingId, out var room)
            ? room.Values.Select(value => value.Participant).OrderBy(value => value.JoinedAt).ToArray()
            : [];

    private IReadOnlyCollection<MeetingRoomParticipant> RemoveConnectionFromRoom(string meetingId, string connectionId)
    {
        if (Rooms.TryGetValue(meetingId, out var room))
        {
            foreach (var entry in room)
            {
                if (!entry.Value.ConnectionIds.Remove(connectionId))
                    continue;
                if (entry.Value.ConnectionIds.Count == 0)
                    room.TryRemove(entry.Key, out _);
                else
                    room[entry.Key] = entry.Value;
            }

            if (room.IsEmpty)
                Rooms.TryRemove(meetingId, out _);
        }

        return Snapshot(meetingId);
    }

    private sealed record ConnectionPresence(MeetingRoomParticipant Participant, HashSet<string> ConnectionIds);
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ConnectionPresence>> Rooms = new();
    private static readonly ConcurrentDictionary<string, HashSet<string>> ConnectionRooms = new();
}

public sealed class SignalRMeetingStatusPublisher(IHubContext<MeetingStatusHub> hub) : IMeetingStatusPublisher
{
    public Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken)
        => hub.Clients.Group(meetingId.ToString()).SendAsync("meetingStatusChanged", new { meetingId, status }, cancellationToken);
}
