'use client';

import { useCallback, useMemo } from 'react';
import { useProjectStore } from '../../store/project';

// Pattern controls component to select, add, remove, and rename patterns
export default function PatternControls() {
  const {
    patterns,
    currentPatternId,
    setCurrentPattern,
    addPattern,
    removePattern,
    renamePattern
  } = useProjectStore();

  const canRemove = patterns.length > 1;

  const onSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPattern(e.target.value);
  }, [setCurrentPattern]);

  const onAdd = useCallback(() => {
    addPattern(); // Auto names "Pattern X" and selects it
  }, [addPattern]);

  const onRemove = useCallback(() => {
    if (!canRemove) return;
    const current = patterns.find(p => p.id === currentPatternId);
    const name = current?.name ?? 'Current pattern';
    const msg = `Are you sure you want to delete "${name}"? This action cannot be undone.`;

    if (window.confirm(msg)) {
      removePattern(currentPatternId);
    }
  }, [canRemove, currentPatternId, removePattern]);

  const onRename = useCallback(() => {
    const current = patterns.find(p => p.id === currentPatternId);
    const next = window.prompt('Rename pattern:', current?.name ?? '');
    if (next && next.trim()) renamePattern(currentPatternId, next.trim());
  }, [patterns, currentPatternId, renamePattern]);

  // Keep options stable for small perf win
  const options = useMemo(() => patterns.map(p => (
    <option key={p.id} value={p.id}>{p.name}</option>
  )), [patterns]);

  return (
    <div className="flex items-center gap-2">
      <select
        className="bg-gray-800 text-white rounded-lg px-2 py-1"
        value={currentPatternId}
        onChange={onSelect}
        aria-label="Select pattern"
      >
        {options}
      </select>

      <button
        className="text-white text-sm bg-gray-700 hover:bg-gray-800 rounded-lg px-2 py-1"
        onClick={onAdd}
        aria-label="Add pattern"
        title="Add pattern"
      >
        +
      </button>

      <button
        className="text-white text-sm bg-gray-700 hover:bg-gray-800 rounded-lg px-2 py-1 disabled:opacity-50"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Delete current pattern"
        title={canRemove ? 'Delete current pattern' : 'At least one pattern is required'}
      >
        –
      </button>

      <button
        className="text-white text-sm bg-gray-700 hover:bg-gray-800 rounded-lg px-2 py-1"
        onClick={onRename}
        aria-label="Rename current pattern"
        title="Rename current pattern"
      >
        Rename
      </button>
    </div>
  )
}