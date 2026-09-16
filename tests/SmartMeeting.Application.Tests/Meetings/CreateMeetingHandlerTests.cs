using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Meetings.Commands.CreateMeeting;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Tests.Meetings;

public sealed class CreateMeetingHandlerTests
{
    [Fact]
    public async Task Handle_persists_meeting_and_returns_dto()
    {
        var context = new FakeApplicationDbContext();
        var handler = new CreateMeetingHandler(context);
        var command = new CreateMeetingCommand("Sprint planlama", "user-1", DateTimeOffset.UtcNow.AddDays(1), null);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("Sprint planlama", result.Value.Title);
        Assert.Single(context.AddedMeetings);
    }

    [Fact]
    public async Task GetMeetings_returns_only_requested_organizer()
    {
        var context = new FakeApplicationDbContext();
        context.Seed(Meeting.Create("Birinci", "user-1", DateTimeOffset.UtcNow));
        context.Seed(Meeting.Create("İkinci", "user-2", DateTimeOffset.UtcNow.AddHours(1)));
        var handler = new Application.Meetings.Queries.GetMeetings.GetMeetingsHandler(context);

        var result = await handler.Handle(new Application.Meetings.Queries.GetMeetings.GetMeetingsQuery("user-1"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("Birinci", result.Value!.Single().Title);
    }

    [Fact]
    public async Task GetMeeting_returns_not_found_for_unknown_id()
    {
        var context = new FakeApplicationDbContext();
        var handler = new Application.Meetings.Queries.GetMeeting.GetMeetingHandler(context);

        var result = await handler.Handle(new Application.Meetings.Queries.GetMeeting.GetMeetingQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("meeting_not_found", result.Error!.Code);
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
}
