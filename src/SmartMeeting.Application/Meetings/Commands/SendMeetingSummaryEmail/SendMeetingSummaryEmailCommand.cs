using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.SendMeetingSummaryEmail;

public sealed record SendMeetingSummaryEmailCommand(Guid MeetingId) : IRequest<Result>;

public sealed class SendMeetingSummaryEmailCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IEmailService emailService) : IRequestHandler<SendMeetingSummaryEmailCommand, Result>
{
    public async Task<Result> Handle(SendMeetingSummaryEmailCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanManage(meeting)) return Result.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");
        if (meeting.Summary is null) return Result.Failure("summary_not_ready", "Toplantı özeti henüz hazır değil.");
        try
        {
            await emailService.SendMeetingSummaryAsync(meeting, cancellationToken);
            return Result.Success();
        }
        catch (InvalidOperationException exception)
        {
            return Result.Failure("email_not_configured", exception.Message);
        }
    }
}
