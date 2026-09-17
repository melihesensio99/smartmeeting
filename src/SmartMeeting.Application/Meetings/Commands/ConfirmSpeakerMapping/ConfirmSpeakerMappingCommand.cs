using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;

namespace SmartMeeting.Application.Meetings.Commands.ConfirmSpeakerMapping;

public sealed record ConfirmSpeakerMappingCommand(Guid MeetingId, Guid ParticipantId) : IRequest<Result<MeetingResponse>>;

public sealed class ConfirmSpeakerMappingCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<ConfirmSpeakerMappingCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(ConfirmSpeakerMappingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanManage(meeting)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");
        meeting.ConfirmSpeakerMapping(request.ParticipantId);
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
