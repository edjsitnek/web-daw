'use client';
import { useMemo } from 'react';
import { useProjectStore } from '../store/project';

// Song grid component for arranging patterns into a song structure
export default function SongGrid() {
  const {
    patterns, songBlocks, songGrid, currentPatternId, toggleSongCell, setCurrentPattern,
  } = useProjectStore();

  // Build column labels (patterns as measures for now)
  const cols = useMemo(() => Array.from({ length: songBlocks }, (_, i) => i), [songBlocks]);

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="grid" style={{ gridTemplateColumns: `175px repeat(${songBlocks}, 24px)` }}>
        <div className="text-xs text-gray-300 px-2 py-1">Pattern</div>
        {cols.map(i => (
          <div key={i} className="text-[10px] text-gray-400 text-center select-none">{i + 1}</div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {patterns.map(p => {
          const row = songGrid[p.id] ?? new Set<number>();
          return (
            <div key={p.id} className="grid items-center"
              style={{ gridTemplateColumns: `175px repeat(${songBlocks}, 24px)` }}>
              {/* Row label (click to jump to that pattern for editing) */}
              <button
                className={`text-left px-2 py-1 rounded ${p.id === currentPatternId ? 'bg-gray-700 text-white' : 'text-gray-200 hover:bg-gray-800'}`}
                onClick={() => setCurrentPattern(p.id)}
                title={p.name}
              >
                {p.name}
              </button>

              {/* Cells */}
              {cols.map(block => {
                const on = row.has(block);
                return (
                  <button
                    key={block}
                    className={`h-6 w-6 rounded-sm border border-gray-700
                                ${on ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-900 hover:bg-gray-800'}`}
                    onClick={() => toggleSongCell(p.id, block)}
                    title={on ? 'Remove pattern' : 'Place pattern'}
                    aria-pressed={on}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
