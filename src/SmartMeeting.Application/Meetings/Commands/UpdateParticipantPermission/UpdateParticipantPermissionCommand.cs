using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;

namespace SmartMeeting.Application.Meetings.Commands.UpdateParticipantPermission;

public sealed record UpdateParticipantPermissionCommand(Guid MeetingId, Guid ParticipantId, bool CanManageMeeting) : IRequest<Result<MeetingResponse>>;

public sealed class UpdateParticipantPermissionCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<UpdateParticipantPermissionCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(UpdateParticipantPermissionCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (currentUser.UserId != meeting.OrganizerId) return Result<MeetingResponse>.Failure("meeting_forbidden", "Katılımcı yetkisini yalnızca toplantı sahibi değiştirebilir.");
        if (!meeting.SetParticipantManagementPermission(request.ParticipantId, request.CanManageMeeting))
            return Result<MeetingResponse>.Failure("participant_not_found", "Katılımcı bulunamadı.");

        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
