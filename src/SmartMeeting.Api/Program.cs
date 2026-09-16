using SmartMeeting.Api.Middleware;
using SmartMeeting.Application;
using SmartMeeting.Infrastructure;
using SmartMeeting.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "smartmeeting-api" }));
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MeetingDbContext>();
    await db.Database.EnsureCreatedAsync();
}

await app.RunAsync();
