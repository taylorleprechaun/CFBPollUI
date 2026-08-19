using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class PredictionAlgorithmResolver : IPredictionAlgorithmResolver
{
    private const int NEW_ALGORITHM_START_SEASON = 2026;

    private readonly PredictionCalculatorModule _v1;
    private readonly PredictionCalculatorModuleV2 _v2;

    public PredictionAlgorithmResolver(PredictionCalculatorModule v1, PredictionCalculatorModuleV2 v2)
    {
        _v1 = v1 ?? throw new ArgumentNullException(nameof(v1));
        _v2 = v2 ?? throw new ArgumentNullException(nameof(v2));
    }

    public IPredictionCalculatorModule Resolve(RatingAlgorithmVersion version)
    {
        return version switch
        {
            RatingAlgorithmVersion.V1 => _v1,
            RatingAlgorithmVersion.V2 => _v2,
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, "Unknown prediction algorithm version.")
        };
    }

    public IPredictionCalculatorModule ResolveForSeason(int season)
    {
        return Resolve(ResolveVersionForSeason(season));
    }

    public RatingAlgorithmVersion ResolveVersionForSeason(int season)
    {
        return season >= NEW_ALGORITHM_START_SEASON ? RatingAlgorithmVersion.V2 : RatingAlgorithmVersion.V1;
    }
}
