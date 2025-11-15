'use client';

import { useState, useRef, useEffect } from 'react';
import { saveProjectToDisk, loadProjectFromDisk } from '../../../lib/io';
import { useProjectStore } from '../../../store/project';

// File menu component with New, Open, and Save options
export default function FileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const resetProject = useProjectStore((state) => state.resetProject);

  // Close menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="mb-2 px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
        onClick={() => setOpen(!open)}
      >
        File ▾
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-40 rounded border border-gray-700 bg-gray-900 text-gray-200 shadow-lg">
          <button
            className="w-full text-left px-3 py-2 text-red-300 hover:bg-gray-800"
            onClick={() => {
              setOpen(false);
              const ok = window.confirm('Start a new project? Unsaved changes will be lost.');
              if (ok) resetProject();
            }}
          >
            New Project
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-800"
            onClick={async () => { setOpen(false); await loadProjectFromDisk(); }}
          >
            Open...
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-800"
            onClick={async () => { setOpen(false); await saveProjectToDisk(); }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}