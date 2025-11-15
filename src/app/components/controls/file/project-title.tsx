'use client';

import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../../store/project';

// Component to display and edit the project title
export default function ProjectTitle() {
  const name = useProjectStore((state) => state.projectName);
  const setName = useProjectStore((state) => state.setProjectName);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    // keep local draft in sync if store changes externally (e.g., load)
    if (!isEditing) setDraft(name);
  }, [name, isEditing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) setName(trimmed);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(name);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center">
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            className="mx-1 mb-1 px-2 py-1 rounded bg-gray-900 text-white border border-gray-700 w-[18ch]"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
            aria-label="Project name"
          />
          <button
            className="px-1 py-0.5 text-xs rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
            onClick={() => setIsEditing(true)}
            title="Save renamed project"
            aria-label="Save renamed project"
          >
            Save Title
          </button>
          <button
            className="px-1 py-0.5 text-xs rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
            onClick={() => setIsEditing(true)}
            title="Cancel renaming project"
            aria-label="Cancel renaming project"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <h1 className="mx-2 mb-2 text-lg font-semibold text-white">{name}</h1>
          <button
            className="px-1 py-0.5 text-xs rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
            onClick={() => setIsEditing(true)}
            title="Rename project"
            aria-label="Rename project"
          >
            ✎
          </button>
        </>
      )}
    </div>
  );
}