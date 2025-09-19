import { useProjectStore } from "../store/project";
import { PITCHES, DEFAULT_COLS } from "../lib/config";

const RACK_MIDI = 60; // C4
const RACK_ROW = PITCHES.indexOf(RACK_MIDI); // shared row for all instruments

export default function InstrumentRack() {
  const {
    instruments,
    instrumentOrder,
    selectedInstrumentId,
    selectInstrument,
    toggleCellFor,
    toggleMute,
    toggleSolo,
  } = useProjectStore();

  return (
    <div className="space-y-2">
      {instrumentOrder.map((id) => {
        const inst = instruments[id];
        if (!inst) return null;
        const isSelected = id === selectedInstrumentId;

        return (
          <div
            key={id}
            className={[
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
              isSelected ? "border-blue-400 bg-blue-50/50" : "border-gray-200",
            ].join(" ")}
          >
            {/* Left: Mute / Solo */}
            <div className="flex items-center gap-2">
              <button
                className={[
                  "px-2 py-1 text-xs rounded border",
                  inst.muted ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 hover:bg-gray-100",
                ].join(" ")}
                onClick={() => toggleMute(id)}
                title="Mute"
              >
                M
              </button>
              <button
                className={[
                  "px-2 py-1 text-xs rounded border",
                  inst.solo ? "bg-amber-500 text-white border-amber-500" : "border-gray-300 hover:bg-gray-100",
                ].join(" ")}
                onClick={() => toggleSolo(id)}
                title="Solo"
              >
                S
              </button>
            </div>
            {/* Middle: name (click to select on grid) */}
            <button
              className="text-sm font-medium truncate hover:underline"
              onClick={() => selectInstrument(id)}
              title="Select instrument"
            >
              {inst.name ?? id}
            </button>

            {/* Right: 16 step buttons bound to C4 row */}
            <div className="flex items-center gap-1">
              {Array.from({ length: DEFAULT_COLS }).map((_, col) => {
                const key: `${number}:${number}` = `${RACK_ROW}:${col}`;
                const isOn = inst.cells.has(key);

                // Alternate tint every group of 4 steps
                const barIndex = Math.floor(col / 4);
                const barBg = barIndex % 2 === 0 ? "bg-neutral-100" : "bg-neutral-400"

                return (
                  <button
                    key={col}
                    onClick={(e) => {
                      e.stopPropagation(); // don’t accidentally trigger select
                      toggleCellFor(id, RACK_ROW, col); // target this instrument
                    }}
                    aria-pressed={isOn}
                    className={[
                      "h-5 w-3 rounded border transition",
                      barBg,                               // base tint for this bar
                      "hover:bg-blue-100",                  // hover works on top of base
                      "aria-[pressed=true]:bg-blue-500",   // active blue overrides tint
                      "aria-[pressed=true]:border-blue-500",
                      "border-gray-300",
                      col % 4 === 0 ? "ml-1" : ""          // small gutter at bar boundaries
                    ].join(" ")}
                    title={`Step ${col + 1} @ C4`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
