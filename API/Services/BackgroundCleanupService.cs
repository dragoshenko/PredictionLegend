using API.Interfaces;

namespace API.Services;

public class BackgroundCleanupService : BackgroundService
{
    private readonly ILogger<BackgroundCleanupService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _period = TimeSpan.FromHours(1); // Run every hour

    public BackgroundCleanupService(
        ILogger<BackgroundCleanupService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoCleanupAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during cleanup task");
            }

            await Task.Delay(_period, stoppingToken);
        }
    }

    private async Task DoCleanupAsync()
    {
        _logger.LogInformation("Starting cleanup task at {time}", DateTimeOffset.Now);

        using var scope = _serviceProvider.CreateScope();
        var creationFlowService = scope.ServiceProvider.GetRequiredService<ICreationFlowService>();

        try
        {
            await creationFlowService.CleanupExpiredFlowsAsync();
            _logger.LogInformation("Cleanup task completed successfully at {time}", DateTimeOffset.Now);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup task execution");
        }
    }
}