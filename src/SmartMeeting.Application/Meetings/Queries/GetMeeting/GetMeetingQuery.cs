using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Queries.GetMeeting;

public sealed record GetMeetingQuery(Guid MeetingId) : IRequest<Result<MeetingDto>>;

public sealed class GetMeetingHandler(IApplicationDbContext db) : IRequestHandler<GetMeetingQuery, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(GetMeetingQuery request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        return meeting is null
            ? Result<MeetingDto>.Failure("meeting_not_found", "Toplantı bulunamadı.")
            : Result<MeetingDto>.Success(MeetingDto.From(meeting));
    }
}
