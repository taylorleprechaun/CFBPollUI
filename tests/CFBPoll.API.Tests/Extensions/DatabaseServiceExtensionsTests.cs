using CFBPoll.API.Extensions;
using CFBPoll.Core.Data;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Options;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace CFBPoll.API.Tests.Extensions;

public class DatabaseServiceExtensionsTests
{
    [Fact]
    public void AddDatabase_RegistersDatabaseOptions()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddDatabase(configuration);

        var provider = services.BuildServiceProvider();
        var options = provider.GetService<IOptions<DatabaseOptions>>();

        Assert.NotNull(options);
        Assert.Equal("Data Source=test.db", options.Value.ConnectionString);
    }

    [Fact]
    public void AddDatabase_RegistersIPageVisibilityData()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddDatabase(configuration);

        var provider = services.BuildServiceProvider();
        var data = provider.GetService<IPageVisibilityData>();

        Assert.NotNull(data);
        Assert.IsType<PageVisibilityData>(data);
    }

    [Fact]
    public void AddDatabase_RegistersIRankingsData()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddDatabase(configuration);

        var provider = services.BuildServiceProvider();
        var data = provider.GetService<IRankingsData>();

        Assert.NotNull(data);
        Assert.IsType<RankingsData>(data);
    }

    [Fact]
    public void AddDatabase_ReturnsServiceCollection()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        var result = services.AddDatabase(configuration);

        Assert.Same(services, result);
    }

    [Fact]
    public void AddDatabase_RegistersAsSingleton()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddDatabase(configuration);

        var provider = services.BuildServiceProvider();

        var data1 = provider.GetService<IRankingsData>();
        var data2 = provider.GetService<IRankingsData>();

        Assert.Same(data1, data2);
    }

    [Fact]
    public void AddDatabase_RegistersIPredictionsData()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var configuration = BuildConfiguration();

        services.AddDatabase(configuration);

        var provider = services.BuildServiceProvider();
        var data = provider.GetService<IPredictionsData>();

        Assert.NotNull(data);
        Assert.IsType<PredictionsData>(data);
    }

    [Fact]
    public async Task InitializeDatabaseAsync_CallsInitializeOnAllDataLayers()
    {
        var mockPageVisibilityData = new Mock<IPageVisibilityData>();
        mockPageVisibilityData.Setup(x => x.InitializeAsync()).ReturnsAsync(true);

        var mockPredictionsData = new Mock<IPredictionsData>();
        mockPredictionsData.Setup(x => x.InitializeAsync()).Returns(Task.CompletedTask);

        var mockRankingsData = new Mock<IRankingsData>();
        mockRankingsData.Setup(x => x.InitializeAsync()).Returns(Task.CompletedTask);

        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSingleton(mockPageVisibilityData.Object);
        builder.Services.AddSingleton(mockPredictionsData.Object);
        builder.Services.AddSingleton(mockRankingsData.Object);
        var app = builder.Build();

        await app.InitializeDatabaseAsync();

        mockPageVisibilityData.Verify(x => x.InitializeAsync(), Times.Once);
        mockPredictionsData.Verify(x => x.InitializeAsync(), Times.Once);
        mockRankingsData.Verify(x => x.InitializeAsync(), Times.Once);
    }

    private static IConfiguration BuildConfiguration()
    {
        var configValues = new Dictionary<string, string?>
        {
            ["Database:ConnectionString"] = "Data Source=test.db"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();
    }
}
