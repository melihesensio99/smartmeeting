using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Abstractions.Communication;

public interface IEmailService
{
    Task SendMeetingSummaryAsync(Meeting meeting, CancellationToken cancellationToken);
}
