'use client';
import Grid from './grid';
import Toolbar from './toolbar';

export default function Home() {

  return (
    <div className="p-2">
      <h1>Web Daw</h1>
      <Toolbar />
      <Grid />
    </div>
  );
}
