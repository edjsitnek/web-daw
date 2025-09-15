export const MIDI_MIN = 21; // A0
export const MIDI_MAX = 108; // C8
export const DEFAULT_COLS = 16;

// 88-key range, ascending
export const PITCHES = Array.from({ length: MIDI_MAX - MIDI_MIN + 1 }, (_, i) => MIDI_MIN + i);

export const DEFAULT_ROWS = PITCHES.length;