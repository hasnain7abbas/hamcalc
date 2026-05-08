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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 p-4 min-h-0">
        <div className="flex flex-col gap-4 min-w-0">
          <MatrixGrid />
          <ParametersPanel />
          <Keyboard />
        </div>
        <div className="min-w-0 min-h-0 flex flex-col">
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
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-ink-950/60 backdrop-blur">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <div>
          <div className="font-semibold leading-tight">HamCalc</div>
          <div className="text-xs text-slate-400 leading-tight">
            Symbolic Hamiltonian Solver
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onResize} className="btn">
          <span className="font-mono text-brand-400 mr-1">{rows}×{cols}</span>
          <span>resize</span>
        </button>
        <button onClick={onReset} className="btn">
          reset
        </button>
        <button onClick={onSolve} className="btn-primary">
          Solve
          <span className="ml-2 text-xs opacity-75 font-mono">Ctrl+↵</span>
        </button>
      </div>
    </header>
  );
}

function Footer({ hasResult }: { hasResult: boolean }) {
  return (
    <footer className="px-4 py-2 text-xs text-slate-500 border-t border-white/5 flex items-center justify-between">
      <span>
        Type <span className="font-mono text-slate-300">\alpha</span>,{" "}
        <span className="font-mono text-slate-300">\hbar</span>,{" "}
        <span className="font-mono text-slate-300">\dag</span> on a hardware
        keyboard, or use the on-screen keyboard.
      </span>
      <span>
        {hasResult ? "✓ ready" : "—"} · v0.1
      </span>
    </footer>
  );
}

export default App;
