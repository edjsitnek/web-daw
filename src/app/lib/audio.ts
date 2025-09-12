'use client';
import * as Tone from 'tone';

let started = false;
let synth: Tone.PolySynth | null = null;

// Ensure AudioContext is started and synth is created
export async function ensureAudio() {
  if (!started) {
    await Tone.start();
    started = true;
  }
  if (!synth) synth = new Tone.PolySynth(Tone.Synth).toDestination();
}

// For immediate playback outside of scheduled callbacks (preview notes)
export function playMidiNow(midi: number, dur: string = '16n', vel = 0.9) {
  if (!synth) return;
  const note = Tone.Frequency(midi, 'midi').toNote();
  synth.triggerAttackRelease(note, dur, undefined, vel);
}

// For scheduled callbacks to keep tight timing
export function playMidiAt(midi: number, dur: string, time: number, vel = 0.9) {
  if (!synth) return;
  const note = Tone.Frequency(midi, 'midi').toNote();
  synth.triggerAttackRelease(note, dur, time, vel);
}
