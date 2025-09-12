'use client';
import Grid from './components/grid';
import Toolbar from './components/toolbar';

export default function Home() {

  return (
    <div className="p-2">
      <h1>Web Daw</h1>
      <Toolbar />
      <Grid />
    </div>
  );
}
