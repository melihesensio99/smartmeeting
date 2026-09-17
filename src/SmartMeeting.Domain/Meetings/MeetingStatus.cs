namespace SmartMeeting.Domain.Meetings;

public enum MeetingStatus
{
    Scheduled,
    Recording,
    Processing,
    Ready,
    Failed,
    Cancelled,
    Completed
}
