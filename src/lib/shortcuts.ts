// Hardware-keyboard shortcut layer. Watches cell strings for trailing
// LaTeX-style commands (e.g. `\alpha`) and rewrites them to the unicode
// glyph the on-screen keyboard would have inserted.

export const shortcutMap: Record<string, string> = {
  "\\alpha": "α",
  "\\beta": "β",
  "\\gamma": "γ",
  "\\delta": "δ",
  "\\epsilon": "ε",
  "\\varepsilon": "ε",
  "\\zeta": "ζ",
  "\\eta": "η",
  "\\theta": "θ",
  "\\iota": "ι",
  "\\kappa": "κ",
  "\\lambda": "λ",
  "\\mu": "μ",
  "\\nu": "ν",
  "\\xi": "ξ",
  "\\pi": "π",
  "\\rho": "ρ",
  "\\sigma": "σ",
  "\\tau": "τ",
  "\\upsilon": "υ",
  "\\phi": "φ",
  "\\chi": "χ",
  "\\psi": "ψ",
  "\\omega": "ω",
  "\\Gamma": "Γ",
  "\\Delta": "Δ",
  "\\Theta": "Θ",
  "\\Lambda": "Λ",
  "\\Xi": "Ξ",
  "\\Pi": "Π",
  "\\Sigma": "Σ",
  "\\Upsilon": "Υ",
  "\\Phi": "Φ",
  "\\Psi": "Ψ",
  "\\Omega": "Ω",
  "\\hbar": "ℏ",
  "\\dag": "†",
  "\\dagger": "†",
  "\\infty": "∞",
  "\\cdot": "·",
  "\\times": "×",
  "\\div": "÷",
  "\\sqrt": "√",
};

// Apply on every keystroke: scan the latest token starting with '\' and
// replace with the unicode glyph if recognized. Returns the (possibly
// rewritten) value; idempotent if no shortcut matched.
export function applyShortcuts(val: string): string {
  const m = val.match(/\\[A-Za-z]+$/);
  if (!m) return val;
  const tok = m[0];
  // Trigger rewrite as soon as the next char is a non-letter — but here we run
  // on every change, so try direct match.
  const repl = shortcutMap[tok];
  if (!repl) return val;
  return val.slice(0, m.index!) + repl;
}
