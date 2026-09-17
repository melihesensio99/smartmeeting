using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;

namespace SmartMeeting.Application.Meetings.Commands.LeaveMeeting;

public sealed record LeaveMeetingCommand(Guid MeetingId) : IRequest<Result<MeetingResponse>>;

public sealed class LeaveMeetingCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<LeaveMeetingCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(LeaveMeetingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (currentUser.UserId == meeting.OrganizerId) return Result<MeetingResponse>.Failure("organizer_cannot_leave", "Toplantı sahibi toplantıdan ayrılamaz.");
        if (string.IsNullOrWhiteSpace(currentUser.UserId) || !meeting.RemoveParticipant(currentUser.UserId))
            return Result<MeetingResponse>.Failure("participant_not_found", "Bu toplantıda katılımcı değilsiniz.");

        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
