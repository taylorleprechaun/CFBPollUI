using CFBPoll.API.Mappers;
using CFBPoll.Core.Models;
using Xunit;

namespace CFBPoll.API.Tests.Mappers;

public class IncompleteGamesMapperTests
{
    [Fact]
    public void ToDTO_MapsAllProperties()
    {
        var scheduleGame = new ScheduleGame
        {
            AwayTeam = "Texas",
            HomeTeam = "Oklahoma",
            StartDate = new DateTime(2026, 9, 12, 18, 0, 0, DateTimeKind.Utc),
            StartTimeTbd = false
        };

        var result = IncompleteGamesMapper.ToDTO(scheduleGame);

        Assert.Equal("Oklahoma", result.HomeTeam);
        Assert.Equal("Texas", result.AwayTeam);
        Assert.Equal(scheduleGame.StartDate, result.StartDate);
        Assert.False(result.StartTimeTbd);
    }

    [Fact]
    public void ToDTO_WithNullInput_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => IncompleteGamesMapper.ToDTO(null!));
    }

    [Fact]
    public void ToResponseDTO_MapsSeasonAndWeek()
    {
        var games = new List<ScheduleGame>
        {
            new() { HomeTeam = "Iowa", AwayTeam = "Nebraska" }
        };

        var result = IncompleteGamesMapper.ToResponseDTO(2026, 2, games);

        Assert.Equal(2026, result.Season);
        Assert.Equal(2, result.Week);
        var game = Assert.Single(result.Games);
        Assert.Equal("Iowa", game.HomeTeam);
        Assert.Equal("Nebraska", game.AwayTeam);
    }

    [Fact]
    public void ToResponseDTO_WithEmptyList_ReturnsEmptyGames()
    {
        var result = IncompleteGamesMapper.ToResponseDTO(2026, 2, []);

        Assert.Empty(result.Games);
    }

    [Fact]
    public void ToResponseDTO_WithNullGames_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => IncompleteGamesMapper.ToResponseDTO(2026, 2, null!));
    }
}
