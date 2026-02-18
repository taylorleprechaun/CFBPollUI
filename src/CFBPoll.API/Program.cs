using System.Diagnostics.CodeAnalysis;
using System.Threading.RateLimiting;
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
            policy.WithOrigins(
                    "http://localhost:5173",
                    "https://taylorsteinberg.net",
                    "https://www.taylorsteinberg.net"
                )
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    builder.Services.Configure<HistoricalDataOptions>(
        builder.Configuration.GetSection(HistoricalDataOptions.SectionName));

    builder.Services.AddDatabase(builder.Configuration);
    builder.Services.AddCFBDataServiceWithCaching(builder.Configuration);
    builder.Services.AddSingleton<IRatingModule, RatingModule>();
    builder.Services.AddRankingsModule();
    builder.Services.AddSingleton<ISeasonModule, SeasonModule>();
    builder.Services.AddSingleton<IConferenceModule, ConferenceModule>();
    builder.Services.AddSingleton<IAdminModule, AdminModule>();
    builder.Services.AddSingleton<IExcelExportModule, ExcelExportModule>();
    builder.Services.AddJwtAuthentication(builder.Configuration);

    builder.Services.AddRateLimiter(options =>
    {
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = 100,
                    Window = TimeSpan.FromMinutes(1)
                }));

        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

    var app = builder.Build();

    app.UseExceptionHandling();
    app.UseRequestLogging();
    app.UseRateLimiter();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    await app.InitializeDatabaseAsync();

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

[ExcludeFromCodeCoverage]
public partial class Program { }
