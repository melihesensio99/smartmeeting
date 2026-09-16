using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Commands.StartRecording;

public sealed record StartRecordingCommand(Guid MeetingId) : IRequest<Result<MeetingDto>>;

public sealed class StartRecordingHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<StartRecordingCommand, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(StartRecordingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingDto>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingDto>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        meeting.StartRecording();
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingDto>.Success(MeetingDto.From(meeting));
    }
}
