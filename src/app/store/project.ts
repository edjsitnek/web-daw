'use client';
console.log('project store loaded');
import { create } from 'zustand';
import type { Instrument, SynthInstrument, DrumInstrument, DrumVoice, CellKey } from '../lib/types';

// Define the shape of the project state
type ProjectState = {
  instruments: Record<string, Instrument>; // All instruments by id
  instrumentOrder: string[]; // Order of instruments for UI
  selectedInstrumentId: string; // Currently selected instrument

  // Actions
  selectInstrument: (id: string) => void; // Select instrument by id
  toggleCell: (row: number, col: number) => void; // Toggle cell state
  addSynth: () => void; // Add a new synth instrument
  addDrum: (voice: DrumVoice, name?: string) => void; // Add a new drum instrument
  removeInstrument: (id: string) => void; // Remove the selected instrument
};

const synthId = 'i_synth1';
const kickId = 'i_kick1';
const snareId = 'i_snare1';
const hatId = 'i_hat1';

function uid() { return Math.random().toString(36).slice(2, 8); }

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
    selectInstrument: (id) =>
      set((s) => {
        if (s.instruments[id]) return { selectedInstrumentId: id };
        // fallback to the first valid instrument instead of adopting a bad id
        const fallback = s.instrumentOrder.find((x) => !!s.instruments[x]);
        return fallback ? { selectedInstrumentId: fallback } : s;
      }),

    toggleCell: (row, col) => {
      set((s: ProjectState) => {
        const inst = s.instruments[s.selectedInstrumentId];
        if (!inst) {
          // auto-heal selection if it's point at something that no longer exists
          const fallback = s.instrumentOrder.find((x) => !!s.instruments[x]);
          if (fallback && fallback !== s.selectedInstrumentId) {
            return { selectedInstrumentId: fallback };
          }
          return s;
        }
        const key = `${row}:${col}` as CellKey;
        const next = new Set(inst.cells);
        next.has(key) ? next.delete(key) : next.add(key);

        return {
          instruments: {
            ...s.instruments,
            [inst.id]: { ...inst, cells: next },
          },
        };
      });
    },

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
  }
});
