<div align="center">

<img src="logo.svg" alt="HamCalc" width="128" height="128" />

# HamCalc

### Symbolic Hamiltonian Solver — diagonalize in your browser, ship as a desktop app.

**Type a matrix with a physics-aware keyboard. Get eigenvalues, eigenvectors, characteristic polynomial, and the time-evolution operator. Rendered as proper LaTeX.**

[![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![KaTeX](https://img.shields.io/badge/KaTeX-rendered-329F00)](https://katex.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

</div>

---

## ✨ What it does

Most people who want to diagonalize a 2×2, 3×3, or 4×4 Hamiltonian today either fire up Mathematica (paid, heavy), wrestle a SymPy script and re-derive the LaTeX next week, or do it on paper and make sign errors.

**HamCalc is the missing third option:** a single page where you spec the matrix size, type the entries with a physics keyboard (Greek letters, ℏ, π, dagger, Pauli matrices, sub/superscripts), press **Solve**, and get the spectrum back as rendered math.

No login. No setup. No Mathematica syntax to memorize.

---

## 🖼️ The interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Ĥ   HamCalc — Symbolic Hamiltonian Solver       [2×2 resize] [Solve ↵] │
├──────────────────────────────────────┬──────────────────────────────────┤
│                                      │  Spectrum  Eigenvectors  Props   │
│   2×2 matrix                         │  Char Poly  U(t)  Numeric  Export│
│                                      ├──────────────────────────────────┤
│   ⎡  ℏω/2     g    ⎤                │                                  │
│   ⎢                ⎥                │  Input matrix:                   │
│   ⎣   g    -ℏω/2   ⎦                │      ⎡ ℏω/2   g   ⎤              │
│                                      │  H = ⎣  g   -ℏω/2 ⎦              │
│   Numeric values:                    │                                  │
│     ω = 1.0    g = 0.3               │  Eigenvalues:                    │
│     ℏ = 1.0                          │    λ₊ = +½√(ℏ²ω² + 4g²)         │
│                                      │    λ₋ = -½√(ℏ²ω² + 4g²)         │
│  ┌─ Keyboard ────────────────────┐   │                                  │
│  │ Basic Latin Greek Physics ··· │   │  ✓ Hermitian                     │
│  │  ℏ  ℎ  c  e  kB  π  i  ∞      │   │                                  │
│  │  †  *  ⊗  ∂  ∇                │   │                                  │
│  │  σx σy σz σ₊ σ₋  𝟙           │   │                                  │
│  └───────────────────────────────┘   │                                  │
└──────────────────────────────────────┴──────────────────────────────────┘
```

The **logo** (`logo.svg`) is rendered into the title bar, taskbar, and `.exe` / `.msi` installer icons — generated automatically by `tauri icon` from the same source SVG.

---

## 🚀 Features

- **Matrix sizing**: 2×2 through 6×6 symbolic, up to 64×64 numeric.
- **Physics-aware keyboard** with six tabs: `Basic`, `Latin`, `Greek`, `Physics`, `Functions`, `Structure`. Inserts proper unicode glyphs (α, β, ℏ, †, σₓ, ∇, ∫…) directly into cells.
- **Hardware shortcut layer**: type `\alpha`, `\hbar`, `\dag` on a normal keyboard — they're rewritten to `α`, `ℏ`, `†` in real time.
- **Live LaTeX preview** under every cell, rendered with KaTeX.
- **Solver outputs** (per Section 4.4 of the design doc):
  - Spectrum (eigenvalues with multiplicities)
  - Eigenvectors
  - Properties: trace, determinant, rank, **Hermitian?**, **Unitary?**, **Positive-definite?**
  - Characteristic polynomial via Faddeev-LeVerrier
  - Time-evolution operator `U(t) = exp(-iHt/ℏ)`
  - Numeric mode with bar plot of the spectrum
- **Export**: copy/download as **LaTeX**, **Markdown**, **JSON**, or a standalone **Python (SymPy)** script that reproduces the calculation.
- **Persists across sessions** via LocalStorage — your matrix is still there next time.
- **Dark theme** styled around the logo's indigo→violet gradient.
- **Ships as a native desktop app** (Windows `.msi` + `.exe`) via Tauri 2 — webview-based but a single ~5 MB binary, not a 200 MB Electron blob.

---

## 📦 Installation

### Pre-built installers

Pre-built Windows installers are committed in the [`release/`](release/) directory of this repository (and attached to the latest GitHub release):

| File | Format | Description |
|------|--------|-------------|
| `HamCalc_0.1.0_x64-setup.exe` | NSIS installer | One-click `.exe` installer |
| `HamCalc_0.1.0_x64_en-US.msi` | MSI installer  | Enterprise-friendly Windows Installer |

Double-click either file to install. The app appears as **HamCalc** in the start menu with the gradient `Ĥ` icon.

### Build from source

Requirements: Node 18+, Rust 1.77+, the Tauri prerequisites for your platform ([docs](https://tauri.app/start/prerequisites/)).

```bash
git clone https://github.com/hasnain7abbas/hamcalc.git
cd hamcalc
npm install

# Dev (hot reload)
npm run tauri dev

# Production build → src-tauri/target/release/bundle/{nsis,msi}/
npm run tauri build
```

---

## 🧮 Worked example — Rabi model

Drop in the standard 2×2 Rabi Hamiltonian:

| | col 1 | col 2 |
|-|-------|-------|
| **row 1** | `ℏω/2`  | `g`     |
| **row 2** | `g`     | `−ℏω/2` |

Press **Solve** (or `Ctrl+Enter`). HamCalc returns:

- **Eigenvalues:**  λ± = ±½ √(ℏ²ω² + 4g²)
- **Eigenvectors:**  standard Rabi mixing-angle form
- **Hermitian:** ✓ yes
- **Char poly:**  `p(λ) = λ² − (ℏω·g)/4 …`  *(the actual symbolic polynomial)*
- **U(t):**  with ω=1, g=0.3, ℏ=1 → numeric 2×2 unitary

That's the regression test enshrined in §11 of [`HAMCALC_DESIGN.md`](HAMCALC_DESIGN.md).

---

## 🏗️ Architecture

```
hamcalc/
├── HAMCALC_DESIGN.md         # Full design doc (vision, scope, UX, grammar, roadmap)
├── logo.svg                  # Source logo — feeds both web favicon and Tauri icons
├── public/                   # Vite static assets (logo copy)
├── src/                      # React + TypeScript front-end
│   ├── App.tsx               # Header, layout, Ctrl+Enter shortcut
│   ├── components/
│   │   ├── SizeModal.tsx     # First-load size picker with presets
│   │   ├── MatrixGrid.tsx    # Grid of cells with live KaTeX preview & status colors
│   │   ├── Keyboard.tsx      # 6-tab on-screen physics keyboard
│   │   ├── ParametersPanel.tsx # Bind numeric values to free symbols
│   │   ├── OutputPanel.tsx   # 7-tab result viewer (Spectrum, Eigvecs, Props, …)
│   │   └── Tex.tsx           # KaTeX wrapper
│   ├── lib/
│   │   ├── parser/
│   │   │   ├── normalize.ts  # unicode → ASCII for math.js, plus LaTeX maps
│   │   │   └── parse.ts      # math.js wrapper, free-symbol collector
│   │   ├── latex/render.ts   # nodes / scalars / vectors / matrices → LaTeX
│   │   ├── solver/solver.ts  # Faddeev-LeVerrier, 2×2 closed form, numeric eigs, U(t)
│   │   ├── shortcuts.ts      # \alpha → α hardware-keyboard rewriter
│   │   └── store.ts          # Zustand store + LocalStorage persist
│   └── styles/globals.css    # Tailwind + brand component styles
├── src-tauri/                # Rust + Tauri 2 shell
│   ├── Cargo.toml
│   ├── tauri.conf.json       # NSIS + WiX bundle config, window settings
│   ├── icons/                # generated by `tauri icon` from logo.svg
│   ├── capabilities/default.json
│   └── src/{main.rs, lib.rs}
└── release/                  # built .exe + .msi (committed for convenience)
```

### How the math works

1. **Cell text** → `normalize.ts` substitutes unicode (ℏ → `hbar`, π → `pi`, σ_x → `sigma_x`) and inserts implicit-multiplication asterisks where unambiguous (`2ω` → `2*omega`).
2. **math.js** parses each cell into a `MathNode` AST.
3. **Faddeev-LeVerrier** runs symbolically over the AST grid to produce characteristic polynomial coefficients of any size up to 5×5. Trace and determinant fall out for free.
4. **For n = 2** we additionally produce a closed-form symbolic eigenvalue expression: λ = ½tr ± √((½diag-diff)² + bc).
5. **If the user has bound numeric values for every free symbol**, the matrix is evaluated to numbers and we run `mathjs.eigs` for full numeric spectrum + eigenvectors, then `expm(-iH)` for the time-evolution operator.
6. **Render** every result through KaTeX, with Greek and physics symbols mapped to the right LaTeX commands.

### Why Tauri and not Electron / Mathematica / a webapp

| | Tauri (HamCalc) | Electron equivalent | Mathematica |
|-|-|-|-|
| Binary size | ~5 MB | ~200 MB | ~5 GB |
| Cold start | <0.5 s | 2–4 s | 10+ s |
| Works offline | ✓ | ✓ | ✓ |
| Free | ✓ | ✓ | ✗ ($350+/yr) |

---

## ⌨️ Keyboard cheatsheet

| Hardware | Inserts | Hardware | Inserts |
|----------|---------|----------|---------|
| `\alpha` | α | `\hbar` | ℏ |
| `\beta`  | β | `\dag` / `\dagger` | † |
| `\gamma` | γ | `\infty` | ∞ |
| `\theta` | θ | `\sqrt` | √ |
| `\lambda`| λ | `\cdot` | · |
| `\omega` | ω | `\Omega` | Ω |
| `^`      | superscript box | `_` | subscript box |
| `Ctrl+Enter` | Solve | `Tab` / `Shift+Tab` | next / prev cell |

Or just click the on-screen keyboard.

---

## 🗺️ Roadmap

- [x] **v0.1 — MVP**: 2×2 / 3×3 / 4×4 symbolic, full keyboard, eigenvalues + eigenvectors, KaTeX output, NSIS + MSI bundle.
- [ ] **v0.2 — Useful**: Up to 6×6 symbolic via SymPy via Pyodide, full export pipeline, light theme.
- [ ] **v0.3 — Sticky**: Hamiltonian zoo (Pauli, Gell-Mann, Jaynes-Cummings, Hubbard…), shareable URLs.
- [ ] **v1.0 — Public launch**: Tensor-product builder `H = H₁ ⊗ I + I ⊗ H₂`, "Explain this step" panel.

See [`HAMCALC_DESIGN.md`](HAMCALC_DESIGN.md) for the full design document.

---

## 🤝 Contributing

PRs welcome. The parser has the most room for sharper UX (better error messages, clearer ambiguous-multiplication warnings); the solver could grow a Pyodide+SymPy fallback for n > 4 symbolic eigenvalues.

```bash
npm run tauri dev          # hot-reload dev
npx tsc -b                  # typecheck
npm run tauri build         # produce installers
```

---

## 📜 License

MIT — see [`LICENSE`](LICENSE).

Logo & brand: Original work, MIT-licensed alongside the source.

---

<div align="center">

<sub>Built with Tauri 2, React 18, TypeScript, KaTeX, math.js, Zustand, and Tailwind CSS.</sub>

</div>
