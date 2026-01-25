using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class ConferenceModule : IConferenceModule
{
    public IEnumerable<ConferenceInfo> GetConferenceInfos(IEnumerable<Conference> conferences)
    {
        return conferences.Select(c => new ConferenceInfo
        {
            ID = c.ID,
            Label = !string.IsNullOrEmpty(c.Abbreviation) ? c.Abbreviation : c.ShortName,
            Name = c.Name
        });
    }
}
