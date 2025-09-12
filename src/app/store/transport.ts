'use client';
import { create } from 'zustand';

type TransportState = {
  isPlaying: boolean;
  bpm: number;
  step: number;
  setIsPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  setStep: (step: number) => void;
};

// Zustand store for transport state
export const useTransportStore = create<TransportState>((set) => ({
  isPlaying: false,
  bpm: 120,
  step: 0,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setBpm: (bpm) => set({ bpm }),
  setStep: (step) => set({ step }),
}));