using CFBPoll.API.DTOs;
using CFBPoll.Core.Models;

namespace CFBPoll.API.Mappers;

public static class PageVisibilityMapper
{
    public static PageVisibilityDTO ToDTO(PageVisibility model)
    {
        ArgumentNullException.ThrowIfNull(model);

        return new PageVisibilityDTO
        {
            AllTimeEnabled = model.AllTimeEnabled,
            PollLeadersEnabled = model.PollLeadersEnabled,
            SeasonTrendsEnabled = model.SeasonTrendsEnabled
        };
    }

    public static PageVisibility ToModel(PageVisibilityDTO dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        return new PageVisibility
        {
            AllTimeEnabled = dto.AllTimeEnabled,
            PollLeadersEnabled = dto.PollLeadersEnabled,
            SeasonTrendsEnabled = dto.SeasonTrendsEnabled
        };
    }
}
