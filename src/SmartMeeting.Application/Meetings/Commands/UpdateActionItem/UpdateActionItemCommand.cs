using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Commands.UpdateActionItem;

public sealed record UpdateActionItemCommand(Guid MeetingId, Guid ActionItemId, string? Assignee, DateTimeOffset? DueAt, ActionPriority Priority) : IRequest<Result<MeetingResponse>>;

public sealed class UpdateActionItemValidator : AbstractValidator<UpdateActionItemCommand>
{
    public UpdateActionItemValidator()
    {
        RuleFor(x => x.Assignee).MaximumLength(160);
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public sealed class UpdateActionItemCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<UpdateActionItemCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(UpdateActionItemCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Aksiyon bilgilerini yalnızca toplantı sahibi güncelleyebilir.");
        try
        {
            meeting.UpdateActionItem(request.ActionItemId, request.Assignee, request.DueAt, request.Priority);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
        }
        catch (DomainException exception)
        {
            return Result<MeetingResponse>.Failure("action_item_not_found", exception.Message);
        }
    }
}
