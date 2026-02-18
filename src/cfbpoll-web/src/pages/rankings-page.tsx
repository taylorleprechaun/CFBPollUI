import { useEffect, useMemo, useRef, useState } from 'react';
import { useSeasons } from '../hooks/use-seasons';
import { useAvailableWeeks } from '../hooks/use-available-weeks';
import { useRankings } from '../hooks/use-rankings';
import { useConferences } from '../hooks/use-conferences';
import { useDefaultSeasonWeek } from '../hooks/use-default-season-week';
import { SeasonSelector } from '../components/rankings/season-selector';
import { WeekSelector } from '../components/rankings/week-selector';
import { ConferenceFilter } from '../components/rankings/conference-filter';
import { RankingsTable } from '../components/rankings/rankings-table';
import { ErrorAlert } from '../components/error';

export function RankingsPage() {
  useEffect(() => {
    document.title = 'Taylor Steinberg - College Football Ratings';
  }, []);

  const [selectedConference, setSelectedConference] = useState<string | null>(null);

  const {
    data: seasonsData,
    isLoading: seasonsLoading,
    error: seasonsError,
    refetch: refetchSeasons,
  } = useSeasons();
  const {
    data: conferencesData,
    isLoading: conferencesLoading,
  } = useConferences();

  const seasonRef = useRef<number | null>(null);
  const {
    data: weeksData,
    isLoading: weeksLoading,
    error: weeksError,
    refetch: refetchWeeks,
  } = useAvailableWeeks(seasonRef.current);

  const {
    season: selectedSeason,
    setSeason: setSelectedSeason,
    week: selectedWeek,
    setWeek: setSelectedWeek,
    resetWeek,
  } = useDefaultSeasonWeek(seasonsData, weeksData);
  seasonRef.current = selectedSeason;

  const {
    data: rankingsData,
    isLoading: rankingsLoading,
    error: rankingsError,
    refetch: refetchRankings,
  } = useRankings(selectedSeason, selectedWeek);

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    resetWeek();
    setSelectedConference(null);
  };

  const activeConferences = useMemo(() => {
    if (!conferencesData?.conferences || !rankingsData?.rankings) {
      return [];
    }

    const conferenceNamesInRankings = new Set(
      rankingsData.rankings.map((team) => team.conference)
    );

    return conferencesData.conferences
      .filter((conf) => conferenceNamesInRankings.has(conf.name))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [conferencesData, rankingsData]);

  const error = seasonsError || weeksError || rankingsError;
  const handleRetry = () => {
    if (seasonsError) refetchSeasons();
    if (weeksError) refetchWeeks();
    if (rankingsError) refetchRankings();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Rankings</h1>
        <div className="flex flex-wrap gap-4">
          <SeasonSelector
            seasons={seasonsData?.seasons ?? []}
            selectedSeason={selectedSeason}
            onSeasonChange={handleSeasonChange}
            isLoading={seasonsLoading}
          />
          <WeekSelector
            weeks={weeksData?.weeks ?? []}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            isLoading={weeksLoading}
          />
        </div>
        <div className="mt-4">
          <ConferenceFilter
            conferences={activeConferences}
            selectedConference={selectedConference}
            onConferenceChange={setSelectedConference}
            isLoading={conferencesLoading || rankingsLoading}
          />
        </div>
      </div>

      {error && (
        <ErrorAlert error={error} onRetry={handleRetry} />
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <RankingsTable
          rankings={rankingsData?.rankings ?? []}
          isLoading={rankingsLoading}
          selectedConference={selectedConference}
          selectedSeason={selectedSeason}
          selectedWeek={selectedWeek}
        />
      </div>

      {rankingsData && (
        <div className="text-sm text-gray-500 text-center">
          Showing rankings for {rankingsData.season} Season,{' '}
          {weeksData?.weeks?.find((w) => w.weekNumber === rankingsData.week)?.label ??
            `Week ${rankingsData.week}`}
        </div>
      )}
    </div>
  );
}
