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

[**🌐 Live Web App**][web-url] · [**💾 Windows Installer**][download-url] · [**📐 Design Doc**](HAMCALC_DESIGN.md) · [**🗺️ Roadmap**](#%EF%B8%8F-roadmap)

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

![HamCalc hero](docs/images/hero.png)

</div>

## 📌 What is HamCalc?

Most people who want to diagonalize a 2×2, 3×3, or 4×4 Hamiltonian today either fire up **Mathematica** (paid, heavy), wrestle a **SymPy** script and re-derive the LaTeX next week, or do it on paper and make sign errors.

**HamCalc is the missing third option:** a single page where you spec the matrix size, type the entries with a physics-aware keyboard, press **Solve**, and get the spectrum back as rendered math.

> No login. No setup. No Mathematica syntax to memorize. Works on your phone.

## 📱 Use it anywhere

The full app is hosted on **GitHub Pages** — open it on a phone, tablet, or desktop:

> **<https://hasnain7abbas.github.io/hamcalc/>**

<table>
<tr>
<td width="50%"><img src="docs/images/mobile.png" alt="HamCalc on mobile" /></td>
<td width="50%"><img src="docs/images/keyboard.png" alt="On-screen physics keyboard" /></td>
</tr>
<tr>
<td align="center"><sub>Phone layout (vertical, sticky header)</sub></td>
<td align="center"><sub>Six-tab Gboard-style physics keyboard</sub></td>
</tr>
</table>

The interface is fully responsive:

- The matrix scales down to phone screens; brackets, gaps, and cell widths shrink with `sm:` breakpoints.
- Inputs use 16 px font on mobile so iOS doesn't auto-zoom.
- Tap targets are at least 40 × 40 px (Material / Apple HIG).
- Layout respects iOS safe areas (notch / home indicator).
- Translucent panels with `backdrop-blur-xl` over a static gradient backdrop.
- Works **offline** once loaded — calculations happen entirely in your browser.

## 🚀 Features

| Capability | Detail |
|------------|--------|
| **Matrix sizing** | 2×2 through 6×6 symbolic, up to 64×64 numeric. |
| **Physics keyboard** | Six tabs (`Basic`, `Latin`, `Greek`, `Physics`, `Functions`, `Structure`), Gboard-style rows. Inserts proper unicode glyphs (α, β, ℏ, †, σₓ, ∇, ∫…). |
| **Hardware shortcuts** | Type `\alpha`, `\hbar`, `\dag` on a normal keyboard — rewritten in real time. |
| **Live LaTeX preview** | Under every cell, rendered with KaTeX. |
| **Symbolic eigenvalues** | Closed form for n = 2; characteristic polynomial via Faddeev–LeVerrier up to n = 5. |
| **Numeric eigenvalues** | math.js `eigs` for full numeric spectrum + eigenvectors once symbols are bound. |
| **Time evolution** | Numerical <img alt="U(t)" src="https://latex.codecogs.com/svg.latex?U(t)=e^{-iHt/\hbar}" />. |
| **Properties** | Trace, determinant, rank, Hermitian, Unitary, Positive-definite. |
| **Export** | LaTeX, Markdown, JSON, standalone Python (SymPy) script. |
| **Persistence** | LocalStorage drafts — your matrix is still there next time. |
| **Dark theme** | Indigo→violet gradient backdrop with translucent glass panels. |
| **Native desktop** | Tauri 2 produces a single ~5 MB Windows binary, not a 200 MB Electron blob. |

## 🧮 What HamCalc computes

For an input matrix Hamiltonian $H \in \mathbb{C}^{n \times n}$, HamCalc reports:

### 1. Eigenvalues (Spectrum)

Solutions of the eigenvalue equation

$$H\,|\psi_k\rangle = \lambda_k\,|\psi_k\rangle, \qquad k = 1, \dots, n.$$

Symbolic for $n = 2$ (closed form via the quadratic formula); numeric for any $n$ once parameters are bound.

![Spectrum tab](docs/images/output-spectrum.png)

### 2. Eigenvectors

The vectors $|\psi_k\rangle$ paired with each eigenvalue. HamCalc returns them normalized; degenerate subspaces are returned as one orthonormal basis.

$$|\psi_k\rangle \in \mathbb{C}^{n}, \qquad \langle\psi_k|\psi_k\rangle = 1.$$

![Eigenvectors tab](docs/images/output-eigenvectors.png)

### 3. Properties

| Property | Definition |
|----------|------------|
| Trace          | $\operatorname{tr}(H) = \sum_i H_{ii}$ |
| Determinant    | $\det(H) = \prod_k \lambda_k$ |
| Rank           | dimension of the column space |
| Hermitian      | $H = H^{\dagger}$ |
| Unitary        | $H^{\dagger} H = I$ |
| Positive-definite | $\lambda_k > 0\;\;\forall k$ (Hermitian only) |

![Properties tab](docs/images/output-properties.png)

### 4. Characteristic polynomial

$$p(\lambda) = \det(\lambda I - H).$$

Computed with the [Faddeev–LeVerrier](https://en.wikipedia.org/wiki/Faddeev%E2%80%93LeVerrier_algorithm) algorithm, which falls out trace, determinant, and all coefficients in a single $O(n^4)$ pass.

![Char Poly tab](docs/images/output-charpoly.png)

### 5. Time-evolution unitary

$$U(t) = \exp\!\left(-\tfrac{i\,H\,t}{\hbar}\right).$$

Computed numerically by matrix exponentiation once all symbols are bound. Default plot is at $t = \hbar = 1$.

![U(t) tab](docs/images/output-evolution.png)

### 6. Worked-example "Steps" mode

Every quantity above has a teacher-style derivation in the **Steps** tab — symbolic algebra first, with a substitution step at the end when free symbols are bound. Full algebra is shown for $n \le 3$ (cofactor expansion, quadratic-formula derivation, eigenvector null-space); for $n \ge 4$ the tab summarizes the Faddeev–LeVerrier recursion that the solver actually runs.

![Steps tab](docs/images/output-steps.png)

### 7. Export

Copy or download the entire calculation as **LaTeX**, **Markdown**, **JSON**, or a standalone **Python (SymPy)** script that reproduces it byte-for-byte.

## 🧪 Worked example — Rabi model

Drop in the standard 2×2 Rabi Hamiltonian

$$H_{\text{Rabi}} = \begin{pmatrix} \hbar\omega/2 & g \\\\ g & -\hbar\omega/2 \end{pmatrix}.$$

Press **Solve** (or `Ctrl+Enter`). HamCalc returns:

| Quantity | Value |
|----------|-------|
| Eigenvalues       | $\lambda_{\pm} = \pm \tfrac{1}{2}\sqrt{\hbar^2\omega^2 + 4g^2}$ |
| Eigenvectors      | Standard Rabi mixing-angle form, $\theta = \tfrac{1}{2}\arctan(2g/\hbar\omega)$ |
| Trace             | $0$ |
| Determinant       | $-\tfrac{\hbar^2\omega^2}{4} - g^2$ |
| Hermitian         | ✓ |
| Char. polynomial  | $p(\lambda) = \lambda^2 - \tfrac{\hbar^2\omega^2}{4} - g^2$ |
| $U(t)$ at $\omega=1, g=0.3, \hbar=1$ | numeric 2×2 unitary |

This is the regression test enshrined in §11 of [`HAMCALC_DESIGN.md`](HAMCALC_DESIGN.md).

## 🎛️ The size picker

On first launch HamCalc asks for the matrix shape. Pick a custom $r \times c$ or grab a preset:

![Size modal](docs/images/size-modal.png)

| Preset | Use case                              |
|--------|---------------------------------------|
| 2×2    | Two-level system / Rabi / qubit       |
| 3×3    | Spin-1 / three-level $\Lambda$, V, $\Xi$ |
| 4×4    | Two qubits / 4-level                  |
| 6×6    | Maximum reliable size for symbolic    |

Symbolic eigenvalues are guaranteed only for $n \le 4$ (Cardano / Ferrari). For $n = 5, 6$ HamCalc falls back to the characteristic polynomial; for $n \ge 7$ numeric mode only.

## 🏁 Get started

### Use the web app

Just open <https://hasnain7abbas.github.io/hamcalc/> on any device.

### Install the desktop app (Windows)

Pre-built installers are attached to each [GitHub release](https://github.com/hasnain7abbas/hamcalc/releases):

| File | Format | Description |
|------|--------|-------------|
| `HamCalc_x64-setup.exe` | NSIS installer | One-click `.exe` installer |
| `HamCalc_x64_en-US.msi` | MSI installer  | Enterprise-friendly Windows Installer |

Double-click either file. The app appears as **HamCalc** in the start menu with the gradient $\hat H$ icon.

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

The web build is published to **GitHub Pages** by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`. To deploy a fork to your own Pages site:

1. Fork the repo.
2. Push to `main`. The workflow auto-enables Pages and deploys `dist/`.
3. The site goes live at `https://<your-user>.github.io/hamcalc/`.

If your fork uses a different repo name, update `base` in [`vite.config.ts`](vite.config.ts).

## ⌨️ Keyboard cheatsheet

Hardware keyboard shortcuts:

| Keystroke | Inserts | Keystroke | Inserts |
|-----------|---------|-----------|---------|
| `\alpha`  | α       | `\hbar`   | ℏ       |
| `\beta`   | β       | `\dag` / `\dagger` | †  |
| `\gamma`  | γ       | `\infty`  | ∞       |
| `\theta`  | θ       | `\sqrt`   | √       |
| `\lambda` | λ       | `\cdot`   | ·       |
| `\omega`  | ω       | `\Omega`  | Ω       |
| `^`       | superscript box | `_` | subscript box |
| `Ctrl+Enter` | **Solve** | `Tab` / `Shift+Tab` | next / prev cell |

Or just tap the on-screen keyboard.

## 🏗️ Architecture

```
hamcalc/
├── HAMCALC_DESIGN.md              # Full design doc
├── logo.svg                       # Source logo — feeds web favicon and Tauri icons
├── index.html                     # Vite entry, mobile + PWA meta
├── vite.config.ts                 # base = "/hamcalc/" when GITHUB_PAGES=true
├── public/                        # Vite static assets
├── docs/images/                   # Screenshots used by this README
├── src/                           # React + TypeScript front-end
│   ├── App.tsx                    # Sticky compact header, responsive layout
│   ├── components/
│   │   ├── SizeModal.tsx          # Translucent first-load size picker
│   │   ├── MatrixGrid.tsx         # Cells with live KaTeX preview & status colors
│   │   ├── Keyboard.tsx           # 6-tab Gboard-style physics keyboard
│   │   ├── ParametersPanel.tsx    # Bind numeric values to free symbols
│   │   ├── OutputPanel.tsx        # 7-tab result viewer with definitions
│   │   └── Tex.tsx                # KaTeX wrapper
│   ├── lib/
│   │   ├── parser/                # unicode → ASCII, math.js wrapper
│   │   ├── latex/render.ts        # nodes → LaTeX
│   │   ├── solver/solver.ts       # Faddeev–LeVerrier, 2×2 closed form, U(t)
│   │   ├── shortcuts.ts           # \alpha → α rewriter
│   │   └── store.ts               # Zustand + LocalStorage persist
│   └── styles/globals.css         # Tailwind + safe-area + iOS zoom guards
├── src-tauri/                     # Rust + Tauri 2 shell (desktop only)
└── .github/workflows/deploy.yml   # Web → GitHub Pages
```

### How the math works

1. **Cell text** → unicode normalized (ℏ → `hbar`, π → `pi`, σ_x → `sigma_x`); implicit-multiplication asterisks inserted where unambiguous (`2ω` → `2*omega`).
2. **math.js** parses each cell into a `MathNode` AST.
3. **Faddeev–LeVerrier** runs symbolically over the AST grid to produce all coefficients of $p(\lambda) = \det(\lambda I - H)$ for $n \le 5$. Trace and determinant fall out for free.
4. For $n = 2$ we additionally produce a closed-form symbolic eigenvalue:
   $$\lambda_{\pm} = \tfrac{1}{2}(a + d) \pm \sqrt{\bigl(\tfrac{a-d}{2}\bigr)^2 + bc}.$$
5. If the user has bound numeric values for every free symbol, the matrix is evaluated to numbers and we run `mathjs.eigs` for full numeric spectrum + eigenvectors, then `expm(-iH)` for $U(t)$.
6. Every result renders through KaTeX with Greek and physics symbols mapped to the right LaTeX commands.

### Why Tauri (and not Electron / Mathematica / a webapp)

|              | Tauri (HamCalc) | Electron equivalent | Mathematica |
|--------------|-----------------|---------------------|-------------|
| Binary size  | ~5 MB           | ~200 MB             | ~5 GB       |
| Cold start   | <0.5 s          | 2–4 s               | 10+ s       |
| Works offline| ✓               | ✓                   | ✓           |
| Mobile (web) | ✓               | ✗                   | ✗           |
| Free         | ✓               | ✓                   | ✗ ($350+/yr) |

## 🗺️ Roadmap

- [x] **v0.1 — MVP**: 2×2 / 3×3 / 4×4 symbolic, full keyboard, eigenvalues + eigenvectors, KaTeX output, NSIS + MSI bundle, web build on GitHub Pages.
- [x] **v0.1.1 — Polish**: Translucent glass UI, Gboard-style keyboard, mobile optimizations, math definitions in every output tab.
- [ ] **v0.2 — Useful**: Up to 6×6 symbolic via SymPy/Pyodide, full export pipeline, light theme.
- [ ] **v0.3 — Sticky**: Hamiltonian zoo (Pauli, Gell-Mann, Jaynes–Cummings, Hubbard, …), shareable URLs.
- [ ] **v1.0 — Public launch**: Tensor-product builder $H = H_1 \otimes I + I \otimes H_2$, "Explain this step" panel.

See [`HAMCALC_DESIGN.md`](HAMCALC_DESIGN.md) for the full design document.

## 🤝 Contributing

PRs welcome. The parser has the most room for sharper UX (better error messages, clearer ambiguous-multiplication warnings); the solver could grow a Pyodide+SymPy fallback for $n > 4$ symbolic eigenvalues.

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

**Why is symbolic eigen-decomposition limited to $n = 2$?**
Closed-form roots only exist up to $n = 4$ (Cardano / Ferrari) and are unwieldy for $n = 3, 4$. v0.2 will ship a Pyodide+SymPy path for full symbolic eigenvalues up to 6×6.

**Why doesn't iOS auto-zoom my matrix when I tap a cell?**
We force a 16 px input font on mobile, the iOS threshold for disabling auto-zoom. Desktop layouts revert to denser font sizes.

**How are the README screenshots produced?**
By [`scripts/screenshots.mjs`](scripts/screenshots.mjs), a Playwright script that drives the live web app at desktop and mobile viewports, walks every output tab, and writes the captures to [`docs/images/`](docs/images/). To re-generate after a UI change:

```bash
npm run build && npx vite preview --port 4173 &
npm run screenshots
```

## 📜 License

[MIT](https://opensource.org/license/mit/) — see [`LICENSE`](LICENSE).

Logo & brand: original work, MIT-licensed alongside the source.

---

<div align="center">

<sub>Built with Tauri 2 · React 18 · TypeScript · KaTeX · math.js · Zustand · Tailwind CSS</sub>

</div>
