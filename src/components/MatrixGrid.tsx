import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import { parseCell } from "../lib/parser/parse";
import { nodeToLatex } from "../lib/latex/render";
import { applyShortcuts } from "../lib/shortcuts";
import { Tex } from "./Tex";

export function MatrixGrid() {
  const rows = useStore((s) => s.rows);
  const cols = useStore((s) => s.cols);
  const cells = useStore((s) => s.cells);
  const cursor = useStore((s) => s.cursor);
  const setCell = useStore((s) => s.setCell);
  const setCursor = useStore((s) => s.setCursor);

  return (
    <div className="panel p-3 sm:p-6 overflow-auto">
      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="text-brand-400">{rows}×{cols}</span>
        <span>matrix</span>
      </div>

      <div className="flex items-stretch min-w-min">
        {/* Left bracket */}
        <div className="w-2 sm:w-3 border-l-2 border-y-2 border-slate-300/80 rounded-l-md mr-1.5 sm:mr-2 flex-shrink-0" />

        <div
          className="grid gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(6rem, 1fr))`,
          }}
        >
          {Array.from({ length: rows }).map((_, i) =>
            Array.from({ length: cols }).map((__, j) => (
              <Cell
                key={`${i}-${j}`}
                i={i}
                j={j}
                value={cells[i]?.[j] ?? ""}
                active={cursor.i === i && cursor.j === j}
                onChange={(v) => setCell(i, j, applyShortcuts(v))}
                onFocus={() => setCursor(i, j)}
              />
            ))
          )}
        </div>

        {/* Right bracket */}
        <div className="w-2 sm:w-3 border-r-2 border-y-2 border-slate-300/80 rounded-r-md ml-1.5 sm:ml-2 flex-shrink-0" />
      </div>
    </div>
  );
}

function Cell({
  i,
  j,
  value,
  active,
  onChange,
  onFocus,
}: {
  i: number;
  j: number;
  value: string;
  active: boolean;
  onChange: (v: string) => void;
  onFocus: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const moveCursor = useStore((s) => s.moveCursor);
  const rows = useStore((s) => s.rows);
  const cols = useStore((s) => s.cols);

  useEffect(() => {
    if (active && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [active]);

  const parsed = value.trim() ? parseCell(value) : null;
  const status: "empty" | "ok" | "err" = !parsed
    ? "empty"
    : parsed.ok
      ? "ok"
      : "err";

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (j > 0) moveCursor(0, -1);
        else if (i > 0) {
          // jump to end of previous row
          const nextI = i - 1;
          useStore.getState().setCursor(nextI, cols - 1);
        }
      } else {
        if (j < cols - 1) moveCursor(0, 1);
        else if (i < rows - 1) useStore.getState().setCursor(i + 1, 0);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (i < rows - 1) moveCursor(1, 0);
    } else if (e.key === "ArrowDown" && !value) {
      e.preventDefault();
      moveCursor(1, 0);
    } else if (e.key === "ArrowUp" && !value) {
      e.preventDefault();
      moveCursor(-1, 0);
    }
    // Hardware shortcut layer: \alpha → α, etc., handled by handler in App
  };

  return (
    <div className={`group relative flex flex-col`}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKey}
        spellCheck={false}
        autoComplete="off"
        inputMode="text"
        autoCapitalize="off"
        autoCorrect="off"
        className={[
          "w-full rounded-lg px-2.5 py-2 text-base sm:text-sm font-mono bg-white/[0.04] backdrop-blur-md border focus:outline-none transition-colors",
          status === "ok"
            ? "border-emerald-400/40 focus:border-emerald-300"
            : status === "err"
              ? "border-rose-400/50 focus:border-rose-300"
              : "border-white/10 focus:border-brand-400",
          active ? "ring-2 ring-brand-400/50" : "",
        ].join(" ")}
        placeholder=""
        aria-label={`row ${i + 1}, column ${j + 1}`}
      />
      <div className="mt-1 min-h-[1.5rem] px-1 text-slate-300 cell-katex">
        {parsed?.ok ? (
          <Tex>{nodeToLatex(parsed.node)}</Tex>
        ) : status === "err" ? (
          <span className="text-rose-400 text-xs">parse error</span>
        ) : (
          <span className="text-slate-500 text-xs">·</span>
        )}
      </div>
    </div>
  );
}
