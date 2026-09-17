using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Abstractions.Identity;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Queries.GetMeetings;

public sealed record GetMeetingsQuery(string? OrganizerId) : IRequest<Result<IReadOnlyCollection<MeetingResponse>>>;

public sealed class GetMeetingsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser, IIdentityService identityService) : IRequestHandler<GetMeetingsQuery, Result<IReadOnlyCollection<MeetingResponse>>>
{
    public async Task<Result<IReadOnlyCollection<MeetingResponse>>> Handle(GetMeetingsQuery request, CancellationToken cancellationToken)
    {
        var organizerId = currentUser.IsGlobalManager ? null : currentUser.IsAuthenticated ? currentUser.UserId : request.OrganizerId;
        var meetings = await db.GetMeetingsAsync(organizerId, cancellationToken);
        var responses = new List<MeetingResponse>(meetings.Count);
        foreach (var meeting in meetings)
        {
            var organizer = await identityService.FindByIdAsync(meeting.OrganizerId, cancellationToken);
            responses.Add(MeetingResponse.From(meeting) with { OrganizerEmail = organizer?.Email });
        }

        return Result<IReadOnlyCollection<MeetingResponse>>.Success(responses);
    }
}
