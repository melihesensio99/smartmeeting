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
        var meeting = Meeting.Create("Demo", "user-1", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("audio/demo.webm");

        Assert.Equal(MeetingStatus.Processing, meeting.Status);
        Assert.Equal("audio/demo.webm", meeting.AudioFilePath);
        Assert.Single(meeting.DomainEvents);
        Assert.IsType<SmartMeeting.Domain.Common.MeetingProcessingRequested>(meeting.DomainEvents.Single());
    }

    [Fact]
    public void AddParticipant_is_idempotent_for_same_user()
    {
        var meeting = Meeting.Create("Demo", "user-1", DateTimeOffset.UtcNow);
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com");
        meeting.AddParticipant("user-2", "Ayşe", "ayse@example.com");

        Assert.Single(meeting.Participants);
    }

    [Fact]
    public void Summary_marks_meeting_ready()
    {
        var meeting = Meeting.Create("Demo", "user-1", DateTimeOffset.UtcNow);
        meeting.StartRecording();
        meeting.CompleteRecording("demo.webm");
        meeting.SetTranscript("Toplantı metni");
        meeting.SetSummary(MeetingSummary.Create("Özet", ["Karar"], [new ActionItem("Takip et", "user-2", null)]));

        Assert.Equal(MeetingStatus.Ready, meeting.Status);
        Assert.Equal("Özet", meeting.Summary?.Overview);
    }
}
