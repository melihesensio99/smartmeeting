using Microsoft.Extensions.DependencyInjection;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Infrastructure.Processing;
using SmartMeeting.Infrastructure.Services;
using SmartMeeting.Infrastructure.Ai;
using SmartMeeting.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;

namespace SmartMeeting.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddTransient<MistralRetryHandler>();
        services.AddSingleton<IMeetingProcessingQueue, InMemoryMeetingProcessingQueue>();
        services.AddHttpClient<ISpeechToTextService, MistralSpeechToTextService>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<MistralOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(120);
        }).AddHttpMessageHandler<MistralRetryHandler>();
        services.Configure<MistralOptions>(configuration.GetSection(MistralOptions.SectionName));
        services.AddHttpClient<IAiSummarizerService, MistralSummarizerService>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<MistralOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(90);
        }).AddHttpMessageHandler<MistralRetryHandler>();
        services.AddHostedService<MeetingProcessingWorker>();
        services.Configure<AudioStorageOptions>(configuration.GetSection(AudioStorageOptions.SectionName));
        services.AddScoped<IAudioStorage, LocalAudioStorage>();
        return services;
    }
}
