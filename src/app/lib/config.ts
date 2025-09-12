export const DEFAULT_COLS = 16;
export const DEFAULT_ROWS = 12;
export const MIDI_C4 = 60; // Middle C
// Choose pitch range (MIDI). Here: C4..B4 (12 semitones)
export const PITCHES = Array.from({ length: DEFAULT_ROWS }, (_, i) => MIDI_C4 + i); // ascending