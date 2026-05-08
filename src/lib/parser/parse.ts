// Thin wrapper around mathjs's expression parser. We take a raw cell string,
// normalize unicode → ASCII, and let mathjs build its symbolic node tree.

import { parse as mjParse } from "mathjs";
import type { MathNode } from "mathjs";
import { toMathExpr } from "./normalize";

export type ParseOk = { ok: true; node: MathNode; text: string };
export type ParseErr = { ok: false; error: string };
export type ParseResult = ParseOk | ParseErr;

export function parseCell(input: string): ParseResult {
  const text = toMathExpr(input);
  try {
    const node = mjParse(text);
    return { ok: true, node, text };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

// Collect free symbols (variable identifiers) referenced in a parsed node.
export function freeSymbols(node: MathNode): Set<string> {
  const out = new Set<string>();
  node.traverse((n: any) => {
    if (n.type === "SymbolNode" && typeof n.name === "string") {
      // Skip mathjs built-in constants.
      if (!builtinConstants.has(n.name)) {
        out.add(n.name);
      }
    }
  });
  return out;
}

const builtinConstants = new Set([
  "pi",
  "e",
  "i",
  "Infinity",
  "true",
  "false",
  "NaN",
  "null",
  "undefined",
  "tau",
  "phi",
]);
