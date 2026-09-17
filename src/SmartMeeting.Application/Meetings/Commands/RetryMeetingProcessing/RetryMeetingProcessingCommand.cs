using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;

namespace SmartMeeting.Application.Meetings.Commands.RetryMeetingProcessing;

public sealed record RetryMeetingProcessingCommand(Guid MeetingId) : IRequest<Result<MeetingResponse>>;

public sealed class RetryMeetingProcessingCommandHandler(
    IApplicationDbContext db,
    IMeetingProcessingQueue queue,
    ICurrentUserService currentUser) : IRequestHandler<RetryMeetingProcessingCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(RetryMeetingProcessingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanManage(meeting)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");

        try
        {
            meeting.RetryProcessing();
        }
        catch (SmartMeeting.Domain.Meetings.DomainException exception)
        {
            return Result<MeetingResponse>.Failure("meeting_invalid_status", exception.Message);
        }

        await db.SaveChangesAsync(cancellationToken);
        await queue.EnqueueAsync(meeting.Id, cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
