using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace SmartMeeting.Api.Tests;

public sealed class AuthenticationAndUsersApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Register_login_and_search_users_use_http_pipeline()
    {
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false, HandleCookies = true });

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "ayse.integration@example.com",
            password = "Password123",
            displayName = "Ayşe Integration"
        });
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "ayse.integration@example.com",
            password = "Password123"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var authCookie = loginResponse.Headers.GetValues("Set-Cookie").Single(cookie => cookie.Contains("smartmeeting.auth", StringComparison.Ordinal)).Split(';')[0];
        Assert.Contains("HttpOnly", loginResponse.Headers.GetValues("Set-Cookie").Single(), StringComparison.OrdinalIgnoreCase);

        using var searchRequest = new HttpRequestMessage(HttpMethod.Get, "/api/users?search=Ay%C5%9Fe");
        searchRequest.Headers.Add("X-Test-User", "integration-user");
        var searchResponse = await client.SendAsync(searchRequest);
        Assert.True(searchResponse.IsSuccessStatusCode, $"{searchResponse.StatusCode}: {await searchResponse.Content.ReadAsStringAsync()}");
        var users = await searchResponse.Content.ReadFromJsonAsync<IReadOnlyCollection<UserSearchResponse>>();
        Assert.Contains(users!, user => user.Email == "ayse.integration@example.com");
    }

    [Fact]
    public async Task Protected_meeting_endpoint_rejects_anonymous_request()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/meetings");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Authenticated_user_can_create_meeting_and_start_recording()
    {
        using var client = factory.CreateClient();
        using var createRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meetings")
        {
            Content = JsonContent.Create(new
            {
                title = "Integration kayıt testi",
                startsAt = DateTimeOffset.UtcNow.AddHours(1),
                endsAt = DateTimeOffset.UtcNow.AddHours(2)
            })
        };
        createRequest.Headers.Add("X-Test-User", "integration-user");

        var createResponse = await client.SendAsync(createRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        using var createdDocument = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var meetingId = createdDocument.RootElement.GetProperty("id").GetGuid();

        using var startRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/recording/start");
        startRequest.Headers.Add("X-Test-User", "integration-user");
        var startResponse = await client.SendAsync(startRequest);

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        using var startedDocument = JsonDocument.Parse(await startResponse.Content.ReadAsStringAsync());
        Assert.Equal(1, startedDocument.RootElement.GetProperty("status").GetInt32());
    }

    private sealed record UserSearchResponse(string UserId, string DisplayName, string Email);
}

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string databasePath = Path.Combine(Path.GetTempPath(), $"smartmeeting-api-tests-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureTestServices(services => services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
            options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
        }).AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.SchemeName, _ => { }));
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = $"Data Source={databasePath}",
            ["Authentication:SigningKey"] = "integration-test-signing-key-at-least-32-chars",
            ["Authentication:Enabled"] = "true",
            ["Authentication:RequireAuthentication"] = "true",
            ["Authentication:Issuer"] = "smartmeeting-api",
            ["Authentication:Audience"] = "smartmeeting-api",
            ["Authentication:Authority"] = "",
            ["Database:ApplyMigrations"] = "false",
            ["RabbitMq:Enabled"] = "false"
        }));
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && File.Exists(databasePath))
        {
            try { File.Delete(databasePath); } catch (IOException) { }
        }
    }
}

internal sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "IntegrationTest";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Test-User", out var userId) || string.IsNullOrWhiteSpace(userId))
            return Task.FromResult(AuthenticateResult.NoResult());

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()), new Claim(ClaimTypes.Name, "Integration User") };
        var identity = new ClaimsIdentity(claims, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
    }
}
