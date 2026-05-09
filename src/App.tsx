import { useEffect } from "react";
import { useStore } from "./lib/store";
import { SizeModal } from "./components/SizeModal";
import { MatrixGrid } from "./components/MatrixGrid";
import { Keyboard } from "./components/Keyboard";
import { OutputPanel } from "./components/OutputPanel";
import { ParametersPanel } from "./components/ParametersPanel";

function App() {
  const showSizeModal = useStore((s) => s.showSizeModal);
  const setShow = useStore((s) => s.setShowSizeModal);
  const rows = useStore((s) => s.rows);
  const cols = useStore((s) => s.cols);
  const runSolve = useStore((s) => s.runSolve);
  const reset = useStore((s) => s.reset);
  const result = useStore((s) => s.result);

  // Global keyboard shortcut: Ctrl+Enter to solve.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runSolve();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runSolve]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onResize={() => setShow(true)}
        onSolve={runSolve}
        onReset={reset}
        rows={rows}
        cols={cols}
      />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3 sm:gap-4 p-3 sm:p-4 min-h-0">
        <div className="flex flex-col gap-3 sm:gap-4 min-w-0 order-1">
          <MatrixGrid />
          <ParametersPanel />
          <Keyboard />
        </div>
        <div className="min-w-0 min-h-0 flex flex-col order-2 lg:order-2">
          <OutputPanel />
        </div>
      </main>
      <Footer hasResult={!!result?.ok} />
      <SizeModal />
    </div>
  );
}

function Header({
  onResize,
  onSolve,
  onReset,
  rows,
  cols,
}: {
  onResize: () => void;
  onSolve: () => void;
  onReset: () => void;
  rows: number;
  cols: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5 bg-ink-950/80 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate">HamCalc</div>
          <div className="text-[10px] sm:text-xs text-slate-400 leading-tight truncate">
            Symbolic Hamiltonian Solver
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button onClick={onResize} className="btn !px-2 sm:!px-3" title="Resize matrix">
          <span className="font-mono text-brand-400 sm:mr-1">{rows}×{cols}</span>
          <span className="hidden sm:inline">resize</span>
        </button>
        <button onClick={onReset} className="btn hidden sm:inline-flex">
          reset
        </button>
        <button onClick={onSolve} className="btn-primary">
          Solve
          <span className="ml-2 text-xs opacity-75 font-mono hidden sm:inline">Ctrl+↵</span>
        </button>
      </div>
    </header>
  );
}

function Footer({ hasResult }: { hasResult: boolean }) {
  return (
    <footer
      className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-slate-500 border-t border-white/5 flex items-center justify-between gap-3"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <span className="hidden sm:inline truncate">
        Type <span className="font-mono text-slate-300">\alpha</span>,{" "}
        <span className="font-mono text-slate-300">\hbar</span>,{" "}
        <span className="font-mono text-slate-300">\dag</span> on a hardware
        keyboard, or use the on-screen keyboard.
      </span>
      <span className="sm:hidden truncate">Tap a cell, then use the keyboard below.</span>
      <span className="flex-shrink-0">
        {hasResult ? "✓ ready" : "—"} · v0.1
      </span>
    </footer>
  );
}

export default App;
