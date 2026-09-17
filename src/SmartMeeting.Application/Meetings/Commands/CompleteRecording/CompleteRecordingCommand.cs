using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.CompleteRecording;

public sealed record CompleteRecordingCommand(Guid MeetingId, string AudioFilePath) : IRequest<Result<MeetingResponse>>;

public sealed class CompleteRecordingCommandHandler(IApplicationDbContext db, IMeetingProcessingQueue queue, ICurrentUserService currentUser) : IRequestHandler<CompleteRecordingCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(CompleteRecordingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!meeting.CanManage(currentUser.UserId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");
        meeting.CompleteRecording(request.AudioFilePath);
        await db.SaveChangesAsync(cancellationToken);
        await queue.EnqueueAsync(meeting.Id, cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
