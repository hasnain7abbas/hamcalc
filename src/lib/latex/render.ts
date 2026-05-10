// Convert mathjs nodes & values into LaTeX strings suitable for KaTeX.

import { format } from "mathjs";
import type { MathNode, Complex, Matrix } from "mathjs";

// Map ASCII identifiers our normalizer produces back to LaTeX commands.
const asciiToLatex: Record<string, string> = {
  alpha: "\\alpha",
  beta: "\\beta",
  gamma: "\\gamma",
  delta: "\\delta",
  epsilon: "\\varepsilon",
  zeta: "\\zeta",
  eta: "\\eta",
  theta: "\\theta",
  iota: "\\iota",
  kappa: "\\kappa",
  lamda: "\\lambda",
  lambda: "\\lambda",
  mu: "\\mu",
  nu: "\\nu",
  xi: "\\xi",
  omicron: "o",
  pi: "\\pi",
  rho: "\\rho",
  sigma: "\\sigma",
  tau: "\\tau",
  upsilon: "\\upsilon",
  phi: "\\varphi",
  chi: "\\chi",
  psi: "\\psi",
  omega: "\\omega",
  Gamma: "\\Gamma",
  Delta: "\\Delta",
  Theta: "\\Theta",
  Lamda: "\\Lambda",
  Lambda: "\\Lambda",
  Xi: "\\Xi",
  Pi: "\\Pi",
  Sigma: "\\Sigma",
  Upsilon: "\\Upsilon",
  Phi: "\\Phi",
  Psi: "\\Psi",
  Omega: "\\Omega",
  hbar: "\\hbar",
  hplanck: "h",
};

export function symbolToLatex(name: string): string {
  // Handle subscript pattern foo_bar.
  if (name.includes("_")) {
    const [base, ...rest] = name.split("_");
    const sub = rest.join("_");
    return `${symbolToLatex(base)}_{${symbolToLatex(sub)}}`;
  }
  return asciiToLatex[name] ?? name;
}

export function nodeToLatex(node: MathNode): string {
  // mathjs has its own toTex with a custom handler for symbol replacement.
  const raw = node.toTex({
    parenthesis: "auto",
    implicit: "show",
    handler: (n: any) => {
      if (n.type === "SymbolNode") return symbolToLatex(n.name);
      if (n.type === "ConstantNode") {
        return formatScalar(n.value);
      }
      return undefined as unknown as string;
    },
  });
  return sanitizeLatex(raw);
}

// mathjs joins multiplication as `${a}\cdot${b}` with no separator. When `b`
// starts with a letter (e.g. `h`, `x`), KaTeX's lexer greedily reads letters
// after a backslash and turns `\cdoth` into one unknown command, which renders
// as red error text. Insert a space after `\cdot` (and other commands likely to
// be emitted by mathjs) when followed by a letter.
function sanitizeLatex(s: string): string {
  return s.replace(/\\cdot(?=[a-zA-Z])/g, "\\cdot ");
}

export function formatScalar(v: any, digits = 4): string {
  if (v === undefined || v === null) return "0";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toString();
    return Number(v.toPrecision(digits)).toString();
  }
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if ("re" in v && "im" in v) {
      const c = v as Complex;
      return complexToLatex(c.re, c.im, digits);
    }
    if ("isFraction" in v) return format(v);
  }
  try {
    return format(v, { precision: digits });
  } catch {
    return String(v);
  }
}

export function complexToLatex(re: number, im: number, digits = 4): string {
  const r = formatScalar(re, digits);
  if (Math.abs(im) < 1e-12) return r;
  const i = formatScalar(Math.abs(im), digits);
  const sign = im >= 0 ? "+" : "-";
  if (Math.abs(re) < 1e-12) {
    return `${im >= 0 ? "" : "-"}${i === "1" ? "" : i}\\,i`;
  }
  return `${r} ${sign} ${i === "1" ? "" : i}\\,i`;
}

export function vectorToLatex(v: number[] | Complex[], digits = 4): string {
  const rows = v
    .map((x: any) => {
      if (typeof x === "number") return formatScalar(x, digits);
      if (x && typeof x === "object" && "re" in x)
        return complexToLatex(x.re, x.im, digits);
      return formatScalar(x, digits);
    })
    .join("\\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

export function matrixToLatex(m: any, digits = 4): string {
  const arr: any[][] = m && m.toArray ? (m as Matrix).toArray() as any[][] : m;
  const rows = arr
    .map((r) =>
      r
        .map((x: any) => {
          if (typeof x === "number") return formatScalar(x, digits);
          if (x && typeof x === "object" && "re" in x)
            return complexToLatex(x.re, x.im, digits);
          if (x && typeof x === "object" && "toTex" in x) {
            return (x as MathNode).toTex();
          }
          return formatScalar(x, digits);
        })
        .join(" & ")
    )
    .join("\\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}
