using CFBPoll.API.DTOs;
using Xunit;

namespace CFBPoll.API.Tests.DTOs;

/// <summary>
/// Guards the public prediction contract: calibration values are admin-only and must never reach public responses.
/// </summary>
public class PublicPredictionDTOTests
{
    [Theory]
    [InlineData(typeof(GamePredictionDTO))]
    [InlineData(typeof(PredictionsResponseDTO))]
    public void Properties_PublicPredictionType_DoNotExposeCalibration(Type publicType)
    {
        Assert.DoesNotContain(publicType.GetProperties(), p => p.Name.Contains("Calibration", StringComparison.OrdinalIgnoreCase));
    }
}
