import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { RankedTeam } from '../../types';
import { SortableTable } from '../ui/sortable-table';
import { TeamLogo } from './team-logo';

interface RankingsTableProps {
  rankings: RankedTeam[];
  isLoading: boolean;
  selectedConference: string | null;
  selectedSeason: number | null;
  selectedWeek: number | null;
}

interface DisplayRankedTeam extends RankedTeam {
  conferenceRank: number | null;
  conferenceSosRank: number | null;
}

const DELTA_ARROW_PATH = "M11.96 24.231l8.344-8.49-0.893-0.916-6.801 6.897v-18.677h-1.302v18.677l-6.801-6.897-0.917 0.916z";

const columnHelper = createColumnHelper<DisplayRankedTeam>();

export function RankingsTable({ rankings, isLoading, selectedConference, selectedSeason, selectedWeek }: RankingsTableProps) {
  const displayData: DisplayRankedTeam[] = useMemo(() => {
    if (!selectedConference) {
      return rankings.map((team) => ({
        ...team,
        conferenceRank: null,
        conferenceSosRank: null,
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
    }));
  }, [rankings, selectedConference]);

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
        const teamDetailUrl = selectedSeason && selectedWeek
          ? `/team-details?team=${encodeURIComponent(info.getValue())}&season=${selectedSeason}&week=${selectedWeek}`
          : `/team-details?team=${encodeURIComponent(info.getValue())}`;
        return (
          <div className="flex items-center space-x-3">
            <TeamLogo logoURL={team.logoURL} teamName={info.getValue()} />
            <Link
              to={teamDetailUrl}
              className="font-medium hover:text-accent hover:underline"
            >
              {info.getValue()}
            </Link>
          </div>
        );
      },
    }),
    columnHelper.accessor('record', {
      header: 'Record',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: (info) => info.getValue().toFixed(4),
    }),
    columnHelper.accessor('weightedSOS', {
      header: 'Weighted SOS',
      cell: (info) => info.getValue().toFixed(4),
    }),
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
  ], [selectedSeason, selectedWeek]);

  return (
    <SortableTable
      columns={columns}
      data={displayData}
      emptyMessage="Select a season and week to view rankings."
      isLoading={isLoading}
    />
  );
}
