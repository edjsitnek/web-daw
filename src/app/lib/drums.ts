import * as Tone from "tone";

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.04,
  octaves: 6,
  envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.25, },
}).toDestination();

export function playKick(time?: number) {
  kick.triggerAttackRelease("C1", "8n", time);
}

const snareNoise = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
}).toDestination();

const snareTone = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
}).toDestination();

export function playSnare(time?: number) {
  snareNoise.triggerAttackRelease("16n", time);
  snareTone.triggerAttackRelease("C4", "16n", time);
}

const hatFilter = new Tone.Filter(8000, "highpass").toDestination();
const hat = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.04, sustain: 0 }
}).connect(hatFilter);

export function playHat(time?: number) {
  hat.triggerAttackRelease("16n", time);
}