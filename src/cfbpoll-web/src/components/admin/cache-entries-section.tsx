import type { CacheEntryFamilyGroup } from '../../lib/group-cache-entries';

import { formatBytes } from '../../lib/format-bytes';
import { BUTTON_DANGER_GHOST } from '../ui/button-styles';
import { CollapsibleContent } from '../ui/collapsible-content';
import { CollapsibleTrigger } from '../ui/collapsible-trigger';
import { EmptyState } from '../ui/empty-state';
import { TableSkeleton } from '../ui/table-skeleton';

const NEVER_EXPIRES_YEAR = 9999;
const COLUMN_COUNT = 6;

interface CacheEntriesSectionProps {
  expandedFamilies: Set<string>;
  groups: CacheEntryFamilyGroup[];
  isDeleting: boolean;
  isLoading: boolean;
  onDeleteOne: (cacheKey: string) => void;
  onToggleFamily: (family: string) => void;
  onToggleSelect: (cacheKey: string) => void;
  onToggleSelectFamily: (family: string, cacheKeys: string[]) => void;
  selectedKeys: Set<string>;
}

export function CacheEntriesSection({
  expandedFamilies,
  groups,
  isDeleting,
  isLoading,
  onDeleteOne,
  onToggleFamily,
  onToggleSelect,
  onToggleSelectFamily,
  selectedKeys,
}: CacheEntriesSectionProps) {
  if (isLoading) {
    return <TableSkeleton columns={COLUMN_COUNT} />;
  }

  if (groups.length === 0) {
    return <EmptyState message="No cached entries found." />;
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const isOpen = expandedFamilies.has(group.family);
        const contentId = `cache-family-${group.family}`;
        const groupKeys = group.entries.map((entry) => entry.cacheKey);
        const selectedInGroup = groupKeys.filter((key) => selectedKeys.has(key)).length;

        return (
          <div key={group.family} className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-alt hover:bg-surface-elevated">
              <input
                type="checkbox"
                aria-label={`Select all ${group.family} entries`}
                checked={selectedInGroup === groupKeys.length}
                ref={(el) => {
                  if (el) el.indeterminate = selectedInGroup > 0 && selectedInGroup < groupKeys.length;
                }}
                onChange={() => onToggleSelectFamily(group.family, groupKeys)}
              />
              <CollapsibleTrigger
                contentId={contentId}
                isOpen={isOpen}
                onToggle={() => onToggleFamily(group.family)}
                className="flex-1 flex items-center gap-2 text-left font-medium text-text-primary"
              >
                <span>{group.family}</span>
                <span className="text-sm font-normal text-text-muted">
                  ({group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}, {formatBytes(group.totalSizeBytes)})
                </span>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent id={contentId} isOpen={isOpen}>
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-alt border-b-2 border-border">
                  <tr>
                    <th className="px-4 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Season</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Cached</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {group.entries.map((entry) => {
                    const expiresAt = new Date(entry.expiresAt);
                    const neverExpires = expiresAt.getFullYear() >= NEVER_EXPIRES_YEAR;

                    return (
                      <tr key={entry.cacheKey} className="even:bg-surface-alt/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            aria-label={`Select ${entry.cacheKey}`}
                            checked={selectedKeys.has(entry.cacheKey)}
                            onChange={() => onToggleSelect(entry.cacheKey)}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">
                          {entry.season ?? '—'}
                          {entry.detail && <span className="text-text-muted"> · {entry.detail}</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                          {new Date(entry.cachedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                          {neverExpires ? 'Never' : expiresAt.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted">
                          {formatBytes(entry.sizeBytes)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => onDeleteOne(entry.cacheKey)}
                            disabled={isDeleting}
                            className={BUTTON_DANGER_GHOST}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CollapsibleContent>
          </div>
        );
      })}
    </div>
  );
}
