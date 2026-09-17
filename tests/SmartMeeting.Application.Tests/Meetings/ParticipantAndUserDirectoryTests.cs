using SmartMeeting.Application.Abstractions.Identity;
using SmartMeeting.Application.Abstractions.Persistence;
using SmartMeeting.Application.Auth.Contracts;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Commands.AddParticipant;
using SmartMeeting.Application.Meetings.Commands.RemoveParticipant;
using SmartMeeting.Application.Meetings.Commands.UpdateParticipantPermission;
using SmartMeeting.Application.Meetings.Commands.LeaveMeeting;
using SmartMeeting.Application.Users.Queries.SearchUsers;
using SmartMeeting.Application.Users.Responses;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Tests.Meetings;

public sealed class ParticipantAndUserDirectoryTests
{
    [Fact]
    public async Task AddParticipant_rejects_unknown_identity_user()
    {
        var meeting = Meeting.Create("Planlama", "organizer", DateTimeOffset.UtcNow);
        var context = new TestDbContext(meeting);
        var handler = new AddParticipantCommandHandler(context, new FakeIdentityService(null), new FakeCurrentUserService("organizer"));

        var result = await handler.Handle(new AddParticipantCommand(meeting.Id, "unknown", "Ayşe", "ayse@example.com"), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("participant_not_found", result.Error!.Code);
        Assert.Empty(meeting.Participants);
    }

    [Fact]
    public async Task AddParticipant_rejects_identity_data_mismatch()
    {
        var meeting = Meeting.Create("Planlama", "organizer", DateTimeOffset.UtcNow);
        var context = new TestDbContext(meeting);
        var identity = new FakeIdentityService(new RegisteredUser("user-2", "real@example.com", "Ayşe Yılmaz"));
        var handler = new AddParticipantCommandHandler(context, identity, new FakeCurrentUserService("organizer"));

        var result = await handler.Handle(new AddParticipantCommand(meeting.Id, "user-2", "Ayşe Yılmaz", "wrong@example.com"), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("participant_identity_mismatch", result.Error!.Code);
        Assert.Empty(meeting.Participants);
    }

    [Fact]
    public async Task AddParticipant_uses_verified_identity_data()
    {
        var meeting = Meeting.Create("Planlama", "organizer", DateTimeOffset.UtcNow);
        var context = new TestDbContext(meeting);
        var identity = new FakeIdentityService(new RegisteredUser("user-2", "ayse@example.com", "Ayşe Yılmaz"));
        var handler = new AddParticipantCommandHandler(context, identity, new FakeCurrentUserService("organizer"));

        var result = await handler.Handle(new AddParticipantCommand(meeting.Id, "user-2", "Ayşe Yılmaz", "ayse@example.com"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var participant = Assert.Single(meeting.Participants);
        Assert.Equal("user-2", participant.UserId);
        Assert.Equal("Ayşe Yılmaz", participant.DisplayName);
    }

    [Fact]
    public async Task AddParticipant_allows_organizer_to_grant_meeting_management_permission()
    {
        var meeting = Meeting.Create("Planlama", "organizer", DateTimeOffset.UtcNow);
        var context = new TestDbContext(meeting);
        var identity = new FakeIdentityService(new RegisteredUser("user-2", "ayse@example.com", "Ayşe Yılmaz"));
        var handler = new AddParticipantCommandHandler(context, identity, new FakeCurrentUserService("organizer"));

        var result = await handler.Handle(new AddParticipantCommand(meeting.Id, "user-2", "Ayşe Yılmaz", "ayse@example.com", true), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(Assert.Single(meeting.Participants).CanManageMeeting);
    }

    [Fact]
    public async Task AddParticipant_rejects_non_organizer_even_when_user_has_meeting_permission()
    {
        var meeting = Meeting.Create("Planlama", "organizer", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe Yılmaz", "ayse@example.com", canManageMeeting: true);
        var context = new TestDbContext(meeting);
        var identity = new FakeIdentityService(new RegisteredUser("user-3", "mehmet@example.com", "Mehmet Yılmaz"));
        var handler = new AddParticipantCommandHandler(context, identity, new FakeCurrentUserService("user-2"));

        var result = await handler.Handle(new AddParticipantCommand(meeting.Id, "user-3", "Mehmet Yılmaz", "mehmet@example.com", true), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("meeting_forbidden", result.Error!.Code);
        Assert.DoesNotContain(meeting.Participants, participant => participant.UserId == "user-3");
    }

    [Fact]
    public async Task Organizer_can_revoke_permission_and_remove_participant()
    {
        var meeting = Meeting.Create("Planlama", "organizer", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe Yılmaz", "ayse@example.com", canManageMeeting: true);
        var participantId = meeting.Participants.Single().Id;
        var context = new TestDbContext(meeting);
        var currentUser = new FakeCurrentUserService("organizer");

        var permissionResult = await new UpdateParticipantPermissionCommandHandler(context, currentUser)
            .Handle(new UpdateParticipantPermissionCommand(meeting.Id, participantId, false), CancellationToken.None);
        var removeResult = await new RemoveParticipantCommandHandler(context, currentUser)
            .Handle(new RemoveParticipantCommand(meeting.Id, participantId), CancellationToken.None);

        Assert.True(permissionResult.IsSuccess);
        Assert.True(removeResult.IsSuccess);
        Assert.Empty(meeting.Participants);
    }

    [Fact]
    public async Task Participant_can_leave_but_organizer_cannot_leave()
    {
        var meeting = Meeting.Create("Planlama", "organizer", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe Yılmaz", "ayse@example.com");
        var context = new TestDbContext(meeting);

        var participantResult = await new LeaveMeetingCommandHandler(context, new FakeCurrentUserService("user-2"))
            .Handle(new LeaveMeetingCommand(meeting.Id), CancellationToken.None);
        var organizerResult = await new LeaveMeetingCommandHandler(context, new FakeCurrentUserService("organizer"))
            .Handle(new LeaveMeetingCommand(meeting.Id), CancellationToken.None);

        Assert.True(participantResult.IsSuccess);
        Assert.Equal("organizer_cannot_leave", organizerResult.Error!.Code);
        Assert.Empty(meeting.Participants);
    }

    [Fact]
    public async Task SearchUsers_returns_directory_results()
    {
        var directory = new FakeUserDirectoryService([new UserResponse("user-2", "Ayşe Yılmaz", "ayse@example.com")]);

        var result = await new SearchUsersQueryHandler(directory).Handle(new SearchUsersQuery("ayşe"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("user-2", result.Value!.Single().UserId);
    }

    [Fact]
    public async Task SearchUsers_rejects_short_search_terms()
    {
        var result = await new SearchUsersQueryHandler(new FakeUserDirectoryService([])).Handle(new SearchUsersQuery("a"), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("search_too_short", result.Error!.Code);
    }

    private sealed class FakeIdentityService(RegisteredUser? user) : IIdentityService
    {
        public Task<Result<RegisteredUser>> RegisterAsync(string email, string password, string displayName, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<Result<AuthenticatedUser>> LoginAsync(string email, string password, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<RegisteredUser?> FindByIdAsync(string userId, CancellationToken cancellationToken) => Task.FromResult(user);
    }

    private sealed class FakeUserDirectoryService(IReadOnlyCollection<UserResponse> users) : IUserDirectoryService
    {
        public Task<IReadOnlyCollection<UserResponse>> SearchAsync(string search, CancellationToken cancellationToken) => Task.FromResult(users);
    }

    private sealed class FakeCurrentUserService(string userId) : ICurrentUserService
    {
        public string? UserId => userId;
        public bool IsAuthenticated => true;
    }

    private sealed class TestDbContext(Meeting meeting) : IApplicationDbContext
    {
        public void AddMeeting(Meeting value) => throw new NotImplementedException();
        public Task<Meeting?> GetMeetingAsync(Guid meetingId, CancellationToken cancellationToken) => Task.FromResult<Meeting?>(meeting.Id == meetingId ? meeting : null);
        public Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyCollection<Meeting>>([meeting]);
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken) => Task.FromResult(1);
    }
}
