using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Commands.UpdateMeetingNotes;

public sealed record UpdateMeetingNotesCommand(Guid MeetingId, string Notes) : IRequest<Result<MeetingDto>>;

public sealed class UpdateMeetingNotesValidator : AbstractValidator<UpdateMeetingNotesCommand>
{
    public UpdateMeetingNotesValidator() => RuleFor(x => x.Notes).NotEmpty().MaximumLength(10000);
}

public sealed class UpdateMeetingNotesHandler(IApplicationDbContext db) : IRequestHandler<UpdateMeetingNotesCommand, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(UpdateMeetingNotesCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingDto>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        meeting.SetNotes(request.Notes);
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingDto>.Success(MeetingDto.From(meeting));
    }
}
