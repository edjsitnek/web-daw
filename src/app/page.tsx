'use client';
import Grid from './components/grid';
import TransportBar from './components/transport-bar';

export default function Home() {

  return (
    <div className="p-2">
      <h1>Web Daw</h1>
      <TransportBar />
      <Grid />
    </div>
  );
}
