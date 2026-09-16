using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Commands.MapSpeaker;

public sealed record MapSpeakerCommand(Guid MeetingId, Guid ParticipantId, string SpeakerLabel) : IRequest<Result<MeetingDto>>;

public sealed class MapSpeakerValidator : AbstractValidator<MapSpeakerCommand>
{
    public MapSpeakerValidator() => RuleFor(x => x.SpeakerLabel).NotEmpty().MaximumLength(80);
}

public sealed class MapSpeakerHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<MapSpeakerCommand, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(MapSpeakerCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingDto>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingDto>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        try
        {
            meeting.MapSpeaker(request.ParticipantId, request.SpeakerLabel);
            await db.SaveChangesAsync(cancellationToken);
            return Result<MeetingDto>.Success(MeetingDto.From(meeting));
        }
        catch (SmartMeeting.Domain.Meetings.DomainException exception)
        {
            return Result<MeetingDto>.Failure("participant_not_found", exception.Message);
        }
    }
}
