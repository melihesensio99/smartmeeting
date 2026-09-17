using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Domain.Tests.Meetings;

public sealed class MeetingTests
{
    [Fact]
    public void Create_sets_scheduled_status_and_identity()
    {
        var meeting = Meeting.Create("Ürün planlama", "user-1", DateTimeOffset.UtcNow.AddHours(1));

        Assert.NotEqual(Guid.Empty, meeting.Id);
        Assert.Equal("Ürün planlama", meeting.Title);
        Assert.Equal(MeetingStatus.Scheduled, meeting.Status);
    }

    [Fact]
    public void Create_rejects_end_before_start()
    {
        var start = DateTimeOffset.UtcNow;

        Assert.Throws<DomainException>(() => Meeting.Create("Geçersiz toplantı", "user-1", start, start.AddMinutes(-1)));
    }

    [Fact]
    public void Recording_lifecycle_raises_processing_event()
    {
        var meeting = Meeting.Create("Sprint planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("audio/sprint-planlama.webm");

        Assert.Equal(MeetingStatus.Processing, meeting.Status);
        Assert.Equal("audio/sprint-planlama.webm", meeting.AudioFilePath);
        Assert.Single(meeting.DomainEvents);
        Assert.IsType<SmartMeeting.Domain.Common.Events.MeetingProcessingRequested>(meeting.DomainEvents.Single());
    }

    [Fact]
    public void AddParticipant_is_idempotent_for_same_user()
    {
        var meeting = Meeting.Create("Sprint planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com");
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com");

        Assert.Single(meeting.Participants);
    }

    [Fact]
    public void Organizer_can_grant_meeting_management_permission_to_participant()
    {
        var meeting = Meeting.Create("Sprint planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com", canManageMeeting: true);
        meeting.AddParticipant("user-3", "Mehmet", "mehmet@example.com");

        Assert.True(meeting.CanManage("user-1"));
        Assert.True(meeting.CanManage("user-2"));
        Assert.False(meeting.CanManage("user-3"));
        Assert.True(meeting.CanAccess("user-3"));
    }

    [Fact]
    public void Organizer_can_change_permission_and_remove_participant()
    {
        var meeting = Meeting.Create("Sprint planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com", canManageMeeting: true);
        var participant = meeting.Participants.Single();

        Assert.True(meeting.SetParticipantManagementPermission(participant.Id, false));
        Assert.False(meeting.CanManage("user-2"));
        Assert.True(meeting.RemoveParticipant(participant.Id));
        Assert.False(meeting.CanAccess("user-2"));
        Assert.Empty(meeting.Participants);
    }

    [Fact]
    public void Participant_can_leave_without_removing_the_meeting()
    {
        var meeting = Meeting.Create("Sprint planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com");

        Assert.True(meeting.RemoveParticipant("user-2"));
        Assert.NotEqual(Guid.Empty, meeting.Id);
        Assert.Empty(meeting.Participants);
    }

    [Fact]
    public void Summary_marks_meeting_ready()
    {
        var meeting = Meeting.Create("Sprint planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("sprint-planlama.webm");
        meeting.SetTranscript("Toplantı metni");
        meeting.SetSummary(MeetingSummary.Create("Özet", ["Karar"], [new ActionItem("Takip et", "user-2", null)]));

        Assert.Equal(MeetingStatus.Ready, meeting.Status);
        Assert.Equal("Özet", meeting.Summary?.Overview);
    }

    [Fact]
    public void CompleteActionItem_marks_matching_action_item_completed()
    {
        var action = new ActionItem("Takip et", "user-2", null);
        var meeting = Meeting.Create("Planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("audio.webm");
        meeting.SetTranscript("transcript");
        meeting.SetSummary(MeetingSummary.Create("Özet", [], [action]));

        meeting.CompleteActionItem(action.Id);

        Assert.True(meeting.Summary!.ActionItems.Single().Completed);
    }

    [Fact]
    public void UpdateActionItem_changes_assignee_due_date_and_priority()
    {
        var action = new ActionItem("Takip et", "user-2", null);
        var meeting = Meeting.Create("Planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("audio.webm");
        meeting.SetTranscript("transcript");
        meeting.SetSummary(MeetingSummary.Create("Özet", [], [action]));
        var dueAt = DateTimeOffset.UtcNow.AddDays(3);

        meeting.UpdateActionItem(action.Id, "user-3", "User Three", dueAt, ActionPriority.High);

        var updated = meeting.Summary!.ActionItems.Single();
        Assert.Equal("user-3", updated.AssigneeUserId);
        Assert.Equal("User Three", updated.Assignee);
        Assert.Equal(dueAt, updated.DueAt);
        Assert.Equal(ActionPriority.High, updated.Priority);
    }

    [Fact]
    public void SetNotes_stores_trimmed_notes()
    {
        var meeting = Meeting.Create("Planlama", "user-1", DateTimeOffset.UtcNow);

        meeting.SetNotes("  Önemli takip notu  ");

        Assert.Equal("Önemli takip notu", meeting.Notes);
    }

    [Fact]
    public void MapSpeaker_assigns_label_to_participant()
    {
        var meeting = Meeting.Create("Planlama", "user-1", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com");
        var participant = meeting.Participants.Single();

        meeting.MapSpeaker(participant.Id, "Speaker 1");

        Assert.Equal("Speaker 1", participant.SpeakerLabel);
    }
}
