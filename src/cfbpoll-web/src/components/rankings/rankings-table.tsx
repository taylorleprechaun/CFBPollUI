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
              {team.conferenceRank} <span className="text-gray-500">({info.getValue()})</span>
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
              className="font-medium hover:text-blue-600 hover:underline"
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
              {team.conferenceSosRank} <span className="text-gray-500">({info.getValue()})</span>
            </>
          );
        }
        return info.getValue();
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
