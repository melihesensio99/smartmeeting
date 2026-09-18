using System.Text.RegularExpressions;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Infrastructure.Processing;

internal static partial class SpeakerLabelResolver
{
    public static string Resolve(string transcript, IEnumerable<MeetingParticipant> participants)
    {
        if (string.IsNullOrWhiteSpace(transcript)) return transcript;

        var mappings = participants
            .Where(participant => participant.SpeakerMappingStatus == SpeakerMappingStatus.Confirmed)
            .Where(participant => !string.IsNullOrWhiteSpace(participant.SpeakerLabel))
            .Select(participant => new Mapping(Normalize(participant.SpeakerLabel!), participant.DisplayName))
            .Where(mapping => mapping.Label.Length > 0 && mapping.Name.Length > 0)
            .GroupBy(mapping => mapping.Label)
            .ToDictionary(group => group.Key, group => group.First().Name);

        if (mappings.Count == 0) return transcript;

        return string.Join(Environment.NewLine, transcript.Split(["\r\n", "\n"], StringSplitOptions.None)
            .Select(line => ReplaceSpeaker(line, mappings)));
    }

    private static string ReplaceSpeaker(string line, IReadOnlyDictionary<string, string> mappings)
    {
        var match = SpeakerPrefixRegex().Match(line);
        if (!match.Success) return line;

        var normalized = Normalize(match.Groups["speaker"].Value);
        return mappings.TryGetValue(normalized, out var displayName)
            ? $"{displayName}{match.Groups["suffix"].Value}:{match.Groups["text"].Value}"
            : line;
    }

    private static string Normalize(string value)
    {
        var normalized = new string(value.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
        if (!normalized.StartsWith("speaker", StringComparison.Ordinal)) return normalized;

        var number = normalized["speaker".Length..];
        return int.TryParse(number, out var index) ? $"speaker{index}" : normalized;
    }

    [GeneratedRegex("^(?<speaker>[^:\\r\\n\\[]+?)(?<suffix>\\s*\\[[^\\]]+\\])?:(?<text>.*)$", RegexOptions.Compiled)]
    private static partial Regex SpeakerPrefixRegex();

    private sealed record Mapping(string Label, string Name);
}
