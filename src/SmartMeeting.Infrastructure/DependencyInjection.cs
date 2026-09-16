using Microsoft.Extensions.DependencyInjection;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Infrastructure.Processing;
using SmartMeeting.Infrastructure.Services;

namespace SmartMeeting.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IMeetingProcessingQueue, InMemoryMeetingProcessingQueue>();
        services.AddSingleton<ISpeechToTextService, DemoSpeechToTextService>();
        services.AddSingleton<IAiSummarizerService, StructuredDemoSummarizerService>();
        services.AddHostedService<MeetingProcessingWorker>();
        return services;
    }
}
