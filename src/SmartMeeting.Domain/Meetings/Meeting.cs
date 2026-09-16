using SmartMeeting.Domain.Common;
using SmartMeeting.Domain.Common.Events;

namespace SmartMeeting.Domain.Meetings;

public sealed class Meeting : Entity
{
    private readonly List<MeetingParticipant> _participants = [];
    private Meeting() : base(Guid.NewGuid()) { }

    private Meeting(Guid id, string title, string organizerId, DateTimeOffset startsAt, DateTimeOffset? endsAt)
        : base(id)
    {
        ChangeTitle(title);
        OrganizerId = Require(organizerId, nameof(organizerId));
        StartsAt = startsAt;
        EndsAt = endsAt;
        Status = MeetingStatus.Scheduled;
    }

    public string Title { get; private set; } = string.Empty;
    public string OrganizerId { get; private set; } = string.Empty;
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset? EndsAt { get; private set; }
    public MeetingStatus Status { get; private set; }
    public string? AudioFilePath { get; private set; }
    public string? Transcript { get; private set; }
    public string? Notes { get; private set; }
    public MeetingSummary? Summary { get; private set; }
    public IReadOnlyCollection<MeetingParticipant> Participants => _participants.AsReadOnly();

    public static Meeting Create(string title, string organizerId, DateTimeOffset startsAt, DateTimeOffset? endsAt = null)
    {
        if (endsAt is not null && endsAt <= startsAt) throw new DomainException("Bitiş tarihi başlangıçtan sonra olmalıdır.");
        return new Meeting(Guid.NewGuid(), title, organizerId, startsAt, endsAt);
    }

    public void ChangeTitle(string title) => Title = Require(title, nameof(title), 160);
    public void AddParticipant(string userId, string displayName, string email)
    {
        if (_participants.Any(x => x.UserId == userId)) return;
        _participants.Add(MeetingParticipant.Create(Id, userId, displayName, email));
        Touch();
    }

    public void MapSpeaker(Guid participantId, string speakerLabel)
    {
        var participant = _participants.SingleOrDefault(x => x.Id == participantId);
        if (participant is null) throw new DomainException("Katılımcı bulunamadı.");
        participant.AssignSpeakerLabel(speakerLabel);
        Touch();
    }

    public void StartRecording()
    {
        EnsureStatus(MeetingStatus.Scheduled);
        Status = MeetingStatus.Recording;
        Touch();
    }

    public void CompleteRecording(string audioFilePath)
    {
        EnsureStatus(MeetingStatus.Recording);
        AudioFilePath = Require(audioFilePath, nameof(audioFilePath));
        Status = MeetingStatus.Processing;
        AddDomainEvent(new MeetingProcessingRequested(Id, DateTimeOffset.UtcNow));
        Touch();
    }

    public void SetTranscript(string transcript)
    {
        if (Status is not MeetingStatus.Processing) throw new DomainException("Toplantı işlenebilir durumda değil.");
        Transcript = Require(transcript, nameof(transcript));
        Touch();
    }

    public void SetSummary(MeetingSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);
        Summary = summary;
        Status = MeetingStatus.Ready;
        Touch();
    }

    public void SetNotes(string notes)
    {
        Notes = Require(notes, nameof(notes), 10000);
        Touch();
    }

    public void CompleteActionItem(Guid actionItemId)
    {
        if (Summary is null) throw new DomainException("Toplantının özeti henüz hazır değil.");
        var actionItem = Summary.ActionItems.SingleOrDefault(x => x.Id == actionItemId);
        if (actionItem is null) throw new DomainException("Aksiyon maddesi bulunamadı.");
        actionItem.Complete();
        Touch();
    }

    public void MarkFailed() { Status = MeetingStatus.Failed; Touch(); }

    private void EnsureStatus(MeetingStatus expected)
    {
        if (Status != expected) throw new DomainException($"Toplantı durumu {expected} olmalıdır.");
    }

    private static string Require(string value, string name, int maxLength = 500)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new DomainException($"{name} boş olamaz.");
        var normalized = value.Trim();
        if (normalized.Length > maxLength) throw new DomainException($"{name} en fazla {maxLength} karakter olabilir.");
        return normalized;
    }
}

public sealed class DomainException(string message) : Exception(message);
