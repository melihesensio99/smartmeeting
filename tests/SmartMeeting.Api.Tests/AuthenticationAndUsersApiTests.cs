using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using SmartMeeting.Application.Abstractions.Processing;
using SmartMeeting.Application.Abstractions.Storage;
using SmartMeeting.Application.Processing.Contracts;
using SmartMeeting.Domain.Meetings;
using SmartMeeting.Persistence;

namespace SmartMeeting.Api.Tests;

public sealed class AuthenticationAndUsersApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Health_endpoint_is_public_for_orchestrators()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

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
        using var registeredUserDocument = JsonDocument.Parse(await registerResponse.Content.ReadAsStringAsync());
        var registeredUserId = registeredUserDocument.RootElement.GetProperty("userId").GetString()!;

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "ayse.integration@example.com",
            password = "Password123"
        });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var authCookie = loginResponse.Headers.GetValues("Set-Cookie").Single(cookie => cookie.Contains("smartmeeting.auth", StringComparison.Ordinal)).Split(';')[0];
        Assert.Contains("HttpOnly", loginResponse.Headers.GetValues("Set-Cookie").Single(), StringComparison.OrdinalIgnoreCase);

        using var currentUserRequest = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        currentUserRequest.Headers.Add("X-Test-User", registeredUserId);
        var currentUserResponse = await client.SendAsync(currentUserRequest);
        Assert.Equal(HttpStatusCode.OK, currentUserResponse.StatusCode);
        using var currentUserDocument = JsonDocument.Parse(await currentUserResponse.Content.ReadAsStringAsync());
        Assert.Equal("Ayşe Integration", currentUserDocument.RootElement.GetProperty("displayName").GetString());
        Assert.False(currentUserDocument.RootElement.GetProperty("isGlobalManager").GetBoolean());

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
        Assert.Equal("Recording", startedDocument.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Uploading_audio_moves_meeting_to_processing_and_enqueues_message()
    {
        using var client = factory.CreateClient();
        var meetingId = await CreateAndStartMeetingAsync(client);
        var queue = factory.Services.GetRequiredService<TestMeetingProcessingQueue>();
        queue.LastMeetingId = null;

        using var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent([1, 2, 3, 4]), "file", "meeting.webm");
        using var uploadRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/audio") { Content = content };
        uploadRequest.Headers.Add("X-Test-User", "integration-user");

        var response = await client.SendAsync(uploadRequest);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("Processing", document.RootElement.GetProperty("status").GetString());
        Assert.Equal(meetingId, queue.LastMeetingId);
    }

    [Fact]
    public async Task Meeting_owner_can_delegate_revoke_and_participant_can_leave()
    {
        using var client = factory.CreateClient();
        var participantEmail = $"participant-{Guid.NewGuid():N}@example.com";
        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = participantEmail,
            password = "Password123",
            displayName = "Test Katılımcı"
        });
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);
        using var registered = JsonDocument.Parse(await registerResponse.Content.ReadAsStringAsync());
        var participantId = registered.RootElement.GetProperty("userId").GetString();

        using var createRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meetings")
        {
            Content = JsonContent.Create(new { title = "Yetki akışı testi", startsAt = DateTimeOffset.UtcNow.AddHours(1) })
        };
        createRequest.Headers.Add("X-Test-User", "owner-user");
        var createResponse = await client.SendAsync(createRequest);
        createResponse.EnsureSuccessStatusCode();
        using var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var meetingId = created.RootElement.GetProperty("id").GetGuid();

        using var addRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/participants")
        {
            Content = JsonContent.Create(new { userId = participantId, displayName = "Test Katılımcı", email = participantEmail, canManageMeeting = true })
        };
        addRequest.Headers.Add("X-Test-User", "owner-user");
        var addResponse = await client.SendAsync(addRequest);
        Assert.Equal(HttpStatusCode.OK, addResponse.StatusCode);
        using var added = JsonDocument.Parse(await addResponse.Content.ReadAsStringAsync());
        var participantRecordId = added.RootElement.GetProperty("participants").EnumerateArray().Single().GetProperty("id").GetGuid();

        using var delegatedStart = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/recording/start");
        delegatedStart.Headers.Add("X-Test-User", participantId);
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(delegatedStart)).StatusCode);

        using var revokeRequest = new HttpRequestMessage(HttpMethod.Put, $"/api/meetings/{meetingId}/participants/{participantRecordId}/management-permission")
        {
            Content = JsonContent.Create(new { canManageMeeting = false })
        };
        revokeRequest.Headers.Add("X-Test-User", "owner-user");
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(revokeRequest)).StatusCode);

        using var forbiddenNotes = new HttpRequestMessage(HttpMethod.Put, $"/api/meetings/{meetingId}/notes")
        {
            Content = JsonContent.Create(new { notes = "Yetki kaldırıldı" })
        };
        forbiddenNotes.Headers.Add("X-Test-User", participantId);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(forbiddenNotes)).StatusCode);

        using var leaveRequest = new HttpRequestMessage(HttpMethod.Delete, $"/api/meetings/{meetingId}/participants/me");
        leaveRequest.Headers.Add("X-Test-User", participantId);
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(leaveRequest)).StatusCode);
    }

    [Fact]
    public async Task Meeting_manager_can_create_manual_action_with_due_date_and_priority()
    {
        using var client = factory.CreateClient();
        using var createRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meetings")
        {
            Content = JsonContent.Create(new { title = "Manuel aksiyon API testi", startsAt = DateTimeOffset.UtcNow.AddHours(1) })
        };
        createRequest.Headers.Add("X-Test-User", "manager-user");
        var createResponse = await client.SendAsync(createRequest);
        createResponse.EnsureSuccessStatusCode();
        using var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var meetingId = created.RootElement.GetProperty("id").GetGuid();

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MeetingDbContext>();
            var meeting = await db.MeetingSet.SingleAsync(x => x.Id == meetingId);
            meeting.SetSummary(MeetingSummary.Create("Hazır özet", [], []));
            await db.SaveChangesAsync();
        }

        var dueAt = DateTimeOffset.UtcNow.AddDays(3);
        using var actionRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/action-items")
        {
            Content = JsonContent.Create(new
            {
                description = "Manuel olarak atanan aksiyon",
                dueAt,
                priority = "High"
            })
        };
        actionRequest.Headers.Add("X-Test-User", "manager-user");

        var actionResponse = await client.SendAsync(actionRequest);

        Assert.True(actionResponse.StatusCode == HttpStatusCode.OK, $"{actionResponse.StatusCode}: {await actionResponse.Content.ReadAsStringAsync()}");
        using var actionDocument = JsonDocument.Parse(await actionResponse.Content.ReadAsStringAsync());
        var action = actionDocument.RootElement.GetProperty("summary").GetProperty("actionItems").EnumerateArray().Single();
        Assert.Equal("Manuel olarak atanan aksiyon", action.GetProperty("description").GetString());
        Assert.Equal("High", action.GetProperty("priority").GetString());
        Assert.Equal(dueAt, action.GetProperty("dueAt").GetDateTimeOffset(), precision: TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task Delegated_manager_can_create_action_but_revoked_participant_cannot()
    {
        using var client = factory.CreateClient();
        var participantEmail = $"action-manager-{Guid.NewGuid():N}@example.com";
        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = participantEmail,
            password = "Password123",
            displayName = "Aksiyon Yöneticisi"
        });
        registerResponse.EnsureSuccessStatusCode();
        using var registered = JsonDocument.Parse(await registerResponse.Content.ReadAsStringAsync());
        var participantId = registered.RootElement.GetProperty("userId").GetString()!;

        using var createRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meetings")
        {
            Content = JsonContent.Create(new { title = "Aksiyon yetki testi", startsAt = DateTimeOffset.UtcNow.AddHours(1) })
        };
        createRequest.Headers.Add("X-Test-User", "action-owner");
        var createResponse = await client.SendAsync(createRequest);
        createResponse.EnsureSuccessStatusCode();
        using var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var meetingId = created.RootElement.GetProperty("id").GetGuid();

        using var addRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/participants")
        {
            Content = JsonContent.Create(new { userId = participantId, displayName = "Aksiyon Yöneticisi", email = participantEmail, canManageMeeting = true })
        };
        addRequest.Headers.Add("X-Test-User", "action-owner");
        var addResponse = await client.SendAsync(addRequest);
        addResponse.EnsureSuccessStatusCode();
        using var added = JsonDocument.Parse(await addResponse.Content.ReadAsStringAsync());
        var participantRecordId = added.RootElement.GetProperty("participants").EnumerateArray().Single().GetProperty("id").GetGuid();

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MeetingDbContext>();
            var meeting = await db.MeetingSet.SingleAsync(x => x.Id == meetingId);
            meeting.SetSummary(MeetingSummary.Create("Yetki testi özeti", [], []));
            await db.SaveChangesAsync();
        }

        using var delegatedAction = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/action-items")
        {
            Content = JsonContent.Create(new { description = "Yetkili katılımcı aksiyonu", assigneeUserId = participantId, priority = "Medium" })
        };
        delegatedAction.Headers.Add("X-Test-User", participantId);
        var delegatedActionResponse = await client.SendAsync(delegatedAction);
        Assert.Equal(HttpStatusCode.OK, delegatedActionResponse.StatusCode);
        using var delegatedActionDocument = JsonDocument.Parse(await delegatedActionResponse.Content.ReadAsStringAsync());
        var actionItemId = delegatedActionDocument.RootElement.GetProperty("summary").GetProperty("actionItems").EnumerateArray().Single().GetProperty("id").GetGuid();

        using var completeRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/action-items/{actionItemId}/complete");
        completeRequest.Headers.Add("X-Test-User", participantId);
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(completeRequest)).StatusCode);

        using var revokeRequest = new HttpRequestMessage(HttpMethod.Put, $"/api/meetings/{meetingId}/participants/{participantRecordId}/management-permission")
        {
            Content = JsonContent.Create(new { canManageMeeting = false })
        };
        revokeRequest.Headers.Add("X-Test-User", "action-owner");
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(revokeRequest)).StatusCode);

        using var revokedAction = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/action-items")
        {
            Content = JsonContent.Create(new { description = "Yetkisiz aksiyon", priority = "Low" })
        };
        revokedAction.Headers.Add("X-Test-User", participantId);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(revokedAction)).StatusCode);
    }

    [Fact]
    public async Task Global_manager_can_see_all_meetings_and_manage_another_users_meeting()
    {
        using var client = factory.CreateClient();
        var firstTitle = $"Global yönetici toplantısı 1 {Guid.NewGuid():N}";
        var secondTitle = $"Global yönetici toplantısı 2 {Guid.NewGuid():N}";
        var firstMeetingId = await CreateMeetingAsync(client, "meeting-owner-1", firstTitle);
        await CreateMeetingAsync(client, "meeting-owner-2", secondTitle);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MeetingDbContext>();
            var meeting = await db.MeetingSet.SingleAsync(x => x.Id == firstMeetingId);
            meeting.SetSummary(MeetingSummary.Create("Global yönetici özeti", [], []));
            await db.SaveChangesAsync();
        }

        using var listRequest = new HttpRequestMessage(HttpMethod.Get, "/api/meetings");
        listRequest.Headers.Add("X-Test-User", "global-manager");
        listRequest.Headers.Add("X-Test-Global-Manager", "true");
        var listResponse = await client.SendAsync(listRequest);
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        using var listDocument = JsonDocument.Parse(await listResponse.Content.ReadAsStringAsync());
        var titles = listDocument.RootElement.EnumerateArray().Select(item => item.GetProperty("title").GetString()).ToArray();
        Assert.Contains(firstTitle, titles);
        Assert.Contains(secondTitle, titles);

        using var actionRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{firstMeetingId}/action-items")
        {
            Content = JsonContent.Create(new { description = "Global yönetici aksiyonu", priority = "High" })
        };
        actionRequest.Headers.Add("X-Test-User", "global-manager");
        actionRequest.Headers.Add("X-Test-Global-Manager", "true");
        var actionResponse = await client.SendAsync(actionRequest);
        Assert.Equal(HttpStatusCode.OK, actionResponse.StatusCode);
    }

    private static async Task<Guid> CreateMeetingAsync(HttpClient client, string userId, string title)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/meetings")
        {
            Content = JsonContent.Create(new { title, startsAt = DateTimeOffset.UtcNow.AddHours(1) })
        };
        request.Headers.Add("X-Test-User", userId);
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("id").GetGuid();
    }

    private static async Task<Guid> CreateAndStartMeetingAsync(HttpClient client)
    {
        using var createRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meetings")
        {
            Content = JsonContent.Create(new { title = "Integration ses testi", startsAt = DateTimeOffset.UtcNow.AddHours(1) })
        };
        createRequest.Headers.Add("X-Test-User", "integration-user");
        var createResponse = await client.SendAsync(createRequest);
        createResponse.EnsureSuccessStatusCode();
        using var createdDocument = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var meetingId = createdDocument.RootElement.GetProperty("id").GetGuid();

        using var startRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/meetings/{meetingId}/recording/start");
        startRequest.Headers.Add("X-Test-User", "integration-user");
        var startResponse = await client.SendAsync(startRequest);
        startResponse.EnsureSuccessStatusCode();
        return meetingId;
    }

    private sealed record UserSearchResponse(string UserId, string DisplayName, string Email);
}

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string databasePath = Path.Combine(Path.GetTempPath(), $"smartmeeting-api-tests-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureTestServices(services =>
        {
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.SchemeName, _ => { });
            services.AddSingleton<TestMeetingProcessingQueue>();
            services.AddSingleton<IMeetingProcessingQueue>(serviceProvider => serviceProvider.GetRequiredService<TestMeetingProcessingQueue>());
            services.AddSingleton<TestAudioStorage>();
            services.AddSingleton<IAudioStorage>(serviceProvider => serviceProvider.GetRequiredService<TestAudioStorage>());
        });
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

public sealed class TestMeetingProcessingQueue : IMeetingProcessingQueue
{
    public Guid? LastMeetingId { get; set; }

    public ValueTask EnqueueAsync(Guid meetingId, CancellationToken cancellationToken)
    {
        LastMeetingId = meetingId;
        return ValueTask.CompletedTask;
    }

    public async ValueTask<QueuedMeeting> DequeueAsync(CancellationToken cancellationToken)
    {
        await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
        throw new OperationCanceledException(cancellationToken);
    }
    public ValueTask CompleteAsync(QueuedMeeting message, bool requeue, CancellationToken cancellationToken) => ValueTask.CompletedTask;
}

public sealed class TestAudioStorage : IAudioStorage
{
    public Task<string> SaveAsync(Stream audio, string originalFileName, string contentType, CancellationToken cancellationToken)
        => Task.FromResult("integration/audio.webm");

    public Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken)
        => Task.FromResult<Stream>(new MemoryStream());
}

internal sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "IntegrationTest";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Test-User", out var userId) || string.IsNullOrWhiteSpace(userId))
            return Task.FromResult(AuthenticateResult.NoResult());

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, "Integration User")
        };
        if (Request.Headers.TryGetValue("X-Test-Global-Manager", out var globalManager) && globalManager == "true")
            claims.Add(new Claim(ClaimTypes.Role, "GlobalManager"));
        var identity = new ClaimsIdentity(claims, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
    }
}
