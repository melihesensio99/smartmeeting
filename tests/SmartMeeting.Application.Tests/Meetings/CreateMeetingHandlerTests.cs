using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Meetings.Commands.CreateMeeting;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Tests.Meetings;

public sealed class CreateMeetingCommandHandlerTests
{
    [Fact]
    public async Task Handle_persists_meeting_and_returns_dto()
    {
        var context = new FakeApplicationDbContext();
        var handler = new CreateMeetingCommandHandler(context, new FakeCurrentUserService("user-1"));
        var command = new CreateMeetingCommand("Sprint planlama", DateTimeOffset.UtcNow.AddDays(1), null);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("Sprint planlama", result.Value.Title);
        Assert.Single(context.AddedMeetings);
    }

    [Fact]
    public async Task Handle_rejects_anonymous_meeting_creation()
    {
        var context = new FakeApplicationDbContext();
        var handler = new CreateMeetingCommandHandler(context, new FakeCurrentUserService());

        var result = await handler.Handle(new CreateMeetingCommand("Yetkisiz toplantı", DateTimeOffset.UtcNow, null), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("authentication_required", result.Error!.Code);
        Assert.Empty(context.AddedMeetings);
    }

    [Fact]
    public async Task GetMeetings_returns_only_requested_organizer()
    {
        var context = new FakeApplicationDbContext();
        context.Seed(Meeting.Create("Birinci", "user-1", DateTimeOffset.UtcNow));
        context.Seed(Meeting.Create("İkinci", "user-2", DateTimeOffset.UtcNow.AddHours(1)));
        var handler = new Application.Meetings.Queries.GetMeetings.GetMeetingsQueryHandler(context, new FakeCurrentUserService());

        var result = await handler.Handle(new Application.Meetings.Queries.GetMeetings.GetMeetingsQuery("user-1"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("Birinci", result.Value!.Single().Title);
    }

    [Fact]
    public async Task Handle_uses_authenticated_user_as_organizer()
    {
        var context = new FakeApplicationDbContext();
        var handler = new CreateMeetingCommandHandler(context, new FakeCurrentUserService("identity-user"));

        var result = await handler.Handle(new CreateMeetingCommand("Güvenli toplantı", DateTimeOffset.UtcNow, null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("identity-user", result.Value!.OrganizerId);
    }

    [Fact]
    public async Task GetMeeting_returns_not_found_for_unknown_id()
    {
        var context = new FakeApplicationDbContext();
        var handler = new Application.Meetings.Queries.GetMeeting.GetMeetingQueryHandler(context, new FakeCurrentUserService());

        var result = await handler.Handle(new Application.Meetings.Queries.GetMeeting.GetMeetingQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("meeting_not_found", result.Error!.Code);
    }

    [Fact]
    public async Task CompleteActionItem_persists_completion()
    {
        var context = new FakeApplicationDbContext();
        var action = new ActionItem("Takip et", "user-2", null);
        var meeting = Meeting.Create("Planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("audio.webm");
        meeting.SetTranscript("transcript");
        meeting.SetSummary(MeetingSummary.Create("Özet", [], [action]));
        context.Seed(meeting);
        var handler = new Application.Meetings.Commands.CompleteActionItem.CompleteActionItemCommandHandler(context, new FakeCurrentUserService("user-1"));

        var result = await handler.Handle(new Application.Meetings.Commands.CompleteActionItem.CompleteActionItemCommand(meeting.Id, action.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value!.Summary!.ActionItems.Single().Completed);
    }

    [Fact]
    public async Task UpdateMeetingNotes_returns_updated_meeting()
    {
        var context = new FakeApplicationDbContext();
        var meeting = Meeting.Create("Planlama", "user-1", DateTimeOffset.UtcNow);
        context.Seed(meeting);
        var handler = new Application.Meetings.Commands.UpdateMeetingNotes.UpdateMeetingNotesCommandHandler(context, new FakeCurrentUserService("user-1"));

        var result = await handler.Handle(new Application.Meetings.Commands.UpdateMeetingNotes.UpdateMeetingNotesCommand(meeting.Id, "Takip notu"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Takip notu", result.Value!.Notes);
    }

    private sealed class FakeApplicationDbContext : IApplicationDbContext
    {
        private readonly List<Meeting> _meetings = [];
        public List<Meeting> AddedMeetings { get; } = [];
        public void Seed(Meeting meeting) => _meetings.Add(meeting);
        public void AddMeeting(Meeting meeting) { _meetings.Add(meeting); AddedMeetings.Add(meeting); }
        public Task<Meeting?> GetMeetingAsync(Guid meetingId, CancellationToken cancellationToken)
            => Task.FromResult(_meetings.SingleOrDefault(x => x.Id == meetingId));
        public Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken)
        {
            IReadOnlyCollection<Meeting> result = _meetings.Where(x => string.IsNullOrWhiteSpace(organizerId) || x.OrganizerId == organizerId).ToList();
            return Task.FromResult(result);
        }
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken) => Task.FromResult(1);
    }

    private sealed class FakeCurrentUserService(string? userId = null) : ICurrentUserService
    {
        public string? UserId => userId;
        public bool IsAuthenticated => userId is not null;
        public bool CanCreateMeetings => IsAuthenticated;
    }
}
