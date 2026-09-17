using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.StartRecording;

public sealed record StartRecordingCommand(Guid MeetingId) : IRequest<Result<MeetingResponse>>;

public sealed class StartRecordingCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<StartRecordingCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(StartRecordingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanManage(meeting)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");
        meeting.StartRecording();
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
