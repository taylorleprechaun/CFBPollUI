using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class RatingAlgorithmResolver : IRatingAlgorithmResolver
{
    // Placeholder far-future cutover: every season resolves to V1 until this is deliberately
    // lowered once the V2 algorithm's real logic exists (see RatingModuleV2).
    private const int NEW_ALGORITHM_START_SEASON = int.MaxValue;

    private readonly RatingModule _v1;
    private readonly RatingModuleV2 _v2;

    public RatingAlgorithmResolver(RatingModule v1, RatingModuleV2 v2)
    {
        _v1 = v1 ?? throw new ArgumentNullException(nameof(v1));
        _v2 = v2 ?? throw new ArgumentNullException(nameof(v2));
    }

    public IRatingModule Resolve(RatingAlgorithmVersion version)
    {
        return version switch
        {
            RatingAlgorithmVersion.V1 => _v1,
            RatingAlgorithmVersion.V2 => _v2,
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, "Unknown rating algorithm version.")
        };
    }

    public IRatingModule ResolveForSeason(int season)
    {
        return Resolve(ResolveVersionForSeason(season));
    }

    public RatingAlgorithmVersion ResolveVersionForSeason(int season)
    {
        return season >= NEW_ALGORITHM_START_SEASON ? RatingAlgorithmVersion.V2 : RatingAlgorithmVersion.V1;
    }
}
