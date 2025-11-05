'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import Toolbar from './toolbar';
import PatternControls from './pattern-controls';
import { CellKey } from '../lib/types';
import { DEFAULT_COLS as COLS, PITCHES } from '../lib/config';
import { ensureAudio, playMidiAt } from '../lib/audio';
import { ensureDrums, playKick, playSnare, playHat } from '../lib/drums';
import { useProjectStore } from '../store/project';
import { useTransportStore } from '../store/transport';

// Transport bar with play, pause, stop functionality, BPM input, and current step display
export default function TransportBar() {
  const { bpm, step, isPlaying, setBpm, setStep, setIsPlaying } = useTransportStore();
  const repeatIdRef = useRef<number | undefined>(undefined); // Keep the schedule id stable between renders
  const transport = Tone.getTransport();

  // Advance one col and play notes in that col
  const playColumnAt = (col: number, time: number) => {
    const { instruments, instrumentOrder, getActiveInstrumentSet } = useProjectStore.getState();
    const anySolo = instrumentOrder.some((id) => instruments[id]?.solo);

    // For each instrument, if a cell is active at (row, next), play it
    for (const id of instrumentOrder) {
      const inst = instruments[id];
      if (!inst || inst.muted) continue;

      // Silence (mute/solo) check
      const isSilenced = anySolo ? !inst.solo : !!inst.muted;
      if (isSilenced) continue;

      // For each row in this instrument, if the cell at (row, next) is active, play its note
      PITCHES.forEach((midi, row) => {
        const key = `${row}:${col}` as CellKey;
        const set = getActiveInstrumentSet(id);
        if (!set.has(key)) return;

        if (inst.kind === 'synth') {
          playMidiAt(midi, '16n', time, 0.9);
        } else {
          if (inst.voice === 'kick') playKick(time);
          if (inst.voice === 'snare') playSnare(time);
          if (inst.voice === 'hat') playHat(time);
        }
      });
    }
  };

  const tick = useCallback((time: number) => {
    const current = useTransportStore.getState().step;
    // Play the current column
    playColumnAt(current, time);
    // Advance step, looping back to 0
    const next = (current + 1) % COLS;
    setStep(next);
  }, [setStep]);

  // Start playback
  const handlePlay = useCallback(async () => {
    await ensureAudio();
    await ensureDrums();
    transport.bpm.rampTo(bpm, 0.05); // smooth transition to new bpm over 50ms

    // Avoid double-scheduling if play is clicked multiple times
    if (repeatIdRef.current === undefined) {
      repeatIdRef.current = transport.scheduleRepeat(tick, '16n');
    }
    transport.start() // start immediately
    setIsPlaying(true);
  }, [bpm, tick]);

  // Pause keeps step where it is
  const handlePause = useCallback(() => {
    transport.pause();
    setIsPlaying(false);
  }, []);

  // Stop and reset step to 0 and clear scheduled events
  const handleStop = useCallback(() => {
    transport.stop();
    setIsPlaying(false);
    setStep(0);
  }, []);

  // Keep Transport BPM in sync if user changes bpm while playing
  useEffect(() => {
    if (isPlaying) {
      transport.bpm.rampTo(bpm, 0.05);
    }
  }, [bpm, isPlaying]);

  // Cleanup on unmount: stop and clear the scheduled repeat
  useEffect(() => {
    return () => {
      transport.stop();
      if (repeatIdRef.current !== undefined) {
        transport.clear(repeatIdRef.current);
        repeatIdRef.current = undefined;
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3 mb-3">
      <Toolbar
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
      />

      <label className="ml-4 text-sm">
        BPM&nbsp;
        <input
          type="number"
          min={40}
          max={220}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-20 border rounded px-2 py-1"
        />
      </label>

      <span className="ml-4 text-sm text-gray-600">Step: {step + 1}/{COLS}</span>

      <PatternControls />
    </div>
  );
}