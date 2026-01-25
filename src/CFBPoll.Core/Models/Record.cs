namespace CFBPoll.Core.Models;

public class Record
{
    public int Losses { get; set; }
    public int Wins { get; set; }

    public Record AddWin()
    {
        return new Record { Wins = Wins + 1, Losses = Losses };
    }

    public Record AddLoss()
    {
        return new Record { Wins = Wins, Losses = Losses + 1 };
    }
}
