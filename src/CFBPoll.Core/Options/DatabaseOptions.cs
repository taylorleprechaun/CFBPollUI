namespace CFBPoll.Core.Options;

public class DatabaseOptions
{
    public const string SectionName = "Database";

    public string ConnectionString { get; set; } = "Data Source=data/cfbpoll.db";
}
