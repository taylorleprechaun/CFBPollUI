import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorAlert } from '../components/error';
import { SeasonSelector } from '../components/rankings/season-selector';
import { TeamLogo } from '../components/rankings/team-logo';
import { useDefaultSeasonWeek } from '../hooks/use-default-season-week';
import { useRankings } from '../hooks/use-rankings';
import { useSeasons } from '../hooks/use-seasons';
import { useTeamDetail } from '../hooks/use-team-detail';
import { useWeeks } from '../hooks/use-weeks';
import { getContrastTextColor } from '../lib/color-utils';
import type { TeamRecord, ScheduleGame } from '../types';

export function TeamDetailsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSeason = useMemo(() => {
    const param = searchParams.get('season');
    if (!param) return null;
    const parsed = Number(param);
    return Number.isNaN(parsed) ? null : parsed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const seasonRef = useRef<number | null>(initialSeason);
  const {
    data: weeksData,
    error: weeksError,
    refetch: refetchWeeks,
  } = useWeeks(seasonRef.current);

  const {
    season: selectedSeason,
    setSeason: setSelectedSeason,
    week: selectedWeek,
    resetWeek,
  } = useDefaultSeasonWeek(seasonsData, weeksData, { initialSeason });
  seasonRef.current = selectedSeason;

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

  const navigate = useNavigate();
  const isNavigating = useRef(false);

  const buildPath = useCallback((season: number | null, team: string | null) => {
    const params = new URLSearchParams();
    if (season !== null) params.set('season', String(season));
    if (team) params.set('team', team);
    const qs = params.toString();
    return qs ? `/team-details?${qs}` : '/team-details';
  }, []);

  // Sync URL → state for browser back/forward
  useEffect(() => {
    if (isNavigating.current) {
      isNavigating.current = false;
      return;
    }
    const teamFromUrl = searchParams.get('team') || null;
    if (teamFromUrl !== selectedTeam) {
      setSelectedTeam(teamFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const teamOptions = useMemo(() => {
    if (!rankingsData?.rankings) return [];
    return [...rankingsData.rankings]
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [rankingsData]);

  const fbsTeamNames = useMemo(() => {
    if (!rankingsData?.rankings) return new Set<string>();
    return new Set(rankingsData.rankings.map((t) => t.teamName));
  }, [rankingsData]);

  const handleSeasonChange = (season: number) => {
    isNavigating.current = true;
    setSelectedSeason(season);
    resetWeek();
    setSelectedTeam(null);
    navigate(buildPath(season, null), { replace: true });
  };

  const handleTeamChange = (teamName: string) => {
    const team = teamName || null;
    isNavigating.current = true;
    setSelectedTeam(team);
    navigate(buildPath(selectedSeason, team));
  };

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
                <RecordRow
                  label="Home"
                  record={teamDetail.details.home}
                  schedule={teamDetail.schedule}
                  filter={(g) => g.isHome && !g.neutralSite && g.isWin !== null && g.isWin !== undefined}
                  containerRef={locationCardRef}
                />
                <RecordRow
                  label="Away"
                  record={teamDetail.details.away}
                  schedule={teamDetail.schedule}
                  filter={(g) => !g.isHome && !g.neutralSite && g.isWin !== null && g.isWin !== undefined}
                  containerRef={locationCardRef}
                />
                <RecordRow
                  label="Neutral"
                  record={teamDetail.details.neutral}
                  schedule={teamDetail.schedule}
                  filter={(g) => g.neutralSite && g.isWin !== null && g.isWin !== undefined}
                  containerRef={locationCardRef}
                />
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
                <RecordRow
                  label="vs #1-10"
                  record={teamDetail.details.vsRank1To10}
                  schedule={teamDetail.schedule}
                  filter={(g) => g.opponentRank != null && g.opponentRank >= 1 && g.opponentRank <= 10 && g.isWin !== null && g.isWin !== undefined}
                  containerRef={rankCardRef}
                />
                <RecordRow
                  label="vs #11-25"
                  record={teamDetail.details.vsRank11To25}
                  schedule={teamDetail.schedule}
                  filter={(g) => g.opponentRank != null && g.opponentRank >= 11 && g.opponentRank <= 25 && g.isWin !== null && g.isWin !== undefined}
                  containerRef={rankCardRef}
                />
                <RecordRow
                  label="vs #26-50"
                  record={teamDetail.details.vsRank26To50}
                  schedule={teamDetail.schedule}
                  filter={(g) => g.opponentRank != null && g.opponentRank >= 26 && g.opponentRank <= 50 && g.isWin !== null && g.isWin !== undefined}
                  containerRef={rankCardRef}
                />
                <RecordRow
                  label="vs #51-100"
                  record={teamDetail.details.vsRank51To100}
                  schedule={teamDetail.schedule}
                  filter={(g) => g.opponentRank != null && g.opponentRank >= 51 && g.opponentRank <= 100 && g.isWin !== null && g.isWin !== undefined}
                  containerRef={rankCardRef}
                />
                <RecordRow
                  label="vs #101+"
                  record={teamDetail.details.vsRank101Plus}
                  schedule={teamDetail.schedule}
                  filter={(g) => (g.opponentRank == null || g.opponentRank >= 101) && g.isWin !== null && g.isWin !== undefined}
                  containerRef={rankCardRef}
                />
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

function RecordRow({
  label,
  record,
  schedule,
  filter,
  containerRef,
}: {
  label: string;
  record: TeamRecord;
  schedule: ScheduleGame[];
  filter: (g: ScheduleGame) => boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasGames = record.wins > 0 || record.losses > 0;
  const matchingGames = useMemo(() => schedule.filter(filter), [schedule, filter]);

  useEffect(() => {
    if (expanded && containerRef.current?.scrollIntoView) {
      const el = containerRef.current;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [expanded, containerRef]);

  return (
    <div>
      <div
        className={`flex justify-between text-sm${hasGames ? ' cursor-pointer' : ''}`}
        onClick={() => hasGames && setExpanded(!expanded)}
        role={hasGames ? 'button' : undefined}
        aria-expanded={hasGames ? expanded : undefined}
      >
        <span className="text-gray-600">
          {hasGames && (
            <span className="inline-block w-4 text-gray-400" aria-label={expanded ? 'collapse' : 'expand'}>
              {expanded ? '▾' : '▸'}
            </span>
          )}
          <span>{label}</span>
        </span>
        <span className="font-medium">{hasGames ? `${record.wins}-${record.losses}` : '-'}</span>
      </div>
      {expanded && matchingGames.length > 0 && (
        <div className="ml-4 mt-1 pb-3 space-y-0.5 max-w-sm">
          {matchingGames.map((g) => (
            <div
              key={`${g.week}-${g.seasonType}-${g.opponentName}`}
              className="text-sm flex items-baseline"
            >
              <span className="w-10 text-right text-gray-400 shrink-0">
                {g.opponentRank != null ? `#${g.opponentRank}` : ''}
              </span>
              <span className="ml-2 flex-1 text-gray-600 truncate">
                {g.opponentName}
              </span>
              {g.isWin !== null && g.isWin !== undefined && g.teamScore != null && g.opponentScore != null && (
                <span className={`ml-2 shrink-0 ${g.isWin ? 'text-green-600' : 'text-red-600'}`}>
                  {g.isWin ? 'W' : 'L'} {g.teamScore}-{g.opponentScore}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  fbsTeamNames,
  game,
  selectedSeason,
  selectedWeek,
  onTeamClick,
}: {
  fbsTeamNames: Set<string>;
  game: ScheduleGame;
  selectedSeason: number | null;
  selectedWeek: number | null;
  onTeamClick: (teamName: string) => void;
}) {
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
    ? 'vs '
    : game.isHome
      ? ''
      : 'at ';

  const weekLabel = game.seasonType === 'postseason' ? 'Post' : `${game.week ?? ''}`;

  const showRank = game.opponentRank != null && game.opponentRank >= 1 && game.opponentRank <= 25;

  const isFbs = fbsTeamNames.has(game.opponentName);
  const teamDetailUrl = `/team-details?team=${encodeURIComponent(game.opponentName)}${selectedSeason != null ? `&season=${selectedSeason}` : ''}${selectedWeek != null ? `&week=${selectedWeek}` : ''}`;

  const opponentLabel = (
    <span className="text-gray-900">
      {locationPrefix}
      {showRank && <span className="text-xs">#{game.opponentRank} </span>}
      {game.opponentName}
    </span>
  );

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
            {isFbs ? (
              <Link
                to={teamDetailUrl}
                className="hover:text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  onTeamClick(game.opponentName);
                }}
              >
                {opponentLabel}
              </Link>
            ) : (
              opponentLabel
            )}
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
