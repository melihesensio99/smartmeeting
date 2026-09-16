using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.UpdateMeetingNotes;

public sealed record UpdateMeetingNotesCommand(Guid MeetingId, string Notes) : IRequest<Result<MeetingResponse>>;

public sealed class UpdateMeetingNotesValidator : AbstractValidator<UpdateMeetingNotesCommand>
{
    public UpdateMeetingNotesValidator() => RuleFor(x => x.Notes).NotEmpty().MaximumLength(10000);
}

public sealed class UpdateMeetingNotesHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<UpdateMeetingNotesCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(UpdateMeetingNotesCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        meeting.SetNotes(request.Notes);
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
