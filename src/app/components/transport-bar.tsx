'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import Toolbar from './toolbar';
import { CellKey } from '../lib/types';
import { DEFAULT_COLS as COLS, PITCHES } from '../lib/config';
import { ensureAudio, playMidiAt } from '../lib/audio';
import { playKick, playSnare, playHat } from '../lib/drums';
import { useProjectStore } from '../store/project';
import { useTransportStore } from '../store/transport';

// Transport bar with play, pause, stop functionality, BPM input, and current step display
export default function TransportBar() {
  const { bpm, step, isPlaying, setBpm, setStep, setIsPlaying } = useTransportStore();
  const repeatIdRef = useRef<number | undefined>(undefined); // Keep the schedule id stable between renders
  const transport = Tone.getTransport();

  // Advance one col and play notes in that col
  const tick = useCallback((time: number) => {
    const next = (useTransportStore.getState().step + 1) % COLS;
    setStep(next);
    // Get current active cells from project store
    const active = useProjectStore.getState().active;
    // For each row, if the cell at (row, next) is active, play its note
    PITCHES.forEach((midi, row) => {
      const key = `${row}:${next}` as CellKey;
      if (!active.has(key)) return;
      // temp: use lowest 3 rows as a drum lane demo
      if (row === 0) { playKick(time); return; }
      if (row === 1) { playSnare(time); return; }
      if (row === 2) { playHat(time); return; }
      playMidiAt(midi, '16n', time, 0.9); // play note at the scheduled time

    });
  }, [setStep]);

  // Start playback
  const handlePlay = useCallback(async () => {
    await ensureAudio();
    // Keep tempo in sync
    transport.bpm.rampTo(bpm, 0.05);

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
    </div>
  );
}