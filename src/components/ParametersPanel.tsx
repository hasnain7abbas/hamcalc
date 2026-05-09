import { useMemo } from "react";
import { useStore } from "../lib/store";
import { parseGrid, collectFreeSymbols } from "../lib/solver/solver";
import { symbolToLatex } from "../lib/latex/render";
import { Tex } from "./Tex";

export function ParametersPanel() {
  const cells = useStore((s) => s.cells);
  const subs = useStore((s) => s.numericSubs);
  const setSub = useStore((s) => s.setNumericSub);

  const symbols = useMemo(() => {
    const { nodes, errors } = parseGrid(cells);
    if (errors.length > 0) return [];
    return collectFreeSymbols(nodes);
  }, [cells]);

  if (symbols.length === 0) {
    return (
      <div className="panel p-3 sm:p-4">
        <div className="text-sm font-semibold text-slate-200 mb-1">
          Parameters
        </div>
        <div className="text-xs text-slate-500">
          No free symbols detected. Enter symbols (ω, g, ℏ, …) in the matrix to
          bind numeric values here.
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-3 sm:p-4">
      <div className="text-sm font-semibold text-slate-200 mb-1">
        Numeric values
      </div>
      <div className="text-xs text-slate-500 mb-3">
        Bind any/all symbols to compute numeric eigenvalues, eigenvectors, and{" "}
        the time-evolution unitary <Tex>{"U(t)"}</Tex>.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {symbols.map((sym) => (
          <div key={sym} className="flex items-center gap-2">
            <div className="w-12 text-right">
              <Tex>{symbolToLatex(sym)}</Tex>
            </div>
            <span className="text-slate-500">=</span>
            <input
              type="number"
              step="any"
              value={sym in subs ? subs[sym] : ""}
              placeholder="—"
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") setSub(sym, null);
                else setSub(sym, Number(v));
              }}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md px-2 py-1.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
