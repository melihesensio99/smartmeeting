namespace SmartMeeting.Domain.Users;

public sealed class User
{
    private User(string id, string email, string displayName)
    {
        Id = Require(id, nameof(id), 100);
        Email = Require(email, nameof(email), 320).ToLowerInvariant();
        DisplayName = Require(displayName, nameof(displayName), 160);
    }

    public string Id { get; }
    public string Email { get; }
    public string DisplayName { get; }

    public static User Create(string id, string email, string displayName) => new(id, email, displayName);

    private static string Require(string value, string name, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException($"{name} boş olamaz.", name);
        var normalized = value.Trim();
        if (normalized.Length > maxLength) throw new ArgumentException($"{name} en fazla {maxLength} karakter olabilir.", name);
        return normalized;
    }
}
