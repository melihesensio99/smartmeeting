using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.CompleteActionItem;

public sealed record CompleteActionItemCommand(Guid MeetingId, Guid ActionItemId) : IRequest<Result<MeetingResponse>>;

public sealed class CompleteActionItemHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<CompleteActionItemCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(CompleteActionItemCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        try
        {
            meeting.CompleteActionItem(request.ActionItemId);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
        }
        catch (SmartMeeting.Domain.Meetings.DomainException exception)
        {
            return Result<MeetingResponse>.Failure("action_item_not_found", exception.Message);
        }
    }
}
