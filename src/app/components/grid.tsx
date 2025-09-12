'use client';
import { useMemo } from 'react';
import { playMidiNow, ensureAudio } from '../lib/audio';
import { CellKey } from '../lib/types';
import { DEFAULT_COLS as COLS, DEFAULT_ROWS as ROWS, PITCHES } from '../lib/config';
import { useProjectStore } from '../store/project';

// Main grid component with piano labels and interactive note cells
export default function Grid() {
  const { active, toggleCell } = useProjectStore();

  // For labels on the piano side
  const noteNames = useMemo(() => {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return PITCHES.map(midi => `${names[midi % 12]}${Math.floor(midi / 12) - 1}`);
  }, []);

  // Render highest pitch on top
  const rows = useMemo(() => [...Array(ROWS).keys()].reverse(), []);

  // Handle piano label click: preview sound
  const onLabelClick = async (row: number) => {
    // Preview sound
    await ensureAudio();
    playMidiNow(PITCHES[row], '16n', 0.9);
  }

  // Handle cell click: play sound and toggle state
  const onCellClick = async (row: number, col: number) => {
    // Preview sound
    await ensureAudio();
    playMidiNow(PITCHES[row], '16n', 0.9);
    // Toggle UI state
    toggleCell(row, col);
  }

  return (
    <main className="p-4 max-w-5xl mx-auto">

      {/* Grid wrapper: piano labels (left) + grid (right) */}
      <div className="flex gap-2">
        {/* Piano labels col */}
        <div className="flex flex-col">
          {rows.map(row => (
            <div
              key={`label-${row}`}
              className="h-8 w-16 flex items-center justify-end pr-2 text-xs text-gray-600 select-none"
              onMouseDown={() => onLabelClick(row)}
            >
              {noteNames[row]}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="grid border border-gray-300 rounded-md overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          }}
        >
          {rows.map((row) =>
            Array.from({ length: COLS }, (_, col) => {
              const key = `${row}:${col}` as CellKey;
              const on = active.has(key);

              // Vertical stripes to visually group beats (every 4 steps)
              const isBeatBoundary = col % 4 === 0;

              return (
                <button
                  key={key}
                  onClick={() => onCellClick(row, col)}
                  className={[
                    'h-8 w-8 focus:outline-none transition-[background-color,box-shadow] duration-75 border border-gray-200/70',
                    isBeatBoundary ? 'border-l-gray-400' : '',
                    on
                      ? 'bg-blue-500 shadow-inner'
                      : 'bg-white hover:bg-blue-50 active:bg-blue-100',
                  ].join(' ')}
                  title={`${noteNames[row]} @ step ${col + 1}`}
                  aria-pressed={on}
                />
              );
            })
          )}
        </div>
      </div>
    </main>
  )
}