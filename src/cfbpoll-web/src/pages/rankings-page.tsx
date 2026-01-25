import { useEffect, useMemo, useState } from 'react';
import { useSeasons } from '../hooks/use-seasons';
import { useWeeks } from '../hooks/use-weeks';
import { useRankings } from '../hooks/use-rankings';
import { useConferences } from '../hooks/use-conferences';
import { SeasonSelector } from '../components/rankings/season-selector';
import { WeekSelector } from '../components/rankings/week-selector';
import { ConferenceFilter } from '../components/rankings/conference-filter';
import { RankingsTable } from '../components/rankings/rankings-table';
import { ErrorAlert } from '../components/error';

export function RankingsPage() {
  useEffect(() => {
    document.title = 'Taylor Steinberg - College Football Ratings';
  }, []);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
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
  const {
    data: weeksData,
    isLoading: weeksLoading,
    error: weeksError,
    refetch: refetchWeeks,
  } = useWeeks(selectedSeason);
  const {
    data: rankingsData,
    isLoading: rankingsLoading,
    error: rankingsError,
    refetch: refetchRankings,
  } = useRankings(selectedSeason, selectedWeek);

  useEffect(() => {
    if (seasonsData?.seasons?.length && selectedSeason === null) {
      setSelectedSeason(seasonsData.seasons[0]);
    }
  }, [seasonsData, selectedSeason]);

  useEffect(() => {
    if (weeksData?.weeks?.length && selectedWeek === null) {
      const lastWeek = weeksData.weeks[weeksData.weeks.length - 1];
      setSelectedWeek(lastWeek.weekNumber);
    }
  }, [weeksData, selectedWeek]);

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    setSelectedWeek(null);
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
