import { useEffect, useState } from "react";
import { useStore } from "./lib/store";
import { SizeModal } from "./components/SizeModal";
import { MatrixGrid } from "./components/MatrixGrid";
import { Keyboard } from "./components/Keyboard";
import { OutputPanel } from "./components/OutputPanel";
import { ParametersPanel } from "./components/ParametersPanel";
import { AboutDialog } from "./components/AboutDialog";

function App() {
  const showSizeModal = useStore((s) => s.showSizeModal);
  const setShow = useStore((s) => s.setShowSizeModal);
  const rows = useStore((s) => s.rows);
  const cols = useStore((s) => s.cols);
  const runSolve = useStore((s) => s.runSolve);
  const reset = useStore((s) => s.reset);
  const result = useStore((s) => s.result);
  const [showAbout, setShowAbout] = useState(false);

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
      <Footer hasResult={!!result?.ok} onAbout={() => setShowAbout(true)} />
      <SizeModal />
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
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
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5 bg-ink-950/40 backdrop-blur-xl"
      style={{
        paddingTop: "calc(0.5rem + env(safe-area-inset-top))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
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

function Footer({
  hasResult,
  onAbout,
}: {
  hasResult: boolean;
  onAbout: () => void;
}) {
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
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
        <button
          onClick={onAbout}
          className="text-slate-400 transition-colors hover:text-brand-300"
        >
          by Hasnain Abbas
        </button>
        <span className="text-white/10">·</span>
        <a
          href="https://github.com/hasnain7abbas/hamcalc"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-slate-400 transition-colors hover:text-brand-300"
          aria-label="GitHub repository"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <span className="text-white/10">·</span>
        <span>{hasResult ? "✓ ready" : "—"} · v0.1</span>
      </div>
    </footer>
  );
}

export default App;
