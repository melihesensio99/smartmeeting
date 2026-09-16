using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Abstractions.Persistence;

public interface IApplicationDbContext
{
    void AddMeeting(Meeting meeting);
    Task<Meeting?> GetMeetingAsync(Guid meetingId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Meeting>> GetMeetingsAsync(string? organizerId, CancellationToken cancellationToken);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
