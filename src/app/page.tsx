'use client';
import Grid from './components/grid';
import TransportBar from './components/transport-bar';
import InstrumentRack from './components/instrument-rack';

export default function Home() {

  return (
    <div className="p-2">
      <h1>Web Daw</h1>
      <TransportBar />
      <div className="flex">
        <InstrumentRack />
        <Grid />
      </div>

    </div>
  );
}
