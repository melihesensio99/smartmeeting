namespace SmartMeeting.Infrastructure.Ai;

public sealed class MistralOptions
{
    public const string SectionName = "Mistral";
    public string ApiKey { get; init; } = string.Empty;
    public string Model { get; init; } = "mistral-large-latest";
    public string BaseUrl { get; init; } = "https://api.mistral.ai/v1/";
}
