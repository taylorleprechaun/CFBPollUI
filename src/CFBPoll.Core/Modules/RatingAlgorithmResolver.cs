using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class RatingAlgorithmResolver : IRatingAlgorithmResolver
{
    // Placeholder far-future cutover: every season resolves to Legacy until this is deliberately
    // lowered once the V2 algorithm's real logic exists (see RatingModuleV2).
    private const int NEW_ALGORITHM_START_SEASON = int.MaxValue;

    private readonly RatingModule _legacy;

    public RatingAlgorithmResolver(RatingModule legacy)
    {
        _legacy = legacy ?? throw new ArgumentNullException(nameof(legacy));
    }

    public IRatingModule Resolve(RatingAlgorithmVersion version)
    {
        return version switch
        {
            RatingAlgorithmVersion.Legacy => _legacy,
            RatingAlgorithmVersion.V2 => throw new NotSupportedException("The V2 rating algorithm is not yet implemented."),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, "Unknown rating algorithm version.")
        };
    }

    public IRatingModule ResolveForSeason(int season)
    {
        return Resolve(ResolveVersionForSeason(season));
    }

    public RatingAlgorithmVersion ResolveVersionForSeason(int season)
    {
        return season >= NEW_ALGORITHM_START_SEASON ? RatingAlgorithmVersion.V2 : RatingAlgorithmVersion.Legacy;
    }
}
