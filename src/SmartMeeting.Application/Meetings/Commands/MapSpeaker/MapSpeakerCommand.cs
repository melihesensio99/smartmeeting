using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.MapSpeaker;

public sealed record MapSpeakerCommand(Guid MeetingId, Guid ParticipantId, string SpeakerLabel) : IRequest<Result<MeetingResponse>>;

public sealed class MapSpeakerValidator : AbstractValidator<MapSpeakerCommand>
{
    public MapSpeakerValidator() => RuleFor(x => x.SpeakerLabel).NotEmpty().MaximumLength(80);
}

public sealed class MapSpeakerCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<MapSpeakerCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(MapSpeakerCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!meeting.CanManage(currentUser.UserId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantı içi işlemi yapma yetkiniz yok.");
        try
        {
            meeting.MapSpeaker(request.ParticipantId, request.SpeakerLabel);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
        }
        catch (SmartMeeting.Domain.Meetings.DomainException exception)
        {
            return Result<MeetingResponse>.Failure("participant_not_found", exception.Message);
        }
    }
}
