using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Commands.CompleteActionItem;

public sealed record CompleteActionItemCommand(Guid MeetingId, Guid ActionItemId) : IRequest<Result<MeetingDto>>;

public sealed class CompleteActionItemHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<CompleteActionItemCommand, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(CompleteActionItemCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingDto>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingDto>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        try
        {
            meeting.CompleteActionItem(request.ActionItemId);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingDto>.Success(MeetingDto.From(meeting));
        }
        catch (SmartMeeting.Domain.Meetings.DomainException exception)
        {
            return Result<MeetingDto>.Failure("action_item_not_found", exception.Message);
        }
    }
}
