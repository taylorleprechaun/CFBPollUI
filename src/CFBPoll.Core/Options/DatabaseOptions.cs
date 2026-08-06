namespace CFBPoll.Core.Options;

public class DatabaseOptions
{
    public const string SECTION_NAME = "Database";

    public string ConnectionString { get; set; } = "Data Source=data/cfbpoll.db";
}
