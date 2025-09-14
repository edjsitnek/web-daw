import * as Tone from "tone";
import { ensureAudio } from "./audio";

type Kit = {
  kick: Tone.MembraneSynth,
  snareNoise: Tone.NoiseSynth,
  snareTone: Tone.Synth,
  hatFilter: Tone.Filter,
  hat: Tone.NoiseSynth,
}

let kit: Kit | null = null;

// Create the drum kit if it doesn't exist yet
export async function ensureDrums() {
  await ensureAudio();
  if (kit) return; // already created

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.25, },
  }).toDestination();

  const snareNoise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
  }).toDestination();
  const snareTone = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
  }).toDestination();

  const hatFilter = new Tone.Filter(8000, "highpass").toDestination();
  const hat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0 }
  }).connect(hatFilter);

  kit = { kick, snareNoise, snareTone, hatFilter, hat };
}

export function playKick(time?: number) {
  if (!kit) return;
  kit.kick.triggerAttackRelease("C1", "8n", time);
}

export function playSnare(time?: number) {
  if (!kit) return;
  kit.snareNoise.triggerAttackRelease("16n", time);
  kit.snareTone.triggerAttackRelease("C4", "16n", time);
}

export function playHat(time?: number) {
  if (!kit) return;
  kit.hat.triggerAttackRelease("16n", time);
}