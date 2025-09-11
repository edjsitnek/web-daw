import Image from 'next/image';
import { useState } from 'react';

export default function Toolbar() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex gap-1">
      {/* Toolbar with play, pause, stop buttons */}
      {!isPlaying ? (
        <button
          className="text-white bg-gray-700 hover:bg-gray-800 rounded-xl p-2.5"
          aria-label="Play button"
          onClick={() => setIsPlaying(!isPlaying)}
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
          onClick={() => setIsPlaying(!isPlaying)}
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