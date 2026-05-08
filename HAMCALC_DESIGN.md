# HamCalc — Symbolic Hamiltonian Solver

> A browser-based calculator for diagonalizing matrix Hamiltonians whose entries can be
> numbers, symbols, or full expressions. Type a 4×4 matrix using a physics keyboard,
> press **Solve**, get eigenvalues, eigenvectors, characteristic polynomial, and the
> time-evolution operator — rendered as proper LaTeX.

---

## 1. Vision

Most people who want to diagonalize a Hamiltonian today either:

1. Open Mathematica (paid, heavy, syntax-heavy).
2. Hand-write a Python script with SymPy, fight LaTeX, and re-do it next week.
3. Do it on paper and make sign errors.

**HamCalc** is the missing third option: a single page where you spec the matrix size,
type the entries with a physics-aware keyboard (Greek letters, ℏ, dagger, Pauli matrices,
sub/superscripts), and get the spectrum back as rendered math. No login, no setup,
no syntax to memorize.

---

## 2. Scope and non-goals

### In scope (v1)

- Square matrices up to **6×6** symbolic, **64×64** numeric.
- Cell entries that are numbers, symbols (e.g. `ω`, `g`, `t`), or expressions
  (e.g. `ℏω/2 + g·cos(θ)`).
- Standard outputs: eigenvalues, eigenvectors, characteristic polynomial,
  determinant, trace, rank, Hermiticity check, and the unitary `U(t) = exp(-iHt/ℏ)`
  for small matrices.
- LaTeX rendering of input *and* output.
- Save / load matrix as JSON. Export results as LaTeX or Markdown.

### Explicit non-goals (for now)

- **Operator algebra.** No symbolic manipulation of non-commuting `a`, `a†`,
  `σ_x` as operators. The user must already have written the Hamiltonian as a
  matrix in some basis. (The keyboard *will* offer Pauli matrices and dagger as
  notational shortcuts that get expanded to their 2×2 forms when the user
  inserts them.)
- **Multi-particle / tensor-product builder.** A `H = H₁ ⊗ I + I ⊗ H₂` widget
  is a v2 feature.
- **Time-dependent Hamiltonians.** Floquet / Magnus expansion → v3.
- **Open systems (Lindblad).** Out of scope; that's QuTiP territory.

---

## 3. Target users

- Graduate students in quantum optics / condensed matter / AMO who keep
  re-diagonalizing 4×4 toy models.
- Faculty preparing problem sets and lecture notes.
- Self-taught learners working through Sakurai or Cohen-Tannoudji.
- Reviewers who want to sanity-check a paper's reported eigenvalues in 30 seconds.

---

## 4. Core UX flow

```
[1] Pick matrix size      [2] Fill cells                [3] Solve              [4] Read output
   ┌──────────┐              ┌─────┬─────┐                                       Eigenvalues:
   │ Rows: 2  │              │ ℏω/2│  g  │                                        λ₁ = ½(ℏω + √(ℏ²ω² + 4g²))
   │ Cols: 2  │     ───►     ├─────┼─────┤      ───►    [Solve]      ───►        λ₂ = ½(ℏω - √(ℏ²ω² + 4g²))
   │  [Go]    │              │  g  │ ℏω/2│
   └──────────┘              └─────┴─────┘                                       Eigenvectors: …
                                                                                 Char poly: …
```

### 4.1 Step 1 — Size picker

Modal on first load. User enters rows and columns (default both to 2).
Non-square matrices are allowed; eigenvalue features grey out unless square.

### 4.2 Step 2 — Cell editor + keyboard

The matrix renders as a real HTML grid. Each cell is a small inline LaTeX
expression editor. Clicking a cell opens the keyboard at the bottom of the
viewport; typing inserts at the cursor; the cell's LaTeX preview updates live.

**Navigation:** `Tab` / `Shift+Tab` move forward/back; arrow keys move between
cells when the cell editor is empty; `Enter` commits and moves to the cell below.

**Live validation:** the cell turns yellow on a parse warning (e.g. unmatched
parenthesis) and red on a parse error. The Solve button is disabled until all
cells are green.

### 4.3 Step 3 — Solve

A single big button. Behind it the pipeline is:

```
cell strings → tokenize → parse to AST → SymPy expressions → assemble Matrix
            → run requested ops (eigenvals, eigenvecs, charpoly, …)
            → render results as LaTeX → stream back to UI
```

### 4.4 Step 4 — Output panel

Tabbed, in this order:

1. **Spectrum** — eigenvalues with multiplicities.
2. **Eigenvectors** — one per eigenvalue, normalized.
3. **Properties** — det, trace, rank, Hermitian?, Unitary?, Positive-definite?
4. **Characteristic polynomial** — `p(λ) = det(λI − H)`.
5. **Time evolution** — `U(t) = exp(-iHt/ℏ)`, computed via diagonalization.
6. **Numerical** — same matrix evaluated at user-supplied parameter values, with
   a small bar plot of the spectrum.
7. **Export** — copy as LaTeX, copy as Markdown, download `.json`, download
   standalone Python (SymPy) script that reproduces the calculation.

---

## 5. The keyboard

This is the main UX innovation. It's a tabbed, on-screen keyboard that always
inserts well-formed LaTeX into the active cell. Tabs:

### 5.1 `Basic`

```
1 2 3 4 5 6 7 8 9 0
+ − × ÷ / ^ . = ( )
±  √   |  ,  ;  ⌫
```

`^` opens a superscript box. `_` (Shift+`-`) opens subscript. `√` wraps the
current selection or opens an empty radicand.

### 5.2 `Latin`

Lowercase a–z and uppercase A–Z, plus italics toggle. Default rendering for
bare letters is italic (math convention).

### 5.3 `Greek`

```
α β γ δ ε ζ η θ ι κ λ μ
ν ξ ο π ρ σ τ υ φ χ ψ ω
Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ
Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω
```

Variant glyphs: `ϵ ϑ ϰ ϕ ϱ ϖ` available in a long-press menu.

### 5.4 `Physics`

Constants and operators that have universally-agreed meaning:

```
ℏ  ℎ  c  e  kB  ε₀  μ₀  π  i  ∞  ⟨⟩  ⟨|⟩  ⟨|·|⟩
†  *  ⊗  ⊕  ∂  ∇  ∫  ∑  ∏
σ_x σ_y σ_z  σ_+ σ_−  𝟙  σ⃗
```

`σ_x`, `σ_y`, `σ_z` insert as named tokens in the cell expression. When the
parser hits one, it expands to the 2×2 Pauli matrix — but only if the parent
cell is *itself* a 2×2 (or 2×2 block of) entry. Otherwise the parser raises a
helpful error: *"σ_x is a 2×2 operator; can't put it in a single cell of a
larger matrix without specifying basis."*

### 5.5 `Functions`

```
sin  cos  tan   exp  ln  log
sinh cosh tanh  arctan arcsin arccos
abs  conj  Re  Im  sgn  δ(·)  Θ(·)
```

### 5.6 `Structure`

Sub/superscript boxes, fractions, big sums and integrals with limits, matrix
of matrices (block notation).

### 5.7 Hardware keyboard shortcuts

| Keystroke    | Inserts        |
|--------------|----------------|
| `\alpha`     | α              |
| `\hbar`      | ℏ              |
| `\dag`       | †              |
| `^{...}`     | superscript    |
| `_{...}`     | subscript      |
| `\frac{a}{b}`| a/b            |
| `\sqrt{...}` | √              |

Basically a LaTeX shortcut layer, so power users never touch the on-screen
keys.

---

## 6. Cell expression grammar

Each cell is parsed as a single SymPy expression. The grammar is roughly:

```
expr     := term (('+' | '−') term)*
term     := factor (('·' | '×' | '/' | (implicit)) factor)*
factor   := unary | factor '^' factor | factor '†'
unary    := ('+' | '−') factor | atom
atom     := number | symbol | constant | function '(' expr_list ')'
          | '(' expr ')' | '|' expr '|' | '√' atom | matrix_ref
symbol   := latin_letter | greek_letter | symbol '_' atom | symbol '^' atom
```

Where `matrix_ref` is a named Pauli or identity matrix that gets substituted
for its 2×2 form when contextually valid.

**Multiplication is implicit between adjacent atoms** (`2ω` = `2*ω`,
`ℏω` = `ℏ*ω`, `ab` is *one symbol* `ab` *unless* it's `a·b`). This is the
trickiest UX call; we follow the Mathematica convention: single-letter
identifiers concatenate as products, multi-letter identifiers are atomic.
The keyboard helps by inserting an invisible `·` between two single-letter
symbols when the user might be ambiguous, and showing it in the LaTeX preview
for clarity.

---

## 7. Solver pipeline

```
┌───────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│ Cell strings  ├──►│ Tokenize ├──►│ Parse to ├──►│ Build SymPy  │
│ (one per cell)│   │          │   │   AST    │   │   Matrix     │
└───────────────┘   └──────────┘   └──────────┘   └──────┬───────┘
                                                         │
                       ┌─────────────────────────────────┤
                       ▼                                 ▼
                ┌──────────────┐                 ┌──────────────┐
                │ Symbolic ops │                 │ Numeric ops  │
                │ (eigenvals,  │                 │ (with user   │
                │  charpoly,   │                 │  parameter   │
                │  exp(-iHt/ℏ))│                 │  values)     │
                └──────┬───────┘                 └──────┬───────┘
                       │                                │
                       └────────────┬───────────────────┘
                                    ▼
                          ┌──────────────────┐
                          │ LaTeX renderer + │
                          │  JSON serializer │
                          └──────────────────┘
```

### 7.1 Symbolic complexity guards

Closed-form eigenvalues exist for n ≤ 4 (Cardano / Ferrari). For n = 5 and
above, SymPy will sometimes find eigenvalues if there's structure (block
diagonal, sparse), and otherwise return roots of an unsolvable polynomial.
We will:

- For `n ≤ 4`: always attempt symbolic.
- For `n = 5, 6`: attempt symbolic with a 10-second timeout. Fall back to
  "characteristic polynomial only" if it times out.
- For `n ≥ 7`: refuse symbolic eigenvalues; offer characteristic polynomial
  and numeric mode only.

### 7.2 Numeric mode

User can declare numeric values for any symbols (`ω = 1.0`, `g = 0.3`).
Backend substitutes, calls `numpy.linalg.eigh` (if Hermitian) or `eig`,
returns numeric spectrum + eigenvectors. Plot via Vega-Lite spec sent to
front-end.

---

## 8. Tech stack

| Layer        | Choice                                | Why                                                                 |
|--------------|---------------------------------------|---------------------------------------------------------------------|
| Frontend     | Next.js 14 (App Router) + TypeScript  | SSR for SEO, RSC for snappy load, TS for safety on the parser glue. |
| UI lib       | Radix UI primitives + Tailwind CSS    | Headless, accessible, no design-system lock-in.                     |
| Math render  | KaTeX                                 | 10× faster than MathJax, server-renderable.                         |
| State        | Zustand                               | Matrix grid + cursor state is small; Redux is overkill.             |
| Parser       | Custom recursive-descent in TS        | Pratt-style; gives us total control over implicit multiplication.   |
| Math engine  | SymPy via Pyodide (in-browser)        | Zero backend, zero per-user cost, offline-capable.                  |
| Fallback     | FastAPI + SymPy on a small VM         | For users on devices that can't run Pyodide (older mobile).         |
| Persistence  | LocalStorage for drafts; optional     | Saves last 20 matrices client-side. Account sync = v2.              |
|              | Supabase for accounts (v2)            |                                                                     |
| Deploy       | Vercel (frontend) + Fly.io (fallback) | Free tier covers the realistic user base.                           |
| Tests        | Vitest (parser), Pytest (solver)      | Parser has ~100 golden-file cases; solver has ~30.                  |

**Why Pyodide over a backend.** SymPy in Pyodide is ~12 MB gzipped — yes,
that's a big first-load, but it caches forever, and after that the app is
fully offline and we pay zero compute for solves. Given that solving a 4×4
symbolic eigenvalue can take 5–30 seconds of CPU, doing this in a backend
would either need a queue or burn money fast. In-browser is the right call
here.

---

## 9. Project structure

```
hamcalc/
├── apps/
│   └── web/                          # Next.js app
│       ├── app/
│       │   ├── page.tsx              # Main solver page
│       │   ├── about/page.tsx
│       │   └── api/solve/route.ts    # Fallback endpoint → backend
│       ├── components/
│       │   ├── MatrixGrid.tsx
│       │   ├── CellEditor.tsx
│       │   ├── Keyboard/
│       │   │   ├── index.tsx
│       │   │   ├── BasicTab.tsx
│       │   │   ├── GreekTab.tsx
│       │   │   ├── PhysicsTab.tsx
│       │   │   └── …
│       │   ├── OutputPanel/
│       │   │   ├── SpectrumTab.tsx
│       │   │   ├── EigenvectorsTab.tsx
│       │   │   ├── PropertiesTab.tsx
│       │   │   └── …
│       │   └── ui/                   # shadcn/ui primitives
│       ├── lib/
│       │   ├── parser/
│       │   │   ├── tokenize.ts
│       │   │   ├── parse.ts
│       │   │   ├── ast.ts
│       │   │   └── toSympy.ts        # AST → Python source string
│       │   ├── pyodide/
│       │   │   ├── loader.ts
│       │   │   └── solver.py         # Runs inside Pyodide
│       │   ├── latex/
│       │   │   └── render.ts
│       │   └── store.ts              # Zustand
│       └── public/
│           └── logo.svg
├── packages/
│   └── grammar/                      # Shared parser grammar tests
├── services/
│   └── solver-fallback/              # FastAPI for non-Pyodide clients
│       ├── main.py
│       ├── solve.py
│       └── tests/
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   └── KEYBOARD.md
└── package.json
```

---

## 10. API (fallback backend)

Used only when Pyodide cannot load (older Android, niche browsers).

### `POST /api/v1/solve`

```jsonc
// Request
{
  "matrix": [
    ["hbar*omega/2", "g"],
    ["g",            "hbar*omega/2"]
  ],
  "operations": ["eigenvalues", "eigenvectors", "charpoly", "evolution"],
  "numeric_subs": { "omega": 1.0, "g": 0.3, "hbar": 1.0 },
  "options": { "assume_hermitian": true, "timeout_s": 10 }
}
```

```jsonc
// Response
{
  "ok": true,
  "results": {
    "eigenvalues": [
      { "latex": "\\frac{\\hbar\\omega}{2} - g", "numeric": 0.2 },
      { "latex": "\\frac{\\hbar\\omega}{2} + g", "numeric": 0.8 }
    ],
    "eigenvectors": [
      { "latex": "\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1\\\\-1\\end{pmatrix}",
        "numeric": [0.7071, -0.7071] },
      { "latex": "\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1\\\\1\\end{pmatrix}",
        "numeric": [0.7071, 0.7071] }
    ],
    "charpoly": "\\lambda^2 - \\hbar\\omega\\lambda + \\frac{\\hbar^2\\omega^2}{4} - g^2",
    "evolution": "..."
  },
  "warnings": [],
  "took_ms": 412
}
```

Errors return HTTP 4xx with a `{ "ok": false, "error": "...", "cell": [i,j] }`
shape so the UI can highlight the offending cell.

---

## 11. Worked example (sanity check)

User inputs the Rabi-model 2×2:

| | col 0 | col 1 |
|-|-------|-------|
| **row 0** | `ℏω/2` | `g` |
| **row 1** | `g`    | `−ℏω/2` |

Solver returns:

- Eigenvalues: `λ± = ±½√(ℏ²ω² + 4g²)`
- Eigenvectors: standard Rabi mixing angle `θ = ½ arctan(2g / ℏω)` form.
- `U(t) = cos(Ωt/2)·𝟙 − i·sin(Ωt/2)·(ℏω·σ_z + 2g·σ_x)/Ω` where `Ω = √(ℏ²ω² + 4g²)`.

This is the regression test the parser + solver must pass before v1 ships.

---

## 12. Roadmap

### v0.1 — MVP (4 weeks)

- 2×2, 3×3, 4×4 matrices.
- Basic + Greek + Physics keyboard tabs only.
- Eigenvalues + eigenvectors only.
- Pyodide path only, no backend.
- LocalStorage drafts.
- Deploy on Vercel.

### v0.2 — Useful (8 weeks)

- Up to 6×6 symbolic, 64×64 numeric.
- Properties tab (Hermitian, trace, det, …).
- Time-evolution operator.
- Export to LaTeX, Markdown, standalone Python.
- Functions tab on keyboard.
- Light + dark theme.

### v0.3 — Sticky (12 weeks)

- Account system; cloud-saved matrices.
- "Library" of named matrices (Pauli, Gell-Mann, σ⃗·n̂, harmonic-oscillator-truncated, …).
- Shareable URLs for a matrix + result.
- Fallback FastAPI service for low-end clients.

### v1.0 — Public launch

- Tensor-product builder (`H₁ ⊗ I + I ⊗ H₂`).
- Block-matrix entry mode.
- "Explain this step" panel that walks through the diagonalization.
- Mobile keyboard polish.

### v2.x — Out past launch

- Operator-algebra mode (treat `a`, `a†` symbolically with `[a, a†] = 1`).
- Time-dependent Hamiltonians (Floquet).
- Open-system extensions or just integrate-with-QuTiP path.

---

## 13. Open questions

1. **Implicit multiplication** for ambiguous strings like `ab` — concatenate
   into one symbol or treat as `a·b`? Current plan: concatenate, force the
   user to write `a·b` or `a*b` for the product. Need to test this with
   real users.
2. **Pauli expansion** when the surrounding matrix is not 2×2 — silently
   forbid, or auto-pad with identities? Probably forbid in v1.
3. **Long-running solves** in Pyodide block the UI. Use a Web Worker with
   `pyodide.runPythonAsync`; need to test cancellability.
4. Whether to ship a "Hamiltonian zoo" (Jaynes-Cummings, Heisenberg, Hubbard,
   Dirac, …) as one-click templates from day one. Probably yes — it answers
   "what do I do here?" for new users.

---

## 14. Name and brand

- **Working name:** HamCalc.
- **Tagline:** *Symbolic Hamiltonian Solver — diagonalize in your browser.*
- **Logo:** stylized `Ĥ` (italic H with caret) inside square matrix brackets,
  on an indigo→violet gradient. See `logo.svg`.
- **Domain candidates:** `hamcalc.app`, `hamiltonian.tools`, `solveh.app`.

---

*End of design document. Next steps: spike the parser in TypeScript against
the worked example in §11, then build the keyboard scaffolding around it.*
