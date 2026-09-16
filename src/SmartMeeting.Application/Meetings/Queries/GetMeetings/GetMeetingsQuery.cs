using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Queries.GetMeetings;

public sealed record GetMeetingsQuery(string? OrganizerId) : IRequest<Result<IReadOnlyCollection<MeetingDto>>>;

public sealed class GetMeetingsHandler(IApplicationDbContext db) : IRequestHandler<GetMeetingsQuery, Result<IReadOnlyCollection<MeetingDto>>>
{
    public async Task<Result<IReadOnlyCollection<MeetingDto>>> Handle(GetMeetingsQuery request, CancellationToken cancellationToken)
    {
        var meetings = await db.GetMeetingsAsync(request.OrganizerId, cancellationToken);
        return Result<IReadOnlyCollection<MeetingDto>>.Success(meetings.Select(MeetingDto.From).ToList());
    }
}
