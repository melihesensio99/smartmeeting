using SmartMeeting.Domain.Common;

namespace SmartMeeting.Domain.Meetings;

public sealed class MeetingParticipant : Entity
{
    private MeetingParticipant() : base(Guid.NewGuid()) { }
    private MeetingParticipant(Guid id, Guid meetingId, string userId, string displayName, string email, bool canManageMeeting) : base(id)
    {
        MeetingId = meetingId; UserId = userId; DisplayName = displayName; Email = email; CanManageMeeting = canManageMeeting;
    }

    public Guid MeetingId { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public bool CanManageMeeting { get; private set; }
    public string? SpeakerLabel { get; private set; }
    public static MeetingParticipant Create(Guid meetingId, string userId, string displayName, string email, bool canManageMeeting = false)
        => new(Guid.NewGuid(), meetingId, userId.Trim(), displayName.Trim(), email.Trim(), canManageMeeting);

    public void AssignSpeakerLabel(string speakerLabel) => SpeakerLabel = string.IsNullOrWhiteSpace(speakerLabel) ? null : speakerLabel.Trim();

    public void SetManagementPermission(bool canManageMeeting) => CanManageMeeting = canManageMeeting;
}
