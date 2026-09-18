using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class GameOverrideMapper
{
    public static CompletedGameDTO ToCompletedGameDTO(ScheduleGame scheduleGame)
    {
        ArgumentNullException.ThrowIfNull(scheduleGame);

        return new CompletedGameDTO
        {
            AwayPoints = scheduleGame.AwayPoints,
            AwayTeam = scheduleGame.AwayTeam,
            AwayTeamLogoURL = scheduleGame.AwayTeamLogoURL,
            GameID = scheduleGame.GameID,
            HasOverride = scheduleGame.ScoreOverrideReason is not null,
            HomePoints = scheduleGame.HomePoints,
            HomeTeam = scheduleGame.HomeTeam,
            HomeTeamLogoURL = scheduleGame.HomeTeamLogoURL,
            SeasonType = scheduleGame.SeasonType
        };
    }

    public static CompletedGamesResponseDTO ToCompletedGamesResponseDTO(int season, int week, IEnumerable<ScheduleGame> games)
    {
        ArgumentNullException.ThrowIfNull(games);

        return new CompletedGamesResponseDTO
        {
            Games = games.Select(ToCompletedGameDTO),
            Season = season,
            Week = week
        };
    }

    public static ScoreOverrideDisclosureDTO ToDisclosureDTO(GameOverride gameOverride)
    {
        ArgumentNullException.ThrowIfNull(gameOverride);

        return new ScoreOverrideDisclosureDTO
        {
            AwayTeam = gameOverride.AwayTeam,
            AwayTeamLogoURL = gameOverride.AwayTeamLogoURL,
            GameID = gameOverride.GameID,
            HomeTeam = gameOverride.HomeTeam,
            HomeTeamLogoURL = gameOverride.HomeTeamLogoURL,
            OriginalAwayPoints = gameOverride.OriginalAwayPoints,
            OriginalHomePoints = gameOverride.OriginalHomePoints,
            OverrideAwayPoints = gameOverride.OverrideAwayPoints,
            OverrideHomePoints = gameOverride.OverrideHomePoints,
            Reason = gameOverride.Reason,
            Week = gameOverride.Week
        };
    }

    public static GameOverrideDTO ToDTO(GameOverride gameOverride)
    {
        ArgumentNullException.ThrowIfNull(gameOverride);

        return new GameOverrideDTO
        {
            AwayTeam = gameOverride.AwayTeam,
            AwayTeamLogoURL = gameOverride.AwayTeamLogoURL,
            CreatedAt = gameOverride.CreatedAt,
            GameID = gameOverride.GameID,
            HomeTeam = gameOverride.HomeTeam,
            HomeTeamLogoURL = gameOverride.HomeTeamLogoURL,
            ModifiedAt = gameOverride.ModifiedAt,
            OriginalAwayPoints = gameOverride.OriginalAwayPoints,
            OriginalHomePoints = gameOverride.OriginalHomePoints,
            OverrideAwayPoints = gameOverride.OverrideAwayPoints,
            OverrideHomePoints = gameOverride.OverrideHomePoints,
            Reason = gameOverride.Reason,
            Season = gameOverride.Season,
            SeasonType = gameOverride.SeasonType,
            Week = gameOverride.Week
        };
    }
}
