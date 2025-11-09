'use client';
import PatternGrid from './components/pattern-grid';
import SongGrid from './components/song-grid';
import TransportBar from './components/transport-bar';
import InstrumentRack from './components/instrument-rack';
import { useProjectStore } from './store/project';

export default function Home() {
  const { projectName, viewMode } = useProjectStore();

  return (
    <div className="p-2">
      <h1>{projectName}</h1>
      <TransportBar />
      <div className="flex">
        <InstrumentRack />
        <div className="col-auto">
          <PatternGrid />
          {viewMode === 'song' ? (
            <div className="mt-3"><SongGrid /></div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
