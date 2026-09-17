using SmartMeeting.Domain.Users;

namespace SmartMeeting.Domain.Tests.Users;

public sealed class UserTests
{
    [Fact]
    public void Create_normalizes_email_and_keeps_profile_identity()
    {
        var user = User.Create("user-1", "  USER@example.com ", " Ayşe Yılmaz ");

        Assert.Equal("user-1", user.Id);
        Assert.Equal("user@example.com", user.Email);
        Assert.Equal("Ayşe Yılmaz", user.DisplayName);
    }

    [Fact]
    public void Create_rejects_missing_identity_fields()
    {
        Assert.Throws<ArgumentException>(() => User.Create("", "user@example.com", "User"));
    }
}
