using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class RatingAlgorithmResolver : IRatingAlgorithmResolver
{
    private const int NEW_ALGORITHM_START_SEASON = 2026;
    /// <summary>
    /// Predictions stay on this version regardless of <see cref="NEW_ALGORITHM_START_SEASON"/> until
    /// <see cref="RatingModuleV2"/>'s rating scale is accounted for in the prediction math.
    /// </summary>
    private const RatingAlgorithmVersion PREDICTIONS_PINNED_VERSION = RatingAlgorithmVersion.V1;

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

    public IRatingModule ResolveForPredictions()
    {
        return Resolve(PREDICTIONS_PINNED_VERSION);
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
