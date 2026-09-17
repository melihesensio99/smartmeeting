using SmartMeeting.Api.Middleware;
using SmartMeeting.Application;
using SmartMeeting.Infrastructure;
using SmartMeeting.Persistence;
using SmartMeeting.Api.Hubs;
using SmartMeeting.Api.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SmartMeeting.Infrastructure.Security;
using SmartMeeting.Api.Security.Abstractions;
using SmartMeeting.Persistence.Identity;
using SmartMeeting.Api.Health;
using SmartMeeting.Infrastructure.Processing;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);
var authenticationOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new();
var isTestEnvironment = builder.Environment.IsEnvironment("Testing");
var isProductionEnvironment = builder.Environment.IsProduction();
if (isProductionEnvironment && authenticationOptions.Enabled)
{
    var hasAuthority = !string.IsNullOrWhiteSpace(authenticationOptions.Authority);
    if (!hasAuthority && string.IsNullOrWhiteSpace(authenticationOptions.SigningKey))
        throw new InvalidOperationException("Production ortamında Authentication:SigningKey veya Authentication:Authority zorunludur.");
    if (!hasAuthority && authenticationOptions.SigningKey!.Length < 32)
        throw new InvalidOperationException("Authentication:SigningKey production ortamında en az 32 karakter olmalıdır.");
    if (string.IsNullOrWhiteSpace(authenticationOptions.Issuer) || string.IsNullOrWhiteSpace(authenticationOptions.Audience))
        throw new InvalidOperationException("Production ortamında Authentication:Issuer ve Authentication:Audience zorunludur.");
}
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<ForwardedHeadersOptions>(options => options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);
var dataProtectionPath = builder.Configuration["DataProtection:KeysPath"] ?? Path.Combine(builder.Environment.ContentRootPath, "data", "keys");
Directory.CreateDirectory(dataProtectionPath);
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath)).SetApplicationName("SmartMeeting.Api");
builder.Services.AddScoped<IAuthCookieService, HttpAuthCookieService>();
builder.Services.AddScoped<ICurrentUserService, HttpCurrentUserService>();
if (authenticationOptions.Enabled)
{
    var hasAuthority = !string.IsNullOrWhiteSpace(authenticationOptions.Authority);
    var hasSigningKey = !string.IsNullOrWhiteSpace(authenticationOptions.SigningKey);
    if (!hasAuthority && !hasSigningKey)
        throw new InvalidOperationException("Authentication:Authority veya Authentication:SigningKey yapılandırılmalıdır.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = authenticationOptions.Authority;
            options.Audience = authenticationOptions.Audience;
            options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
            if (!hasAuthority)
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = !string.IsNullOrWhiteSpace(authenticationOptions.Issuer),
                    ValidIssuer = authenticationOptions.Issuer,
                    ValidateAudience = !string.IsNullOrWhiteSpace(authenticationOptions.Audience),
                    ValidAudience = authenticationOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authenticationOptions.SigningKey!)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            }
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    context.Token = context.Request.Cookies[authenticationOptions.CookieName];
                    return Task.CompletedTask;
                }
            };
        });
}
builder.Services.AddAuthorization(options =>
{
    if (authenticationOptions.RequireAuthentication)
        options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build();
});
builder.Services.AddSignalR();
builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<IMeetingStatusPublisher, SignalRMeetingStatusPublisher>();
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"];
if (isProductionEnvironment && (corsOrigins.Length == 0 || corsOrigins.Any(origin => !Uri.TryCreate(origin, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)))
    throw new InvalidOperationException("Production ortamında Cors:Origins yalnızca HTTPS origin değerleri içermelidir.");
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database", tags: ["ready"])
    .AddCheck<RabbitMqHealthCheck>("rabbitmq", tags: ["ready"]);

var app = builder.Build();
app.UseForwardedHeaders();
if (isProductionEnvironment && !isTestEnvironment)
    app.UseHttpsRedirection();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
if (authenticationOptions.Enabled)
    app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready").AllowAnonymous();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "smartmeeting-api" })).AllowAnonymous();
app.MapControllers();
app.MapHub<MeetingStatusHub>("/hubs/meeting-status");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MeetingDbContext>();
    if (builder.Configuration.GetValue<bool>("Database:ApplyMigrations"))
        await db.Database.MigrateAsync();
    else
        await db.Database.EnsureCreatedAsync();
    await IdentitySchemaRepair.ApplyAsync(db);
}

await app.RunAsync();

public partial class Program;
