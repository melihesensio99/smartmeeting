using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Abstractions.Processing;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;

namespace SmartMeeting.Application.Meetings.Commands.CompleteMeeting;

public sealed record CompleteMeetingCommand(Guid MeetingId) : IRequest<Result<MeetingResponse>>;

public sealed class CompleteMeetingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IMeetingStatusPublisher statusPublisher) : IRequestHandler<CompleteMeetingCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(CompleteMeetingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanManage(meeting)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Toplantıyı yalnızca oda yöneticisi bitirebilir.");

        try
        {
            meeting.CompleteMeeting();
        }
        catch (SmartMeeting.Domain.Meetings.DomainException exception)
        {
            return Result<MeetingResponse>.Failure("meeting_invalid_status", exception.Message);
        }

        await db.SaveChangesAsync(cancellationToken);
        await statusPublisher.PublishAsync(meeting.Id, meeting.Status.ToString(), cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
