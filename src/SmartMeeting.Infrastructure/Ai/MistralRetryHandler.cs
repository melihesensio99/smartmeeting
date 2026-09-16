using System.Net;

namespace SmartMeeting.Infrastructure.Ai;

public sealed class MistralRetryHandler : DelegatingHandler
{
    private const int MaxAttempts = 3;

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            using var clonedRequest = await CloneAsync(request, cancellationToken);
            var response = await base.SendAsync(clonedRequest, cancellationToken);
            if (!IsTransient(response.StatusCode) || attempt == MaxAttempts) return response;
            response.Dispose();
            await Task.Delay(GetDelay(attempt), cancellationToken);
        }
        throw new InvalidOperationException("Mistral isteği tekrar denemelerinden sonra başarısız oldu.");
    }

    private static bool IsTransient(HttpStatusCode statusCode) => statusCode == HttpStatusCode.TooManyRequests || (int)statusCode >= 500;

    private static TimeSpan GetDelay(int attempt) => TimeSpan.FromSeconds(Math.Pow(2, attempt));

    private static async Task<HttpRequestMessage> CloneAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri);
        foreach (var header in request.Headers) clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
        if (request.Content is not null)
        {
            var bytes = await request.Content.ReadAsByteArrayAsync(cancellationToken);
            clone.Content = new ByteArrayContent(bytes);
            foreach (var header in request.Content.Headers) clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }
        return clone;
    }
}
