'use client';
import { useMemo } from 'react';
import { playMidiNow, ensureAudio } from '../lib/audio';
import { CellKey } from '../lib/types';
import { DEFAULT_COLS as COLS, DEFAULT_ROWS as ROWS, PITCHES } from '../lib/config';
import { useProjectStore } from '../store/project';
import { ensureDrums, playKick, playSnare, playHat } from '../lib/drums';

// Main grid component with piano labels and interactive note cells
export default function Grid() {
  const { instruments, instrumentOrder, selectedInstrumentId, selectInstrument, toggleCell } = useProjectStore();

  const inst = instruments[selectedInstrumentId];
  const cells = inst?.cells ?? new Set<CellKey>();

  // For labels on the piano side
  const noteNames = useMemo(() => {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return PITCHES.map(midi => `${names[midi % 12]}${Math.floor(midi / 12) - 1}`);
  }, []);

  // Render highest pitch on top
  const rows = useMemo(() => [...Array(ROWS).keys()].reverse(), []);

  // Preview sound for a given row
  const preview = async (row: number) => {
    await ensureAudio();
    if (!inst) return;
    if (inst.kind === 'drum') {
      await ensureDrums();
      if (inst.voice === 'kick') playKick();
      else if (inst.voice === 'snare') playSnare();
      else if (inst.voice === 'hat') playHat();
    } else {
      playMidiNow(PITCHES[row], '16n', 0.9);
    }
  }

  // Handle piano label click: preview sound
  const onLabelClick = (row: number) => { preview(row); }

  // Handle cell click: play sound and toggle state
  const onCellClick = async (row: number, col: number) => {
    // Preview sound
    await preview(row);
    // Toggle UI state
    toggleCell(row, col);
  }

  return (
    <main className="p-4 max-w-5xl mx-auto">
      {/* Instrument selector */}
      <div className="mb-2">
        <label className="text-sm mr-2">Instrument</label>
        <select className="border rounded px-2 py-1" value={selectedInstrumentId} onChange={e => selectInstrument(e.target.value)}>
          {instrumentOrder.map((id: string) => (
            <option key={id} value={id} className="text-gray-900">
              {instruments[id].name}
            </option>
          ))}
        </select>
      </div>

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
              const on = cells.has(key);
              const isBeatBoundary = col % 4 === 0; // Vertical stripes to visually group beats (every 4 steps)

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