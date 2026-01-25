using CFBPoll.Core.Models;

namespace CFBPoll.Core.Interfaces;

/// <summary>
/// Module for conference data transformation.
/// </summary>
public interface IConferenceModule
{
    /// <summary>
    /// Transforms conferences to conference info with resolved labels.
    /// </summary>
    /// <param name="conferences">The conferences to transform.</param>
    /// <returns>Collection of conference info with resolved labels.</returns>
    IEnumerable<ConferenceInfo> GetConferenceInfos(IEnumerable<Conference> conferences);
}
