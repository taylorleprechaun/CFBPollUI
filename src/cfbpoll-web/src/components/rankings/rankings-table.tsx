import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useState, useCallback, useMemo } from 'react';
import type { RankedTeam } from '../../types';
import { TeamDetailsPopup } from './team-details-popup';
import { TeamLogo } from './team-logo';

interface RankingsTableProps {
  rankings: RankedTeam[];
  isLoading: boolean;
  selectedConference: string | null;
}

interface DisplayRankedTeam extends RankedTeam {
  conferenceRank: number | null;
  conferenceSosRank: number | null;
}

interface HoverState {
  team: RankedTeam;
  position: { x: number; y: number };
}

export function RankingsTable({ rankings, isLoading, selectedConference }: RankingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

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

    return filteredTeams.map((team) => ({
      ...team,
      conferenceRank: sortedByRank.findIndex((t) => t.teamName === team.teamName) + 1,
      conferenceSosRank: sortedBySos.findIndex((t) => t.teamName === team.teamName) + 1,
    }));
  }, [rankings, selectedConference]);

  const handleMouseEnter = useCallback((team: RankedTeam, event: React.MouseEvent) => {
    setHoverState({
      team,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverState(null);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (hoverState) {
      setHoverState((prev) =>
        prev ? { ...prev, position: { x: event.clientX, y: event.clientY } } : null
      );
    }
  }, [hoverState]);

  const columnHelper = useMemo(() => createColumnHelper<DisplayRankedTeam>(), []);

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
        return (
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onMouseEnter={(e) => handleMouseEnter(team, e)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          >
            <TeamLogo logoURL={team.logoURL} teamName={info.getValue()} />
            <span className="font-medium hover:text-blue-600 hover:underline">
              {info.getValue()}
            </span>
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
  ], [columnHelper, handleMouseEnter, handleMouseLeave, handleMouseMove]);

  const table = useReactTable({
    data: displayData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Select a season and week to view rankings.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    <span className="text-gray-400">
                      {{
                        asc: ' ^',
                        desc: ' v',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {hoverState && (
        <TeamDetailsPopup team={hoverState.team} position={hoverState.position} />
      )}
    </div>
  );
}
