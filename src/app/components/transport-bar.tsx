'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import Toolbar from './toolbar';
import PatternControls from './pattern-controls';
import { CellKey, PatternId } from '../lib/types';
import { DEFAULT_COLS as COLS, DEFAULT_ROWS, PITCHES } from '../lib/config';
import { ensureAudio, playMidiAt } from '../lib/audio';
import { ensureDrums, playKick, playSnare, playHat } from '../lib/drums';
import { useProjectStore } from '../store/project';
import { useTransportStore } from '../store/transport';
import { saveProjectToDisk, loadProjectFromDisk } from '../lib/io';

// Transport bar with play, pause, stop functionality, BPM input, and current step display
export default function TransportBar() {
  const { bpm, step, isPlaying, setBpm, setStep, setIsPlaying } = useTransportStore();
  const { viewMode, playMode, songBlocks, setViewMode, setPlayMode } = useProjectStore.getState();
  const repeatIdRef = useRef<number | undefined>(undefined); // Keep the schedule id stable between renders
  const transport = Tone.getTransport();
  const PATTERN_COLS = 16; // current grid width

  // Advance one col and play notes in that col
  const playColumnAt = (col: number, time: number) => {
    const {
      instruments,
      instrumentOrder,
      currentPatternId,
      patternGrids,
      songGrid,
      songBlocks,
      playMode
    } = useProjectStore.getState();

    const anySolo = instrumentOrder.some((id) => instruments[id]?.solo);
    const block = Math.floor(col / PATTERN_COLS);
    const localCol = col % PATTERN_COLS;

    // Decide which patterns to read this step
    let patternsToPlay: PatternId[] = [];
    if (playMode === 'pattern') {
      patternsToPlay = [currentPatternId];
    } else {
      // song play mode: any pattern that has a clip at this block
      if (block < songBlocks) {
        patternsToPlay = Object.entries(songGrid)
          .filter(([pid, set]) => set.has(block))
          .map(([pid]) => pid as PatternId);
      } else {
        return; // beyond song length
      }
    }

    // Helper to schedule one instrument from a given pattern at a given column
    const scheduleFromPatternAtCol = (patternId: PatternId, colToPlay: number) => {
      const grid = patternGrids[patternId] ?? {};
      for (const id of instrumentOrder) {
        const inst = instruments[id];
        if (!inst) continue;

        // Silence (mute/solo) check
        const isSilenced = anySolo ? !inst.solo : !!inst.muted;
        if (isSilenced) continue;

        const set = grid[id];
        if (!set) continue;

        // Synth: scan rows
        for (let row = 0; row < DEFAULT_ROWS; row++) {
          const k = `${row}:${colToPlay}` as CellKey;
          if (!set.has(k)) continue;

          if (inst.kind === 'synth') {
            playMidiAt(PITCHES[row], '16n', time, 0.9);
          } else {
            if (inst.voice === 'kick') playKick(time);
            if (inst.voice === 'snare') playSnare(time);
            if (inst.voice === 'hat') playHat(time);
          }
        }
      }
    };

    // Schedule all patterns for this step
    if (patternsToPlay.length === 0) return;
    const colToUse = (playMode === 'pattern') ? col : localCol;
    for (const pid of patternsToPlay) {
      scheduleFromPatternAtCol(pid, colToUse);
    }
  };

  // Calculate total columns in song mode based on placed clips
  const getSongTotalCols = () => {
    const { songGrid } = useProjectStore.getState();
    const PATTERN_COLS = 16;
    // find max placed block across all patterns
    let maxBlock = -1;
    for (const set of Object.values(songGrid)) {
      if (!set || set.size === 0) continue;
      const localMax = Math.max(...Array.from(set));
      if (localMax > maxBlock) maxBlock = localMax;
    }
    const totalBlocks = (maxBlock >= 0 ? maxBlock + 1 : 0); // 0 if nothing placed
    // if nothing is placed, keep at least 1 block so the transport ticks
    return Math.max(1, totalBlocks * PATTERN_COLS);
  };

  const tick = useCallback((time: number) => {
    const current = useTransportStore.getState().step;
    // Play the current column
    playColumnAt(current, time);
    // Advance step, looping back to 0
    const { playMode } = useProjectStore.getState();
    const total = playMode === 'pattern' ? COLS : getSongTotalCols();
    const next = (current + 1) % total;
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
    if (repeatIdRef.current !== undefined) {
      transport.clear(repeatIdRef.current);
      repeatIdRef.current = undefined;
    }
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
      <button
        className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white"
        onClick={() => saveProjectToDisk()}
      >
        Save
      </button>
      <button
        className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white"
        onClick={() => loadProjectFromDisk()}
      >
        Load
      </button>
      {/* Play mode buttons */}
      <div className="flex flex-col">
        <button
          className={`px-1 py-1 text-sm rounded-t ${playMode === 'pattern' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-200'}`}
          onClick={() => {
            setPlayMode('pattern');
            // Reset step if out of bounds for pattern mode
            const s = useTransportStore.getState().step;
            if (s >= COLS) useTransportStore.getState().setStep(0);
          }}
        >
          Pattern
        </button>
        <button
          className={`px-1 py-1 text-sm rounded-b ${playMode === 'song' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-200'}`}
          onClick={() => {
            setPlayMode('song');
            const total = Math.max(1, songBlocks * PATTERN_COLS);
            const s = useTransportStore.getState().step;
            if (s >= total) useTransportStore.getState().setStep(0);
          }}
        >
          Song
        </button>
      </div>

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

      {playMode === 'pattern' ? (
        <span className="ml-4 text-sm text-gray-600">Step: {step + 1}/{COLS}</span>
      ) : (
        <span className="ml-4 text-sm text-gray-600">Step: {step + 1}/{getSongTotalCols()}</span>
      )}

      < PatternControls />

      <div className="flex">
        {viewMode !== 'song' ? (
          <button
            className={'text-white bg-gray-700 hover:bg-gray-800 rounded-lg px-2 py-1'}
            onClick={() => setViewMode('song')}
          >
            View Song Grid
          </button>
        ) : (
          <button
            className={'text-white bg-gray-700 hover:bg-gray-800 rounded-lg px-2 py-1'}
            onClick={() => setViewMode('pattern')}
          >
            Hide Song Grid
          </button>
        )}
      </div>
    </div>
  );
}