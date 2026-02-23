using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;
using Microsoft.Extensions.Logging;

namespace CFBPoll.Core.Modules;

public class PageVisibilityModule : IPageVisibilityModule
{
    private readonly ILogger<PageVisibilityModule> _logger;
    private readonly IPageVisibilityData _pageVisibilityData;

    public PageVisibilityModule(IPageVisibilityData pageVisibilityData, ILogger<PageVisibilityModule> logger)
    {
        _pageVisibilityData = pageVisibilityData ?? throw new ArgumentNullException(nameof(pageVisibilityData));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<PageVisibility> GetPageVisibilityAsync()
    {
        return await _pageVisibilityData.GetPageVisibilityAsync().ConfigureAwait(false);
    }

    public async Task<bool> UpdatePageVisibilityAsync(PageVisibility visibility)
    {
        return await _pageVisibilityData.UpdatePageVisibilityAsync(visibility).ConfigureAwait(false);
    }
}
