import { useState } from "react";
import { useStore } from "../lib/store";
import type { SolveResult } from "../lib/solver/solver";
import { Tex } from "./Tex";

const tabs = [
  "Spectrum",
  "Eigenvectors",
  "Properties",
  "Char Poly",
  "U(t)",
  "Numeric",
  "Export",
] as const;
type Tab = (typeof tabs)[number];

export function OutputPanel() {
  const result = useStore((s) => s.result);
  const solving = useStore((s) => s.solving);
  const [tab, setTab] = useState<Tab>("Spectrum");

  return (
    <div className="panel p-4 flex flex-col min-h-0">
      <div className="flex items-center gap-1 overflow-x-auto mb-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab whitespace-nowrap ${tab === t ? "tab-active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {solving && (
        <div className="text-sm text-slate-400 animate-pulse">Solving…</div>
      )}

      {!result && !solving && (
        <div className="text-sm text-slate-500">
          Press <span className="text-brand-400 font-semibold">Solve</span> to
          compute eigenvalues, eigenvectors, characteristic polynomial, and
          properties.
        </div>
      )}

      {result?.error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {result.error}
        </div>
      )}

      {result?.ok && (
        <div className="flex-1 overflow-auto out-katex space-y-4">
          {result.matrixLatex && tab === "Spectrum" && (
            <Section label="Input matrix">
              <Tex display>{result.matrixLatex}</Tex>
            </Section>
          )}

          {tab === "Spectrum" && <SpectrumTab r={result} />}
          {tab === "Eigenvectors" && <EigenvectorsTab r={result} />}
          {tab === "Properties" && <PropertiesTab r={result} />}
          {tab === "Char Poly" && <CharPolyTab r={result} />}
          {tab === "U(t)" && <EvolutionTab r={result} />}
          {tab === "Numeric" && <NumericTab r={result} />}
          {tab === "Export" && <ExportTab r={result} />}

          {result.warnings.length > 0 && tab !== "Export" && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300 space-y-1">
              {result.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
        {label}
      </div>
      <div className="rounded-md border border-white/5 bg-ink-850/40 p-3 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

function SpectrumTab({ r }: { r: SolveResult }) {
  if (!r.eigenvalues || r.eigenvalues.length === 0) {
    return (
      <Section label="Eigenvalues">
        <div className="text-sm text-slate-500">
          Eigenvalues unavailable for this matrix
          {r.symbolic ? " — symbolic eigen-decomposition only supported for n=2 in this build." : "."}
        </div>
      </Section>
    );
  }
  return (
    <Section label="Eigenvalues">
      <div className="space-y-2">
        {r.eigenvalues.map((ev, k) => (
          <div key={k} className="flex items-baseline gap-2">
            <span className="text-slate-400 text-sm font-mono">λ_{k + 1} =</span>
            <Tex>{ev.latex}</Tex>
          </div>
        ))}
      </div>
    </Section>
  );
}

function EigenvectorsTab({ r }: { r: SolveResult }) {
  if (!r.eigenvectors || r.eigenvectors.length === 0) {
    return (
      <Section label="Eigenvectors">
        <div className="text-sm text-slate-500">
          Eigenvectors require numeric values for all symbols.
        </div>
      </Section>
    );
  }
  return (
    <Section label="Eigenvectors">
      <div className="space-y-3">
        {r.eigenvectors.map((ev, k) => (
          <div key={k}>
            <div className="text-xs text-slate-400 mb-1">
              <Tex>{ev.eigenvalueLatex}</Tex>
            </div>
            <Tex display>{ev.vectorLatex}</Tex>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PropertiesTab({ r }: { r: SolveResult }) {
  return (
    <div className="space-y-3">
      <Section label="Trace">
        <Tex display>{r.trace.latex}</Tex>
      </Section>
      {r.determinant && (
        <Section label="Determinant">
          <Tex display>{r.determinant.latex}</Tex>
        </Section>
      )}
      <Section label="Predicates">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Pred label="Hermitian" value={r.hermitian} />
          <Pred label="Unitary" value={r.unitary} />
          <Pred label="Positive-definite" value={r.positiveDefinite} />
          {typeof r.rank === "number" && (
            <div className="flex justify-between">
              <span className="text-slate-400">Rank</span>
              <span className="font-mono">{r.rank}</span>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Pred({ label, value }: { label: string; value: boolean | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span
        className={
          value === true
            ? "text-emerald-400"
            : value === false
              ? "text-slate-500"
              : "text-slate-600"
        }
      >
        {value === true ? "yes" : value === false ? "no" : "—"}
      </span>
    </div>
  );
}

function CharPolyTab({ r }: { r: SolveResult }) {
  if (!r.charPolyLatex) {
    return (
      <Section label="Characteristic polynomial">
        <div className="text-sm text-slate-500">
          Skipped — matrix too large or symbolic engine declined.
        </div>
      </Section>
    );
  }
  return (
    <Section label="Characteristic polynomial">
      <Tex display>{r.charPolyLatex}</Tex>
      <div className="mt-2 text-xs text-slate-500">
        p(λ) = det(λI − H). Roots of p are the eigenvalues.
      </div>
    </Section>
  );
}

function EvolutionTab({ r }: { r: SolveResult }) {
  if (!r.evolutionLatex) {
    return (
      <Section label="Time evolution">
        <div className="text-sm text-slate-500">
          U(t) = exp(−iHt/ℏ). Bind all symbols to numeric values to compute.
        </div>
      </Section>
    );
  }
  return (
    <Section label="Time evolution">
      <Tex display>{r.evolutionLatex}</Tex>
      <div className="mt-2 text-xs text-slate-500">
        Shown at t = ℏ = 1. Substitute parameters above to vary t.
      </div>
    </Section>
  );
}

function NumericTab({ r }: { r: SolveResult }) {
  if (!r.numeric) {
    return (
      <Section label="Numeric">
        <div className="text-sm text-slate-500">
          Bind all free symbols above to compute numeric eigenvalues.
        </div>
      </Section>
    );
  }
  // simple bar plot of real parts
  const evs = r.numeric.eigenvalues.map((v: any) =>
    typeof v === "number" ? v : v.re
  );
  const max = Math.max(...evs.map((x) => Math.abs(x)), 1);
  return (
    <div className="space-y-3">
      <Section label="Spectrum (real part)">
        <div className="space-y-1">
          {evs.map((v, k) => (
            <div key={k} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-12 text-slate-400">λ_{k + 1}</span>
              <span className="w-20 text-right">{v.toFixed(4)}</span>
              <div className="flex-1 h-2 bg-ink-800 rounded">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(Math.abs(v) / max) * 100}%`,
                    background: v >= 0 ? "#7c3aed" : "#f43f5e",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ExportTab({ r }: { r: SolveResult }) {
  const [copied, setCopied] = useState<string | null>(null);

  const latexBlob = [
    r.matrixLatex,
    r.trace.latex,
    r.determinant?.latex,
    r.charPolyLatex,
    ...(r.eigenvalues?.map((e, k) => `\\lambda_{${k + 1}} = ${e.latex}`) ?? []),
  ]
    .filter(Boolean)
    .map((s) => `\\[${s}\\]`)
    .join("\n");

  const markdownBlob =
    "# Hamiltonian solve\n\n" +
    [
      r.matrixLatex && `$$${r.matrixLatex}$$`,
      r.trace.latex && `$$${r.trace.latex}$$`,
      r.determinant?.latex && `$$${r.determinant.latex}$$`,
      r.charPolyLatex && `$$${r.charPolyLatex}$$`,
      r.eigenvalues?.length &&
        "## Eigenvalues\n\n" +
          r.eigenvalues
            .map((e, k) => `- $\\lambda_{${k + 1}} = ${e.latex}$`)
            .join("\n"),
    ]
      .filter(Boolean)
      .join("\n\n");

  const jsonBlob = JSON.stringify(
    {
      matrixLatex: r.matrixLatex,
      eigenvalues: r.eigenvalues,
      eigenvectors: r.eigenvectors,
      trace: r.trace,
      determinant: r.determinant,
      charPolyLatex: r.charPolyLatex,
      hermitian: r.hermitian,
      unitary: r.unitary,
      rank: r.rank,
    },
    null,
    2
  );

  const pythonBlob = `# Reproduce the calculation in Python with SymPy
from sympy import Matrix, symbols, simplify

# (substitute symbol values as you like)
H = Matrix(${JSON.stringify(
    r.numeric?.matrix?.map((row) =>
      row.map((x: any) => (typeof x === "number" ? x : `${x.re}+${x.im}j`))
    ) ?? "?"
  )})

print("trace:", simplify(H.trace()))
print("det:  ", simplify(H.det()))
print("charpoly:", H.charpoly().as_expr())
for v, m, _ in H.eigenvects():
    print("λ =", simplify(v), "  multiplicity", m)
`;

  const items: { label: string; body: string; mime: string; ext: string }[] = [
    { label: "LaTeX", body: latexBlob, mime: "text/plain", ext: "tex" },
    { label: "Markdown", body: markdownBlob, mime: "text/markdown", ext: "md" },
    { label: "JSON", body: jsonBlob, mime: "application/json", ext: "json" },
    { label: "Python (SymPy)", body: pythonBlob, mime: "text/x-python", ext: "py" },
  ];

  const copy = async (label: string, body: string) => {
    await navigator.clipboard.writeText(body);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  };

  const download = (ext: string, mime: string, body: string) => {
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hamcalc.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-md border border-white/5 bg-ink-850/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">{it.label}</div>
            <div className="flex gap-1">
              <button
                onClick={() => copy(it.label, it.body)}
                className="btn-ghost text-xs"
              >
                {copied === it.label ? "copied!" : "copy"}
              </button>
              <button
                onClick={() => download(it.ext, it.mime, it.body)}
                className="btn-ghost text-xs"
              >
                download
              </button>
            </div>
          </div>
          <pre className="text-xs text-slate-400 max-h-48 overflow-auto whitespace-pre-wrap">
            {it.body}
          </pre>
        </div>
      ))}
    </div>
  );
}
