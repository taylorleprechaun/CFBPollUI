import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorAlert } from '../components/error';
import { SeasonSelector } from '../components/rankings/season-selector';
import { TeamLogo } from '../components/rankings/team-logo';
import { useRankings } from '../hooks/use-rankings';
import { useSeasons } from '../hooks/use-seasons';
import { useTeamDetail } from '../hooks/use-team-detail';
import { useWeeks } from '../hooks/use-weeks';
import { getContrastTextColor } from '../lib/color-utils';
import type { Record as TeamRecord, ScheduleGame } from '../types';

export function TeamDetailsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedSeason, setSelectedSeason] = useState<number | null>(
    searchParams.get('season') ? Number(searchParams.get('season')) : null
  );
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(
    searchParams.get('team') || null
  );

  useEffect(() => {
    document.title = 'Taylor Steinberg - Team Details';
  }, []);

  const {
    data: seasonsData,
    isLoading: seasonsLoading,
    error: seasonsError,
    refetch: refetchSeasons,
  } = useSeasons();
  const {
    data: weeksData,
    error: weeksError,
    refetch: refetchWeeks,
  } = useWeeks(selectedSeason);
  const {
    data: rankingsData,
    isLoading: rankingsLoading,
    error: rankingsError,
    refetch: refetchRankings,
  } = useRankings(selectedSeason, selectedWeek);
  const {
    data: teamDetail,
    isLoading: teamDetailLoading,
    error: teamDetailError,
    refetch: refetchTeamDetail,
  } = useTeamDetail(selectedSeason, selectedWeek, selectedTeam);

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

  useEffect(() => {
    const params: globalThis.Record<string, string> = {};
    if (selectedSeason !== null) params.season = String(selectedSeason);
    if (selectedTeam) params.team = selectedTeam;
    setSearchParams(params, { replace: true });
  }, [selectedSeason, selectedTeam, setSearchParams]);

  const teamOptions = useMemo(() => {
    if (!rankingsData?.rankings) return [];
    return [...rankingsData.rankings]
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [rankingsData]);

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    setSelectedWeek(null);
    setSelectedTeam(null);
  };

  const handleTeamChange = (teamName: string) => {
    setSelectedTeam(teamName || null);
  };

  const error = seasonsError || weeksError || rankingsError || teamDetailError;
  const handleRetry = () => {
    if (seasonsError) refetchSeasons();
    if (weeksError) refetchWeeks();
    if (rankingsError) refetchRankings();
    if (teamDetailError) refetchTeamDetail();
  };

  const bgColor = teamDetail?.color || '#6B7280';
  const textColor = getContrastTextColor(bgColor);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Details</h1>
        <div className="flex flex-wrap gap-4">
          <SeasonSelector
            seasons={seasonsData?.seasons ?? []}
            selectedSeason={selectedSeason}
            onSeasonChange={handleSeasonChange}
            isLoading={seasonsLoading}
          />
          <div className="flex items-center space-x-2">
            <label htmlFor="team-select" className="font-medium text-gray-700">
              Team:
            </label>
            <select
              id="team-select"
              value={selectedTeam ?? ''}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={rankingsLoading || teamOptions.length === 0}
              className="block w-56 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a team</option>
              {teamOptions.map((team) => (
                <option key={team.teamName} value={team.teamName}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={handleRetry} />}

      {teamDetailLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      )}

      {teamDetail && (
        <>
          <div
            className="shadow rounded-lg p-6"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={teamDetail.logoURL}
                  alt={`${teamDetail.teamName} logo`}
                  className="w-16 h-16 object-contain rounded-lg bg-white p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <h2 className="text-2xl font-bold">{teamDetail.teamName}</h2>
                  <p className="opacity-80">
                    {teamDetail.conference}
                    {teamDetail.division ? ` - ${teamDetail.division}` : ''}
                  </p>
                  <p className="text-lg font-semibold">{teamDetail.record}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="opacity-70">Rank</span>
                  <p className="text-xl font-bold">#{teamDetail.rank}</p>
                </div>
                <div>
                  <span className="opacity-70">Rating</span>
                  <p className="text-xl font-bold">{teamDetail.rating.toFixed(4)}</p>
                </div>
                <div>
                  <span className="opacity-70">SOS Rank</span>
                  <p className="text-xl font-bold">#{teamDetail.sosRanking}</p>
                </div>
                <div>
                  <span className="opacity-70">Weighted SOS</span>
                  <p className="text-xl font-bold">{teamDetail.weightedSOS.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div
              className="p-6 pb-3 rounded-t-lg"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              <h3 className="text-lg font-semibold">Schedule</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opponent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamDetail.schedule.map((game, index) => (
                    <ScheduleRow key={index} game={game} />
                  ))}
                  {teamDetail.schedule.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No games found for this season.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <h3
                className="text-lg font-semibold p-4 rounded-t-lg"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                Record by Location
              </h3>
              <div className="space-y-2 p-4">
                <RecordRow label="Home" record={teamDetail.details.home} />
                <RecordRow label="Away" record={teamDetail.details.away} />
                <RecordRow label="Neutral" record={teamDetail.details.neutral} />
              </div>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <h3
                className="text-lg font-semibold p-4 rounded-t-lg"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                Record vs Opponent Rank
              </h3>
              <div className="space-y-2 p-4">
                <RecordRow label="vs #1-10" record={teamDetail.details.vsRank1To10} />
                <RecordRow label="vs #11-25" record={teamDetail.details.vsRank11To25} />
                <RecordRow label="vs #26-50" record={teamDetail.details.vsRank26To50} />
                <RecordRow label="vs #51-100" record={teamDetail.details.vsRank51To100} />
                <RecordRow label="vs #101+" record={teamDetail.details.vsRank101Plus} />
              </div>
            </div>
          </div>
        </>
      )}

      {!teamDetailLoading && !teamDetail && selectedTeam && !error && (
        <div className="text-center py-12 text-gray-500">
          Loading team details...
        </div>
      )}

      {!selectedTeam && !teamDetailLoading && (
        <div className="text-center py-12 text-gray-500">
          Select a season and team to view details.
        </div>
      )}
    </div>
  );
}

function RecordRow({ label, record }: { label: string; record: TeamRecord }) {
  const hasGames = record.wins > 0 || record.losses > 0;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{hasGames ? `${record.wins}-${record.losses}` : '-'}</span>
    </div>
  );
}

function ScheduleRow({ game }: { game: ScheduleGame }) {
  const gameDate = game.gameDate ? new Date(game.gameDate) : null;
  const dateStr = gameDate
    ? gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'TBD';
  const timeStr = game.startTimeTbd
    ? 'TBA'
    : gameDate
      ? gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';

  const locationPrefix = game.neutralSite
    ? ''
    : game.isHome
      ? 'vs '
      : 'at ';

  const weekLabel = game.seasonType === 'postseason' ? 'Post' : `${game.week ?? ''}`;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
        {weekLabel}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm">
        <div className="text-gray-900">{dateStr}</div>
        {timeStr && <div className="text-gray-400 text-xs">{timeStr}</div>}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm">
        <div className="flex items-center space-x-2">
          <TeamLogo logoURL={game.opponentLogoURL} teamName={game.opponentName} />
          <div>
            <span className="text-gray-900">
              {locationPrefix}{game.opponentName}
            </span>
            {game.opponentRecord && (
              <span className="text-gray-400 ml-1">({game.opponentRecord})</span>
            )}
            {game.venue && (
              <div className="text-gray-400 text-xs">{game.venue}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-sm">
        {game.isWin !== null && game.isWin !== undefined && game.teamScore !== null && game.teamScore !== undefined && game.opponentScore !== null && game.opponentScore !== undefined ? (
          <span className={game.isWin ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {game.isWin ? 'W' : 'L'} {game.teamScore}-{game.opponentScore}
          </span>
        ) : null}
      </td>
    </tr>
  );
}
