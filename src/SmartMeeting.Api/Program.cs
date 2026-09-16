using SmartMeeting.Api.Middleware;
using SmartMeeting.Application;
using SmartMeeting.Infrastructure;
using SmartMeeting.Persistence;
using SmartMeeting.Api.Hubs;
using SmartMeeting.Api.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SmartMeeting.Infrastructure.Security;

var builder = WebApplication.CreateBuilder(args);
var authenticationOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new();
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
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
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
if (authenticationOptions.Enabled)
    app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "smartmeeting-api" }));
app.MapControllers();
app.MapHub<MeetingStatusHub>("/hubs/meeting-status");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MeetingDbContext>();
    if (builder.Configuration.GetValue<bool>("Database:ApplyMigrations"))
        await db.Database.MigrateAsync();
    else
        await db.Database.EnsureCreatedAsync();
}

await app.RunAsync();
