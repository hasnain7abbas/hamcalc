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
            <Section
              label="Input matrix"
              definition={
                <span>
                  Hamiltonian operator <DefTex>{"H"}</DefTex>
                </span>
              }
            >
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
  definition,
  children,
}: {
  label: string;
  definition?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </div>
        {definition && (
          <div className="text-[11px] text-slate-500">{definition}</div>
        )}
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 overflow-x-auto backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}

function DefTex({ children }: { children: string }) {
  return (
    <span className="inline-block align-baseline">
      <Tex>{children}</Tex>
    </span>
  );
}

function SpectrumTab({ r }: { r: SolveResult }) {
  const definition = (
    <>
      Solutions of <DefTex>{"H\\,|\\psi\\rangle = \\lambda\\,|\\psi\\rangle"}</DefTex>
    </>
  );
  if (!r.eigenvalues || r.eigenvalues.length === 0) {
    return (
      <Section label="Eigenvalues" definition={definition}>
        <div className="text-sm text-slate-500">
          Eigenvalues unavailable for this matrix
          {r.symbolic ? " — symbolic eigen-decomposition only supported for n=2 in this build." : "."}
        </div>
      </Section>
    );
  }
  // Symbolic 2×2 uses λ₊, λ₋ labels; everything else uses λ_k.
  const labelFor = (k: number) => {
    if (r.symbolic && r.eigenvalues!.length === 2) {
      return k === 0 ? "\\lambda_{+}" : "\\lambda_{-}";
    }
    return `\\lambda_{${k + 1}}`;
  };
  return (
    <Section label="Eigenvalues" definition={definition}>
      <div className="space-y-3">
        {r.eigenvalues.map((ev, k) => (
          <div
            key={k}
            className="flex items-baseline flex-wrap gap-x-2 gap-y-1"
          >
            <Tex>{`${labelFor(k)} \\;=\\;`}</Tex>
            <Tex>{ev.latex}</Tex>
          </div>
        ))}
      </div>
    </Section>
  );
}

function EigenvectorsTab({ r }: { r: SolveResult }) {
  const definition = (
    <>
      Vectors satisfying{" "}
      <DefTex>{"H\\,|\\psi_k\\rangle = \\lambda_k\\,|\\psi_k\\rangle"}</DefTex>
    </>
  );
  if (!r.eigenvectors || r.eigenvectors.length === 0) {
    return (
      <Section label="Eigenvectors" definition={definition}>
        <div className="text-sm text-slate-500">
          Eigenvectors require numeric values for all symbols.
        </div>
      </Section>
    );
  }
  return (
    <Section label="Eigenvectors" definition={definition}>
      <div className="space-y-4">
        {r.eigenvectors.map((ev, k) => (
          <div key={k}>
            <div className="text-sm text-slate-300 mb-1">
              <Tex>{ev.eigenvalueLatex}</Tex>
            </div>
            <Tex display>{`|\\psi_{${k + 1}}\\rangle = ${ev.vectorLatex}`}</Tex>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PropertiesTab({ r }: { r: SolveResult }) {
  return (
    <div className="space-y-3">
      <Section
        label="Trace"
        definition={
          <>
            <DefTex>{"\\operatorname{tr}(H) = \\sum_i H_{ii}"}</DefTex>
          </>
        }
      >
        <Tex display>{r.trace.latex}</Tex>
      </Section>
      {r.determinant && (
        <Section
          label="Determinant"
          definition={<DefTex>{"\\det(H) = \\prod_k \\lambda_k"}</DefTex>}
        >
          <Tex display>{r.determinant.latex}</Tex>
        </Section>
      )}
      <Section
        label="Predicates"
        definition={
          <span>
            Hermitian:{" "}
            <DefTex>{"H = H^{\\dagger}"}</DefTex>
            {"  ·  "}
            Unitary: <DefTex>{"H^{\\dagger}H = I"}</DefTex>
            {"  ·  "}
            Positive-definite: <DefTex>{"\\lambda_k > 0\\;\\forall k"}</DefTex>
          </span>
        }
      >
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
  const definition = (
    <DefTex>{"p(\\lambda) = \\det(\\lambda I - H)"}</DefTex>
  );
  if (!r.charPolyLatex) {
    return (
      <Section label="Characteristic polynomial" definition={definition}>
        <div className="text-sm text-slate-500">
          Skipped — matrix too large or symbolic engine declined.
        </div>
      </Section>
    );
  }
  return (
    <Section label="Characteristic polynomial" definition={definition}>
      <Tex display>{r.charPolyLatex}</Tex>
      <div className="mt-2 text-xs text-slate-500">
        Roots of <Tex>{"p(\\lambda)"}</Tex> are the eigenvalues of{" "}
        <Tex>{"H"}</Tex>.
      </div>
    </Section>
  );
}

function EvolutionTab({ r }: { r: SolveResult }) {
  const definition = (
    <DefTex>{"U(t) = \\exp\\!\\left(-\\tfrac{i\\,H\\,t}{\\hbar}\\right)"}</DefTex>
  );
  if (!r.evolutionLatex) {
    return (
      <Section label="Time evolution" definition={definition}>
        <div className="text-sm text-slate-500">
          Bind all symbols to numeric values above to compute the unitary{" "}
          <Tex>{"U(t)"}</Tex>.
        </div>
      </Section>
    );
  }
  return (
    <Section label="Time evolution" definition={definition}>
      <Tex display>{r.evolutionLatex}</Tex>
      <div className="mt-2 text-xs text-slate-500">
        Shown at <Tex>{"t = \\hbar = 1"}</Tex>. Substitute parameters above to
        vary <Tex>{"t"}</Tex>.
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
      <Section
        label="Spectrum (real part)"
        definition={
          <DefTex>{"\\operatorname{Re}(\\lambda_k)"}</DefTex>
        }
      >
        <div className="space-y-1.5">
          {evs.map((v, k) => (
            <div key={k} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-10 sm:w-12 text-slate-400">
                <Tex>{`\\lambda_{${k + 1}}`}</Tex>
              </span>
              <span className="w-16 sm:w-20 text-right">{v.toFixed(4)}</span>
              <div className="flex-1 h-2 bg-white/5 rounded">
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
