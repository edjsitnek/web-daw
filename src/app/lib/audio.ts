'use client';
import * as Tone from 'tone';

let _started = false;
let synth: Tone.PolySynth | null = null;

// Ensure AudioContext is started and synth is created
export async function ensureAudio() {
  if (!_started) {
    await Tone.start();
    _started = true;
  }
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.8 },
    }).toDestination();
  }
}

// Get the synth, or throw if not initialized
function getSynth() {
  if (!synth) throw new Error('Synth not initialized');
  return synth;
}

// For immediate playback outside of scheduled callbacks (preview notes)
export function playMidiNow(midi: number, dur: string = '16n', vel = 0.9) {
  const note = Tone.Frequency(midi, 'midi').toNote();
  getSynth().triggerAttackRelease(note, dur, undefined, vel);
}

// For scheduled callbacks to keep tight timing
export function playMidiAt(midi: number, dur: string, time: number, vel = 0.9) {
  const note = Tone.Frequency(midi, 'midi').toNote();
  getSynth().triggerAttackRelease(note, dur, time, vel);
}
