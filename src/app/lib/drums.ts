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

// Pools of drum voices for polyphony
let kickPool: Tone.MembraneSynth[] | null = null;
let snarePool: { noise: Tone.NoiseSynth; tone: Tone.Synth }[] | null = null;
let hatPool: Tone.NoiseSynth[] | null = null;

// Round-robin pointers
let kickPtr = 0, snarePtr = 0, hatPtr = 0;

// Round-robin pickers for each drum voice (return the next voice for this drum)
const nextKick = () => kickPool![kickPtr = (kickPtr + 1) % (kickPool!.length)];
const nextSnare = () => snarePool![snarePtr = (snarePtr + 1) % (snarePool!.length)];
const nextHat = () => hatPool![hatPtr = (hatPtr + 1) % (hatPool!.length)];

// Utility: clone options if available, otherwise fall back
const safeGet = <T extends { get?: () => any }>(node: T | undefined) =>
  (node && typeof node.get === 'function' ? node.get() : undefined) ?? {};

// Ensure pools exist AFTER ensureDrums() has created kit
function ensureDrumPools() {
  // Make sure original kit is initialized (lazy, after Tone.start())
  ensureDrums();
  if (!kit) return;

  // Create voice pools if they don't exist yet
  if (!kickPool) {
    const kickOpts = safeGet(kit.kick);
    kickPool = Array.from({ length: 4 }, () =>
      new Tone.MembraneSynth(kickOpts).toDestination()
    );
  }
  if (!snarePool) {
    const nOpts = safeGet(kit.snareNoise);
    const tOpts = safeGet(kit.snareTone);
    snarePool = Array.from({ length: 4 }, () => ({
      noise: new Tone.NoiseSynth(nOpts).toDestination(),
      tone: new Tone.Synth(tOpts).toDestination(),
    }));
  }
  if (!hatPool) {
    const hatOpts = safeGet(kit.hat);
    hatPool = Array.from({ length: 4 }, () =>
      new Tone.NoiseSynth(hatOpts).toDestination()
    );
  }
}

// MIDI to frequency helper for tuned hits
const toFreq = (midi: number | undefined, fallbackNote: string): number | string =>
  midi != null ? Tone.Frequency(midi, "midi").toFrequency() : fallbackNote;

// Play functions for each drum voice
export function playKick(time?: number, midi?: number) {
  ensureDrumPools();
  if (!kickPool) return;
  const v = nextKick();
  v.triggerAttackRelease(toFreq(midi, "C1"), "8n", time);
}

export function playSnare(time?: number, midi?: number) {
  ensureDrumPools();
  if (!snarePool) return;
  const v = nextSnare();
  v.noise.triggerAttackRelease("16n", time);                 // unpitched layer
  v.tone.triggerAttackRelease(toFreq(midi, "C4"), "16n", time); // pitched layer
}

export function playHat(time?: number | string, midi?: number) {
  ensureDrumPools();
  if (!hatPool) return;
  const v = nextHat();
  if (time === undefined) {
    // one-arg overload: duration only
    v.triggerAttackRelease("16n");
  } else {
    // two-arg overload: (duration, time) with time as number
    const at = Tone.Time(time).toSeconds();
    v.triggerAttackRelease("16n", at);
  }
}