export type CellKey = `${number}:${number}`; // "row:col"
export type InstrumentKind = 'synth' | 'drum';
export type DrumVoice = 'kick' | 'snare' | 'hat';

export interface BaseInstrument {
  id: string;
  name: string;
  kind: InstrumentKind;
  cells: Set<CellKey>;
  muted?: boolean;
  solo?: boolean;
  color?: string;
}

export interface SynthInstrument extends BaseInstrument {
  kind: 'synth';
}

export interface DrumInstrument extends BaseInstrument {
  kind: 'drum';
  voice: DrumVoice;
}

export type Instrument = SynthInstrument | DrumInstrument;

// Patterns
export type PatternId = string;
export type InstrumentId = string;

export interface PatternInfo {
  id: PatternId;
  name: string; // e.g. "Pattern 1"
}

// Note data per pattern
export type InstrumentGrid = Record<InstrumentId, Set<CellKey>>;

// Mapping of pattern IDs to their respective instrument grids
export type PatternGrids = Record<PatternId, InstrumentGrid>;