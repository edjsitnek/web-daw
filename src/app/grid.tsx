'use client';
import { useMemo, useState, useCallback } from 'react';
import { playMidi, ensureAudio } from './lib/audio';

// Grid dimensions
const COLS = 16; // Steps (time)
const ROWS = 12; // Notes (pitch)

// Choose pitch range (MIDI). Here: C4..B4 (12 semitones)
const MIDI_C4 = 60;
const PITCHES = Array.from({ length: ROWS }, (_, i) => MIDI_C4 + i); // ascending
// Reverse rows when rendering for highest pitch on top

type CellKey = `${number}:${number}`; // "row:col"

export default function Grid() {
  // Active cells - notes toggled on the grid (later convert to Note objects)
  const [active, setActive] = useState<Set<CellKey>>(new Set());

  const toggleCell = useCallback((row: number, col: number) => {
    setActive(prev => {
      const next = new Set(prev);
      const key = `${row}:${col}` as CellKey;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

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
    playMidi(PITCHES[row], '16n', 0.9);
  }

  // Handle cell click: play sound and toggle state
  const onCellClick = async (row: number, col: number) => {
    // Preview sound
    await ensureAudio();
    playMidi(PITCHES[row], '16n', 0.9);
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
                    'h-8 w-8',
                    'focus:outline-none',
                    'transition-[background-color,box-shadow] duration-75',
                    'border border-gray-200/70',
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