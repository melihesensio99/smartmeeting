using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Responses;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Commands.CreateActionItem;

public sealed record CreateActionItemCommand(Guid MeetingId, string Description, IReadOnlyCollection<string> AssigneeUserIds, DateTimeOffset? DueAt, ActionPriority Priority) : IRequest<Result<MeetingResponse>>;

public sealed class CreateActionItemValidator : AbstractValidator<CreateActionItemCommand>
{
    public CreateActionItemValidator()
    {
        RuleFor(x => x.Description).NotEmpty().MaximumLength(1000);
        RuleForEach(x => x.AssigneeUserIds).NotEmpty().MaximumLength(100);
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
            var assignees = new List<(string UserId, string DisplayName)>();
            foreach (var userId in request.AssigneeUserIds.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var assignee = await identityService.FindByIdAsync(userId, cancellationToken);
                if (assignee is null) return Result<MeetingResponse>.Failure("assignee_not_found", "Aksiyon sorumlularından biri sistemde kayıtlı değil.");
                if (assignee.UserId != meeting.OrganizerId && !meeting.Participants.Any(x => x.UserId == assignee.UserId)) return Result<MeetingResponse>.Failure("assignee_not_participant", "Aksiyon yalnızca toplantı katılımcılarına atanabilir.");
                assignees.Add((assignee.UserId, assignee.DisplayName));
            }
            meeting.AddActionItem(request.Description, assignees.Select(x => x.UserId).ToList(), assignees.Select(x => x.DisplayName).ToList(), request.DueAt?.ToUniversalTime(), request.Priority);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
        }
        catch (DomainException exception)
        {
            return Result<MeetingResponse>.Failure("action_item_invalid", exception.Message);
        }
    }
}
