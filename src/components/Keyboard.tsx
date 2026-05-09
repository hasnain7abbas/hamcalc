import { useState } from "react";
import { useStore } from "../lib/store";

type Key = {
  label: string; // shown on the key
  insert?: string; // text to insert; defaults to label
  cmd?: boolean; // styled as a command/operator key
  wide?: number; // grid span
  title?: string;
};

const tabs = ["Basic", "Latin", "Greek", "Physics", "Functions", "Structure"] as const;
type Tab = (typeof tabs)[number];

// Each tab is a list of rows; each row is a list of keys.
// We render every row as an equal-cell grid so the keyboard reads like Gboard.
const layouts: Record<Tab, Key[][]> = {
  Basic: [
    "1234567890".split("").map((c) => ({ label: c })),
    [
      { label: "+", cmd: true },
      { label: "−", insert: "−", cmd: true },
      { label: "·", insert: "·", cmd: true, title: "multiply" },
      { label: "/", cmd: true, title: "divide / fraction" },
      { label: "^", cmd: true, title: "superscript" },
      { label: "_", cmd: true, title: "subscript" },
      { label: "(", cmd: true },
      { label: ")", cmd: true },
      { label: "[", cmd: true },
      { label: "]", cmd: true },
    ],
    [
      { label: ".", },
      { label: ",", cmd: true },
      { label: "=", cmd: true },
      { label: "±", insert: "±" },
      { label: "√", insert: "sqrt(", cmd: true },
      { label: "|", cmd: true },
      { label: ";", cmd: true },
      { label: "←", insert: "__LEFT__", cmd: true, title: "cursor left" },
      { label: "→", insert: "__RIGHT__", cmd: true, title: "cursor right" },
      { label: "⌫", insert: "__BACKSPACE__", cmd: true, title: "backspace" },
    ],
  ],
  Latin: [
    "qwertyuiop".split("").map((c) => ({ label: c })),
    "asdfghjkl".split("").map((c) => ({ label: c })),
    "zxcvbnm".split("").map((c) => ({ label: c })),
    "QWERTYUIOP".split("").map((c) => ({ label: c })),
    "ASDFGHJKL".split("").map((c) => ({ label: c })),
    "ZXCVBNM".split("").map((c) => ({ label: c })),
  ],
  Greek: [
    "αβγδεζηθικλμ".split("").map((c) => ({ label: c })),
    "νξοπρστυφχψω".split("").map((c) => ({ label: c })),
    "ΓΔΘΛΞΠΣΦΨΩ".split("").map((c) => ({ label: c })),
    [
      { label: "ϵ" }, { label: "ϑ" }, { label: "ϰ" },
      { label: "ϕ" }, { label: "ϱ" }, { label: "ϖ" },
    ],
  ],
  Physics: [
    [
      { label: "ℏ", title: "reduced Planck" },
      { label: "ℎ", title: "Planck constant" },
      { label: "c", title: "speed of light" },
      { label: "e", title: "elementary charge" },
      { label: "kB", insert: "k_B", title: "Boltzmann" },
      { label: "ε₀", insert: "epsilon_0", title: "vacuum permittivity" },
      { label: "μ₀", insert: "mu_0", title: "vacuum permeability" },
      { label: "π", insert: "π" },
      { label: "i", title: "imaginary unit" },
      { label: "∞", insert: "∞" },
    ],
    [
      { label: "†", title: "Hermitian conjugate" },
      { label: "*", title: "complex conjugate" },
      { label: "⊗", insert: "*", title: "tensor product" },
      { label: "⊕", insert: "+", title: "direct sum" },
      { label: "∂", insert: "∂" },
      { label: "∇", insert: "∇" },
      { label: "∫", insert: "integrate(" },
      { label: "∑", insert: "sum(" },
      { label: "⟨", insert: "⟨", cmd: true },
      { label: "⟩", insert: "⟩", cmd: true },
    ],
    [
      { label: "σx", insert: "sigma_x", title: "Pauli X" },
      { label: "σy", insert: "sigma_y", title: "Pauli Y" },
      { label: "σz", insert: "sigma_z", title: "Pauli Z" },
      { label: "σ₊", insert: "sigma_+" },
      { label: "σ₋", insert: "sigma_-" },
      { label: "𝟙", insert: "1", title: "identity" },
      { label: "â", insert: "a" },
      { label: "â†", insert: "a_dag" },
      { label: "Ĥ", insert: "H" },
      { label: "Ψ", insert: "Psi" },
    ],
  ],
  Functions: [
    [
      { label: "sin", insert: "sin(", cmd: true },
      { label: "cos", insert: "cos(", cmd: true },
      { label: "tan", insert: "tan(", cmd: true },
      { label: "exp", insert: "exp(", cmd: true },
      { label: "ln", insert: "ln(", cmd: true },
      { label: "log", insert: "log(", cmd: true },
    ],
    [
      { label: "sinh", insert: "sinh(", cmd: true, wide: 2 },
      { label: "cosh", insert: "cosh(", cmd: true, wide: 2 },
      { label: "tanh", insert: "tanh(", cmd: true, wide: 2 },
    ],
    [
      { label: "asin", insert: "asin(", cmd: true, wide: 2 },
      { label: "acos", insert: "acos(", cmd: true, wide: 2 },
      { label: "atan", insert: "atan(", cmd: true, wide: 2 },
    ],
    [
      { label: "abs", insert: "abs(", cmd: true },
      { label: "conj", insert: "conj(", cmd: true },
      { label: "Re", insert: "re(", cmd: true },
      { label: "Im", insert: "im(", cmd: true },
      { label: "sgn", insert: "sign(", cmd: true },
      { label: "δ(·)", insert: "delta(", cmd: true },
    ],
  ],
  Structure: [
    [
      { label: "x²", insert: "^2", cmd: true, title: "square" },
      { label: "x³", insert: "^3", cmd: true, title: "cube" },
      { label: "xⁿ", insert: "^", cmd: true, title: "superscript" },
      { label: "x_n", insert: "_", cmd: true, title: "subscript" },
      { label: "a/b", insert: "/", cmd: true, title: "fraction" },
      { label: "√x", insert: "sqrt(", cmd: true },
    ],
    [
      { label: "(…)", insert: "()", cmd: true },
      { label: "[…]", insert: "[]", cmd: true },
      { label: "{…}", insert: "{}", cmd: true },
      { label: "|…|", insert: "abs(", cmd: true },
      { label: "⟨…|", insert: "⟨|", cmd: true },
      { label: "|…⟩", insert: "|⟩", cmd: true },
    ],
    [
      { label: "Σ", insert: "sum(", cmd: true },
      { label: "∏", insert: "prod(", cmd: true },
      { label: "∫", insert: "integrate(", cmd: true },
      { label: "lim", insert: "lim(", cmd: true },
      { label: "max", insert: "max(", cmd: true },
      { label: "min", insert: "min(", cmd: true },
    ],
  ],
};

export function Keyboard() {
  const [tab, setTab] = useState<Tab>("Basic");
  const insertAtCursor = useStore((s) => s.insertAtCursor);
  const setCell = useStore((s) => s.setCell);
  const cursor = useStore((s) => s.cursor);
  const cells = useStore((s) => s.cells);

  const press = (k: Key) => {
    const value = k.insert ?? k.label;
    if (value === "__BACKSPACE__") {
      const cur = cells[cursor.i]?.[cursor.j] ?? "";
      setCell(cursor.i, cursor.j, cur.slice(0, -1));
      return;
    }
    if (value === "__LEFT__" || value === "__RIGHT__") {
      // No-op for now; real cursor movement would need DOM coordination.
      return;
    }
    insertAtCursor(value);
  };

  const rows = layouts[tab];
  // Pick a column count that lets the widest row fit cleanly.
  const cols = Math.max(
    ...rows.map((r) => r.reduce((s, k) => s + (k.wide ?? 1), 0))
  );

  return (
    <div className="panel p-2 sm:p-3">
      <div className="flex items-center gap-1 mb-2 sm:mb-3 overflow-x-auto -mx-1 px-1">
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
      <div className="flex flex-col gap-1 sm:gap-1.5">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="key-row"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {row.map((k, ki) => (
              <KeyBtn key={ki} k={k} onPress={press} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyBtn({ k, onPress }: { k: Key; onPress: (k: Key) => void }) {
  const cls = k.cmd ? "key-cmd" : "key";
  const span = k.wide ?? 1;
  return (
    <button
      onClick={() => onPress(k)}
      title={k.title ?? k.label}
      className={cls}
      style={span > 1 ? { gridColumn: `span ${span} / span ${span}` } : undefined}
    >
      {k.label}
    </button>
  );
}
