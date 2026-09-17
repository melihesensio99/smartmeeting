using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Commands.CreateActionItem;

public sealed record CreateActionItemCommand(Guid MeetingId, string Description, string? AssigneeUserId, DateTimeOffset? DueAt, ActionPriority Priority) : IRequest<Result<MeetingResponse>>;

public sealed class CreateActionItemValidator : AbstractValidator<CreateActionItemCommand>
{
    public CreateActionItemValidator()
    {
        RuleFor(x => x.Description).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.AssigneeUserId).MaximumLength(100);
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public sealed class CreateActionItemCommandHandler(IApplicationDbContext db, IIdentityService identityService, ICurrentUserService currentUser) : IRequestHandler<CreateActionItemCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(CreateActionItemCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanManage(meeting)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");

        try
        {
            var assignee = request.AssigneeUserId is null ? null : await identityService.FindByIdAsync(request.AssigneeUserId, cancellationToken);
            if (request.AssigneeUserId is not null && assignee is null) return Result<MeetingResponse>.Failure("assignee_not_found", "Aksiyon sorumlusu sistemde kayıtlı değil.");
            meeting.AddActionItem(request.Description, assignee?.UserId, assignee?.DisplayName, request.DueAt, request.Priority);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
        }
        catch (DomainException exception)
        {
            return Result<MeetingResponse>.Failure("action_item_invalid", exception.Message);
        }
    }
}
