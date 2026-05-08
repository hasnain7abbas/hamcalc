// Map the user-friendly unicode / physics characters that the on-screen keyboard
// inserts into ASCII identifiers that mathjs can parse.
//
// Strategy: do this *before* handing the string to mathjs so the math engine
// stays vanilla. We keep the original string for display/LaTeX rendering.

export const symbolMap: Record<string, string> = {
  // Greek (lowercase)
  α: "alpha",
  β: "beta",
  γ: "gamma",
  δ: "delta",
  ε: "epsilon",
  ζ: "zeta",
  η: "eta",
  θ: "theta",
  ι: "iota",
  κ: "kappa",
  λ: "lamda", // mathjs avoids 'lambda' keyword
  μ: "mu",
  ν: "nu",
  ξ: "xi",
  ο: "omicron",
  π: "pi",
  ρ: "rho",
  σ: "sigma",
  τ: "tau",
  υ: "upsilon",
  φ: "phi",
  χ: "chi",
  ψ: "psi",
  ω: "omega",
  // Variant glyphs
  ϵ: "epsilon",
  ϑ: "theta",
  ϰ: "kappa",
  ϕ: "phi",
  ϱ: "rho",
  ϖ: "pi",
  // Greek (uppercase)
  Α: "Alpha",
  Β: "Beta",
  Γ: "Gamma",
  Δ: "Delta",
  Ε: "Epsilon",
  Ζ: "Zeta",
  Η: "Eta",
  Θ: "Theta",
  Ι: "Iota",
  Κ: "Kappa",
  Λ: "Lamda",
  Μ: "Mu",
  Ν: "Nu",
  Ξ: "Xi",
  Ο: "Omicron",
  Π: "Pi",
  Ρ: "Rho",
  Σ: "Sigma",
  Τ: "Tau",
  Υ: "Upsilon",
  Φ: "Phi",
  Χ: "Chi",
  Ψ: "Psi",
  Ω: "Omega",
  // Physics / constants
  ℏ: "hbar",
  ℎ: "hplanck",
  // Operators
  "·": "*",
  "×": "*",
  "÷": "/",
  "−": "-",
  "—": "-",
  "–": "-",
  "√": "sqrt",
  "∞": "Infinity",
  "𝟙": "1",
  "†": "_dag", // dagger is post-fix; we lower it to a no-op in the *value* (Hermitian conjugate handled at the matrix level via assume_hermitian)
};

// Map unicode chars to KaTeX commands for rendering.
export const latexMap: Record<string, string> = {
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  δ: "\\delta",
  ε: "\\varepsilon",
  ζ: "\\zeta",
  η: "\\eta",
  θ: "\\theta",
  ι: "\\iota",
  κ: "\\kappa",
  λ: "\\lambda",
  μ: "\\mu",
  ν: "\\nu",
  ξ: "\\xi",
  ο: "o",
  π: "\\pi",
  ρ: "\\rho",
  σ: "\\sigma",
  τ: "\\tau",
  υ: "\\upsilon",
  φ: "\\varphi",
  χ: "\\chi",
  ψ: "\\psi",
  ω: "\\omega",
  ϵ: "\\epsilon",
  ϑ: "\\vartheta",
  ϰ: "\\varkappa",
  ϕ: "\\phi",
  ϱ: "\\varrho",
  ϖ: "\\varpi",
  Γ: "\\Gamma",
  Δ: "\\Delta",
  Θ: "\\Theta",
  Λ: "\\Lambda",
  Ξ: "\\Xi",
  Π: "\\Pi",
  Σ: "\\Sigma",
  Υ: "\\Upsilon",
  Φ: "\\Phi",
  Ψ: "\\Psi",
  Ω: "\\Omega",
  ℏ: "\\hbar",
  ℎ: "h",
  "·": "\\cdot",
  "×": "\\times",
  "÷": "\\div",
  "−": "-",
  "√": "\\sqrt",
  "∞": "\\infty",
  "𝟙": "\\mathbb{1}",
  "†": "^{\\dagger}",
};

// Convert a user cell string to a mathjs-compatible expression string.
// Insert explicit '*' between adjacent identifier chars only when context
// strongly suggests multiplication (e.g., a number followed by a letter).
export function toMathExpr(input: string): string {
  if (!input.trim()) return "0";
  let s = "";
  for (const ch of input) {
    s += symbolMap[ch] ?? ch;
  }
  // Insert implicit multiplication: number followed by identifier or '('
  s = s.replace(/(\d)\s*([A-Za-z_(])/g, "$1*$2");
  // identifier followed by '(' — only matters when not a function. Keep as-is;
  // mathjs treats unknown function calls as errors. For our cells we expect
  // numbers and variables only, so insert * between ')' and identifier/number.
  s = s.replace(/\)\s*([A-Za-z0-9_(])/g, ")*$1");
  s = s.replace(/(\d)\s*\(/g, "$1*(");
  // Treat dagger as identity for value: turn '_dag' suffix into nothing.
  s = s.replace(/_dag/g, "");
  return s;
}

// Convert a user cell string into LaTeX for the live preview.
export function toLatex(input: string): string {
  if (!input.trim()) return "";
  // First replace unicode characters with their latex commands.
  let out = "";
  for (const ch of input) {
    out += latexMap[ch] ?? ch;
  }
  // Convert ASCII operators that stayed.
  out = out.replace(/\*/g, " \\cdot ");
  // Subscripts and superscripts: handle simple cases like x_1 / x^2
  // mark caret/underscore as KaTeX-friendly: a^2 already valid; a_b already valid.
  // Wrap multi-char subscripts that come from {} preserved.
  return out;
}
