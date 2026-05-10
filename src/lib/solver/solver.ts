// Solver pipeline. Given parsed cell strings and optional numeric
// substitutions for free symbols, compute eigenvalues, eigenvectors,
// characteristic polynomial, and the time-evolution operator.
//
// Strategy:
//   - If every cell evaluates to a number once subs are applied, run numeric
//     mode (math.js eigs).
//   - For 2x2 we attempt a closed-form symbolic eigenvalue expression.
//   - For all sizes we always produce the *symbolic* characteristic
//     polynomial coefficients via Faddeev-LeVerrier.

import {
  subtract,
  multiply,
  parse as mjParse,
  simplify,
  matrix,
  identity,
  complex,
  eigs as mjEigs,
  expm as mjExpm,
} from "mathjs";
import type { MathNode, Matrix as MjMatrix, Complex } from "mathjs";
import { freeSymbols, parseCell } from "../parser/parse";
import {
  nodeToLatex,
  matrixToLatex,
  formatScalar,
  vectorToLatex,
} from "../latex/render";
import { buildSteps, type StepSection } from "./steps";

export type CellNodes = (MathNode | null)[][];

export type SolveInput = {
  rows: number;
  cols: number;
  cells: string[][];
  numericSubs: Record<string, number>;
  options: {
    timeoutMs: number;
  };
};

export type SolveResult = {
  ok: boolean;
  symbolic: boolean;
  freeSymbols: string[];
  matrixLatex: string;
  trace: { latex: string; numeric?: number | Complex };
  determinant?: { latex: string; numeric?: number | Complex };
  rank?: number;
  hermitian?: boolean;
  unitary?: boolean;
  positiveDefinite?: boolean;
  charPolyLatex?: string;
  eigenvalues?: {
    latex: string;
    numeric?: number | Complex;
    multiplicity: number;
  }[];
  eigenvectors?: { eigenvalueLatex: string; vectorLatex: string }[];
  evolutionLatex?: string;
  numeric?: {
    matrix: (number | Complex)[][];
    eigenvalues: (number | Complex)[];
  };
  steps?: StepSection[];
  warnings: string[];
  error?: string;
};

export function parseGrid(cells: string[][]): {
  nodes: CellNodes;
  errors: { i: number; j: number; error: string }[];
} {
  const nodes: CellNodes = cells.map((row) => row.map(() => null));
  const errors: { i: number; j: number; error: string }[] = [];
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      const raw = (cells[i][j] ?? "").trim();
      if (!raw) {
        nodes[i][j] = mjParse("0");
        continue;
      }
      const r = parseCell(raw);
      if (r.ok) nodes[i][j] = r.node;
      else errors.push({ i, j, error: r.error });
    }
  }
  return { nodes, errors };
}

export function collectFreeSymbols(nodes: CellNodes): string[] {
  const all = new Set<string>();
  for (const row of nodes) {
    for (const n of row) {
      if (!n) continue;
      for (const s of freeSymbols(n)) all.add(s);
    }
  }
  return Array.from(all).sort();
}

function substituteCell(node: MathNode, subs: Record<string, number>): MathNode {
  let out: MathNode = node;
  for (const [k, v] of Object.entries(subs)) {
    out = out.transform((n: any) => {
      if (n.type === "SymbolNode" && n.name === k) return mjParse(String(v));
      return n;
    });
  }
  return out;
}

function evalNumeric(node: MathNode): number | Complex | null {
  try {
    const v = node.evaluate({});
    if (typeof v === "number") return v;
    if (v && typeof v === "object" && "re" in v && "im" in v) return v as Complex;
    return null;
  } catch {
    return null;
  }
}

function evalGridNumeric(
  nodes: CellNodes,
  subs: Record<string, number>
): (number | Complex)[][] | null {
  const out: (number | Complex)[][] = [];
  for (let i = 0; i < nodes.length; i++) {
    const row: (number | Complex)[] = [];
    for (let j = 0; j < nodes[i].length; j++) {
      const n = nodes[i][j];
      if (!n) return null;
      const sub = substituteCell(n, subs);
      const v = evalNumeric(sub);
      if (v === null) return null;
      row.push(v);
    }
    out.push(row);
  }
  return out;
}

function isHermitianNumeric(M: (number | Complex)[][], tol = 1e-9): boolean {
  const n = M.length;
  if (n === 0 || M[0].length !== n) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const a = M[i][j];
      const b = M[j][i];
      const ar = typeof a === "number" ? a : a.re;
      const ai = typeof a === "number" ? 0 : a.im;
      const br = typeof b === "number" ? b : b.re;
      const bi = typeof b === "number" ? 0 : b.im;
      if (Math.abs(ar - br) > tol) return false;
      if (Math.abs(ai + bi) > tol) return false;
    }
  }
  return true;
}

function conjTranspose(M: (number | Complex)[][]): (number | Complex)[][] {
  const n = M.length;
  const m = M[0].length;
  const out: (number | Complex)[][] = Array.from({ length: m }, () =>
    new Array(n).fill(0)
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const v = M[i][j];
      out[j][i] = typeof v === "number" ? v : complex(v.re, -v.im);
    }
  }
  return out;
}

function isUnitaryNumeric(M: (number | Complex)[][], tol = 1e-7): boolean {
  try {
    const A = matrix(M as any);
    const Ah = matrix(conjTranspose(M) as any);
    const prod = multiply(A, Ah) as MjMatrix;
    const I = identity(M.length) as MjMatrix;
    const diff = subtract(prod, I) as MjMatrix;
    const arr = (diff.toArray() as any[][]).flat();
    return arr.every((x: any) => {
      const r = typeof x === "number" ? Math.abs(x) : Math.hypot(x.re, x.im);
      return r < tol;
    });
  } catch {
    return false;
  }
}

// 2x2 symbolic eigenvalues.
function eig2x2Symbolic(nodes: CellNodes): {
  latex: string[];
  evectorsLatex: string[];
} {
  const a = nodes[0][0]!;
  const b = nodes[0][1]!;
  const c = nodes[1][0]!;
  const d = nodes[1][1]!;
  const halfTr = simplify(`((${a.toString()}) + (${d.toString()})) / 2`);
  const diff = simplify(
    `((${a.toString()}) - (${d.toString()})) / 2`
  );
  const disc = simplify(
    `(${diff.toString()})^2 + (${b.toString()})*(${c.toString()})`
  );
  const sq = `\\sqrt{${nodeToLatex(disc as MathNode)}}`;
  const ht = nodeToLatex(halfTr as MathNode);
  const lp = `${ht} + ${sq}`;
  const lm = `${ht} - ${sq}`;
  const evec = (lam: string) =>
    `\\begin{pmatrix} ${nodeToLatex(b as MathNode)} \\\\ ${lam} - \\left(${nodeToLatex(a as MathNode)}\\right) \\end{pmatrix}`;
  return {
    latex: [lp, lm],
    evectorsLatex: [
      evec(`\\left(${lp}\\right)`),
      evec(`\\left(${lm}\\right)`),
    ],
  };
}

// Faddeev-LeVerrier: characteristic polynomial coefficients for symbolic A.
function charPolyCoeffs(nodes: CellNodes): MathNode[] {
  const n = nodes.length;
  const A: MathNode[][] = nodes.map((row) =>
    row.map((nd) => (nd as MathNode) ?? (mjParse("0") as MathNode))
  );
  const coeffs: MathNode[] = new Array(n + 1).fill(null);
  coeffs[n] = mjParse("1");
  let M: MathNode[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => mjParse("0") as MathNode)
  );
  for (let k = 1; k <= n; k++) {
    const AM: MathNode[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => mjParse("0") as MathNode)
    );
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let acc = "0";
        for (let r = 0; r < n; r++) {
          acc = `(${acc}) + ((${A[i][r].toString()})*(${M[r][j].toString()}))`;
        }
        AM[i][j] = simplify(acc) as MathNode;
      }
    }
    const cprev = coeffs[n - k + 1];
    const Mk: MathNode[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        const idTerm = i === j ? `(${cprev.toString()})` : "0";
        return simplify(`(${AM[i][j].toString()}) + ${idTerm}`) as MathNode;
      })
    );
    let trAMk = "0";
    for (let i = 0; i < n; i++) {
      for (let r = 0; r < n; r++) {
        trAMk = `(${trAMk}) + ((${A[i][r].toString()})*(${Mk[r][i].toString()}))`;
      }
    }
    coeffs[n - k] = simplify(`-(1/${k}) * (${trAMk})`) as MathNode;
    M = Mk;
  }
  return coeffs;
}

function charPolyLatex(coeffs: MathNode[]): string {
  const n = coeffs.length - 1;
  const parts: string[] = [];
  for (let k = n; k >= 0; k--) {
    const cs = simplify(coeffs[k]).toString();
    if (cs === "0") continue;
    const ctex = nodeToLatex(simplify(coeffs[k]) as MathNode);
    if (k === 0) parts.push(ctex);
    else if (k === 1) {
      if (cs === "1") parts.push("\\lambda");
      else if (cs === "-1") parts.push("-\\lambda");
      else parts.push(`\\left(${ctex}\\right)\\lambda`);
    } else {
      if (cs === "1") parts.push(`\\lambda^{${k}}`);
      else if (cs === "-1") parts.push(`-\\lambda^{${k}}`);
      else parts.push(`\\left(${ctex}\\right)\\lambda^{${k}}`);
    }
  }
  let body = parts.join(" + ").replace(/\+\s*-/g, "- ");
  if (!body) body = "0";
  return `p(\\lambda) = ${body}`;
}

function numericEig(M: (number | Complex)[][]) {
  const A = matrix(M as any);
  const r: any = mjEigs(A as any);
  // Newer mathjs returns { values, eigenvectors: [{value, vector}] }
  const values: any[] = (Array.isArray(r.values)
    ? r.values
    : r.values.toArray
      ? r.values.toArray()
      : r.values) as any[];
  let vectors: any[][] = [];
  if (r.eigenvectors) {
    vectors = r.eigenvectors.map((ev: any) =>
      ev.vector?.toArray ? ev.vector.toArray() : ev.vector
    );
  } else if (r.vectors) {
    const v = r.vectors;
    const arr = v.toArray ? (v.toArray() as any[][]) : (v as any[][]);
    // columns are eigenvectors → transpose
    const n = arr.length;
    const m = arr[0]?.length ?? n;
    vectors = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
      for (let j = 0; j < m; j++) vectors[j][i] = arr[i][j];
  }
  return { values, vectors };
}

export function solve(input: SolveInput): SolveResult {
  const warnings: string[] = [];
  const { rows, cols, cells, numericSubs } = input;
  if (rows !== cols) {
    return {
      ok: false,
      symbolic: false,
      freeSymbols: [],
      matrixLatex: "",
      trace: { latex: "" },
      warnings,
      error: "Eigen-features require a square matrix.",
    };
  }
  const { nodes, errors } = parseGrid(cells);
  if (errors.length > 0) {
    return {
      ok: false,
      symbolic: false,
      freeSymbols: [],
      matrixLatex: "",
      trace: { latex: "" },
      warnings,
      error: `Parse error in cell (${errors[0].i + 1}, ${errors[0].j + 1}): ${errors[0].error}`,
    };
  }
  const free = collectFreeSymbols(nodes);
  const remaining = free.filter((s) => !(s in numericSubs));
  const symbolic = remaining.length > 0;

  const latexCells = nodes.map((row) =>
    row.map((n) => (n ? nodeToLatex(n) : "0")).join(" & ")
  );
  const matrixLatex = `H = \\begin{pmatrix} ${latexCells.join(" \\\\ ")} \\end{pmatrix}`;

  let trExpr: MathNode = mjParse("0");
  for (let i = 0; i < rows; i++) {
    trExpr = mjParse(`(${trExpr.toString()}) + (${nodes[i][i]!.toString()})`);
  }
  trExpr = simplify(trExpr) as MathNode;
  const trLatex = `\\operatorname{tr}(H) = ${nodeToLatex(trExpr)}`;

  let charPoly: string | undefined;
  let coeffs: MathNode[] | undefined;
  try {
    if (rows <= 5) {
      coeffs = charPolyCoeffs(nodes);
      charPoly = charPolyLatex(coeffs);
    } else {
      warnings.push(
        `Skipping symbolic characteristic polynomial for ${rows}×${rows} (too large).`
      );
    }
  } catch (e: any) {
    warnings.push(`Charpoly failed: ${e?.message ?? e}`);
  }

  let detLatex: string | undefined;
  if (coeffs) {
    const c0 = coeffs[0];
    const sign = rows % 2 === 0 ? "" : "-";
    const det = simplify(
      mjParse(`${sign}(${c0.toString()})`)
    ) as MathNode;
    detLatex = `\\det(H) = ${nodeToLatex(det)}`;
  }

  let eigLatex:
    | { latex: string; numeric?: number | Complex; multiplicity: number }[]
    | undefined;
  let evecsLatex: { eigenvalueLatex: string; vectorLatex: string }[] | undefined;
  // Keep the symbolic 2×2 forms aside so the Steps tab can show them even when
  // numeric values later overwrite the user-facing eigenvalues field.
  let eig2SymbolicLatex: string[] | undefined;
  if (rows === 2) {
    const { latex, evectorsLatex } = eig2x2Symbolic(nodes);
    eig2SymbolicLatex = latex;
    eigLatex = latex.map((l) => ({ latex: l, multiplicity: 1 }));
    evecsLatex = latex.map((_, k) => ({
      eigenvalueLatex: `\\lambda_{${k === 0 ? "+" : "-"}}`,
      vectorLatex: evectorsLatex[k],
    }));
  }

  let numericData: SolveResult["numeric"] | undefined;
  let hermitian: boolean | undefined;
  let unitary: boolean | undefined;
  let positiveDefinite: boolean | undefined;
  let rank: number | undefined;
  if (!symbolic) {
    const M = evalGridNumeric(nodes, numericSubs);
    if (M) {
      try {
        const { values, vectors } = numericEig(M);
        const numericPairs = values.map((v: any, k: number) => ({
          value: v,
          vec: vectors[k] ?? [],
        }));
        if (eigLatex) {
          eigLatex = numericPairs.map((p, k) => ({
            latex: eigLatex![k]?.latex ?? formatScalar(p.value),
            numeric: p.value,
            multiplicity: 1,
          }));
          if (evecsLatex) {
            evecsLatex = numericPairs.map((p, k) => ({
              eigenvalueLatex: `\\lambda_{${k + 1}} = ${formatScalar(p.value)}`,
              vectorLatex: vectorToLatex(p.vec),
            }));
          }
        } else {
          eigLatex = numericPairs.map((p) => ({
            latex: formatScalar(p.value),
            numeric: p.value,
            multiplicity: 1,
          }));
          evecsLatex = numericPairs.map((p, k) => ({
            eigenvalueLatex: `\\lambda_{${k + 1}} = ${formatScalar(p.value)}`,
            vectorLatex: vectorToLatex(p.vec),
          }));
        }
        numericData = { matrix: M, eigenvalues: values };
      } catch (e: any) {
        warnings.push(`Numeric eigendecomposition failed: ${e?.message ?? e}`);
      }
      hermitian = isHermitianNumeric(M);
      unitary = isUnitaryNumeric(M);
      try {
        const Ah = matrix(conjTranspose(M) as any);
        const A = matrix(M as any);
        const prod = multiply(Ah, A) as MjMatrix;
        const r: any = mjEigs(prod as any);
        const vs = (Array.isArray(r.values)
          ? r.values
          : r.values.toArray()) as any[];
        rank = vs.filter((x: any) => {
          const r0 = typeof x === "number" ? Math.abs(x) : Math.hypot(x.re, x.im);
          return r0 > 1e-9;
        }).length;
      } catch {}
      if (hermitian && eigLatex) {
        positiveDefinite = eigLatex.every((e) => {
          const v: any = e.numeric;
          if (v == null) return false;
          const r0 = typeof v === "number" ? v : v.re;
          return r0 > -1e-9;
        });
      }
    } else {
      warnings.push(
        "Could not fully evaluate matrix to numbers; missing or invalid substitutions."
      );
    }
  }

  let evolutionLatex: string | undefined;
  if (!symbolic && numericData) {
    try {
      const A = matrix(numericData.matrix as any);
      const Ht = multiply(complex(0, -1), A) as MjMatrix;
      const U = mjExpm(Ht) as MjMatrix;
      evolutionLatex = `U(t=1, \\hbar=1) = ${matrixToLatex(U)}`;
    } catch (e: any) {
      warnings.push(`Time evolution failed: ${e?.message ?? e}`);
    }
  } else if (symbolic) {
    warnings.push("Time evolution requires numeric values for all symbols.");
  }

  const steps = buildSteps({
    rows,
    nodes,
    numericSubs,
    traceLatex: trLatex,
    detLatex,
    charPolyLatex: charPoly,
    eigenvaluesSymbolicLatex: eig2SymbolicLatex,
    eigenvaluesNumeric: numericData?.eigenvalues,
    eigenvectors: evecsLatex,
    evolutionLatex,
    symbolic,
  });

  return {
    ok: true,
    symbolic,
    freeSymbols: remaining,
    matrixLatex,
    trace: { latex: trLatex },
    determinant: detLatex ? { latex: detLatex } : undefined,
    rank,
    hermitian,
    unitary,
    positiveDefinite,
    charPolyLatex: charPoly,
    eigenvalues: eigLatex,
    eigenvectors: evecsLatex,
    evolutionLatex,
    numeric: numericData,
    steps,
    warnings,
  };
}
