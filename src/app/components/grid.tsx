'use client';
import { useMemo, useEffect, useRef } from 'react';
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

  const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12); // Sets "black keys" on piano roll grid
  const midiRowId = (midi: number) => `row-m${midi}`;

  // For centering grid on C4 when loading page
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hasAutoCentered = useRef(false);
  const userInteracted = useRef(false);

  // Hook a scroll listener once
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => { userInteracted.current = true; };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll)
  }, []);

  // Center middle C once unless user already interacted
  useEffect(() => {
    if (hasAutoCentered.current || userInteracted.current) return;
    const rowEl = document.getElementById(`row-m${60}`); //C4
    requestAnimationFrame(() => {
      if (!rowEl || userInteracted.current) return;
      rowEl.scrollIntoView({ block: "center" });
      hasAutoCentered.current = true;
    });
  }, []);

  // For labels on the piano side
  const noteNames = useMemo(() => {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return PITCHES.map(midi => `${names[midi % 12]}${Math.floor(midi / 12) - 1}`);
  }, []);

  // Render highest pitch on top
  const rows = useMemo(() => [...Array(ROWS).keys()].reverse(), []);

  // Collect all cells from other instruments for ghost note rendering
  const ghostCells = useMemo(() => {
    const set = new Set<CellKey>();
    for (const id of instrumentOrder) {
      if (id === selectedInstrumentId) continue; // exclude current instrument
      const inst = instruments[id];
      if (!inst) continue;
      for (const key of inst.cells) set.add(key); // add all other instrument cells
    }
    return set;
  }, [instruments, instrumentOrder, selectedInstrumentId]);

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
  const onLabelClick = (row: number) => {
    userInteracted.current = true;
    preview(row);
  }

  // Handle cell click: play sound and toggle state
  const onCellClick = async (row: number, col: number) => {
    userInteracted.current = true;
    // Preview sound
    await preview(row);
    // Toggle UI state
    toggleCell(row, col);
  }

  return (
    <main className="p-4 mx-6 max-w-5xl">
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

      {/* Scrollable grid wrapper */}
      <div ref={scrollRef} className="h-96 overflow-y-auto rounded-md border border-gray-200 w-fit">
        {/* Tone labels (left) + grid (right) */}
        <div className="flex gap-1">
          {/* Tone labels col */}
          <div className="flex flex-col">
            {rows.map(row => (
              <div
                key={`label-${row}`}
                id={midiRowId(PITCHES[row])}
                className={["h-8 w-16 flex items-center justify-end pr-2 text-xs select-none",
                  isBlackKey(PITCHES[row]) ? "bg-neutral-400 text-gray-700" : "bg-neutral-100 text-gray-600"].join(" ")}
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
                const ghost = !on && ghostCells.has(key); // Ghost note only if not active on this instrument

                return (
                  <button
                    key={key}
                    onClick={() => onCellClick(row, col)}
                    data-active={on ? "true" : "false"}
                    data-ghost={ghost ? "true" : "false"}
                    className={[
                      "h-8 w-8 focus:outline-none transition-[background-color,box-shadow] duration-75 border border-gray-200/70",
                      isBeatBoundary ? "border-l-gray-400" : "",
                      isBlackKey(PITCHES[row]) ? "bg-neutral-100" : "bg-white",
                      "data-[active=true]:bg-blue-500 data-[active=true]:shadow-inner hover:bg-blue-50 active:bg-blue-100",
                      "data-[ghost=true]:bg-gray-100/50 hover:data-[ghost=true]:bg-gray-300/70",
                    ].join(" ")}
                    title={`${noteNames[row]} @ step ${col + 1}`}
                    aria-pressed={on}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  )
}