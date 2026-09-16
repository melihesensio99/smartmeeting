using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Commands.StartRecording;

public sealed record StartRecordingCommand(Guid MeetingId) : IRequest<Result<MeetingDto>>;

public sealed class StartRecordingHandler(IApplicationDbContext db) : IRequestHandler<StartRecordingCommand, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(StartRecordingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingDto>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        meeting.StartRecording();
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingDto>.Success(MeetingDto.From(meeting));
    }
}
