import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import type { RankedTeam, ScoreOverrideDisclosure } from '../../types';

import { calculateZScores } from '../../lib/stats-utils';
import { InfoIcon } from '../ui/icons';
import { SortableTable } from '../ui/sortable-table';
import { ScoreOverrideModal } from './score-override-modal';
import { TeamLogo } from './team-logo';

interface RankingsTableProps {
  isLoading: boolean;
  rankings: RankedTeam[];
  scoreOverrides?: ScoreOverrideDisclosure[];
  selectedConference: string | null;
  selectedSeason: number | null;
  showRatingZScore?: boolean;
  showWeightedSOS?: boolean;
}

interface DisplayRankedTeam extends RankedTeam {
  conferenceRank: number | null;
  conferenceSosRank: number | null;
  ratingZScore?: number;
}

const DELTA_ARROW_PATH = "M11.96 24.231l8.344-8.49-0.893-0.916-6.801 6.897v-18.677h-1.302v18.677l-6.801-6.897-0.917 0.916z";

const columnHelper = createColumnHelper<DisplayRankedTeam>();

export function RankingsTable({
  rankings,
  isLoading,
  scoreOverrides = [],
  selectedConference,
  selectedSeason,
  showRatingZScore = false,
  showWeightedSOS = false,
}: RankingsTableProps) {
  const [modalOverrides, setModalOverrides] = useState<ScoreOverrideDisclosure[] | null>(null);

  const overridesByTeamName = useMemo(() => {
    const map = new Map<string, ScoreOverrideDisclosure[]>();

    for (const override of scoreOverrides) {
      for (const teamName of [override.awayTeam, override.homeTeam]) {
        const existing = map.get(teamName);
        if (existing) {
          existing.push(override);
        } else {
          map.set(teamName, [override]);
        }
      }
    }

    return map;
  }, [scoreOverrides]);

  const displayData: DisplayRankedTeam[] = useMemo(() => {
    const zScores = showRatingZScore ? calculateZScores(rankings.map((t) => t.rating)) : null;
    const zScoreMap = zScores
      ? new Map(rankings.map((team, i) => [team.teamName, zScores[i]]))
      : null;

    if (!selectedConference) {
      return rankings.map((team) => ({
        ...team,
        conferenceRank: null,
        conferenceSosRank: null,
        ratingZScore: zScoreMap?.get(team.teamName),
      }));
    }

    const filteredTeams = rankings.filter(
      (team) => team.conference === selectedConference
    );

    const sortedByRank = [...filteredTeams].sort((a, b) => a.rank - b.rank);
    const sortedBySos = [...filteredTeams].sort((a, b) => a.sosRanking - b.sosRanking);
    const rankMap = new Map(sortedByRank.map((t, i) => [t.teamName, i + 1]));
    const sosMap = new Map(sortedBySos.map((t, i) => [t.teamName, i + 1]));

    return filteredTeams.map((team) => ({
      ...team,
      conferenceRank: rankMap.get(team.teamName) ?? null,
      conferenceSosRank: sosMap.get(team.teamName) ?? null,
      ratingZScore: zScoreMap?.get(team.teamName),
    }));
  }, [rankings, selectedConference, showRatingZScore]);

  const columns = useMemo(() => [
    columnHelper.accessor('rank', {
      header: 'Rank',
      cell: (info) => {
        const team = info.row.original;
        if (team.conferenceRank !== null) {
          return (
            <>
              {team.conferenceRank} <span className="text-text-muted">({info.getValue()})</span>
            </>
          );
        }
        return info.getValue();
      },
    }),
    columnHelper.accessor('teamName', {
      header: 'Team',
      cell: (info) => {
        const team = info.row.original;
        const teamDetailUrl = selectedSeason
          ? `/team-details?team=${encodeURIComponent(info.getValue())}&season=${selectedSeason}`
          : `/team-details?team=${encodeURIComponent(info.getValue())}`;
        const teamOverrides = overridesByTeamName.get(info.getValue());
        return (
          <div className="flex items-center space-x-3">
            <TeamLogo logoURL={team.logoURL} teamName={info.getValue()} />
            <Link
              to={teamDetailUrl}
              className="font-medium hover:text-accent hover:underline"
            >
              {info.getValue()}
            </Link>
            {teamOverrides && (
              <button
                type="button"
                aria-label={`Show manually corrected scores for ${info.getValue()}`}
                onClick={() => setModalOverrides(teamOverrides)}
                className="shrink-0 rounded-full p-1 text-amber-600 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 [&>svg]:h-5 [&>svg]:w-5"
              >
                <InfoIcon />
              </button>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('record', {
      header: 'Record',
      cell: (info) => info.getValue(),
    }),
    showRatingZScore
      ? columnHelper.accessor('ratingZScore', {
          header: 'Rating (Z-Score)',
          cell: (info) => {
            const value = info.getValue();
            const team = info.row.original;
            if (value === undefined) return team.rating.toFixed(4);
            return (
              <>
                <span>{team.rating.toFixed(4)}</span>
                <span className="text-text-muted text-xs ml-1">({value.toFixed(2)})</span>
              </>
            );
          },
        })
      : columnHelper.accessor('rating', {
          header: 'Rating',
          cell: (info) => info.getValue().toFixed(4),
        }),
    ...(showWeightedSOS
      ? [
          columnHelper.accessor('weightedSOS', {
            header: 'Weighted SOS',
            cell: (info) => info.getValue().toFixed(4),
          }),
        ]
      : []),
    columnHelper.accessor('sosRanking', {
      header: 'SOS Rank',
      cell: (info) => {
        const team = info.row.original;
        if (team.conferenceSosRank !== null) {
          return (
            <>
              {team.conferenceSosRank} <span className="text-text-muted">({info.getValue()})</span>
            </>
          );
        }
        return info.getValue();
      },
    }),
    columnHelper.accessor('rankDelta', {
      header: '\u0394',
      cell: (info) => {
        const value = info.getValue();
        if (value !== null && value !== undefined && value > 0) {
          return (
            <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <svg width="12" height="14" viewBox="0 0 24 27" aria-hidden="true">
                <path d={DELTA_ARROW_PATH} fill="currentColor" transform="rotate(180 12 13.5)" />
              </svg>
              {value}
            </span>
          );
        }
        if (value !== null && value !== undefined && value < 0) {
          return (
            <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400">
              <svg width="12" height="14" viewBox="0 0 24 27" aria-hidden="true">
                <path d={DELTA_ARROW_PATH} fill="currentColor" />
              </svg>
              {Math.abs(value)}
            </span>
          );
        }
        return <span className="text-text-muted">-</span>;
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.rankDelta ?? 0;
        const b = rowB.original.rankDelta ?? 0;
        return a - b;
      },
    }),
  ], [overridesByTeamName, selectedSeason, showRatingZScore, showWeightedSOS]);

  return (
    <>
      <SortableTable
        columns={columns}
        data={displayData}
        emptyMessage="Select a season and week to view rankings."
        isLoading={isLoading}
      />
      {modalOverrides && (
        <ScoreOverrideModal onClose={() => setModalOverrides(null)} scoreOverrides={modalOverrides} />
      )}
    </>
  );
}
