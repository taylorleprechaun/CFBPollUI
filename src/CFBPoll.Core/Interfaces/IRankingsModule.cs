using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for generating complete rankings from team ratings and managing persisted rankings data.
/// </summary>
public interface IRankingsModule
{
    /// <summary>
    /// Deletes a snapshot for the given season and week.
    /// </summary>
    Task<bool> DeleteSnapshotAsync(int season, int week);

    /// <summary>
    /// Generates complete rankings from season data and calculated ratings.
    /// </summary>
    /// <param name="seasonData">The season data containing teams and game results.</param>
    /// <param name="ratings">Dictionary mapping team names to their calculated rating details.</param>
    /// <returns>Rankings result containing all ranked teams.</returns>
    Task<RankingsResult> GenerateRankingsAsync(SeasonData seasonData, IDictionary<string, RatingDetails> ratings);

    /// <summary>
    /// Retrieves available published weeks for a season, enriched with week labels.
    /// </summary>
    /// <param name="season">The season year.</param>
    /// <param name="calendarWeeks">Calendar weeks from the external data source.</param>
    /// <returns>Published weeks with labels.</returns>
    Task<IEnumerable<WeekInfo>> GetAvailableWeeksAsync(int season, IEnumerable<CalendarWeek> calendarWeeks);

    /// <summary>
    /// Retrieves all persisted week summaries including draft and published.
    /// </summary>
    Task<IEnumerable<PersistedWeekSummary>> GetPersistedWeeksAsync();

    /// <summary>
    /// Retrieves a published snapshot for the given season and week.
    /// </summary>
    Task<RankingsResult?> GetPublishedSnapshotAsync(int season, int week);

    /// <summary>
    /// Retrieves a snapshot for the given season and week regardless of published status.
    /// </summary>
    Task<RankingsResult?> GetSnapshotAsync(int season, int week);

    /// <summary>
    /// Publishes a snapshot for the given season and week.
    /// </summary>
    Task<bool> PublishSnapshotAsync(int season, int week);

    /// <summary>
    /// Saves a rankings result as a draft snapshot.
    /// </summary>
    Task SaveSnapshotAsync(RankingsResult rankings);
}
