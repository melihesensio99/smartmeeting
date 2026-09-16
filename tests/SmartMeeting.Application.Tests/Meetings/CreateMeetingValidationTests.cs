using SmartMeeting.Application.Meetings.Commands.CreateMeeting;

namespace SmartMeeting.Application.Tests.Meetings;

public sealed class CreateMeetingValidationTests
{
    private readonly CreateMeetingValidator _validator = new();

    [Fact]
    public void Empty_title_is_invalid()
    {
        var result = _validator.Validate(new CreateMeetingCommand("", DateTimeOffset.UtcNow, null));

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateMeetingCommand.Title));
    }

    [Fact]
    public void End_before_start_is_invalid()
    {
        var start = DateTimeOffset.UtcNow;

        var result = _validator.Validate(new CreateMeetingCommand("Toplantı", start, start.AddMinutes(-5)));

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateMeetingCommand.EndsAt));
    }
}
