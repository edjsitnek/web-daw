export type CellKey = `${number}:${number}`; // "row:col"

export type Note = {
  pitch: number; // MIDI pitch (e.g., 60 = middle C)
  startStep: number; // Start step (0..COLS-1)
  durationSteps: number; // Duration in steps
  velocity: number; // Velocity (0.0 to 1.0)
}