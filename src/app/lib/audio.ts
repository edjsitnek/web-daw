import * as Tone from 'tone';

// Ensure audio context is started only once
let started = false;
export async function ensureAudio() {
  if (!started) {
    await Tone.start();
    started = true;
  }
}

// A single synth instance
export const synth = new Tone.Synth({
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.5 }
}).toDestination();

// Play a MIDI note number (e.g. 60 = C4) for a given duration and velocity
export function playMidi(midi: number, dur: string = '16n', vel: number = 0.9) {
  const note = Tone.Frequency(midi, "midi").toNote();
  synth.triggerAttackRelease(note, dur, undefined, vel);
}