using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;

namespace SmartMeeting.Application.Meetings.Commands.RemoveParticipant;

public sealed record RemoveParticipantCommand(Guid MeetingId, Guid ParticipantId) : IRequest<Result<MeetingResponse>>;

public sealed class RemoveParticipantCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<RemoveParticipantCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(RemoveParticipantCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.IsGlobalManager && currentUser.UserId != meeting.OrganizerId) return Result<MeetingResponse>.Failure("meeting_forbidden", "Katılımcıyı yalnızca toplantı sahibi veya global yönetici çıkarabilir.");
        if (!meeting.RemoveParticipant(request.ParticipantId)) return Result<MeetingResponse>.Failure("participant_not_found", "Katılımcı bulunamadı.");

        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
