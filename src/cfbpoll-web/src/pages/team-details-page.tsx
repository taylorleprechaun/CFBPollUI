import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorAlert } from '../components/error';
import { SeasonSelector } from '../components/rankings/season-selector';
import { RecordRow, ScheduleRow } from '../components/team-details';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useSeason } from '../contexts/season-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import { useRankings } from '../hooks/use-rankings';
import { useTeamDetail } from '../hooks/use-team-detail';
import { useWeekSelection } from '../hooks/use-week-selection';
import { useWeeks } from '../hooks/use-weeks';
import { getContrastTextColor } from '../lib/color-utils';
import type { ScheduleGame } from '../types';

const filterHome = (g: ScheduleGame) => g.isHome && !g.neutralSite && g.isWin != null;
const filterAway = (g: ScheduleGame) => !g.isHome && !g.neutralSite && g.isWin != null;
const filterNeutral = (g: ScheduleGame) => g.neutralSite && g.isWin != null;
const filterVsRank1To10 = (g: ScheduleGame) => g.opponentRank != null && g.opponentRank >= 1 && g.opponentRank <= 10 && g.isWin != null;
const filterVsRank11To25 = (g: ScheduleGame) => g.opponentRank != null && g.opponentRank >= 11 && g.opponentRank <= 25 && g.isWin != null;
const filterVsRank26To50 = (g: ScheduleGame) => g.opponentRank != null && g.opponentRank >= 26 && g.opponentRank <= 50 && g.isWin != null;
const filterVsRank51To100 = (g: ScheduleGame) => g.opponentRank != null && g.opponentRank >= 51 && g.opponentRank <= 100 && g.isWin != null;
const filterVsRank101Plus = (g: ScheduleGame) => (g.opponentRank == null || g.opponentRank >= 101) && g.isWin != null;

export function TeamDetailsPage() {
  useDocumentTitle('Taylor Steinberg - Team Details');

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTeam = searchParams.get('team') || null;
  const initialSeasonApplied = useRef(false);

  const {
    seasons,
    seasonsLoading,
    seasonsError,
    refetchSeasons,
    selectedSeason,
    setSelectedSeason,
  } = useSeason();

  useEffect(() => {
    if (initialSeasonApplied.current) return;
    const param = searchParams.get('season');
    if (param) {
      const parsed = Number(param);
      if (!Number.isNaN(parsed) && parsed !== selectedSeason) {
        setSelectedSeason(parsed);
      }
    }
    initialSeasonApplied.current = true;
  }, [searchParams, selectedSeason, setSelectedSeason]);

  const {
    data: weeksData,
    error: weeksError,
    refetch: refetchWeeks,
  } = useWeeks(selectedSeason);

  const { selectedWeek, setSelectedWeek } = useWeekSelection(weeksData?.weeks);

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

  const teamOptions = useMemo(() => {
    if (!rankingsData?.rankings) return [];
    return [...rankingsData.rankings]
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [rankingsData?.rankings]);

  const fbsTeamNames = useMemo(() => {
    if (!rankingsData?.rankings) return new Set<string>();
    return new Set(rankingsData.rankings.map((t) => t.teamName));
  }, [rankingsData?.rankings]);

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    setSelectedWeek(null);
    const params: Record<string, string> = { season: String(season) };
    if (selectedTeam) params.team = selectedTeam;
    setSearchParams(params, { replace: true });
  };

  const handleTeamChange = useCallback((teamName: string) => {
    const params: Record<string, string> = {};
    if (selectedSeason !== null) params.season = String(selectedSeason);
    if (teamName) params.team = teamName;
    setSearchParams(params);
  }, [selectedSeason, setSearchParams]);

  useEffect(() => {
    if (selectedTeam && fbsTeamNames.size > 0 && !fbsTeamNames.has(selectedTeam)) {
      handleTeamChange('');
    }
  }, [fbsTeamNames, selectedTeam, handleTeamChange]);

  const error = seasonsError || weeksError || rankingsError || teamDetailError;
  const handleRetry = () => {
    if (seasonsError) refetchSeasons();
    if (weeksError) refetchWeeks();
    if (rankingsError) refetchRankings();
    if (teamDetailError) refetchTeamDetail();
  };

  const [logoErrorTeam, setLogoErrorTeam] = useState<string | null>(null);
  const logoError = logoErrorTeam === selectedTeam;

  const handleLogoError = useCallback(
    () => setLogoErrorTeam(selectedTeam),
    [selectedTeam]
  );

  const locationCardRef = useRef<HTMLDivElement>(null);
  const rankCardRef = useRef<HTMLDivElement>(null);

  const bgColor = teamDetail?.color || '#6B7280';
  const textColor = getContrastTextColor(bgColor);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Details</h1>
        <div className="flex flex-wrap gap-4">
          <SeasonSelector
            seasons={seasons}
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

      {teamDetailLoading && <LoadingSpinner />}

      {teamDetail && (
        <>
          <div
            className="shadow rounded-lg p-6"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {!logoError && (
                  <img
                    src={teamDetail.logoURL}
                    alt={`${teamDetail.teamName} logo`}
                    className="w-16 h-16 object-contain rounded-lg bg-white p-1"
                    onError={handleLogoError}
                  />
                )}
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
                  {teamDetail.schedule.map((game) => (
                    <ScheduleRow
                      key={`${game.week}-${game.seasonType}-${game.opponentName}`}
                      fbsTeamNames={fbsTeamNames}
                      game={game}
                      selectedSeason={selectedSeason}
                      selectedWeek={selectedWeek}
                      onTeamClick={handleTeamChange}
                    />
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
            <div ref={locationCardRef} className="bg-white shadow rounded-lg overflow-hidden">
              <h3
                className="text-lg font-semibold p-4 rounded-t-lg"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                Record by Location
              </h3>
              <div className="space-y-2 p-4">
                <RecordRow label="Home" record={teamDetail.details.home} schedule={teamDetail.schedule} filter={filterHome} containerRef={locationCardRef} />
                <RecordRow label="Away" record={teamDetail.details.away} schedule={teamDetail.schedule} filter={filterAway} containerRef={locationCardRef} />
                <RecordRow label="Neutral" record={teamDetail.details.neutral} schedule={teamDetail.schedule} filter={filterNeutral} containerRef={locationCardRef} />
              </div>
            </div>
            <div ref={rankCardRef} className="bg-white shadow rounded-lg overflow-hidden">
              <h3
                className="text-lg font-semibold p-4 rounded-t-lg"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                Record vs Opponent Rank
              </h3>
              <div className="space-y-2 p-4">
                <RecordRow label="vs #1-10" record={teamDetail.details.vsRank1To10} schedule={teamDetail.schedule} filter={filterVsRank1To10} containerRef={rankCardRef} />
                <RecordRow label="vs #11-25" record={teamDetail.details.vsRank11To25} schedule={teamDetail.schedule} filter={filterVsRank11To25} containerRef={rankCardRef} />
                <RecordRow label="vs #26-50" record={teamDetail.details.vsRank26To50} schedule={teamDetail.schedule} filter={filterVsRank26To50} containerRef={rankCardRef} />
                <RecordRow label="vs #51-100" record={teamDetail.details.vsRank51To100} schedule={teamDetail.schedule} filter={filterVsRank51To100} containerRef={rankCardRef} />
                <RecordRow label="vs #101+" record={teamDetail.details.vsRank101Plus} schedule={teamDetail.schedule} filter={filterVsRank101Plus} containerRef={rankCardRef} />
              </div>
            </div>
          </div>
        </>
      )}

      {!teamDetailLoading && !teamDetail && selectedTeam && !error && (
        <div className="text-center py-12 text-gray-500">
          No details available for the selected team.
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
