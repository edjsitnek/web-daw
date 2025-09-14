export type CellKey = `${number}:${number}`; // "row:col"
export type InstrumentKind = 'synth' | 'drum';
export type DrumVoice = 'kick' | 'snare' | 'hat';

export interface BaseInstrument {
  id: string;
  name: string;
  kind: InstrumentKind;
  cells: Set<CellKey>;
  muted: boolean;
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