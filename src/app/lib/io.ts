import { useProjectStore } from "../store/project";
import { useTransportStore } from "../store/transport";
import type { CellKey, PatternId } from "./types";

type SaveFileV1 = {
  version: 1;
  projectName: string;
  patterns: { id: string; name: string }[];
  currentPatternId: string;
  instrumentOrder: string[];
  instruments: Record<string, { id: string; name: string; kind: 'synth' | 'drum'; voice?: string }>;
  patternGrids: Record<PatternId, Record<string, CellKey[]>>;
  songGrid: Record<PatternId, number[]>;
  bpm: number;
};

export function exportProject(): SaveFileV1 {
  const p = useProjectStore.getState();
  const t = useTransportStore.getState();

  // serialize patternGrids (set to array)
  const pg: SaveFileV1['patternGrids'] = {};
  for (const [pid, grid] of Object.entries(p.patternGrids)) {
    // for each pattern, serialize each instrument's Set to an Array
    const g: Record<string, CellKey[]> = {};
    for (const [instId, set] of Object.entries(grid)) {
      g[instId] = Array.from(set ?? []);
    }
    pg[pid] = g;
  }

  // serialize songGrid (set to array)
  const sg: SaveFileV1['songGrid'] = {};
  for (const [pid, set] of Object.entries(p.songGrid)) {
    sg[pid] = Array.from(set ?? []);
  }

  // instruments (lightweight metadata only)
  const instrumentsMeta: SaveFileV1['instruments'] = {};
  for (const id of p.instrumentOrder) {
    const inst = p.instruments[id];
    if (!inst) continue;
    instrumentsMeta[id] = {
      id,
      name: inst.name,
      kind: inst.kind,
      voice: inst.kind === 'drum' ? inst.voice : undefined,
    };
  }

  return {
    version: 1,
    projectName: p.projectName,
    patterns: p.patterns,
    currentPatternId: p.currentPatternId,
    instrumentOrder: p.instrumentOrder,
    instruments: instrumentsMeta,
    patternGrids: pg,
    songGrid: sg,
    bpm: t.bpm ?? 120,
  };
}

export function importProject(data: unknown) {
  const s = data as Partial<SaveFileV1>;
  if (s.version !== 1) throw new Error('Unsupported save file version');

  // Rebuild Sets
  const pg: Record<string, Record<string, Set<CellKey>>> = {};
  for (const [pid, grid] of Object.entries(s.patternGrids ?? {})) {
    const g: Record<string, Set<CellKey>> = {};
    for (const [instId, arr] of Object.entries(grid ?? {})) {
      g[instId] = new Set(arr as CellKey[]);
    }
    pg[pid] = g;
  }

  const sg: Record<string, Set<number>> = {};
  for (const [pid, arr] of Object.entries(s.songGrid ?? {})) {
    sg[pid] = new Set(arr as number[]);
  }

  useProjectStore.setState(state => ({
    ...state,
    projectName: s.projectName ?? state.projectName,
    patterns: s.patterns ?? state.patterns,
    currentPatternId: s.currentPatternId ?? state.currentPatternId,
    instrumentOrder: s.instrumentOrder ?? state.instrumentOrder,
    instruments: {
      ...state.instruments,
      ...Object.fromEntries(
        Object.entries(s.instruments ?? {}).map(([id, meta]) => {
          const old = state.instruments[id];
          return [id, { ...old, name: meta?.name ?? old?.name }];
        })
      ),
    },
    patternGrids: Object.keys(pg).length ? pg : state.patternGrids,
    songGrid: Object.keys(sg).length ? sg : state.songGrid,
  }));

  // update transport (BPM) after project state is set
  if (typeof s.bpm === 'number') {
    const { setBpm } = useTransportStore.getState();
    if (setBpm) setBpm(s.bpm);
  }
}

function defaultFileName(): string {
  const { projectName } = useProjectStore.getState();
  const safeName = (projectName || 'Untitled Project').replace(/[\\/:*?"<>|]+/g, '_');
  return `${safeName}.json`;
}

export async function saveProjectToDisk(): Promise<void> {
  try {
    const data = exportProject();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const name = defaultFileName();

    // File System Access API (Chromium)
    const hasPicker = 'showSaveFilePicker' in window;
    if (hasPicker) {
      // @ts-ignore - TS doesn’t know the picker yet
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'DAW Project', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    // Fallback: download attribute (suggest name, no location choice)
    // Fallback
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    // Silently ignore user cancels; rethrow other errors
    if (err instanceof DOMException && err.name === 'AbortError') return;
    // Some Chromium builds throw a plain Error with message containing 'aborted'
    if (err && typeof err === 'object' && 'message' in err && String((err as any).message).toLowerCase().includes('aborted')) return;
    console.error('Save failed:', err);
  }
}

export async function loadProjectFromDisk(): Promise<void> {
  try {
    // File System Access API open picker if available
    // @ts-ignore
    if ('showOpenFilePicker' in window) {
      // @ts-ignore
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'DAW Project', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      importProject(JSON.parse(text));
      // Use file name to set projectName if absent
      const base = file.name.replace(/\.json$/i, 'Untitled Project');
      if (!useProjectStore.getState().projectName) {
        useProjectStore.getState().setProjectName?.(base);
      }
      return;
    }

    // Fallback: dynamically create an <input type="file"> and read the chosen file
    await new Promise<void>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        try {
          const file = input.files?.[0];
          if (!file) return resolve(); // cancel in fallback
          const text = await file.text();
          importProject(JSON.parse(text));
          const base = file.name.replace(/\.json$/i, '');
          if (!useProjectStore.getState().projectName) {
            useProjectStore.getState().setProjectName?.(base);
          }
        } finally {
          resolve();
        }
      };
      input.click();
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    if (err && typeof err === 'object' && 'message' in err && String((err as any).message).toLowerCase().includes('aborted')) return;
    console.error('Open failed:', err);
  }
}