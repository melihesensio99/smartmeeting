using Microsoft.Extensions.Options;
using SmartMeeting.Application.Abstractions;

namespace SmartMeeting.Infrastructure.Storage;

public sealed class LocalAudioStorage(IOptions<AudioStorageOptions> options) : IAudioStorage
{
    private static readonly string[] AllowedExtensions = [".webm", ".wav", ".mp3", ".m4a", ".ogg"];

    public async Task<string> SaveAsync(Stream audio, string originalFileName, string contentType, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension)) throw new InvalidOperationException("Desteklenmeyen ses dosyası formatı.");
        var root = Path.GetFullPath(options.Value.AudioRoot);
        Directory.CreateDirectory(root);
        var relativePath = Path.Combine(DateTimeOffset.UtcNow.ToString("yyyy/MM/dd"), $"{Guid.NewGuid():N}{extension}");
        var fullPath = Path.Combine(root, relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await using var output = File.Create(fullPath);
        await audio.CopyToAsync(output, cancellationToken);
        return relativePath.Replace(Path.DirectorySeparatorChar, '/');
    }

    public Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken)
    {
        var root = Path.GetFullPath(options.Value.AudioRoot);
        var fullPath = Path.GetFullPath(Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar)));
        if (!fullPath.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Geçersiz ses dosyası yolu.");
        Stream stream = File.OpenRead(fullPath);
        return Task.FromResult(stream);
    }
}
