using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Manages page visibility settings that control which public pages are accessible.
/// </summary>
public interface IPageVisibilityModule
{
    /// <summary>
    /// Retrieves the current page visibility settings.
    /// </summary>
    Task<PageVisibility> GetPageVisibilityAsync();

    /// <summary>
    /// Updates page visibility settings.
    /// </summary>
    Task<bool> UpdatePageVisibilityAsync(PageVisibility visibility);
}
