import { useState } from "react";
import { useStore } from "../lib/store";

type Key = {
  label: string; // shown on the key
  insert?: string; // text to insert; defaults to label
  cmd?: boolean; // styled as a command/operator key
  wide?: boolean;
  title?: string;
};

const tabs = ["Basic", "Latin", "Greek", "Physics", "Functions", "Structure"] as const;
type Tab = (typeof tabs)[number];

const basic: Key[] = [
  ..."1234567890".split("").map<Key>((c) => ({ label: c })),
  { label: "+", cmd: true },
  { label: "−", insert: "−", cmd: true },
  { label: "×", insert: "·", cmd: true, title: "multiply (·)" },
  { label: "÷", insert: "/", cmd: true },
  { label: "/", cmd: true },
  { label: "^", cmd: true, title: "superscript" },
  { label: ".", },
  { label: "=", cmd: true },
  { label: "(", cmd: true },
  { label: ")", cmd: true },
  { label: "±", insert: "±" },
  { label: "√", insert: "sqrt(", cmd: true },
  { label: "|", cmd: true },
  { label: ",", cmd: true },
  { label: ";", cmd: true },
  { label: "⌫", insert: "__BACKSPACE__", cmd: true, wide: true, title: "backspace" },
];

const latinLower: Key[] = "abcdefghijklmnopqrstuvwxyz".split("").map((c) => ({ label: c }));
const latinUpper: Key[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => ({ label: c }));

const greekLower: Key[] = "αβγδεζηθικλμνξοπρστυφχψω".split("").map((c) => ({ label: c }));
const greekUpper: Key[] = "ΓΔΘΛΞΠΣΥΦΨΩ".split("").map((c) => ({ label: c }));

const physics: Key[] = [
  { label: "ℏ", title: "hbar" },
  { label: "ℎ", title: "Planck h" },
  { label: "c" },
  { label: "e" },
  { label: "kB", insert: "k_B" },
  { label: "ε₀", insert: "epsilon_0" },
  { label: "μ₀", insert: "mu_0" },
  { label: "π", insert: "π" },
  { label: "i", title: "imaginary unit" },
  { label: "∞", insert: "∞" },
  { label: "†", title: "dagger (Hermitian conjugate)" },
  { label: "*", title: "complex conjugate" },
  { label: "⊗", insert: "*", title: "tensor product (treated as ·)" },
  { label: "∂", insert: "∂" },
  { label: "∇", insert: "∇" },
  { label: "σ_x", insert: "sigma_x" },
  { label: "σ_y", insert: "sigma_y" },
  { label: "σ_z", insert: "sigma_z" },
  { label: "σ₊", insert: "sigma_+" },
  { label: "σ₋", insert: "sigma_-" },
  { label: "𝟙", insert: "1", title: "identity" },
];

const fns: Key[] = [
  "sin",
  "cos",
  "tan",
  "exp",
  "ln",
  "log",
  "sinh",
  "cosh",
  "tanh",
  "atan",
  "asin",
  "acos",
  "abs",
  "conj",
  "Re",
  "Im",
  "sgn",
].map((s) => ({ label: s, insert: `${s}(`, cmd: true, wide: s.length > 3 }));

const structure: Key[] = [
  { label: "x²", insert: "^2", cmd: true, title: "square" },
  { label: "xⁿ", insert: "^", cmd: true, title: "superscript" },
  { label: "x_n", insert: "_", cmd: true, title: "subscript" },
  { label: "a/b", insert: "/", cmd: true, title: "fraction" },
  { label: "(…)", insert: "()", cmd: true, title: "parens" },
  { label: "[…]", insert: "[]", cmd: true, title: "brackets" },
  { label: "|…|", insert: "abs(", cmd: true },
  { label: "Σ", insert: "sum(", cmd: true, title: "sum" },
  { label: "∫", insert: "integrate(", cmd: true, wide: true },
  { label: "∏", insert: "prod(", cmd: true },
];

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
    insertAtCursor(value);
  };

  return (
    <div className="panel p-3">
      <div className="flex items-center gap-1 mb-3 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab ${tab === t ? "tab-active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(tab === "Basic" ? basic : []).map((k, idx) => (
          <KeyBtn key={idx} k={k} onPress={press} />
        ))}
        {tab === "Latin" && (
          <>
            <Row keys={latinLower} onPress={press} />
            <div className="basis-full" />
            <Row keys={latinUpper} onPress={press} />
          </>
        )}
        {tab === "Greek" && (
          <>
            <Row keys={greekLower} onPress={press} />
            <div className="basis-full" />
            <Row keys={greekUpper} onPress={press} />
          </>
        )}
        {tab === "Physics" && <Row keys={physics} onPress={press} />}
        {tab === "Functions" && <Row keys={fns} onPress={press} />}
        {tab === "Structure" && <Row keys={structure} onPress={press} />}
      </div>
    </div>
  );
}

function Row({ keys, onPress }: { keys: Key[]; onPress: (k: Key) => void }) {
  return (
    <>
      {keys.map((k, i) => (
        <KeyBtn key={i} k={k} onPress={onPress} />
      ))}
    </>
  );
}

function KeyBtn({ k, onPress }: { k: Key; onPress: (k: Key) => void }) {
  const cls = k.cmd
    ? k.wide
      ? "key-wide text-brand-400"
      : "key-cmd"
    : k.wide
      ? "key-wide"
      : "key";
  return (
    <button
      onClick={() => onPress(k)}
      title={k.title ?? k.label}
      className={cls}
    >
      {k.label}
    </button>
  );
}
