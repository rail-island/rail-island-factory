// Fixtures of the constructs the C# transpiler supports (docs/guide/cs-transpiler.md):
// each exported function returns a JSON value, and `pnpm cs:pilot --fixtures` runs it in
// Node and as transpiled C#, and compares the two exactly. A case covers one construct
// and the edge cases JS gives it; add one with each construct the transpiler learns.

// --- arr.entries() -----------------------------------------------------------------------

export function entriesLoop(): unknown {
  const out: number[] = [];
  for (const [i, x] of [5, 6, 7].entries()) out.push(i * 10 + x);
  return out;
}

/** An array iterator is live: an element pushed during the loop is visited. */
export function entriesLive(): unknown {
  const a = [1, 2];
  const seen: number[] = [];
  for (const [i, x] of a.entries()) {
    if (i === 0) a.push(9);
    seen.push(x);
  }
  return seen;
}

export function entriesObjects(): unknown {
  const names = ["a", "b", "c"];
  const out: string[] = [];
  for (const [i, n] of names.entries()) {
    if (i === 1) continue;
    out.push(`${n}${i}`);
  }
  return out;
}

export function entriesPattern(): unknown {
  const pts: Array<[number, number]> = [[1, 2], [3, 4]];
  const out: number[] = [];
  for (const [, [x, y]] of pts.entries()) out.push(x * y);
  for (const [i] of pts.entries()) out.push(i);
  return out;
}

export function entriesAsValue(): unknown {
  return [...[3, 4].entries(), ...["x"].entries()];
}

// --- switch ------------------------------------------------------------------------------

function classify(k: string): string {
  let out = "";
  switch (k) {
    case "a":
      out += "a";
    // falls through
    case "b": {
      out += "b";
      if (out.length > 1) break;
      out += "!";
      break;
    }
    default:
      out += "d";
    // falls through
    case "c":
      out += "c";
      break;
    case "r":
      return "returned";
  }
  return out;
}

function kind(n: number): string {
  switch (n) {
    case 1: return "one";
    case 2: return "two";
    default: return "many";
  }
}

export function switchCases(): unknown {
  const out: string[] = ["a", "b", "c", "z", "r"].map(classify);
  // `continue` inside a switch continues the loop; `break` in a loop inside a case leaves that loop
  for (let i = 0; i < 4; i++) {
    switch (i % 2) {
      case 0:
        if (i === 2) continue;
        for (let j = 0; j < 9; j++) if (j === 1) break;
        out.push(`even${i}`);
        break;
      default:
        out.push(`odd${i}`);
    }
  }
  return [...out, kind(1), kind(2), kind(7)];
}

// --- rest parameters -----------------------------------------------------------------------

function sum(...xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function label(head: string, ...parts: string[]): string {
  return `${head}:${parts.length}:${parts.join("-")}`;
}

export function restParameters(): unknown {
  const more = [4, 5];
  return [sum(), sum(1, 2, 3), sum(...more), sum(1, ...more, 6), label("h"), label("h", "a", "b"), label("h", ...["x", "y"])];
}

// --- Math with spreads ------------------------------------------------------------------------

export function mathSpreads(): unknown {
  const v = [3, 4, 12];
  const xs = [5, 2];
  return [Math.hypot(...v), Math.hypot(...[3, 4]), Math.max(1, ...xs, 3), Math.min(...xs, 7), Math.min(9, ...[]), Math.max(...xs.map((x) => x * 2))];
}

// --- push with spreads -------------------------------------------------------------------------

export function pushSpreads(): unknown {
  const a = [1];
  a.push(...[2, 3], 4, ...[5]);
  // every argument is read before anything is pushed: a spread of the array itself
  const b = [7, 8];
  b.push(...b, ...b);
  const c: string[] = [];
  c.push("x", ...["y", "z"]);
  return [a, b, c];
}

// --- bitwise operators, Math.imul (hashing and seeded noise) -------------------------------------

export function int32Operators(): unknown {
  let h = 2166136261;
  for (const c of [104, 105, 33]) {
    h ^= c;
    h = Math.imul(h, 16777619);
  }
  let n = 0x7fffffff;
  n ^= n >>> 13;
  n |= 3;
  return [h >>> 0, h | 0, n, -5 >>> 0, 1 << 31, (1 << 31) >> 4, 5000000000 | 0, ~7, Math.imul(0xffffffff, 5), 7 & 3, 6 ^ 3];
}

// --- built-ins ----------------------------------------------------------------------------------

export function builtins(): unknown {
  const a = [1, 2, 3, 4, 5];
  const removed = a.splice(1, 2, 9, 8, 7);
  const b = [3];
  const len = b.unshift(1, 2);
  const nested = [[1, 2], [3], []].flat();
  const s = "proc-vehicle-cd-150_x";
  const camel = s.replace(/^(proc-vehicle-|veh-)/, "").replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  const first = "a-b-c".replace("-", "+");
  const chars: string[] = [];
  for (const ch of "hé!") chars.push(ch);
  const digits = [..."1503"].map(Number);
  const holes = Array<number>(3).fill(2);
  return [removed, a, len, b, nested, camel, first, chars, digits, holes, parseInt("ff", 16), parseInt("  -42px"), parseInt("x"), Number.isNaN(Number("q")), [-2, 3].map(Math.abs), [1, 2].every(Number.isFinite)];
}

const [ALPHA, BETA, GAMMA] = [0.5, 0.85, 1.45];

export function moduleDestructuring(): unknown {
  return ALPHA + BETA * GAMMA;
}

export function statements(): unknown {
  const a: number[] = [];
  const b: number[] = [];
  for (let i = 0; i < 2; i++) a.push(i), b.push(i * 10);
  const unused = 3;
  void unused;
  return [a, b];
}

export function objects(): unknown {
  const base: Record<string, number> = { x: 1 };
  const more: Record<string, number> = { y: 2 };
  const all = Object.assign({}, base, more, { x: 5 }) as Record<string, number>;
  const lit = { p: 1, q: "s" };
  const keyName = "p";
  const m = new Map<string, number>([["k1", 1], ["k2", 2]]);
  const firstKey = m.keys().next().value!;
  const victim: { a: number; b?: number } = { a: 1, b: 2 };
  delete victim.b;
  const extra = true;
  const spread = { a: 1, ...(extra ? { b: 2, ...(extra ? { c: 3 } : {}) } : {}) };
  const pen = { draw(x: number, scale = 2): number { return x * scale; } };
  return [all, Object.values(lit), keyName in lit, "z" in lit, firstKey, victim, spread, pen.draw(3), pen.draw(3, 5)];
}

/** const next = xs[i + 1] tested against undefined: a read past the end. */
export function readPastTheEnd(): unknown {
  const xs = [0.1, 0.5, 0.9];
  const out: number[] = [];
  xs.forEach((x, i) => {
    const next = xs[i + 1];
    if (next === undefined) return;
    out.push(next - x);
  });
  return out;
}

/** A union of tuples of different lengths destructured: the shorter one's missing element is undefined. */
export function shortTuples(): unknown {
  const rows: ReadonlyArray<readonly [number, number] | readonly [number, number, number]> = [[1, 2], [3, 4, 5]];
  return rows.map(([a, b, c]) => (c === undefined ? a + b : a * b * c));
}

/** A comparison with a literal reads past the end as undefined. */
export function comparePastTheEnd(): unknown {
  const flags: readonly boolean[] = [true, false];
  const xs = [1, 2];
  return [0, 1, 2, 3].map((i) => [flags[i] !== false, xs[i] === 2]);
}

interface Series {
  len: number;
  well?: { d: number };
  tag?: string;
}

/** A key set to undefined is present: a spread copies it over, JSON leaves it out, a default applies. */
export function presentUndefined(): unknown {
  const base: Series = { len: 1, well: { d: 2 }, tag: "a" };
  const lead: Partial<Series> = { len: 3, well: undefined };
  const merged = { ...base, ...lead } as Series;
  const { well = { d: 9 }, tag = "z" } = merged;
  return [merged.well === undefined, Object.keys(merged), JSON.stringify(merged), well.d, tag];
}

const KIT: Record<string, { color: string }> = { roof: { color: "r" }, rim: { color: "m" } };
const KIT_MORE = { ...KIT, hazard: { color: "h" } };
const KIT_ALL: Record<string, { color: string }> = { ...KIT_MORE, blue: { color: "b" } };

/** A constant spread from a record holds the record's keys, and so does one spread from it. */
export function recordSpreads(): unknown {
  const deeper = { ...KIT_MORE, claret: { color: "c" } };
  return [Object.keys(KIT_ALL), KIT_ALL["rim"]?.color, Object.keys(KIT_MORE).length, Object.keys(deeper)];
}

interface Spec {
  color: string;
  glass?: boolean;
}

const plain = (): Record<string, { color: string }> => ({ harness: { color: "h" } });
const withSpecs = (more: Record<string, Spec>): Record<string, Spec> => ({ ...plain(), ...more });

/** A record built from records of narrower values keeps every value whole. */
export function recordValueTypes(): unknown {
  return withSpecs({ glass: { color: "g", glass: true } });
}

/** find over numbers: no match is undefined. */
export function findNumbers(): unknown {
  const kinks = [0.27, 1, 2.92];
  const snap = (y: number) => kinks.find((k) => Math.abs(k - y) < 0.04) ?? y;
  return [snap(0.62), snap(0.99), kinks.find((_k, i) => i > 5) === undefined, [0, 3].find((x) => x === 0)];
}

interface End {
  tip: number;
  windows?: string[];
}

function endOf(front: End | undefined, fallback: () => { tip: number }, flip: boolean): End {
  return { ...(front ?? fallback()), ...(flip ? front : { tip: 7 }), ...(flip ? {} : fallback()) };
}

/** A spread of `a ?? b` or `c ? a : b` copies the chosen object whole. */
export function spreadNullish(): unknown {
  const nose: End = { tip: 1, windows: ["w"] };
  return [endOf(nose, () => ({ tip: 0 }), false), endOf(undefined, () => ({ tip: 2 }), true), endOf(nose, () => ({ tip: 0 }), true)];
}

function capOf(mat: string, top: string | null = mat): string {
  return top === null ? "none" : top;
}

/** A default applies to a left-out argument, not to an explicit null. */
export function nullArgument(): unknown {
  return [capOf("slate"), capOf("slate", null), capOf("slate", "lead")];
}

interface Nose {
  len: number;
  tip?: number;
}

const SHARED_NOSE = { len: 0.3, tip: 0.88 };

function noseCount(front: Nose, rear: Nose): number {
  // the same object at both ends counts once
  return front === rear ? 1 : 2;
}

/** An untyped constant used as one interface everywhere stays one object. */
export function sharedConstant(): unknown {
  const spec: { front: Nose; rear: Nose } = { front: SHARED_NOSE, rear: SHARED_NOSE };
  return [noseCount(spec.front, spec.rear), noseCount(SHARED_NOSE, { len: 1 }), SHARED_NOSE.len];
}

/** A function with a defaulted parameter used as a value: a left-out argument takes the default. */
export function defaultThroughAlias(): unknown {
  const place = (u: number, w: number, base = 0.5): number => u + w + base;
  const alias = place;
  const lifted = (u: number, w: number) => alias(u, w);
  return [alias(1, 2), alias(1, 2, 3), lifted(1, 1)];
}

type Piece = { k: "tier"; u: [number, number]; y: [number, number] } | { k: "mast"; u: [number, number]; h: number };

/** Items narrowed to one member and found again by identity (a ship's stacked tiers). */
export function narrowedIdentity(): unknown {
  const items: Piece[] = [{ k: "tier", u: [0, 4], y: [0, 2] }, { k: "mast", u: [1, 2], h: 5 }, { k: "tier", u: [0, 4], y: [2, 4] }];
  const out: Piece[] = [];
  const stacks: Array<Array<Extract<Piece, { k: "tier" }>>> = [];
  for (const it of items) {
    if (it.k !== "tier") { out.push(it); continue; }
    const st = stacks.find((g) => Math.abs(g[g.length - 1]!.y[1] - it.y[0]) < 0.6);
    if (st) st.push(it);
    else { stacks.push([it]); out.push(it); }
  }
  return out.map((it) => (it.k === "tier" ? stacks.find((q) => q[0] === it)?.length ?? -1 : 0));
}

function leaf(paint: string | Array<[number, number, string]> = "orange"): string {
  return typeof paint === "string" ? paint : paint.map((b) => b[2]).join("+");
}

/** A default of a parameter whose type is a union (an object in C#). */
export function unionDefault(): unknown {
  return [leaf(), leaf("green"), leaf([[0, 1, "red"], [1, 2, "blue"]])];
}

const pick = <T>(l: Record<string, T>, k: string): T => l[k]!;

/** A generic record read with `!` (its type is T & {}). */
export function genericNonNull(): unknown {
  return [pick({ a: { title: "A" }, b: { title: "B" } }, "b").title];
}

/** toFixed rounds an exact binary tie half away from zero (a memo key of a cab's scan). */
export function toFixedTies(): unknown {
  return [(-3.44140625).toFixed(7), (3.44140625).toFixed(7), (0.125).toFixed(2), (2.5).toFixed(0), (-0.001).toFixed(2), (0).toFixed(3), (1e-7).toFixed(7), (123.456).toFixed(1), (1.005).toFixed(2), (-2.0039062500).toFixed(7)];
}

interface Scan {
  memo: Map<string, [number, number] | null>;
}

class Scanner {
  private readonly memo: Map<string, [number, number] | null>;
  constructor(shared?: Scan) {
    this.memo = shared?.memo ?? new Map();
  }
  mark(k: string): void {
    this.memo.set(k, [1, 2]);
  }
}

/** A shared map handed on with `?? new Map()` stays the same map. */
export function sharedMap(): unknown {
  const shared: Scan = { memo: new Map() };
  new Scanner(shared).mark("a");
  new Scanner().mark("b");
  return [...shared.memo.keys()];
}

const BY_SIDE: Record<number, string> = { [1]: "right", [-1]: "left" };

/** Number keys computed in a record literal. */
export function numberKeys(): unknown {
  return [BY_SIDE[1], BY_SIDE[-1], Object.keys(BY_SIDE)];
}

const colorsOf = (c: Record<string, string>): Record<string, { color: string }> => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, { color: v }]));
const tramPalette = (c: Record<string, string>) => ({ ...colorsOf(c), darkGrey: { color: "g" } });

/** A function returning a literal that spreads a record returns the record. */
export function recordReturn(): unknown {
  const use = (r: Record<string, { color: string }>) => [Object.keys(r), r["red"]?.color];
  return use(tramPalette({ red: "r", white: "w" }));
}

export function late(): unknown {
  const buf = new Float64Array(3);
  buf[1] = 2.5;
  const maps = new Map<string, Map<string, number>>([["a", new Map([["x", 1], ["y", 2]])]]);
  const seen: string[] = [];
  for (const [k, v] of maps.get("a") ?? []) seen.push(`${k}${v}`);
  for (const [k] of maps.get("zz") ?? []) seen.push(k);
  const key = JSON.stringify({ a: -0, b: [0, -0], c: "s" }, (_k, x: unknown) => (Object.is(x, -0) ? "-0" : x));
  return [Array.from(buf), seen, key, Object.is(NaN, NaN), Object.is(0, -0), JSON.stringify(["q", 1.5, true])];
}
