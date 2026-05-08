import { useState } from "react";
import { useStore } from "../lib/store";

export function SizeModal() {
  const show = useStore((s) => s.showSizeModal);
  const setShow = useStore((s) => s.setShowSizeModal);
  const resize = useStore((s) => s.resize);
  const currentRows = useStore((s) => s.rows);
  const currentCols = useStore((s) => s.cols);
  const [rows, setRows] = useState(currentRows);
  const [cols, setCols] = useState(currentCols);

  if (!show) return null;

  const presets: [number, number, string][] = [
    [2, 2, "Two-level (Rabi, qubit)"],
    [3, 3, "Three-level / spin-1"],
    [4, 4, "Two qubits / 4-level"],
    [6, 6, "6-level (max symbolic)"],
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="panel w-[440px] p-6">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-9 w-9" />
          <div>
            <div className="font-semibold text-lg">HamCalc</div>
            <div className="text-xs text-slate-400">
              Choose the matrix shape to begin.
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-slate-400 mb-1">Rows</span>
            <input
              type="number"
              min={1}
              max={64}
              value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(64, Number(e.target.value) || 1)))}
              className="w-full rounded-md border border-white/10 bg-ink-800 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-400 mb-1">Cols</span>
            <input
              type="number"
              min={1}
              max={64}
              value={cols}
              onChange={(e) => setCols(Math.max(1, Math.min(64, Number(e.target.value) || 1)))}
              className="w-full rounded-md border border-white/10 bg-ink-800 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Or pick a preset
          </div>
          <div className="grid grid-cols-2 gap-2">
            {presets.map(([r, c, label]) => (
              <button
                key={label}
                onClick={() => {
                  setRows(r);
                  setCols(c);
                }}
                className="btn justify-start text-left"
              >
                <span className="font-mono text-brand-400 mr-2">{r}×{c}</span>
                <span className="text-slate-300 text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Symbolic eigenvalues for n ≤ 4 work cleanly. Numeric mode handles up
          to 64×64.
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {currentRows > 0 && (
            <button onClick={() => setShow(false)} className="btn-ghost">
              Cancel
            </button>
          )}
          <button
            onClick={() => resize(rows, cols)}
            className="btn-primary"
            autoFocus
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
