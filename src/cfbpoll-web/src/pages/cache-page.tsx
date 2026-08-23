import { useMemo, useState } from 'react';

import { CacheEntriesSection } from '../components/admin';
import { BUTTON_DANGER, BUTTON_SECONDARY } from '../components/ui/button-styles';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useAuth } from '../hooks/use-auth';
import { useCacheEntries } from '../hooks/use-cache-entries';
import { useDocumentTitle } from '../hooks/use-document-title';
import { groupCacheEntriesByFamily } from '../lib/group-cache-entries';

type ConfirmTarget = { keys: string[]; type: 'bulk' } | { keys: [string]; type: 'single' };

export function CachePage() {
  useDocumentTitle('Taylor Steinberg - Cache');

  const { token } = useAuth();
  const { data, deleteMany, deleteOne, isDeleting, isLoading } = useCacheEntries(token);

  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const groups = useMemo(() => groupCacheEntriesByFamily(data ?? []), [data]);

  function toggleFamily(family: string) {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });
  }

  function toggleSelect(cacheKey: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(cacheKey)) next.delete(cacheKey);
      else next.add(cacheKey);
      return next;
    });
  }

  function toggleSelectFamily(_family: string, cacheKeys: string[]) {
    setSelectedKeys((prev) => {
      const allSelected = cacheKeys.every((key) => prev.has(key));
      const next = new Set(prev);
      for (const key of cacheKeys) {
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;

    if (confirmTarget.type === 'single') {
      await deleteOne(confirmTarget.keys[0]);
    } else {
      await deleteMany(confirmTarget.keys);
    }

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of confirmTarget.keys) next.delete(key);
      return next;
    });
    setConfirmTarget(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Cache</h1>
        <p className="mt-1 text-sm text-text-muted">
          Everything the site has cached from CollegeFootballData.com, grouped by type and season. Delete an entry to force a fresh pull next time it's needed.
        </p>
      </div>

      {selectedKeys.size > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-text-muted">{selectedKeys.size} selected</span>
          <button
            onClick={() => setConfirmTarget({ keys: [...selectedKeys], type: 'bulk' })}
            disabled={isDeleting}
            className={BUTTON_DANGER}
          >
            Delete Selected
          </button>
          <button onClick={() => setSelectedKeys(new Set())} className={BUTTON_SECONDARY}>
            Clear Selection
          </button>
        </div>
      )}

      <div className="bg-surface shadow-md rounded-xl p-4 sm:p-6">
        <CacheEntriesSection
          expandedFamilies={expandedFamilies}
          groups={groups}
          isDeleting={isDeleting}
          isLoading={isLoading}
          onDeleteOne={(cacheKey) => setConfirmTarget({ keys: [cacheKey], type: 'single' })}
          onToggleFamily={toggleFamily}
          onToggleSelect={toggleSelect}
          onToggleSelectFamily={toggleSelectFamily}
          selectedKeys={selectedKeys}
        />
      </div>

      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.type === 'single' ? 'Delete Cache Entry' : 'Delete Cache Entries'}
          message={
            confirmTarget.type === 'single'
              ? `Remove the cached entry "${confirmTarget.keys[0]}"? It will be re-fetched from CollegeFootballData.com the next time it's needed.`
              : `Remove ${confirmTarget.keys.length} cached entries? They will be re-fetched from CollegeFootballData.com the next time they're needed.`
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

export default CachePage;
