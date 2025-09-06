'use client';
import * as Tone from 'tone';
import Grid from './grid';

export default function Home() {
  const playBeep = async () => {
    await Tone.start(); // unlocks audio context
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n"); // plays a middle C for an eighth note
  };

  return (
    <div className="p-2">
      <h1>Hello Daw</h1>
      <button onClick={playBeep}>Beep</button>
      <Grid />
    </div>
  );
}
