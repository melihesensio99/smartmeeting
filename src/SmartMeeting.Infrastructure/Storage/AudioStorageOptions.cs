namespace SmartMeeting.Infrastructure.Storage;

public sealed class AudioStorageOptions
{
    public const string SectionName = "Storage";
    public string AudioRoot { get; init; } = "data/audio";
}
