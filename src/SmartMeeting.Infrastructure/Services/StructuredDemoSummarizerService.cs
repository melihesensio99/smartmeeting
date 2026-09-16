using SmartMeeting.Application.Abstractions;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Infrastructure.Services;

public sealed class StructuredDemoSummarizerService : IAiSummarizerService
{
    public Task<MeetingSummary> SummarizeAsync(string transcript, CancellationToken cancellationToken)
        => Task.FromResult(MeetingSummary.Create(
            "Toplantının ana başlıkları ve takip gerektiren maddeleri özetlendi.",
            ["Toplantı hedefleri gözden geçirildi."],
            [new ActionItem("Sonraki adımları planla", null, DateTimeOffset.UtcNow.AddDays(7))]));
}
