using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Abstractions.Ai;

public interface IAiSummarizerService
{
    Task<MeetingSummary> SummarizeAsync(string transcript, string? notes, CancellationToken cancellationToken);
}
