'use client';
console.log('project store loaded');
import { create } from 'zustand';
import type { Instrument, SynthInstrument, DrumInstrument, DrumVoice, CellKey, PatternId, PatternInfo, InstrumentId, InstrumentGrid, PatternGrids } from '../lib/types';

// Define the shape of the project state
type ProjectState = {
  instruments: Record<InstrumentId, Instrument>; // All instruments by id
  instrumentOrder: InstrumentId[]; // Order of instruments for UI
  selectedInstrumentId: InstrumentId; // Currently selected instrument
  patterns: PatternInfo[]; // List of patterns
  currentPatternId: PatternId; // Currently active pattern
  patternGrids: PatternGrids; // Note data per pattern

  // Actions
  selectInstrument: (id: string) => void; // Select instrument by id
  addSynth: () => void; // Add a new synth instrument
  addDrum: (voice: DrumVoice, name?: string) => void; // Add a new drum instrument
  removeInstrument: (id: string) => void; // Remove the selected instrument
  toggleMute: (id: string) => void; // Toggle the mute modifier
  toggleSolo: (id: string) => void; // Toggle the solo modifier
  addPattern: (name?: string) => void; // Add a new pattern
  removePattern: (patternId: PatternId) => void; // Remove a pattern
  renamePattern: (patternId: PatternId, name: string) => void; // Rename a pattern
  setCurrentPattern: (patternId: PatternId) => void; // Set the current pattern
  getActiveInstrumentSet: (instrumentId: InstrumentId) => Set<CellKey>; // Get the active set of cells for an instrument in the current pattern
  toggleCellInActivePattern: (instrumentId: InstrumentId, row: number, col: number) => void; // Toggle a cell in the current pattern for a given instrument
};

const synthId = 'i_synth1';
const kickId = 'i_kick1';
const snareId = 'i_snare1';
const hatId = 'i_hat1';

function uid() { return Math.random().toString(36).slice(2, 8); }

// Utility to create an empty instrument grid
function makeEmptyInstrumentGrid(instrumentIds: InstrumentId[]): InstrumentGrid {
  const grid: InstrumentGrid = {};
  for (const id of instrumentIds) grid[id] = new Set<CellKey>();
  return grid;
}

// Zustand store for project state
export const useProjectStore = create<ProjectState>((set, get) => {
  // Seeding initial instruments
  const synth: SynthInstrument = {
    id: synthId,
    name: 'Synth 1',
    kind: 'synth',
    cells: new Set<CellKey>(),
    muted: false,
  };
  const kick: DrumInstrument = {
    id: kickId,
    name: 'Kick',
    kind: 'drum',
    voice: 'kick',
    cells: new Set<CellKey>(),
    muted: false,
  };
  const snare: DrumInstrument = {
    id: snareId,
    name: 'Snare',
    kind: 'drum',
    voice: 'snare',
    cells: new Set<CellKey>(),
    muted: false,
  };
  const hat: DrumInstrument = {
    id: hatId,
    name: 'Hat',
    kind: 'drum',
    voice: 'hat',
    cells: new Set<CellKey>(),
    muted: false,
  };

  // Instruments map
  const instruments: Record<string, Instrument> = {
    [synth.id]: synth,
    [kick.id]: kick,
    [snare.id]: snare,
    [hat.id]: hat,
  };

  return {
    instruments,
    instrumentOrder: [synth.id, kick.id, snare.id, hat.id],
    selectedInstrumentId: synth.id,
    patterns: [{ id: 'p1', name: 'Pattern 1' }],
    currentPatternId: 'p1',
    patternGrids: { p1: makeEmptyInstrumentGrid([synth.id, kick.id, snare.id, hat.id]) },
    selectInstrument: (id) =>
      set((s) => {
        if (s.instruments[id]) return { selectedInstrumentId: id };
        // fallback to the first valid instrument instead of adopting a bad id
        const fallback = s.instrumentOrder.find((x) => !!s.instruments[x]);
        return fallback ? { selectedInstrumentId: fallback } : s;
      }),

    addSynth: (name = 'Synth') => {
      const id = `i_${uid()}`;
      const inst: SynthInstrument = { id, name, kind: 'synth', cells: new Set(), muted: false };
      set((s: ProjectState) => ({
        instruments: { ...s.instruments, [id]: inst },
        instrumentOrder: [...s.instrumentOrder, id],
        selectedInstrumentId: id,
      }));
      return id;
    },

    addDrum: (voice, name = voice[0].toUpperCase() + voice.slice(1)) => {
      const id = `i_${uid()}`;
      const inst: DrumInstrument = { id, name, kind: 'drum', voice, cells: new Set(), muted: false };
      set((s: ProjectState) => ({
        instruments: { ...s.instruments, [id]: inst },
        instrumentOrder: [...s.instrumentOrder, id],
        selectedInstrumentId: id,
      }));
      return id;
    },

    removeInstrument: (id: string) => {
      set((s: ProjectState) => {
        const { [id]: _, ...rest } = s.instruments; // Remove from map
        const order = s.instrumentOrder.filter((x) => x !== id); // Remove from order array

        // If we removed the selected instrument, point selection to the first instrument if any
        const nextSelected = rest[s.selectedInstrumentId] ? s.selectedInstrumentId : (order[0] ?? '');

        return {
          instruments: rest,
          instrumentOrder: order,
          selectedInstrumentId: nextSelected,
        };
      });
    },

    toggleMute: (id: string) => {
      set((state) => {
        const inst = state.instruments[id];
        if (!inst) return state;
        return {
          instruments: {
            ...state.instruments,
            [id]: { ...inst, muted: !inst.muted }
          }
        };
      })
    },

    toggleSolo: (id: string) => {
      set((state) => {
        const current = state.instruments[id];
        if (!current) return state;

        const nextSolo = !current.solo; // tapping it toggles
        const updated: typeof state.instruments = { ...state.instruments };

        for (const otherId of state.instrumentOrder) {
          const inst = updated[otherId];
          if (!inst) continue;
          updated[otherId] = {
            ...inst,
            // if turning one on, all others off; if turning that one off, all off
            solo: nextSolo && otherId === id,
          }
        }

        return { instruments: updated };
      })
    },

    addPattern: (name) => {
      const id = `p_${uid()}`;
      const { instrumentOrder, patternGrids, patterns } = get();
      set({
        patterns: [...patterns, { id, name: name ?? `Pattern ${patterns.length + 1}` }],
        patternGrids: { ...patternGrids, [id]: makeEmptyInstrumentGrid(instrumentOrder) },
        currentPatternId: id,
      })
    },

    removePattern: (patternId) => {
      const { patterns, patternGrids, currentPatternId } = get();
      if (patterns.length <= 1) return; // prevent removing last pattern
      const nextPatterns = patterns.filter(p => p.id !== patternId);
      const nextGrids = { ...patternGrids };
      delete nextGrids[patternId];

      const fallbackId =
        currentPatternId === patternId
          ? (nextPatterns[nextPatterns.length - 1]?.id ?? nextPatterns[0]?.id)
          : currentPatternId;

      set({ patterns: nextPatterns, patternGrids: nextGrids, currentPatternId: fallbackId });
    },

    renamePattern: (patternId, name) => {
      set((state) => ({
        patterns: state.patterns.map(p => p.id === patternId ? { ...p, name } : p)
      }));
    },

    setCurrentPattern: (patternId) => {
      set({ currentPatternId: patternId });
    },

    // Get the active set of cells for an instrument in the current pattern
    getActiveInstrumentSet: (instrumentId: string) => {
      const { currentPatternId, patternGrids } = get();
      return patternGrids[currentPatternId]?.[instrumentId] ?? new Set<CellKey>();
    },

    // Toggle a cell in the current pattern for a given instrument
    toggleCellInActivePattern: (instrumentId: string, row: number, col: number) => {
      const key: CellKey = `${row}:${col}`;
      const { currentPatternId, patternGrids } = get();
      const grid = patternGrids[currentPatternId] ?? {}; // Ensure we have a grid for the current pattern
      const current = grid[instrumentId] ?? new Set<CellKey>(); // Get current set (or empty)
      const next = new Set(current); // Clone so the reference changes
      if (next.has(key)) next.delete(key);
      else next.add(key);

      // Write back with new object paths so Zustand emits a change
      set({
        patternGrids: {
          ...patternGrids,
          [currentPatternId]: {
            ...grid,
            [instrumentId]: next,
          },
        },
      });
    },
  }
});
