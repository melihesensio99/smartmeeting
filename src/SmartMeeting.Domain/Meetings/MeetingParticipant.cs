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
    public SpeakerMappingStatus SpeakerMappingStatus { get; private set; }
    public decimal? SpeakerConfidence { get; private set; }
    public static MeetingParticipant Create(Guid meetingId, string userId, string displayName, string email, bool canManageMeeting = false)
        => new(Guid.NewGuid(), meetingId, userId.Trim(), displayName.Trim(), email.Trim(), canManageMeeting);

    public void SuggestSpeakerLabel(string speakerLabel, decimal? confidence = null)
    {
        if (string.IsNullOrWhiteSpace(speakerLabel)) throw new DomainException("Konuşmacı etiketi boş olamaz.");
        SpeakerLabel = speakerLabel.Trim();
        SpeakerConfidence = confidence is null ? null : Math.Clamp(confidence.Value, 0m, 1m);
        SpeakerMappingStatus = SpeakerMappingStatus.PendingConfirmation;
    }

    public void ConfirmSpeakerLabel()
    {
        if (string.IsNullOrWhiteSpace(SpeakerLabel)) throw new DomainException("Onaylanacak konuşmacı eşleştirmesi bulunamadı.");
        SpeakerMappingStatus = SpeakerMappingStatus.Confirmed;
    }

    public void RejectSpeakerLabel()
    {
        SpeakerLabel = null;
        SpeakerConfidence = null;
        SpeakerMappingStatus = SpeakerMappingStatus.None;
    }

    public void SetManagementPermission(bool canManageMeeting) => CanManageMeeting = canManageMeeting;
}
