using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Queries.GetMeetings;

public sealed record GetMeetingsQuery(string? OrganizerId) : IRequest<Result<IReadOnlyCollection<MeetingResponse>>>;

public sealed class GetMeetingsHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<GetMeetingsQuery, Result<IReadOnlyCollection<MeetingResponse>>>
{
    public async Task<Result<IReadOnlyCollection<MeetingResponse>>> Handle(GetMeetingsQuery request, CancellationToken cancellationToken)
    {
        var organizerId = currentUser.IsAuthenticated ? currentUser.UserId : request.OrganizerId;
        var meetings = await db.GetMeetingsAsync(organizerId, cancellationToken);
        return Result<IReadOnlyCollection<MeetingResponse>>.Success(meetings.Select(MeetingResponse.From).ToList());
    }
}
