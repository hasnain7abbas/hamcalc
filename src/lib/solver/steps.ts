// Generate "teacher-style" step-by-step derivations for each quantity the
// solver computes. Each section is a list of narration + optional displayed
// LaTeX. Symbolic first, then a final substitution step when all symbols are
// bound to numbers. Full algebra for n <= 3, recursion-outline for n >= 4.

import { parse as mjParse, simplify } from "mathjs";
import type { MathNode, Complex } from "mathjs";
import type { CellNodes } from "./solver";
import { nodeToLatex, formatScalar, symbolToLatex } from "../latex/render";

export type Step = {
  say: string;
  tex?: string;
};

export type StepSection = {
  topic: string;
  title: string;
  steps: Step[];
};

function cellTex(nodes: CellNodes, i: number, j: number): string {
  const n = nodes[i]?.[j];
  return n ? nodeToLatex(n) : "0";
}

function par(s: string): string {
  return `\\left(${s}\\right)`;
}

function substituteAll(
  node: MathNode,
  subs: Record<string, number>
): MathNode {
  let out: MathNode = node;
  for (const [k, v] of Object.entries(subs)) {
    out = out.transform((n: any) => {
      if (n.type === "SymbolNode" && n.name === k) return mjParse(String(v));
      return n;
    });
  }
  return out;
}

function tryNumeric(node: MathNode): number | Complex | null {
  try {
    const v = node.evaluate({});
    if (typeof v === "number") return v;
    if (v && typeof v === "object" && "re" in v && "im" in v)
      return v as Complex;
    return null;
  } catch {
    return null;
  }
}

function subsLatex(subs: Record<string, number>): string {
  const entries = Object.entries(subs);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${symbolToLatex(k)} = ${v}`).join(", \\;\\; ");
}

function hasUsedSymbols(
  nodes: CellNodes,
  subs: Record<string, number>
): boolean {
  if (Object.keys(subs).length === 0) return false;
  const used = new Set<string>();
  for (const row of nodes) {
    for (const n of row) {
      if (!n) continue;
      n.traverse((nn: any) => {
        if (nn.type === "SymbolNode") used.add(nn.name);
      });
    }
  }
  return Object.keys(subs).some((k) => used.has(k));
}

// ---------------------------------------------------------------------------
// Trace
// ---------------------------------------------------------------------------

function traceSection(
  nodes: CellNodes,
  n: number,
  numericSubs: Record<string, number>,
  finalLatex: string
): StepSection {
  const steps: Step[] = [];
  steps.push({
    say: "The trace of a square matrix is the sum of its diagonal entries — that's the definition.",
    tex: `\\operatorname{tr}(H) \\;=\\; \\sum_{i=1}^{${n}} H_{ii}`,
  });

  if (n <= 5) {
    const lines = Array.from({ length: n }, (_, i) =>
      `H_{${i + 1}${i + 1}} &= ${cellTex(nodes, i, i)}`
    ).join(" \\\\ ");
    steps.push({
      say: "Read the diagonal entries straight off the matrix:",
      tex: `\\begin{aligned} ${lines} \\end{aligned}`,
    });
  }

  const sumExpr = Array.from({ length: n }, (_, i) =>
    cellTex(nodes, i, i)
  ).join(" + ");
  steps.push({
    say: "Now add them together:",
    tex: `\\operatorname{tr}(H) \\;=\\; ${sumExpr}`,
  });

  steps.push({
    say: "After collecting like terms this simplifies to:",
    tex: finalLatex,
  });

  if (hasUsedSymbols(nodes, numericSubs)) {
    let trExpr: MathNode = mjParse("0");
    for (let i = 0; i < n; i++) {
      trExpr = mjParse(
        `(${trExpr.toString()}) + (${nodes[i][i]!.toString()})`
      );
    }
    const sub = simplify(substituteAll(trExpr, numericSubs)) as MathNode;
    const v = tryNumeric(sub);
    steps.push({
      say: `Substituting your bound values (${subsLatex(numericSubs)}):`,
      tex: `\\operatorname{tr}(H) \\;=\\; ${
        v !== null ? formatScalar(v) : nodeToLatex(sub)
      }`,
    });
  }

  return { topic: "Trace", title: "Trace", steps };
}

// ---------------------------------------------------------------------------
// Determinant
// ---------------------------------------------------------------------------

function determinant2Section(
  nodes: CellNodes,
  numericSubs: Record<string, number>,
  finalLatex?: string
): StepSection {
  const a = cellTex(nodes, 0, 0);
  const b = cellTex(nodes, 0, 1);
  const c = cellTex(nodes, 1, 0);
  const d = cellTex(nodes, 1, 1);
  const steps: Step[] = [];

  steps.push({
    say: "For a 2×2 matrix the determinant is the main-diagonal product minus the anti-diagonal product. This is the rule we'll apply.",
    tex: `\\det\\!\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\;=\\; ad - bc`,
  });

  steps.push({
    say: "Match the entries of H against the template:",
    tex: `a = ${a}, \\quad b = ${b}, \\quad c = ${c}, \\quad d = ${d}`,
  });

  steps.push({
    say: "Form the two products:",
    tex: `ad \\;=\\; ${par(a)}\\cdot ${par(d)}, \\qquad bc \\;=\\; ${par(b)}\\cdot ${par(c)}`,
  });

  steps.push({
    say: "Subtract bc from ad:",
    tex: `\\det(H) \\;=\\; ${par(a)}\\cdot ${par(d)} \\;-\\; ${par(b)}\\cdot ${par(c)}`,
  });

  if (finalLatex) {
    steps.push({ say: "Simplifying gives:", tex: finalLatex });
  }

  if (hasUsedSymbols(nodes, numericSubs)) {
    const expr = simplify(
      substituteAll(
        mjParse(
          `(${nodes[0][0]!.toString()})*(${nodes[1][1]!.toString()}) - (${nodes[0][1]!.toString()})*(${nodes[1][0]!.toString()})`
        ) as MathNode,
        numericSubs
      )
    ) as MathNode;
    const v = tryNumeric(expr);
    steps.push({
      say: `Substituting (${subsLatex(numericSubs)}):`,
      tex: `\\det(H) \\;=\\; ${
        v !== null ? formatScalar(v) : nodeToLatex(expr)
      }`,
    });
  }

  return { topic: "Determinant", title: "Determinant", steps };
}

function determinant3Section(
  nodes: CellNodes,
  numericSubs: Record<string, number>,
  finalLatex?: string
): StepSection {
  const m = (i: number, j: number) => cellTex(nodes, i, j);
  const steps: Step[] = [];

  steps.push({
    say: "For a 3×3 matrix we expand the determinant along the first row using cofactors. Each entry of row 1 is multiplied by the determinant of the 2×2 minor obtained by deleting that entry's row and column, with alternating signs.",
    tex: `\\det(H) \\;=\\; H_{11}\\,M_{11} \\;-\\; H_{12}\\,M_{12} \\;+\\; H_{13}\\,M_{13}`,
  });

  const minorMatrix = (skipRow: number, skipCol: number) => {
    const rows: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (i === skipRow) continue;
      const cols: string[] = [];
      for (let j = 0; j < 3; j++) {
        if (j === skipCol) continue;
        cols.push(m(i, j));
      }
      rows.push(cols.join(" & "));
    }
    return `\\begin{vmatrix} ${rows.join(" \\\\ ")} \\end{vmatrix}`;
  };

  steps.push({
    say: "Write down the three 2×2 minors. M₁ⱼ is what's left when you cross out row 1 and column j:",
    tex: `M_{11} = ${minorMatrix(0, 0)}, \\quad M_{12} = ${minorMatrix(0, 1)}, \\quad M_{13} = ${minorMatrix(0, 2)}`,
  });

  const minorVal = (skipRow: number, skipCol: number) => {
    const rs: number[] = [];
    const cs: number[] = [];
    for (let i = 0; i < 3; i++) if (i !== skipRow) rs.push(i);
    for (let j = 0; j < 3; j++) if (j !== skipCol) cs.push(j);
    const a = m(rs[0], cs[0]);
    const b = m(rs[0], cs[1]);
    const c = m(rs[1], cs[0]);
    const d = m(rs[1], cs[1]);
    return `${par(a)}\\cdot ${par(d)} - ${par(b)}\\cdot ${par(c)}`;
  };

  steps.push({
    say: "Each minor evaluates to ad − bc of its 2×2 block:",
    tex: `\\begin{aligned} M_{11} &= ${minorVal(0, 0)} \\\\ M_{12} &= ${minorVal(0, 1)} \\\\ M_{13} &= ${minorVal(0, 2)} \\end{aligned}`,
  });

  steps.push({
    say: "Plug everything back into the cofactor expansion:",
    tex: `\\det(H) \\;=\\; ${par(m(0, 0))}\\,M_{11} \\;-\\; ${par(m(0, 1))}\\,M_{12} \\;+\\; ${par(m(0, 2))}\\,M_{13}`,
  });

  if (finalLatex) {
    steps.push({ say: "Expanding and collecting like terms gives:", tex: finalLatex });
  }

  if (hasUsedSymbols(nodes, numericSubs) && finalLatex) {
    steps.push({
      say: `Substituting (${subsLatex(numericSubs)}) at the end yields the numeric determinant available in the Numeric tab.`,
    });
  }

  return { topic: "Determinant", title: "Determinant", steps };
}

function determinantLargeSection(n: number, finalLatex?: string): StepSection {
  const steps: Step[] = [];
  steps.push({
    say: `For an ${n}×${n} matrix the cofactor expansion has ${n}! terms, which gets out of hand quickly. Instead we use the Faddeev–LeVerrier recursion, which produces all of the characteristic polynomial's coefficients (and therefore the determinant) in O(n⁴) operations.`,
  });
  steps.push({
    say: "Once we have the characteristic polynomial p(λ) = ∑ c_k λ^k, the determinant pops out of its constant term:",
    tex: `\\det(H) \\;=\\; (-1)^{n}\\, c_{0}`,
  });
  if (finalLatex) {
    steps.push({ say: "Running the recursion on this matrix gives:", tex: finalLatex });
  }
  return { topic: "Determinant", title: "Determinant", steps };
}

// ---------------------------------------------------------------------------
// Characteristic polynomial
// ---------------------------------------------------------------------------

function charPoly2Section(
  nodes: CellNodes,
  finalLatex?: string
): StepSection {
  const a = cellTex(nodes, 0, 0);
  const b = cellTex(nodes, 0, 1);
  const c = cellTex(nodes, 1, 0);
  const d = cellTex(nodes, 1, 1);
  const steps: Step[] = [];

  steps.push({
    say: "The characteristic polynomial is defined as p(λ) = det(λI − H). Start by writing out λI − H:",
    tex: `\\lambda I - H \\;=\\; \\begin{pmatrix} \\lambda - ${par(a)} & -${par(b)} \\\\ -${par(c)} & \\lambda - ${par(d)} \\end{pmatrix}`,
  });

  steps.push({
    say: "Apply the 2×2 determinant rule (ad − bc):",
    tex: `p(\\lambda) \\;=\\; \\bigl(\\lambda - ${par(a)}\\bigr)\\bigl(\\lambda - ${par(d)}\\bigr) \\;-\\; \\bigl(-${par(b)}\\bigr)\\bigl(-${par(c)}\\bigr)`,
  });

  steps.push({
    say: "Notice the two minus signs combine. Expanding the products gives the standard 2×2 form:",
    tex: `p(\\lambda) \\;=\\; \\lambda^{2} \\;-\\; \\operatorname{tr}(H)\\,\\lambda \\;+\\; \\det(H)`,
  });

  if (finalLatex) {
    steps.push({
      say: "Substituting the trace and determinant from above:",
      tex: finalLatex,
    });
  }

  return { topic: "Char Poly", title: "Characteristic polynomial", steps };
}

function charPoly3Section(
  nodes: CellNodes,
  finalLatex?: string
): StepSection {
  const m = (i: number, j: number) => cellTex(nodes, i, j);
  const steps: Step[] = [];

  steps.push({
    say: "The characteristic polynomial is p(λ) = det(λI − H). Build λI − H by subtracting H from λ on the diagonal:",
    tex: `\\lambda I - H \\;=\\; \\begin{pmatrix} \\lambda - ${par(m(0, 0))} & -${par(m(0, 1))} & -${par(m(0, 2))} \\\\ -${par(m(1, 0))} & \\lambda - ${par(m(1, 1))} & -${par(m(1, 2))} \\\\ -${par(m(2, 0))} & -${par(m(2, 1))} & \\lambda - ${par(m(2, 2))} \\end{pmatrix}`,
  });

  steps.push({
    say: "There's a clean shortcut for any 3×3: p(λ) factors through three coefficient invariants of H — the trace, the sum of 2×2 principal minors, and the determinant.",
    tex: `p(\\lambda) \\;=\\; \\lambda^{3} \\;-\\; \\operatorname{tr}(H)\\,\\lambda^{2} \\;+\\; \\tfrac{1}{2}\\!\\left[\\operatorname{tr}(H)^{2} - \\operatorname{tr}(H^{2})\\right]\\!\\lambda \\;-\\; \\det(H)`,
  });

  if (finalLatex) {
    steps.push({
      say: "After substituting and simplifying the matrix entries, the polynomial collapses to:",
      tex: finalLatex,
    });
  }

  return { topic: "Char Poly", title: "Characteristic polynomial", steps };
}

function charPolyLargeSection(n: number, finalLatex?: string): StepSection {
  const steps: Step[] = [];
  steps.push({
    say: `For an ${n}×${n} matrix we use the Faddeev–LeVerrier recursion. It avoids the combinatorial blow-up of cofactor expansion by building the matrices M_k iteratively.`,
  });
  steps.push({
    say: "Initialize M₀ = 0 and c_n = 1, then for k = 1, …, n iterate:",
    tex: `M_{k} \\;=\\; H\\,M_{k-1} + c_{n-k+1}\\,I, \\qquad c_{n-k} \\;=\\; -\\frac{1}{k}\\,\\operatorname{tr}\\!\\bigl(H\\,M_{k}\\bigr)`,
  });
  steps.push({
    say: "Assemble the polynomial from the recovered coefficients:",
    tex: `p(\\lambda) \\;=\\; \\sum_{k=0}^{n} c_{k}\\,\\lambda^{k}`,
  });
  if (finalLatex) {
    steps.push({
      say: "Running the recursion on the entries of this H gives:",
      tex: finalLatex,
    });
  }
  return { topic: "Char Poly", title: "Characteristic polynomial", steps };
}

// ---------------------------------------------------------------------------
// Eigenvalues
// ---------------------------------------------------------------------------

function eigenvalues2Section(
  symbolicLatex?: string[],
  numericValues?: any[]
): StepSection {
  const steps: Step[] = [];
  steps.push({
    say: "Eigenvalues are the roots of the characteristic polynomial: p(λ) = 0. For a 2×2 that's a quadratic, so we can solve in closed form.",
    tex: `\\lambda^{2} \\;-\\; T\\,\\lambda \\;+\\; D \\;=\\; 0, \\qquad T = \\operatorname{tr}(H),\\;\\; D = \\det(H)`,
  });
  steps.push({
    say: "Apply the quadratic formula:",
    tex: `\\lambda_{\\pm} \\;=\\; \\frac{T \\;\\pm\\; \\sqrt{\\,T^{2} - 4D\\,}}{2}`,
  });
  steps.push({
    say: "Equivalently, write it in terms of the half-trace and the off-diagonal product — this form is what the calculator emits, and it's often more convenient for two-level systems:",
    tex: `\\lambda_{\\pm} \\;=\\; \\frac{a + d}{2} \\;\\pm\\; \\sqrt{\\,\\left(\\frac{a - d}{2}\\right)^{\\!2} + bc\\,}`,
  });
  if (symbolicLatex && symbolicLatex.length === 2) {
    steps.push({
      say: "Plugging in the entries of H and simplifying the radical gives:",
      tex: `\\begin{aligned} \\lambda_{+} &= ${symbolicLatex[0]} \\\\ \\lambda_{-} &= ${symbolicLatex[1]} \\end{aligned}`,
    });
  }
  if (numericValues && numericValues.length) {
    const lines = numericValues
      .map((v: any, k: number) => `\\lambda_{${k + 1}} &= ${formatScalar(v)}`)
      .join(" \\\\ ");
    steps.push({
      say: "With your numeric bindings, the eigenvalues evaluate to:",
      tex: `\\begin{aligned} ${lines} \\end{aligned}`,
    });
  }
  return { topic: "Eigenvalues", title: "Eigenvalues", steps };
}

function eigenvaluesNumericSection(
  n: number,
  numericValues?: any[]
): StepSection {
  const steps: Step[] = [];
  steps.push({
    say: "Eigenvalues are the roots of p(λ) = 0. For n ≥ 3 there is no general closed-form solution by radicals (Abel–Ruffini for n ≥ 5; cubic and quartic formulas exist but are unwieldy), so in practice we solve numerically.",
  });
  steps.push({
    say: "Internally the calculator builds H as a numeric matrix and calls a QR-based eigensolver (math.js eigs). This is also how textbook problems are checked once you've done the symbolic work.",
  });
  if (numericValues && numericValues.length) {
    const lines = numericValues
      .map((v: any, k: number) => `\\lambda_{${k + 1}} &= ${formatScalar(v)}`)
      .join(" \\\\ ");
    steps.push({
      say: "The solver returns:",
      tex: `\\begin{aligned} ${lines} \\end{aligned}`,
    });
  } else {
    steps.push({
      say: `For a ${n}×${n} symbolic matrix, bind every free symbol above to a number to compute the eigenvalues.`,
    });
  }
  return { topic: "Eigenvalues", title: "Eigenvalues", steps };
}

// ---------------------------------------------------------------------------
// Eigenvectors
// ---------------------------------------------------------------------------

function eigenvectorsSection(
  nodes: CellNodes,
  n: number,
  evec: { eigenvalueLatex: string; vectorLatex: string }[]
): StepSection {
  const steps: Step[] = [];
  steps.push({
    say: "An eigenvector |ψ_k⟩ paired with eigenvalue λ_k satisfies (H − λ_k I)|ψ_k⟩ = 0. Geometrically, that's a vector in the null space of H − λ_k I — a direction H stretches but does not rotate.",
    tex: `\\bigl(H - \\lambda_{k} I\\bigr)\\,|\\psi_{k}\\rangle \\;=\\; 0`,
  });

  if (n === 2) {
    const a = cellTex(nodes, 0, 0);
    const b = cellTex(nodes, 0, 1);
    steps.push({
      say: "For a 2×2 the first row of (H − λI)v = 0 says (a − λ)v₁ + b·v₂ = 0. Choose v₂ = λ − a; then v₁ = b solves it. So an unnormalized eigenvector is:",
      tex: `|\\psi_{\\pm}\\rangle \\;\\propto\\; \\begin{pmatrix} ${b} \\\\ \\lambda_{\\pm} - ${par(a)} \\end{pmatrix}`,
    });
    steps.push({
      say: "If you want them normalized, divide by √(|v₁|² + |v₂|²). The calculator leaves them unnormalized in the symbolic case so the algebra stays readable.",
    });
  } else {
    steps.push({
      say: `For n = ${n} we form (H − λ_k I), find a basis for its null space (Gaussian elimination, or equivalently take any nonzero column of the adjugate), and that's |ψ_k⟩. For numeric matrices the calculator delegates to math.js's eigensolver, which returns orthonormal eigenvectors.`,
    });
  }

  evec.forEach((e, k) => {
    steps.push({
      say: `Eigenvector for the ${ordinal(k + 1)} eigenvalue:`,
      tex: `${e.eigenvalueLatex}\\\\[2pt] |\\psi_{${k + 1}}\\rangle \\;=\\; ${e.vectorLatex}`,
    });
  });

  return { topic: "Eigenvectors", title: "Eigenvectors", steps };
}

function ordinal(k: number): string {
  const v = k % 100;
  if (v >= 11 && v <= 13) return `${k}th`;
  switch (k % 10) {
    case 1: return `${k}st`;
    case 2: return `${k}nd`;
    case 3: return `${k}rd`;
    default: return `${k}th`;
  }
}

// ---------------------------------------------------------------------------
// Time evolution U(t)
// ---------------------------------------------------------------------------

function evolutionSection(
  symbolic: boolean,
  finalLatex?: string
): StepSection {
  const steps: Step[] = [];
  steps.push({
    say: "Evolution under a time-independent Hamiltonian H is generated by the unitary operator U(t). This is what answers \"given |ψ(0)⟩, where is the state at time t?\"",
    tex: `U(t) \\;=\\; \\exp\\!\\left(-\\,\\dfrac{i\\,H\\,t}{\\hbar}\\right)`,
  });
  steps.push({
    say: "The matrix exponential is hard to compute on a non-diagonal H — but easy on a diagonal one. So we diagonalize first, using the eigendata from above:",
    tex: `H \\;=\\; P\\,D\\,P^{-1}, \\qquad D = \\operatorname{diag}(\\lambda_{1}, \\ldots, \\lambda_{n})`,
  });
  steps.push({
    say: "exp of a diagonal matrix is the diagonal of the scalar exponentials, and the similarity transform passes through cleanly:",
    tex: `U(t) \\;=\\; P\\;\\operatorname{diag}\\!\\bigl(e^{-i\\lambda_{k} t/\\hbar}\\bigr)\\;P^{-1}`,
  });
  steps.push({
    say: "So each eigenmode picks up its own phase e^(−iλ_k t/ℏ); off-diagonal entries of U(t) come from the change of basis P.",
  });
  if (finalLatex) {
    steps.push({
      say: "Evaluating at t = ℏ = 1 with the eigendata from above:",
      tex: finalLatex,
    });
  } else if (symbolic) {
    steps.push({
      say: "To compute U(t) explicitly, bind every free symbol in H above to a numeric value.",
    });
  }
  return { topic: "U(t)", title: "Time evolution", steps };
}

// ---------------------------------------------------------------------------
// Top-level builder
// ---------------------------------------------------------------------------

export function buildSteps(args: {
  rows: number;
  nodes: CellNodes;
  numericSubs: Record<string, number>;
  traceLatex: string;
  detLatex?: string;
  charPolyLatex?: string;
  eigenvaluesSymbolicLatex?: string[];
  eigenvaluesNumeric?: any[];
  eigenvectors?: { eigenvalueLatex: string; vectorLatex: string }[];
  evolutionLatex?: string;
  symbolic: boolean;
}): StepSection[] {
  const sections: StepSection[] = [];
  const n = args.rows;

  sections.push(traceSection(args.nodes, n, args.numericSubs, args.traceLatex));

  if (n === 2) {
    sections.push(determinant2Section(args.nodes, args.numericSubs, args.detLatex));
  } else if (n === 3) {
    sections.push(determinant3Section(args.nodes, args.numericSubs, args.detLatex));
  } else {
    sections.push(determinantLargeSection(n, args.detLatex));
  }

  if (n === 2) {
    sections.push(charPoly2Section(args.nodes, args.charPolyLatex));
  } else if (n === 3) {
    sections.push(charPoly3Section(args.nodes, args.charPolyLatex));
  } else {
    sections.push(charPolyLargeSection(n, args.charPolyLatex));
  }

  if (n === 2) {
    sections.push(
      eigenvalues2Section(args.eigenvaluesSymbolicLatex, args.eigenvaluesNumeric)
    );
  } else {
    sections.push(eigenvaluesNumericSection(n, args.eigenvaluesNumeric));
  }

  if (args.eigenvectors && args.eigenvectors.length > 0) {
    sections.push(eigenvectorsSection(args.nodes, n, args.eigenvectors));
  } else {
    sections.push({
      topic: "Eigenvectors",
      title: "Eigenvectors",
      steps: [
        {
          say: "Eigenvectors require either a symbolic 2×2 matrix or a fully bound numeric matrix. Bind your free symbols above (or shrink to 2×2) to see them derived.",
        },
      ],
    });
  }

  sections.push(evolutionSection(args.symbolic, args.evolutionLatex));

  return sections;
}
