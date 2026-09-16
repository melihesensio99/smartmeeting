using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.AddParticipant;

public sealed record AddParticipantCommand(Guid MeetingId, string UserId, string DisplayName, string Email) : IRequest<Result<MeetingResponse>>;

public sealed class AddParticipantValidator : AbstractValidator<AddParticipantCommand>
{
    public AddParticipantValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
    }
}

public sealed class AddParticipantHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<AddParticipantCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(AddParticipantCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        meeting.AddParticipant(request.UserId, request.DisplayName, request.Email);
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
