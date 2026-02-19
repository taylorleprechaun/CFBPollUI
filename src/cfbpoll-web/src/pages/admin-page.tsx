import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useSeason } from '../contexts/season-context';
import { useWeeks } from '../hooks/use-weeks';
import {
  calculateRankings,
  deleteSnapshot,
  downloadExport,
  fetchPersistedWeeks,
  publishSnapshot,
} from '../services/admin-api';
import { RankingsTable } from '../components/rankings/rankings-table';
import { ErrorAlert } from '../components/error';
import type { CalculateResponse, PersistedWeek } from '../schemas/admin';
import type { RankingsResponse } from '../types';

interface ActionFeedback {
  key: string;
  type: 'success' | 'error';
  message?: string;
}

function SuccessCheckmark({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <svg
      className="inline-block w-5 h-5 text-green-600 animate-[fadeInOut_2s_ease-in-out_forwards]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-label="Success"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function AdminPage() {
  useEffect(() => {
    document.title = 'Admin - CFB Poll';
  }, []);

  const { isAuthenticated, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const {
    seasons,
    seasonsLoading,
    selectedSeason,
    setSelectedSeason,
  } = useSeason();

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [calculatedResult, setCalculatedResult] = useState<CalculateResponse | null>(null);
  const [persistedWeeks, setPersistedWeeks] = useState<PersistedWeek[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [collapsedSeasons, setCollapsedSeasons] = useState<Set<number>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  const { data: weeksData, isLoading: weeksLoading } = useWeeks(selectedSeason);

  useEffect(() => {
    if (weeksData?.weeks?.length && selectedWeek === null) {
      const lastWeek = weeksData.weeks[weeksData.weeks.length - 1];
      setSelectedWeek(lastWeek.weekNumber);
    }
  }, [weeksData, selectedWeek]);

  useEffect(() => {
    if (token) {
      loadPersistedWeeks(true);
    }
  }, [token]);

  const loadPersistedWeeks = async (collapseAll = false) => {
    if (!token) return;
    try {
      const weeks = await fetchPersistedWeeks(token);
      setPersistedWeeks(weeks);
      if (collapseAll) {
        setCollapsedSeasons(new Set(weeks.map((w) => w.season)));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load persisted weeks'));
    }
  };

  const handleCalculate = async () => {
    if (!token || selectedSeason === null || selectedWeek === null) return;
    setError(null);
    setIsCalculating(true);
    setCalculatedResult(null);

    try {
      const result = await calculateRankings(token, selectedSeason, selectedWeek);
      setCalculatedResult(result);
      setPreviewExpanded(true);
      await loadPersistedWeeks();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Calculation failed'));
    } finally {
      setIsCalculating(false);
    }
  };

  const clearFeedback = useCallback(() => setActionFeedback(null), []);

  const handlePublish = async (season: number, week: number, source: 'preview' | 'snapshot') => {
    if (!token) return;
    setError(null);
    setActionFeedback(null);
    const feedbackKey = `${source}-publish-${season}-${week}`;
    setActionInProgress(feedbackKey);

    try {
      await publishSnapshot(token, season, week);
      await loadPersistedWeeks();
      setActionFeedback({ key: feedbackKey, type: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publish failed';
      setActionFeedback({ key: feedbackKey, type: 'error', message });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (season: number, week: number, published: boolean) => {
    if (!token) return;

    if (published) {
      const confirmed = window.confirm(
        `This snapshot (${season} Week ${week}) is published and visible to users. Are you sure you want to delete it?`
      );
      if (!confirmed) return;
    }

    setError(null);
    setActionInProgress(`delete-${season}-${week}`);

    try {
      await deleteSnapshot(token, season, week);
      await loadPersistedWeeks();
      if (calculatedResult?.rankings.season === season && calculatedResult?.rankings.week === week) {
        setCalculatedResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Delete failed'));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleExport = async (season: number, week: number) => {
    if (!token) return;
    setError(null);
    setActionInProgress(`export-${season}-${week}`);

    try {
      await downloadExport(token, season, week);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setActionInProgress(null);
    }
  };

  const toggleSeason = (season: number) => {
    setCollapsedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(season)) {
        next.delete(season);
      } else {
        next.add(season);
      }
      return next;
    });
  };

  const previewRankings: RankingsResponse | null = useMemo(() => {
    if (!calculatedResult) return null;
    return calculatedResult.rankings;
  }, [calculatedResult]);

  const groupedPersistedWeeks = useMemo(() => {
    const sorted = [...persistedWeeks].sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      return b.week - a.week;
    });

    const groups: { season: number; weeks: PersistedWeek[] }[] = [];
    for (const pw of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.season === pw.season) {
        last.weeks.push(pw);
      } else {
        groups.push({ season: pw.season, weeks: [pw] });
      }
    }
    return groups;
  }, [persistedWeeks]);

  if (!isAuthenticated) return null;

  const previewPublishKey = previewRankings
    ? `preview-publish-${previewRankings.season}-${previewRankings.week}`
    : null;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.5); }
          15% { opacity: 1; transform: scale(1); }
          70% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5); }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Log Out
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={() => setError(null)} />}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculate Rankings</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="admin-season" className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select
              id="admin-season"
              value={selectedSeason ?? ''}
              onChange={(e) => {
                setSelectedSeason(Number(e.target.value));
                setSelectedWeek(null);
              }}
              disabled={seasonsLoading}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="admin-week" className="block text-sm font-medium text-gray-700 mb-1">
              Week
            </label>
            <select
              id="admin-week"
              value={selectedWeek ?? ''}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              disabled={weeksLoading}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {weeksData?.weeks.map((w) => (
                <option key={w.weekNumber} value={w.weekNumber}>{w.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCalculate}
            disabled={isCalculating || selectedSeason === null || selectedWeek === null}
            className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
      </div>

      {previewRankings && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700"
              >
                <span className="text-sm">{previewExpanded ? '\u25BC' : '\u25B6'}</span>
                Preview: {previewRankings.season} Week {previewRankings.week}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(previewRankings.season, previewRankings.week)}
                  disabled={actionInProgress !== null}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Download Excel
                </button>
                <button
                  onClick={() => handlePublish(previewRankings.season, previewRankings.week, 'preview')}
                  disabled={actionInProgress !== null}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  Publish
                </button>
                {actionFeedback?.key === previewPublishKey && actionFeedback.type === 'success' && (
                  <SuccessCheckmark onDone={clearFeedback} />
                )}
                {actionFeedback?.key === previewPublishKey && actionFeedback.type === 'error' && (
                  <span className="text-red-600 text-sm">{actionFeedback.message}</span>
                )}
              </div>
            </div>
            {calculatedResult && !calculatedResult.persisted && (
              <p className="text-amber-600 text-sm mt-2">
                Warning: Rankings were not persisted to the database.
              </p>
            )}
          </div>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: previewExpanded ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <RankingsTable
                rankings={previewRankings.rankings}
                isLoading={false}
                selectedConference={null}
                selectedSeason={previewRankings.season}
                selectedWeek={previewRankings.week}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Persisted Snapshots</h2>
          {groupedPersistedWeeks.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCollapsedSeasons(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Expand All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setCollapsedSeasons(new Set(groupedPersistedWeeks.map((g) => g.season)))}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
        {groupedPersistedWeeks.length === 0 ? (
          <p className="text-gray-500">No persisted snapshots found.</p>
        ) : (
          <div className="space-y-2">
            {groupedPersistedWeeks.map((group) => {
              const isCollapsed = collapsedSeasons.has(group.season);
              return (
                <div key={group.season} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSeason(group.season)}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium text-gray-900"
                  >
                    <span className="text-xs">{isCollapsed ? '\u25B6' : '\u25BC'}</span>
                    <span>{group.season} Season</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({group.weeks.length} snapshot{group.weeks.length !== 1 ? 's' : ''})
                    </span>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }}
                  >
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.weeks.map((pw) => {
                            const publishKey = `snapshot-publish-${pw.season}-${pw.week}`;
                            return (
                              <tr key={`${pw.season}-${pw.week}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pw.week}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    pw.published
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {pw.published ? 'Published' : 'Draft'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(pw.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center gap-2">
                                    {!pw.published && (
                                      <button
                                        onClick={() => handlePublish(pw.season, pw.week, 'snapshot')}
                                        disabled={actionInProgress !== null}
                                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                      >
                                        Publish
                                      </button>
                                    )}
                                    {actionFeedback?.key === publishKey && actionFeedback.type === 'success' && (
                                      <SuccessCheckmark onDone={clearFeedback} />
                                    )}
                                    {actionFeedback?.key === publishKey && actionFeedback.type === 'error' && (
                                      <span className="text-red-600 text-sm">{actionFeedback.message}</span>
                                    )}
                                    <button
                                      onClick={() => handleExport(pw.season, pw.week)}
                                      disabled={actionInProgress !== null}
                                      className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                    >
                                      Export
                                    </button>
                                    <button
                                      onClick={() => handleDelete(pw.season, pw.week, pw.published)}
                                      disabled={actionInProgress !== null}
                                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
