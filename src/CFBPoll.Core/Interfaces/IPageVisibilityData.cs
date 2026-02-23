using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Provides persistence for page visibility settings.
/// </summary>
public interface IPageVisibilityData
{
    /// <summary>
    /// Retrieves the current page visibility settings.
    /// </summary>
    Task<PageVisibility> GetPageVisibilityAsync();

    /// <summary>
    /// Initializes the page visibility persistence store and seeds defaults if they do not exist.
    /// </summary>
    Task<bool> InitializeAsync();

    /// <summary>
    /// Persists updated page visibility settings.
    /// </summary>
    Task<bool> UpdatePageVisibilityAsync(PageVisibility visibility);
}
