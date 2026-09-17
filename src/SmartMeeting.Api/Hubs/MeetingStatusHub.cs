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
        UserConnections.AddOrUpdate(userId,
            _ => [Context.ConnectionId],
            (_, existing) => existing.Append(Context.ConnectionId).ToHashSet());

        var snapshot = Snapshot(meetingId);
        await Groups.AddToGroupAsync(Context.ConnectionId, meetingId);
        await Clients.Group(meetingId).SendAsync("roomPresenceChanged", snapshot, Context.ConnectionAborted);
        await Clients.GroupExcept(meetingId, Context.ConnectionId).SendAsync("roomParticipantJoined", new { userId }, Context.ConnectionAborted);
        return snapshot;
    }

    public async Task LeaveRoom(string meetingId)
    {
        var userId = currentUser.UserId;
        var snapshot = RemoveConnectionFromRoom(meetingId, Context.ConnectionId);
        if (ConnectionRooms.TryGetValue(Context.ConnectionId, out var meetingIds))
        {
            meetingIds.Remove(meetingId);
            if (meetingIds.Count == 0)
                ConnectionRooms.TryRemove(Context.ConnectionId, out _);
        }
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, meetingId);
        await Clients.Group(meetingId).SendAsync("roomPresenceChanged", snapshot, Context.ConnectionAborted);
        if (!string.IsNullOrWhiteSpace(userId) && !snapshot.Any(participant => participant.UserId == userId))
            await Clients.Group(meetingId).SendAsync("roomParticipantLeft", new { userId }, Context.ConnectionAborted);
    }

    public async Task SendWebRtcSignal(string meetingId, string targetUserId, string signalType, string payload)
    {
        if (!Guid.TryParse(meetingId, out _) || string.IsNullOrWhiteSpace(targetUserId) || string.IsNullOrWhiteSpace(payload))
            throw new HubException("Geçersiz WebRTC sinyali.");

        var senderUserId = currentUser.UserId;
        if (string.IsNullOrWhiteSpace(senderUserId) || !Rooms.TryGetValue(meetingId, out var room) || !room.ContainsKey(senderUserId) || !room.ContainsKey(targetUserId))
            throw new HubException("WebRTC sinyali için iki kullanıcı da aynı odada olmalıdır.");

        if (!UserConnections.TryGetValue(targetUserId, out var targetConnections))
            return;

        var signal = new { fromUserId = senderUserId, signalType, payload };
        foreach (var connectionId in targetConnections)
            await Clients.Client(connectionId).SendAsync("webrtcSignal", signal, Context.ConnectionAborted);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectionRooms.TryRemove(Context.ConnectionId, out var meetingIds))
        {
            var userId = currentUser.UserId;
            foreach (var meetingId in meetingIds)
            {
                var snapshot = RemoveConnectionFromRoom(meetingId, Context.ConnectionId);
                await Clients.Group(meetingId).SendAsync("roomPresenceChanged", snapshot);
                if (!string.IsNullOrWhiteSpace(userId) && !snapshot.Any(participant => participant.UserId == userId))
                    await Clients.Group(meetingId).SendAsync("roomParticipantLeft", new { userId });
            }

            if (!string.IsNullOrWhiteSpace(userId) && UserConnections.TryGetValue(userId, out var connections))
            {
                connections.Remove(Context.ConnectionId);
                if (connections.Count == 0)
                    UserConnections.TryRemove(userId, out _);
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
    private static readonly ConcurrentDictionary<string, HashSet<string>> UserConnections = new();
}

public sealed class SignalRMeetingStatusPublisher(IHubContext<MeetingStatusHub> hub) : IMeetingStatusPublisher
{
    public Task PublishAsync(Guid meetingId, string status, CancellationToken cancellationToken)
        => hub.Clients.Group(meetingId.ToString()).SendAsync("meetingStatusChanged", new { meetingId, status }, cancellationToken);
}
