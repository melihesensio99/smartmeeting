using Microsoft.Extensions.Options;
using SmartMeeting.Infrastructure.Storage;

namespace SmartMeeting.Application.Tests.Storage;

public sealed class LocalAudioStorageTests
{
    [Fact]
    public async Task SaveAsync_writes_audio_under_date_partition()
    {
        var root = Path.Combine(Path.GetTempPath(), "smartmeeting-tests", Guid.NewGuid().ToString("N"));
        try
        {
            var storage = new LocalAudioStorage(Options.Create(new AudioStorageOptions { AudioRoot = root }));
            await using var input = new MemoryStream([1, 2, 3, 4]);

            var path = await storage.SaveAsync(input, "meeting.webm", "audio/webm", CancellationToken.None);
            await using var output = await storage.OpenReadAsync(path, CancellationToken.None);

            Assert.EndsWith(".webm", path);
            Assert.Equal([1, 2, 3, 4], await ReadAllAsync(output));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, true);
        }
    }

    [Fact]
    public async Task SaveAsync_rejects_unsupported_extension()
    {
        var storage = new LocalAudioStorage(Options.Create(new AudioStorageOptions { AudioRoot = Path.GetTempPath() }));
        await using var input = new MemoryStream([1]);

        await Assert.ThrowsAsync<InvalidOperationException>(() => storage.SaveAsync(input, "payload.exe", "application/octet-stream", CancellationToken.None));
    }

    [Fact]
    public async Task OpenReadAsync_rejects_path_traversal()
    {
        var root = Path.Combine(Path.GetTempPath(), "smartmeeting-tests", Guid.NewGuid().ToString("N"));
        var storage = new LocalAudioStorage(Options.Create(new AudioStorageOptions { AudioRoot = root }));

        await Assert.ThrowsAsync<InvalidOperationException>(() => storage.OpenReadAsync("../../secrets.txt", CancellationToken.None));
    }

    private static async Task<byte[]> ReadAllAsync(Stream stream)
    {
        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer);
        return buffer.ToArray();
    }
}
