using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.AddParticipant;

public sealed record AddParticipantCommand(Guid MeetingId, string UserId, string DisplayName, string Email, bool CanManageMeeting = false) : IRequest<Result<MeetingResponse>>;

public sealed class AddParticipantValidator : AbstractValidator<AddParticipantCommand>
{
    public AddParticipantValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
    }
}

public sealed class AddParticipantCommandHandler(IApplicationDbContext db, IIdentityService identityService, ICurrentUserService currentUser) : IRequestHandler<AddParticipantCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(AddParticipantCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (currentUser.UserId != meeting.OrganizerId) return Result<MeetingResponse>.Failure("meeting_forbidden", "Katılımcı yetkisini yalnızca toplantı sahibi verebilir.");
        var user = await identityService.FindByIdAsync(request.UserId, cancellationToken);
        if (user is null) return Result<MeetingResponse>.Failure("participant_not_found", "Katılımcı olarak eklenmek istenen kullanıcı bulunamadı.");
        if (!string.Equals(user.Email, request.Email.Trim(), StringComparison.OrdinalIgnoreCase) || !string.Equals(user.DisplayName, request.DisplayName.Trim(), StringComparison.Ordinal))
            return Result<MeetingResponse>.Failure("participant_identity_mismatch", "Katılımcı bilgileri sistemdeki kullanıcı kaydıyla eşleşmiyor.");
        meeting.AddParticipant(user.UserId, user.DisplayName, user.Email, request.CanManageMeeting);
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
