using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Queries.GetMeeting;

public sealed record GetMeetingQuery(Guid MeetingId) : IRequest<Result<MeetingResponse>>;

public sealed class GetMeetingQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetMeetingQuery, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(GetMeetingQuery request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is not null && !currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        return meeting is null
            ? Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.")
            : Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
