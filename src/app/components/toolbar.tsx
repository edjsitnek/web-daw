'use client';

import Image from 'next/image';

export interface ToolbarProps {
  isPlaying: boolean;
  onPlay: () => Promise<void>;
  onPause: () => void;
  onStop: () => void;
}

// Toolbar component with play, pause, and stop buttons
export default function Toolbar({ isPlaying, onPlay, onPause, onStop }: ToolbarProps) {
  return (
    <div className="flex gap-1">
      {!isPlaying ? (
        <button
          className="text-white bg-gray-700 hover:bg-gray-800 rounded-xl p-2.5"
          aria-label="Play button"
          onClick={onPlay}
        >
          <Image
            src="/svgs/play-svgrepo-com.svg"
            alt="Play icon"
            width={25}
            height={25}
          />
        </button>
      ) : (
        <button
          className="text-white bg-gray-700 hover:bg-gray-800 rounded-xl p-2.5"
          aria-label="Pause button"
          onClick={onPause}
        >
          <Image
            src="/svgs/pauze-svgrepo-com.svg"
            alt="Pause icon"
            width={25}
            height={25}
          />
        </button>
      )}
      <button
        className="text-white bg-gray-700 hover:bg-gray-800 rounded-xl p-2.5"
        aria-label="Stop button"
        onClick={onStop}
      >
        <Image
          src="/svgs/stop-svgrepo-com.svg"
          alt="Stop icon"
          width={25}
          height={25}
        />
      </button>
    </div>
  );
};