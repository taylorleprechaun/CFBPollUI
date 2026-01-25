using CFBPoll.API.Extensions;
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Modules;
using CFBPoll.Core.Options;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Configuration.AddJsonFile("appsettings-private.json", optional: true, reloadOnChange: true);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    builder.Services.Configure<HistoricalDataOptions>(
        builder.Configuration.GetSection(HistoricalDataOptions.SectionName));

    builder.Services.AddCFBDataServiceWithCaching(builder.Configuration);
    builder.Services.AddSingleton<IRatingModule, RatingModule>();
    builder.Services.AddSingleton<IRankingsModule, RankingsModule>();
    builder.Services.AddSingleton<ISeasonModule, SeasonModule>();
    builder.Services.AddSingleton<IConferenceModule, ConferenceModule>();

    builder.Services.AddMemoryCache();

    var app = builder.Build();

    app.UseExceptionHandling();
    app.UseRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();
    app.UseCors();
    app.UseAuthorization();
    app.MapControllers();

    Log.Information("Starting CFBPoll API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
