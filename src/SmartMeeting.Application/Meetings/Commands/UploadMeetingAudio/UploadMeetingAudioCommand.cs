using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Meetings.Commands.UploadMeetingAudio;

public sealed record UploadMeetingAudioCommand(Guid MeetingId, Stream Audio, string OriginalFileName, string ContentType) : IRequest<Result<MeetingResponse>>;

public sealed class UploadMeetingAudioCommandHandler(IApplicationDbContext db, IAudioStorage storage, IMeetingProcessingQueue queue, ICurrentUserService currentUser) : IRequestHandler<UploadMeetingAudioCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(UploadMeetingAudioCommand request, CancellationToken cancellationToken)
    {
        var meeting = await db.GetMeetingAsync(request.MeetingId, cancellationToken);
        if (meeting is null) return Result<MeetingResponse>.Failure("meeting_not_found", "Toplantı bulunamadı.");
        if (!currentUser.CanAccess(meeting.OrganizerId)) return Result<MeetingResponse>.Failure("meeting_forbidden", "Bu toplantıya erişim yetkiniz yok.");
        var path = await storage.SaveAsync(request.Audio, request.OriginalFileName, request.ContentType, cancellationToken);
        meeting.CompleteRecording(path);
        await db.SaveChangesAsync(cancellationToken);
        await queue.EnqueueAsync(meeting.Id, cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
