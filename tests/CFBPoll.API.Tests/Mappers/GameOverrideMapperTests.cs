using System.Collections.Generic;

using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class GameOverrideMapperTests
{
    [Fact]
    public void ToCompletedGameDTO_MapsTeamLogoURLsFromScheduleGame()
    {
        var scheduleGame = new ScheduleGame
        {
            AwayPoints = 20,
            AwayTeam = "Iowa",
            AwayTeamLogoURL = "https://example.com/iowa.png",
            GameID = 401234561,
            HomePoints = 24,
            HomeTeam = "Nebraska",
            HomeTeamLogoURL = "https://example.com/nebraska.png",
            SeasonType = "regular"
        };

        var result = GameOverrideMapper.ToCompletedGameDTO(scheduleGame);

        Assert.Equal("https://example.com/iowa.png", result.AwayTeamLogoURL);
        Assert.Equal("https://example.com/nebraska.png", result.HomeTeamLogoURL);
    }

    [Fact]
    public void ToCompletedGameDTO_NullScheduleGame_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => GameOverrideMapper.ToCompletedGameDTO(null!));
    }

    [Fact]
    public void ToCompletedGamesResponseDTO_MapsEachGame()
    {
        var games = new List<ScheduleGame>
        {
            new() { AwayTeam = "Oklahoma", HomeTeam = "Texas" }
        };

        var result = GameOverrideMapper.ToCompletedGamesResponseDTO(2024, 5, games);

        var game = Assert.Single(result.Games);
        Assert.Equal("Oklahoma", game.AwayTeam);
        Assert.Equal("Texas", game.HomeTeam);
    }

    [Fact]
    public void ToCompletedGamesResponseDTO_NullGames_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => GameOverrideMapper.ToCompletedGamesResponseDTO(2024, 5, null!));
    }

    [Fact]
    public void ToDTO_MapsTeamLogoURLsFromGameOverride()
    {
        var gameOverride = new GameOverride
        {
            AwayTeam = "Michigan",
            AwayTeamLogoURL = "https://example.com/michigan.png",
            GameID = 401234563,
            HomeTeam = "Ohio State",
            HomeTeamLogoURL = "https://example.com/ohio-state.png",
            Reason = "A false start was not called before the game-winning field goal.",
            Season = 2024,
            SeasonType = "regular",
            Week = 10
        };

        var result = GameOverrideMapper.ToDTO(gameOverride);

        Assert.Equal("https://example.com/michigan.png", result.AwayTeamLogoURL);
        Assert.Equal("https://example.com/ohio-state.png", result.HomeTeamLogoURL);
    }

    [Fact]
    public void ToDTO_NullGameOverride_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => GameOverrideMapper.ToDTO(null!));
    }
}
