using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Commands.UpdateActionItem;

public sealed record UpdateActionItemCommand(Guid MeetingId, Guid ActionItemId, string? AssigneeUserId, DateTimeOffset? DueAt, ActionPriority Priority) : IRequest<Result<MeetingResponse>>;

public sealed class UpdateActionItemValidator : AbstractValidator<UpdateActionItemCommand>
{
    public UpdateActionItemValidator()
    {
        RuleFor(x => x.AssigneeUserId).MaximumLength(100);
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public sealed class UpdateActionItemCommandHandler(IApplicationDbContext db, IIdentityService identityService, ICurrentUserService currentUser) : IRequestHandler<UpdateActionItemCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(UpdateActionItemCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanManage(meeting)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");
        try
        {
            var assignee = request.AssigneeUserId is null ? null : await identityService.FindByIdAsync(request.AssigneeUserId, cancellationToken);
            if (request.AssigneeUserId is not null && assignee is null) return Result<MeetingResponse>.Failure("assignee_not_found", "Aksiyon sorumlusu sistemde kayıtlı değil.");
            meeting.UpdateActionItem(request.ActionItemId, assignee?.UserId, assignee?.DisplayName, request.DueAt, request.Priority);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
        }
        catch (DomainException exception)
        {
            return Result<MeetingResponse>.Failure("action_item_not_found", exception.Message);
        }
    }
}
