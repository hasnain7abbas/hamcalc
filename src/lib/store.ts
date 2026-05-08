// Zustand store: matrix size, cell strings, cursor, parameter substitutions,
// and the most-recent solve result.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { solve, type SolveResult } from "./solver/solver";

const STORAGE_KEY = "hamcalc-state-v1";

export type CellPos = { i: number; j: number };

type State = {
  rows: number;
  cols: number;
  cells: string[][];
  cursor: CellPos;
  numericSubs: Record<string, number>;
  result: SolveResult | null;
  solving: boolean;
  showSizeModal: boolean;
};

type Actions = {
  resize: (rows: number, cols: number) => void;
  setCell: (i: number, j: number, value: string) => void;
  insertAtCursor: (snippet: string, opts?: { wrapBraces?: boolean }) => void;
  setCursor: (i: number, j: number) => void;
  moveCursor: (dx: number, dy: number) => void;
  setNumericSub: (name: string, value: number | null) => void;
  runSolve: () => void;
  loadJSON: (state: Partial<State>) => void;
  reset: () => void;
  setShowSizeModal: (show: boolean) => void;
};

function emptyGrid(r: number, c: number): string[][] {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => ""));
}

function preserveGrid(prev: string[][], r: number, c: number): string[][] {
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => prev[i]?.[j] ?? "")
  );
}

const initial: State = {
  rows: 2,
  cols: 2,
  cells: emptyGrid(2, 2),
  cursor: { i: 0, j: 0 },
  numericSubs: {},
  result: null,
  solving: false,
  showSizeModal: true,
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      resize: (rows, cols) =>
        set((s) => ({
          rows,
          cols,
          cells: preserveGrid(s.cells, rows, cols),
          cursor: { i: 0, j: 0 },
          showSizeModal: false,
        })),
      setCell: (i, j, value) =>
        set((s) => {
          const next = s.cells.map((row) => row.slice());
          next[i][j] = value;
          return { cells: next };
        }),
      insertAtCursor: (snippet, opts) =>
        set((s) => {
          const { i, j } = s.cursor;
          const next = s.cells.map((row) => row.slice());
          const cur = next[i]?.[j] ?? "";
          const insertion = opts?.wrapBraces ? `${snippet}{}` : snippet;
          next[i][j] = cur + insertion;
          return { cells: next };
        }),
      setCursor: (i, j) => set({ cursor: { i, j } }),
      moveCursor: (di, dj) =>
        set((s) => {
          const i = Math.max(0, Math.min(s.rows - 1, s.cursor.i + di));
          const j = Math.max(0, Math.min(s.cols - 1, s.cursor.j + dj));
          return { cursor: { i, j } };
        }),
      setNumericSub: (name, value) =>
        set((s) => {
          const next = { ...s.numericSubs };
          if (value === null || Number.isNaN(value)) delete next[name];
          else next[name] = value;
          return { numericSubs: next };
        }),
      runSolve: () => {
        set({ solving: true });
        // tiny defer so UI shows the spinner even on fast solves
        setTimeout(() => {
          const s = get();
          try {
            const result = solve({
              rows: s.rows,
              cols: s.cols,
              cells: s.cells,
              numericSubs: s.numericSubs,
              options: { timeoutMs: 10000 },
            });
            set({ result, solving: false });
          } catch (e: any) {
            set({
              result: {
                ok: false,
                symbolic: false,
                freeSymbols: [],
                matrixLatex: "",
                trace: { latex: "" },
                warnings: [],
                error: String(e?.message ?? e),
              },
              solving: false,
            });
          }
        }, 30);
      },
      loadJSON: (st) =>
        set((s) => ({
          rows: st.rows ?? s.rows,
          cols: st.cols ?? s.cols,
          cells: st.cells ?? s.cells,
          cursor: st.cursor ?? s.cursor,
          numericSubs: st.numericSubs ?? s.numericSubs,
          result: null,
        })),
      reset: () => set(initial),
      setShowSizeModal: (show) => set({ showSizeModal: show }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        rows: s.rows,
        cols: s.cols,
        cells: s.cells,
        numericSubs: s.numericSubs,
      }),
    }
  )
);
