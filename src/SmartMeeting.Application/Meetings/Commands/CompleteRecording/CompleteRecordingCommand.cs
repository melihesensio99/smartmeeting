using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Meetings.Dtos;

namespace SmartMeeting.Application.Meetings.Commands.CompleteRecording;

public sealed record CompleteRecordingCommand(Guid MeetingId, string AudioFilePath) : IRequest<Result<MeetingDto>>;

public sealed class CompleteRecordingHandler(IApplicationDbContext db, IMeetingProcessingQueue queue) : IRequestHandler<CompleteRecordingCommand, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(CompleteRecordingCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingDto>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        meeting.CompleteRecording(request.AudioFilePath);
        await db.SaveChangesAsync(cancellationToken);
        await queue.EnqueueAsync(meeting.Id, cancellationToken);
        return Result<MeetingDto>.Success(MeetingDto.From(meeting));
    }
}
