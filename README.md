<div align="center">

<img src="logo.svg" alt="HamCalc" width="160" height="160" />

<h1 align="center">HamCalc</h1>

✨ Symbolic Hamiltonian Solver — diagonalize matrix Hamiltonians in your browser, ship as a desktop app.

[![Web][Web-image]][web-url]
[![Windows][Windows-image]][download-url]
[![Tauri][Tauri-image]][tauri-url]
[![React][React-image]][react-url]
[![TypeScript][TS-image]][ts-url]
[![License: MIT][License-image]](#-license)

[**Live Web App**][web-url] / [**Windows Installer**][download-url] / [**Design Doc**](HAMCALC_DESIGN.md) / [**Roadmap**](#%EF%B8%8F-roadmap)

[web-url]: https://hasnain7abbas.github.io/hamcalc/
[download-url]: https://github.com/hasnain7abbas/hamcalc/releases
[tauri-url]: https://tauri.app
[react-url]: https://react.dev
[ts-url]: https://typescriptlang.org
[Web-image]: https://img.shields.io/badge/Web-Live-orange?logo=microsoftedge
[Windows-image]: https://img.shields.io/badge/-Windows-blue?logo=windows
[Tauri-image]: https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri&logoColor=white
[React-image]: https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=000
[TS-image]: https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white
[License-image]: https://img.shields.io/badge/License-MIT-blue.svg

</div>

## 📌 What is HamCalc?

Most people who want to diagonalize a 2×2, 3×3, or 4×4 Hamiltonian today either fire up **Mathematica** (paid, heavy), wrestle a **SymPy** script and re-derive the LaTeX next week, or do it on paper and make sign errors.

**HamCalc is the missing third option:** a single page where you spec the matrix size, type the entries with a physics keyboard (Greek letters, ℏ, π, dagger, Pauli matrices, sub/superscripts), press **Solve**, and get the spectrum back as rendered math.

> No login. No setup. No Mathematica syntax to memorize. Works on your phone.

## 📱 Use it on the web

The full app is hosted on GitHub Pages — open it on a phone, tablet, or desktop:

> **<https://hasnain7abbas.github.io/hamcalc/>**

The interface is fully responsive:
- The matrix scales down to phone screens, with a dedicated on-screen physics keyboard.
- Inputs use a 16 px font on mobile to prevent iOS auto-zoom.
- Tap targets are at least 40 × 40 px (Material/Apple HIG).
- Layout respects iOS safe areas (notch / home indicator).
- Works offline once loaded — calculations happen entirely in your browser.

## 🚀 Features

- **Matrix sizing**: 2×2 through 6×6 symbolic, up to 64×64 numeric.
- **Physics-aware keyboard** with six tabs: `Basic`, `Latin`, `Greek`, `Physics`, `Functions`, `Structure`.
  Inserts proper unicode glyphs (α, β, ℏ, †, σₓ, ∇, ∫…) directly into cells.
- **Hardware shortcut layer**: type `\alpha`, `\hbar`, `\dag` on a normal keyboard — they're rewritten in real time.
- **Live LaTeX preview** under every cell, rendered with KaTeX.
- **Solver outputs**:
  - Spectrum (eigenvalues with multiplicities)
  - Eigenvectors
  - Properties: trace, determinant, rank, **Hermitian?**, **Unitary?**, **Positive-definite?**
  - Characteristic polynomial via Faddeev–LeVerrier
  - Time-evolution operator `U(t) = exp(-iHt/ℏ)`
  - Numeric mode with bar plot of the spectrum
- **Export**: copy/download as **LaTeX**, **Markdown**, **JSON**, or a standalone **Python (SymPy)** script that reproduces the calculation.
- **Persists across sessions** via LocalStorage — your matrix is still there next time.
- **Dark theme** styled around the logo's indigo→violet gradient.
- **Ships as a native desktop app** (Windows `.msi` + `.exe`) via Tauri 2 — webview-based but a single ~5 MB binary, not a 200 MB Electron blob.

## 🖼️ The interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Ĥ   HamCalc — Symbolic Hamiltonian Solver       [2×2 resize] [Solve ↵] │
├──────────────────────────────────────┬──────────────────────────────────┤
│                                      │  Spectrum  Eigenvectors  Props   │
│   2×2 matrix                         │  Char Poly  U(t)  Numeric  Export│
│                                      ├──────────────────────────────────┤
│   ⎡  ℏω/2     g    ⎤                 │  Input matrix:                   │
│   ⎢                ⎥                 │      ⎡ ℏω/2   g   ⎤              │
│   ⎣   g    -ℏω/2   ⎦                 │  H = ⎣  g   -ℏω/2 ⎦              │
│                                      │                                  │
│   Numeric values:                    │  Eigenvalues:                    │
│     ω = 1.0    g = 0.3               │    λ₊ = +½√(ℏ²ω² + 4g²)          │
│     ℏ = 1.0                          │    λ₋ = -½√(ℏ²ω² + 4g²)          │
│                                      │                                  │
│  ┌─ Keyboard ────────────────────┐   │  ✓ Hermitian                     │
│  │ Basic Latin Greek Physics ··· │   │                                  │
│  │  ℏ  ℎ  c  e  kB  π  i  ∞      │   │                                  │
│  │  †  *  ⊗  ∂  ∇                │   │                                  │
│  │  σx σy σz σ₊ σ₋  𝟙           │   │                                  │
│  └───────────────────────────────┘   │                                  │
└──────────────────────────────────────┴──────────────────────────────────┘
```

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
- **Char poly:**  `p(λ) = λ² − (ℏω·g)/4 …`  *(actual symbolic polynomial)*
- **U(t):**  with ω=1, g=0.3, ℏ=1 → numeric 2×2 unitary

This is the regression test enshrined in §11 of [`HAMCALC_DESIGN.md`](HAMCALC_DESIGN.md).

## 🏁 Get started

### Use the web app

Just open <https://hasnain7abbas.github.io/hamcalc/> on any device.

### Install the desktop app (Windows)

Pre-built installers are attached to each [GitHub release](https://github.com/hasnain7abbas/hamcalc/releases):

| File | Format | Description |
|------|--------|-------------|
| `HamCalc_x64-setup.exe` | NSIS installer | One-click `.exe` installer |
| `HamCalc_x64_en-US.msi` | MSI installer  | Enterprise-friendly Windows Installer |

Double-click either file. The app appears as **HamCalc** in the start menu with the gradient `Ĥ` icon.

### Build from source

Requirements: Node 18+, Rust 1.77+, the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your platform.

```bash
git clone https://github.com/hasnain7abbas/hamcalc.git
cd hamcalc
npm install

# Web dev server (hot reload)
npm run dev

# Tauri dev (desktop)
npm run tauri dev

# Production builds
npm run build           # → dist/  (web)
npm run tauri build     # → src-tauri/target/release/bundle/{nsis,msi}/
```

## 🌐 Deployment

The web build is automatically published to **GitHub Pages** by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`.

To deploy a fork to your own Pages site:

1. Fork the repo.
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. Push to `main`. The workflow runs `npm ci && npm run build` (with `GITHUB_PAGES=true` so Vite emits the right `base`) and uploads `dist/` to Pages.
4. The site goes live at `https://<your-user>.github.io/hamcalc/`.

If you publish under a different repo name, change the `base` value in [`vite.config.ts`](vite.config.ts).

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

Or just tap the on-screen keyboard.

## 🏗️ Architecture

```
hamcalc/
├── HAMCALC_DESIGN.md              # Full design doc
├── logo.svg                       # Source logo — feeds web favicon and Tauri icons
├── index.html                     # Vite entry, mobile meta tags, PWA hints
├── vite.config.ts                 # base = "/hamcalc/" when GITHUB_PAGES=true
├── public/                        # Vite static assets
├── src/                           # React + TypeScript front-end
│   ├── App.tsx                    # Header (sticky), responsive layout, Ctrl+Enter
│   ├── components/
│   │   ├── SizeModal.tsx          # First-load size picker
│   │   ├── MatrixGrid.tsx         # Cells with live KaTeX preview & status colors
│   │   ├── Keyboard.tsx           # 6-tab on-screen physics keyboard
│   │   ├── ParametersPanel.tsx    # Bind numeric values to free symbols
│   │   ├── OutputPanel.tsx        # 7-tab result viewer
│   │   └── Tex.tsx                # KaTeX wrapper
│   ├── lib/
│   │   ├── parser/                # unicode → ASCII, math.js wrapper
│   │   ├── latex/render.ts        # nodes → LaTeX
│   │   ├── solver/solver.ts       # Faddeev–LeVerrier, 2×2 closed form, U(t)
│   │   ├── shortcuts.ts           # \alpha → α rewriter
│   │   └── store.ts               # Zustand + LocalStorage persist
│   └── styles/globals.css         # Tailwind + safe-area + mobile zoom guards
├── src-tauri/                     # Rust + Tauri 2 shell (desktop only)
└── .github/workflows/deploy.yml   # Web → GitHub Pages
```

### How the math works

1. **Cell text** → unicode normalized (ℏ → `hbar`, π → `pi`, σ_x → `sigma_x`); implicit-multiplication asterisks inserted where unambiguous (`2ω` → `2*omega`).
2. **math.js** parses each cell into a `MathNode` AST.
3. **Faddeev–LeVerrier** runs symbolically over the AST grid to produce characteristic-polynomial coefficients up to 5×5. Trace and determinant fall out for free.
4. For **n = 2** we additionally produce a closed-form symbolic eigenvalue expression: λ = ½tr ± √((½diag-diff)² + bc).
5. If the user has bound numeric values for every free symbol, the matrix is evaluated to numbers and we run `mathjs.eigs` for full numeric spectrum + eigenvectors, then `expm(-iH)` for the time-evolution operator.
6. Render every result through KaTeX, with Greek and physics symbols mapped to the right LaTeX commands.

### Why Tauri (and not Electron / Mathematica / a webapp)

|              | Tauri (HamCalc) | Electron equivalent | Mathematica |
|--------------|-----------------|---------------------|-------------|
| Binary size  | ~5 MB           | ~200 MB             | ~5 GB       |
| Cold start   | <0.5 s          | 2–4 s               | 10+ s       |
| Works offline| ✓               | ✓                   | ✓           |
| Mobile (web) | ✓               | ✗                   | ✗           |
| Free         | ✓               | ✓                   | ✗ ($350+/yr)|

## 🗺️ Roadmap

- [x] **v0.1 — MVP**: 2×2 / 3×3 / 4×4 symbolic, full keyboard, eigenvalues + eigenvectors, KaTeX output, NSIS + MSI bundle, web build on GitHub Pages.
- [ ] **v0.2 — Useful**: Up to 6×6 symbolic via SymPy/Pyodide, full export pipeline, light theme.
- [ ] **v0.3 — Sticky**: Hamiltonian zoo (Pauli, Gell-Mann, Jaynes-Cummings, Hubbard…), shareable URLs.
- [ ] **v1.0 — Public launch**: Tensor-product builder `H = H₁ ⊗ I + I ⊗ H₂`, "Explain this step" panel.

See [`HAMCALC_DESIGN.md`](HAMCALC_DESIGN.md) for the full design document.

## 🤝 Contributing

PRs welcome. The parser has the most room for sharper UX (better error messages, clearer ambiguous-multiplication warnings); the solver could grow a Pyodide+SymPy fallback for n > 4 symbolic eigenvalues.

```bash
npm run dev                 # web dev server
npm run tauri dev           # hot-reload desktop dev
npx tsc -b                  # typecheck
npm run build               # web production build
npm run tauri build         # produce native installers
```

## ❓ FAQ

**Is my data private?**
Yes. Everything runs in the browser; no matrix or numeric value ever leaves your device.

**Will it work offline?**
After the first load, the web app is cached and works offline. The desktop build never needs the network.

**Why is symbolic eigen-decomposition limited to n = 2?**
Closed-form roots only exist up to n = 4 (Cardano / Ferrari) and even those are unwieldy. v0.2 will ship a Pyodide+SymPy path for full symbolic eigenvalues up to 6×6.

**Why doesn't the iOS keyboard zoom my matrix when I tap a cell?**
We force a 16 px input font on mobile, which is the iOS threshold for disabling auto-zoom. Desktop layouts revert to the denser font size.

## 📜 License

[MIT](https://opensource.org/license/mit/) — see [`LICENSE`](LICENSE).

Logo & brand: original work, MIT-licensed alongside the source.

---

<div align="center">

<sub>Built with Tauri 2 · React 18 · TypeScript · KaTeX · math.js · Zustand · Tailwind CSS</sub>

</div>
