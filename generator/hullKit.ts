// The hull kit (docs/models/world-ships.md): a ship from one typed `ShipSpec`, in
// metres from the stern. The hull is the station-and-band shell of ships.ts
// (cross-sections at stations along the length, cut at the paint lines and joined
// strip by strip, so the waterline is a real edge), generated from a few numbers:
// the length, beam, depth and draft, a bow and a stern form, the section, the
// sheer and raised decks. On it stand the deck furniture blocks (`Item`): tiers
// of superstructure with their windows and bridge wings, funnels, masts, cranes
// and derricks, hatch covers, container stacks, tank domes, LNG spheres, gas
// tanks, helidecks, gantries and A-frames, booms, boats, canopies, paddle wheels,
// foils, a hovercraft's skirt and its air propellers, and the sailing rigs
// (square, gaff, lateen, junk, sprit, crab-claw, Bermuda and jib sails) with their
// spars and stays. `shipLod` draws the distant model from the same spec.
//
// The helpers below the hull shell are copies of ships.ts's (lerpTable, TriBatch,
// hullShell, planRing, roundEnd, spindle): the three existing ships keep their
// own module untouched, so their models and JS files stay byte-identical.
//
// Axes as the cruise ferry's: metres, +X towards the bow, +Y up, +Z to starboard,
// centred on the length (x = u - length / 2 for u metres from the stern) and on
// the beam, the keel on y = 0. The waterline is at y = draft: the boundary
// between the bottom paint and the boot-top band, and `shipDraftFrac` gives the
// game its `draftFrac`.

import { MeshBuilder, chamferedRect, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { LOD_PALETTE, lodPolygon } from "./lodKit.ts";
import { lodBar, lodStack } from "./lodAir.ts";

// --- the spec ----------------------------------------------------------------------

export type Bow = "raked" | "bulbous" | "ice" | "barge" | "clipper" | "canoe" | "plumb";
export type Stern = "transom" | "cruiser" | "sternwheel" | "canoe";
export type Section = "round" | "vee" | "flat" | "keel";

export interface HullForm {
  /** Over the hull (spars aside), the moulded beam, keel to deck edge midships, keel to waterline. */
  length: number;
  beam: number;
  depth: number;
  draft: number;
  bow: Bow;
  stern: Stern;
  section: Section;
  /** The bow's and the stern's taper as fractions of the length (defaults by form). */
  entry?: number;
  run?: number;
  /** The transom's half-width as a fraction of the half beam (defaults by stern). */
  transom?: number;
  /** How far the stem rakes, keel to deck, as a fraction of the length (defaults by bow). */
  rake?: number;
  /** The deck's rise at the stern and at the bow, metres. */
  sheer?: readonly [number, number];
  /** A raised forecastle and poop: [length, height] metres. */
  forecastle?: readonly [number, number];
  poop?: readonly [number, number];
  /** The boot-top band above the waterline and the sheer stripe below the deck edge, metres (0: none). */
  boot?: number;
  stripe?: number;
  /** Twin hulls (a catamaran): each hull's beam; `beam` is then the overall. */
  twin?: number;
  /** Rudder and propellers under the stern (default: one rudder, one screw on a ship). */
  screws?: number;
  rudder?: boolean;
  /** The bulb of a bulbous bow, as a fraction of the beam (default 0.16). */
  bulb?: number;
  /** A hydrofoil's hull stands this high on its foils: the keel at y = lift, the waterline (draft) still from y = 0. */
  lift?: number;
  /** Twice the stations along the hull (a smoother entry, run and flare; the detailed ships). */
  fine?: boolean;
}

/** A row of windows on a tier: height above its base, pane height and width, pitch; along u from..to (default the tier's length). */
export interface Windows {
  y: number;
  h: number;
  w: number;
  pitch: number;
  from?: number;
  to?: number;
  /** One side only: +1 starboard, -1 port (default both). */
  side?: number;
  /** The panes' material (default glass): a vent grille, a door. */
  mat?: string;
}

/** A tier of superstructure: from u0 to u1, base y0 to top y1, half-width (or the hull's less `inset`). */
export interface Tier {
  k: "tier";
  u: readonly [number, number];
  y: readonly [number, number];
  hw?: number;
  inset?: number;
  /** Rounded aft and forward ends: radii, metres. */
  round?: readonly [number, number];
  /** The front narrows by this much per metre over its last `taper[1]` metres. */
  taper?: readonly [number, number];
  mat?: string;
  top?: string;
  windows?: readonly Windows[];
  /** Bridge windows across the square front: pane height above the base, height, width, count. */
  front?: { y: number; h: number; w: number; n: number };
  /** Bridge wings: their half-width and depth below the top. */
  wings?: { hw: number; h: number; len?: number };
  /** A deck edge: the deck above overhanging the walls by this much, metres (its depth 0.3 m). */
  lip?: number;
  name?: string;
}

export type Band = readonly [mat: string, frac: number];

export type Item =
  | Tier
  | { k: "box"; u: readonly [number, number]; z: readonly [number, number]; y: readonly [number, number]; mat: string; name?: string; top?: boolean }
  | { k: "cyl"; u: number; z?: number; y: readonly [number, number]; r: number; mat: string; n?: number; name?: string }
  | { k: "rod"; a: Vec3; b: Vec3; r: number; mat: string; n?: number; name?: string }
  | { k: "funnel"; u: readonly [number, number]; hw: number; y: readonly [number, number]; rake?: number; bands: readonly Band[]; z?: number; round?: boolean; smoke?: boolean; name?: string }
  | { k: "mast"; u: number; z?: number; y: readonly [number, number]; r?: number; yards?: ReadonlyArray<readonly [number, number]>; mat?: string; radar?: boolean; name?: string }
  | { k: "crane"; u: number; z: number; y: number; h: number; jib: number; dir: number; lift?: number; mat?: string; name?: string }
  | { k: "derrick"; u: number; y: number; h: number; boom: number; dir: number; mat?: string; pair?: boolean; name?: string }
  | { k: "hatches"; u: readonly [number, number]; n: number; hw: number; y: number; h: number; mat?: string; gap?: number; name?: string; coaming?: number; coamingMat?: string; ridge?: number; ribs?: number }
  | { k: "containers"; u: readonly [number, number]; bays: number; hw: number; y: number; tiers: number; groups?: number; seed?: number; name?: string; rows?: number }
  | { k: "domes"; u: readonly [number, number]; n: number; r: number; y: number; h: number; mat?: string; z?: number; name?: string }
  | { k: "spheres"; u: readonly [number, number]; n: number; r: number; y: number; base?: number; mat?: string; cover?: string; name?: string }
  | { k: "tanks"; u: readonly [number, number]; n: number; r: number; y: number; z?: readonly number[]; mat?: string; name?: string }
  | { k: "pipes"; u: readonly [number, number]; z: readonly number[]; y: number; r: number; mat?: string; name?: string }
  | { k: "helideck"; u: number; y: number; r: number; z?: number; legs?: number; name?: string }
  | { k: "gantry"; u: number; hw: number; y: number; h: number; t?: number; lean?: number; mat?: string; name?: string }
  | { k: "boom"; a: Vec3; b: Vec3; w: number; mat?: string; name?: string }
  | { k: "boats"; at: readonly number[]; z: number; y: number; len: number; r: number; mat?: string; name?: string }
  | { k: "canopy"; u: readonly [number, number]; hw: number; y: number; h: number; mat: string; posts?: string; name?: string }
  | { k: "paddle"; u: number; r: number; w: number; z: number; y: number; box?: string; mat?: string; stern?: boolean; name?: string }
  | { k: "foil"; u: number; span: number; y: number; chord: number; strut: number; inner?: number; mat?: string; name?: string }
  | { k: "skirt"; u: readonly [number, number]; hw: number; h: number; c: number; mat?: string; name?: string }
  | { k: "prop"; u: number; z: number; y: number; r: number; blades?: number; pylon?: number; mat?: string; name?: string }
  | { k: "plate"; pts: ReadonlyArray<readonly [number, number]>; z: number; t: number; mat: string; name?: string }
  | { k: "portholes"; u: readonly [number, number]; y: number; pitch: number; r: number; mat?: string; name?: string }
  | { k: "rig"; masts: readonly Mast[]; bowsprit?: { len: number; rise: number }; stays?: boolean; name?: string }
  | { k: "rail"; u: readonly [number, number]; y: number; hw: number; h?: number; mat?: string; name?: string }
  // the detail items (docs/models/world-ships.md, "Detail"): drawn only where a spec asks for them
  | { k: "bulwark"; u: readonly [number, number]; h: number; t?: number; mat?: string; name?: string }
  | { k: "anchors"; u: number; y: number; s: number; mat?: string; name?: string }
  | { k: "mooring"; at: readonly number[]; hw: number; s?: number; winch?: boolean; mat?: string; name?: string }
  | { k: "catwalk"; u: readonly [number, number]; y: number; z?: number; w?: number; pitch?: number; mat?: string; name?: string }
  | { k: "vents"; at: ReadonlyArray<readonly [number, number]>; y?: number; h: number; r: number; cowl?: boolean; mat?: string; name?: string }
  | { k: "freefall"; u: number; y: number; len: number; r?: number; tilt?: number; mat?: string; name?: string }
  | { k: "lashing"; at: readonly number[]; hw: number; y: number; h: number; mat?: string; name?: string }
  | { k: "fender"; u: readonly [number, number]; y: readonly [number, number]; out: number; mat?: string; name?: string }
  | { k: "strakes"; u: readonly [number, number]; y: readonly number[]; w?: number; mat?: string; name?: string }
  | { k: "marks"; at: readonly number[]; y: readonly [number, number]; step?: number; s?: number; thruster?: number; eye?: boolean; mat?: string; name?: string };

export type SailKind = "square" | "gaff" | "lateen" | "junk" | "sprit" | "crabclaw" | "bermuda" | "jib";

/** A sail on a mast: heights are absolute; `w` the half-span of a square sail (bottom, top); `len` a fore-and-aft sail's foot. */
export interface Sail {
  kind: SailKind;
  y: readonly [number, number];
  w?: readonly [number, number];
  len?: number;
  head?: number;
  /** Where a jib's tack is, metres from the stern (the bow or the bowsprit's end). */
  tack?: number;
  /** A lateen's or crab-claw's forward reach beyond the mast. */
  fwd?: number;
}

export interface Mast {
  u: number;
  y: readonly [number, number];
  r: number;
  sails: readonly Sail[];
  /** Rake aft, metres at the top. */
  rake?: number;
}

export type ShipKind = "cargo" | "passenger" | "service" | "small" | "sail";

export interface ShipSpec {
  kind: ShipKind;
  /** Null for a craft with no displacement hull (a hovercraft on its skirt). */
  hull: HullForm | null;
  /** The overall length when there is no hull. */
  length?: number;
  livery: Record<string, string>;
  items: readonly Item[];
  /** Small craft budget (4,000 triangles), whatever the length. */
  small?: boolean;
}

// --- colours -----------------------------------------------------------------------

const BASE_COLOURS: Record<string, string> = {
  bottom: "#8f2a22", boot: "#24282c", hull: "#1f3a5a", stripe: "#f2f2ee", deck: "#7d8479", house: "#f2f0ea",
  houseTrim: "#2a2f36", roof: "#c8cbc7", funnel: "#20252b", steel: "#9ba1a4", crane: "#e3b021", hatch: "#6c7a52", mast: "#d8d6cf",
  boat: "#e2691f", sail: "#efe7d2", wood: "#8a5a33", spar: "#5a3b20", rope: "#3b3026", canopy: "#2f6d8c",
  red: "#c23128", white: "#f4f4f0", black: "#1d2024", yellow: "#e8bf2a", blue: "#1f4f9a", green: "#2f7a4b",
  orange: "#e57a1f", grey: "#7d8287", skirt: "#2b2d30", tank: "#d9d6cc",
  c0: "#b8402e", c1: "#2b5f9e", c2: "#3e8a4a", c3: "#d8b23a", c4: "#8f8f8f", c5: "#e1e1dc", c6: "#6a3d7a", c7: "#c46a2a",
};

/** The palette of a ship: every role in its colour, the livery's over the defaults; `glass` and `sail` are special. */
export function shipPalette(livery: Record<string, string>): Record<string, MaterialSpec> {
  const out: Record<string, MaterialSpec> = {};
  const cols = { ...BASE_COLOURS, ...livery };
  for (const [k, c] of Object.entries(cols)) out[k] = { color: c, roughness: 0.6 };
  out.glass = { color: livery.glass ?? "#1f2a33", metallic: 0.2, roughness: 0.15, glass: true };
  out.sail = { color: cols.sail!, roughness: 0.8, doubleSided: true };
  out.steel = { color: cols.steel!, metallic: 0.3, roughness: 0.5 };
  return out;
}

/** The container colours, cycled. */
const BOXES = ["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"];

// --- helpers (copied from ships.ts, see the header) ---------------------------------

export function lerpTable(table: ReadonlyArray<readonly [number, number]>, x: number): number {
  if (x <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i]!;
    if (x <= x1) {
      const [x0, y0] = table[i - 1]!;
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return table[table.length - 1]![1];
}

type Frame = (s: number, y: number, b: number) => Vec3;

const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Triangles facing away from the model's inside, drawn as one `facets` leaf (ships.ts TriBatch). */
class TriBatch {
  private readonly pts: Vec3[] = [];
  private readonly nrm: Vec3[] = [];
  add(a: Vec3, b: Vec3, c: Vec3, out?: Vec3): void {
    let n = cross3(sub3(b, a), sub3(c, a));
    const l = Math.hypot(n[0], n[1], n[2]);
    if (l < 1e-9) return;
    n = [n[0] / l, n[1] / l, n[2] / l];
    if (out && dot3(n, out) < 0) {
      this.pts.push(a, c, b);
      n = [-n[0], -n[1], -n[2]];
    } else this.pts.push(a, b, c);
    this.nrm.push(n);
  }
  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, out?: Vec3): void {
    this.add(a, b, c, out);
    this.add(a, c, d, out);
  }
  draw(m: MeshBuilder, mat: string): void {
    if (this.nrm.length === 0) return;
    const avg: Vec3 = [0, 0, 0];
    for (const n of this.nrm) for (let k = 0; k < 3; k++) avg[k] += n[k]!;
    const l = Math.hypot(avg[0], avg[1], avg[2]) || 1;
    const hint: Vec3 = [avg[0] / l, avg[1] / l, avg[2] / l];
    const main: Vec3[] = [];
    const loners: number[] = [];
    this.nrm.forEach((n, i) => {
      if (dot3(n, hint) > 0.05) main.push(this.pts[i * 3]!, this.pts[i * 3 + 1]!, this.pts[i * 3 + 2]!);
      else loners.push(i);
    });
    if (main.length) m.facets(mat, main, hint);
    for (const i of loners) m.facets(mat, [this.pts[i * 3]!, this.pts[i * 3 + 1]!, this.pts[i * 3 + 2]!], this.nrm[i]!);
  }
}

interface ShellBand {
  mat: string;
  top?: (s: number) => number;
  cuts?: number[];
}

interface ShellSpec {
  frame: Frame;
  stations: number[];
  keel: (s: number) => number;
  deck: (s: number) => number;
  halfBeam: (s: number, y: number) => number;
  bands: ShellBand[];
  deckMat: string;
}

/** The hull shell (ships.ts hullShell): sections from the keel to the deck edge, cut at the bands, joined station to station. */
function hullShell(m: MeshBuilder, spec: ShellSpec): void {
  const { frame: F, stations, bands } = spec;
  const sections = stations.map((s) => {
    const keel = spec.keel(s);
    const deck = spec.deck(s);
    const ys: number[] = [keel];
    const rowBand: number[] = [];
    let lo = keel;
    bands.forEach((band, k) => {
      const hi = k === bands.length - 1 ? deck : Math.min(deck, Math.max(lo, band.top ? band.top(s) : deck));
      for (const f of band.cuts ?? [1]) {
        ys.push(lo + (hi - lo) * f);
        rowBand.push(k);
      }
      lo = hi;
    });
    return { s, ys, bs: ys.map((y) => spec.halfBeam(s, y)), rowBand };
  });
  const rows = sections[0]!.rowBand;
  const P = (sec: (typeof sections)[number], j: number, side: number): Vec3 => F(sec.s, sec.ys[j]!, side * sec.bs[j]!);
  const outSide = (side: number): Vec3 => [0, 0, side];
  m.scope("sides", () => {
    bands.forEach((band, k) => {
      m.scope(band.mat, () => {
        for (const side of [1, -1]) {
          const batch = new TriBatch();
          for (let j = 0; j < rows.length; j++) {
            if (rows[j] !== k) continue;
            for (let i = 0; i + 1 < sections.length; i++) {
              const a = sections[i]!;
              const b = sections[i + 1]!;
              batch.quad(P(a, j, side), P(b, j, side), P(b, j + 1, side), P(a, j + 1, side), outSide(side));
            }
          }
          batch.draw(m, band.mat);
        }
      });
    });
  });
  m.scope("bottom", () => {
    const batch = new TriBatch();
    for (let i = 0; i + 1 < sections.length; i++) {
      const a = sections[i]!;
      const b = sections[i + 1]!;
      batch.quad(P(a, 0, -1), P(b, 0, -1), P(b, 0, 1), P(a, 0, 1), [0, -1, 0]);
    }
    batch.draw(m, bands[0]!.mat);
  });
  m.scope("deck", () => {
    const batch = new TriBatch();
    const top = rows.length;
    for (let i = 0; i + 1 < sections.length; i++) {
      const a = sections[i]!;
      const b = sections[i + 1]!;
      batch.quad(P(a, top, -1), P(b, top, -1), P(b, top, 1), P(a, top, 1), [0, 1, 0]);
    }
    batch.draw(m, spec.deckMat);
  });
  const end = (sec: (typeof sections)[number], dir: number, name: string): void => {
    if (sec.bs.every((b) => b < 1e-3)) return;
    m.scope(name, () => {
      bands.forEach((band, k) => {
        const batch = new TriBatch();
        for (let j = 0; j < rows.length; j++) {
          if (rows[j] === k) batch.quad(P(sec, j, -1), P(sec, j, 1), P(sec, j + 1, 1), P(sec, j + 1, -1), [dir, 0, 0]);
        }
        batch.draw(m, band.mat);
      });
    });
  };
  end(sections[0]!, -1, "transom");
  end(sections[sections.length - 1]!, 1, "stem");
}

function orient(ring: Ring): Ring {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i]!;
    const [x1, z1] = ring[(i + 1) % ring.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a > 0 ? [...ring].reverse() : ring;
}

/** A deckhouse plan from x0 to x1, half-width w(x), sampled `n` times and finer near the ends (ships.ts planRing). */
function planRing(s0: number, s1: number, w: (s: number) => number, n: number): Ring {
  const at = new Set<number>();
  for (let i = 0; i <= n; i++) at.add(Math.round((s0 + ((s1 - s0) * i) / n) * 1000) / 1000);
  const end = Math.min(12, (s1 - s0) / 2);
  const near = [0, 0.12, 0.45, 1.1];
  for (let d = 2; d <= end; d += 2) near.push(d);
  for (const d of near.filter((v) => v <= end)) {
    at.add(Math.round((s0 + d) * 1000) / 1000);
    at.add(Math.round((s1 - d) * 1000) / 1000);
  }
  const pts: Array<[number, number]> = [...at].sort((a, b) => a - b).map((s) => [s, Math.max(0.01, w(s))]);
  const ring: Array<[number, number]> = [];
  for (const [s, h] of pts) ring.push([s, h]);
  for (let i = pts.length - 1; i >= 0; i--) ring.push([pts[i]![0], -pts[i]![1]]);
  return orient(ring);
}

export function roundEnd(hw: number, r: number, d: number): number {
  if (r <= 0 || d >= r) return hw;
  const t = (r - Math.max(0, d)) / r;
  return hw * Math.sqrt(Math.max(0, 1 - t * t));
}

/** A body of revolution along x about (z c0, y cy): stations (x, rz, ry) (ships.ts spindle). */
function spindle(m: MeshBuilder, mat: string, c0: number, cy: number, st: ReadonlyArray<readonly [number, number, number]>, n = 10): void {
  const ring = (rx: number, ry: number): Ring => {
    const out: Ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / n;
      out.push([c0 + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  };
  for (let i = 0; i + 1 < st.length; i++) {
    const [a0, rx0, ry0] = st[i]!;
    const [a1, rx1, ry1] = st[i + 1]!;
    m.sweep(mat, "x", ring(Math.max(0.01, rx0), Math.max(0.01, ry0)), a0, ring(Math.max(0.01, rx1), Math.max(0.01, ry1)), a1, false);
  }
}

/** Evenly spaced positions from a to b, about `pitch` apart. */
export function spaced(a: number, b: number, pitch: number): number[] {
  const n = Math.max(1, Math.round((b - a) / pitch));
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
}

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

// --- the hull's geometry -----------------------------------------------------------

interface BowDefaults { entry: number; rake: number; transomBow: number }
const BOW: Record<Bow, BowDefaults> = {
  raked: { entry: 0.22, rake: 0.03, transomBow: 0 },
  bulbous: { entry: 0.2, rake: 0.025, transomBow: 0 },
  ice: { entry: 0.26, rake: 0.1, transomBow: 0 },
  barge: { entry: 0.06, rake: 0.05, transomBow: 0.86 },
  clipper: { entry: 0.3, rake: 0.09, transomBow: 0 },
  canoe: { entry: 0.34, rake: 0.1, transomBow: 0 },
  plumb: { entry: 0.22, rake: 0.006, transomBow: 0 },
};
const STERN: Record<Stern, { run: number; transom: number; lift: number }> = {
  transom: { run: 0.2, transom: 0.72, lift: 0.55 },
  cruiser: { run: 0.16, transom: 0.18, lift: 0.6 },
  sternwheel: { run: 0.04, transom: 0.92, lift: 0.2 },
  canoe: { run: 0.3, transom: 0, lift: 0.7 },
};

/** The hull's functions of u (metres from the stern) and y. */
export interface HullGeometry {
  form: HullForm;
  L: number;
  /** Each hull's half-breadth at the deck at u (one demihull's for a catamaran). */
  plan: (u: number) => number;
  keel: (u: number) => number;
  deck: (u: number) => number;
  halfBeam: (u: number, y: number) => number;
  stations: number[];
  /** The hulls' centrelines (z): [0], or the two demihulls'. */
  centres: number[];
}

export function hullGeometry(f: HullForm): HullGeometry {
  const L = f.length;
  const bd = BOW[f.bow];
  const sd = STERN[f.stern];
  const entry = f.entry ?? bd.entry;
  const run = f.run ?? sd.run;
  const tr = f.transom ?? sd.transom;
  const rake = (f.rake ?? bd.rake) * L;
  const half = (f.twin ?? f.beam) / 2;
  const centres = f.twin ? [-(f.beam - f.twin) / 2, (f.beam - f.twin) / 2] : [0];
  const [sheerA, sheerF] = f.sheer ?? [0, 0];
  const deck = (u: number): number => {
    const a = Math.max(0, (L / 2 - u) / (L / 2));
    const b = Math.max(0, (u - L / 2) / (L / 2));
    let d = f.depth + sheerA * a * a + sheerF * b * b;
    if (f.forecastle) d += f.forecastle[1] * clamp01((u - (L - f.forecastle[0])) / 0.6 + 1);
    if (f.poop) d += f.poop[1] * clamp01((f.poop[0] - u) / 0.6 + 1);
    return d;
  };
  const plan = (u: number): number => {
    const ub = L * (1 - entry);
    if (u > ub) {
      const t = clamp01((u - ub) / (L - ub));
      if (f.bow === "barge") return half * (1 - (1 - bd.transomBow) * t * t);
      const p = f.bow === "canoe" ? 1.7 : f.bow === "clipper" ? 1.6 : f.bow === "ice" ? 1.8 : 2.1;
      return half * Math.pow(Math.max(0, 1 - Math.pow(t, p)), 0.75);
    }
    const ua = L * run;
    if (u < ua) {
      const t = clamp01(1 - u / ua);
      if (f.stern === "canoe") return half * Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.75);
      if (f.stern === "cruiser") return half * Math.sqrt(Math.max(0, 1 - (1 - tr * tr) * Math.pow(t, 2.4)));
      return half * (1 - (1 - tr) * t * t);
    }
    return half;
  };
  const keel = (u: number): number => {
    // the stem: from its foot (rake + a forefoot) up to the deck at the bow
    const foot = L - rake - (f.bow === "canoe" || f.bow === "clipper" ? L * 0.05 : f.bow === "barge" ? 0 : L * 0.015);
    if (u > foot) {
      const t = clamp01((u - foot) / (L - foot));
      const top = deck(L) * 0.98;
      const shape = f.bow === "clipper" ? 1 - (1 - t) * (1 - t) : f.bow === "canoe" ? t * t * 0.5 + t * 0.5 : f.bow === "barge" ? t : Math.pow(t, 1.25);
      return top * shape;
    }
    // the counter: the bottom rising into the stern
    const ua = L * run * (f.stern === "canoe" ? 1 : 0.8);
    if (u < ua) {
      const t = clamp01(1 - u / ua);
      const lift = f.stern === "canoe" ? deck(0) * 0.98 : Math.min(f.draft * sd.lift * 1.2, deck(0) * 0.7);
      const shape = f.stern === "canoe" ? Math.pow(t, 1.6) : Math.pow(t, 2.2);
      return lift * shape;
    }
    return 0;
  };
  const halfBeam = (u: number, y: number): number => {
    const k = keel(u);
    const d = Math.max(0.05, deck(u) - k);
    const t = clamp01((y - k) / d);
    const bowness = clamp01((u - L * (1 - entry)) / (L * entry * 0.8));
    const sternness = f.stern === "canoe" ? clamp01((L * run - u) / (L * run * 0.8)) : 0;
    const vee = 0.08 + 0.92 * Math.pow(t, 0.6);
    let mid: number;
    if (f.section === "flat") mid = t < 0.08 ? 0.9 + 0.1 * Math.sqrt(t / 0.08) : 1;
    else if (f.section === "vee") mid = 0.25 + 0.75 * Math.pow(t, 0.55);
    else if (f.section === "keel") mid = 0.06 + 0.94 * Math.pow(t, 0.42);
    else {
      // round bilge over a flat floor
      const tb = Math.min(0.45, Math.max(0.12, (f.beam / f.depth) * 0.06));
      mid = t < tb ? 0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / tb, 2))) : 1;
    }
    const w = Math.max(bowness, sternness);
    const g = f.bow === "barge" && u > L * 0.5 ? mid : mid * (1 - w) + vee * w;
    return plan(u) * g;
  };
  // stations: the run, the parallel middle body, the entry, finer at the ends
  const st = new Set<number>();
  const add = (u: number): void => { st.add(Math.round(Math.min(L, Math.max(0, u)) * 1000) / 1000); };
  const ua = L * run;
  const ub = L * (1 - entry);
  const nRun = f.fine ? 12 : 6;
  const nEntry = f.fine ? 18 : 9;
  for (let i = 0; i <= nRun; i++) add((ua * i) / nRun);
  for (const t of [0.01, 0.03, 0.06]) add(ua * t);
  const mids = f.fine ? Math.max(4, Math.min(16, Math.round((ub - ua) / Math.max(3, L / 24)))) : Math.max(2, Math.min(8, Math.round((ub - ua) / Math.max(4, L / 12))));
  for (let i = 0; i <= mids; i++) add(ua + ((ub - ua) * i) / mids);
  for (let i = 0; i <= nEntry; i++) add(ub + ((L - ub) * i) / nEntry);
  for (const t of [0.95, 0.975, 0.99]) add(ub + (L - ub) * t);
  const foot = L - rake;
  for (const d of [-0.04, -0.015, 0, 0.3, 0.6].map((v) => v * L)) if (foot + d > ub && foot + d < L) add(foot + d);
  if (f.forecastle) for (const d of [-0.05, 0.6]) add(L - f.forecastle[0] - 0.6 + d + 0.05);
  if (f.poop) for (const d of [-0.05, 0.6]) add(f.poop[0] + 0.6 - d - 0.05);
  const stations = [...st].sort((a, b) => a - b);
  const lift = f.lift ?? 0;
  if (!lift) return { form: f, L, plan, keel, deck, halfBeam, stations, centres };
  return { form: f, L, plan, keel: (u) => keel(u) + lift, deck: (u) => deck(u) + lift, halfBeam: (u, y) => halfBeam(u, y - lift), stations, centres };
}

// --- the build context -------------------------------------------------------------

export interface ShipCtx {
  m: MeshBuilder;
  spec: ShipSpec;
  L: number;
  /** x of u metres from the stern. */
  x: (u: number) => number;
  hull: HullGeometry | null;
  /** The deck height at u (or 0 without a hull). */
  deck: (u: number) => number;
  /** The hull's half-breadth at u and y (outermost hull), or 0. */
  side: (u: number, y: number) => number;
}

export function shipLength(s: ShipSpec): number {
  return s.hull ? s.hull.length : s.length ?? 10;
}

function ctxOf(m: MeshBuilder, s: ShipSpec): ShipCtx {
  const L = shipLength(s);
  const hull = s.hull ? hullGeometry(s.hull) : null;
  const deck = (u: number): number => (hull ? hull.deck(Math.min(L, Math.max(0, u))) : 0);
  const side = (u: number, y: number): number => {
    if (!hull) return 0;
    const uu = Math.min(L, Math.max(0, u));
    const c = Math.max(...hull.centres.map(Math.abs));
    return c + hull.halfBeam(uu, y);
  };
  return { m, spec: s, L, x: (u) => u - L / 2, hull, deck, side };
}

/** The triangle budget of a ship (docs/models/world-ships.md, "Budgets"): 25,000 over 150 m, 4,000 small craft, else 15,000. */
export function shipBudget(s: ShipSpec): number {
  if (s.small) return 4000;
  return shipLength(s) > 150 ? 25_000 : 15_000;
}

// --- the hull ------------------------------------------------------------------------

function drawHull(c: ShipCtx): void {
  const { m, hull } = c;
  if (!hull) return;
  const f = hull.form;
  const boot = f.boot ?? Math.max(0.15, Math.min(1.2, f.depth * 0.06));
  const stripe = f.stripe ?? 0;
  const small = c.spec.small || f.length < 30;
  const bands: ShellBand[] = [
    { mat: "bottom", top: () => f.draft, cuts: small ? [0.3, 0.65, 1] : [0.06, 0.16, 0.32, 0.55, 0.8, 1] },
    ...(boot > 0 ? [{ mat: "boot", top: () => f.draft + boot }] : []),
    { mat: "hull", top: (u: number) => hull.deck(u) - stripe, cuts: small ? [1] : [0.5, 1] },
    ...(stripe > 0 ? [{ mat: "stripe" }] : []),
  ];
  hull.centres.forEach((zc, i) => {
    m.scope(hull.centres.length > 1 ? (zc < 0 ? "port hull" : "starboard hull") : "hull", () => {
      hullShell(m, {
        frame: (u, y, b) => [c.x(u), y, b + zc],
        stations: hull.stations,
        keel: hull.keel,
        deck: hull.deck,
        halfBeam: hull.halfBeam,
        bands,
        deckMat: "deck",
      });
      if (f.bow === "bulbous" && i === 0) drawBulb(c, f);
      if (i === 0 || hull.centres.length > 1) drawSternGear(c, f, zc);
    });
  });
}

function drawBulb(c: ShipCtx, f: HullForm): void {
  const L = f.length;
  const r = (f.bulb ?? 0.16) * f.beam / 2;
  const cy = f.draft * 0.5;
  const ry = Math.min(r * 1.3, f.draft * 0.42);
  const tip = L - (f.rake ?? BOW.bulbous.rake) * L * 0.1;
  c.m.scope("bulbous bow", () => spindle(c.m, "bottom", 0, cy, [
    [c.x(tip - L * 0.06), r * 0.7, ry * 0.8], [c.x(tip - L * 0.035), r, ry], [c.x(tip - L * 0.012), r * 0.85, ry * 0.85], [c.x(tip - L * 0.003), r * 0.45, ry * 0.45], [c.x(tip), r * 0.08, ry * 0.08],
  ], 10));
}

function drawSternGear(c: ShipCtx, f: HullForm, zc: number): void {
  const { m } = c;
  const L = f.length;
  if (f.stern === "canoe" || f.stern === "sternwheel" || f.rudder === false) return;
  const hull = c.hull!;
  const chord = Math.max(0.3, f.draft * 0.5);
  // the rudder's after edge just inside the stern
  const ur = Math.max(L * 0.012, chord / 2 + 0.05);
  const top = Math.min(hull.keel(ur) + 0.05, f.draft * 1.1);
  const h = Math.max(0.3, top - f.draft * 0.12);
  const t = Math.max(0.06, f.beam * 0.012);
  m.scope("rudder", () => m.box("bottom", c.x(ur), zc, chord, t, Math.max(0, top - h), Math.max(top, 0.2)));
  const n = f.screws ?? (c.spec.kind === "small" || c.spec.kind === "sail" ? 0 : 1);
  if (!n) return;
  const r = Math.max(0.25, f.draft * 0.32);
  const zs = n === 1 ? [zc] : [zc - f.beam * 0.18, zc + f.beam * 0.18];
  m.scope("propellers", () => {
    for (const z of zs) {
      const up = ur + chord * 0.6 + 0.15;
      const cy = Math.max(r + 0.05, f.draft * 0.42);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const p: Vec3 = [c.x(up), cy + Math.sin(a) * r * 0.2, z + Math.cos(a) * r * 0.2];
        const q: Vec3 = [c.x(up), cy + Math.sin(a) * r, z + Math.cos(a) * r];
        m.slab("steel", [[p[0] - r * 0.12, p[1], p[2]], [q[0] - r * 0.08, q[1], q[2]], [q[0] + r * 0.08, q[1], q[2]], [p[0] + r * 0.12, p[1], p[2]]], [0, Math.cos(a) * 0.05, -Math.sin(a) * 0.05]);
      }
      m.rod("steel", [c.x(up - r * 0.15), cy, z], [c.x(up + r * 0.3), cy, z], r * 0.22, 6);
    }
  });
}

// --- the furniture -------------------------------------------------------------------

/** The game's draftFrac: the waterline (y = draft) over the built model's height (its highest point; the keel is on y = 0). */
export function shipDraftFrac(s: ShipSpec): number {
  const pos = worldShip(s).positions();
  let top = 0;
  for (let i = 1; i < pos.length; i += 3) top = Math.max(top, pos[i]!);
  const d = s.hull ? s.hull.draft : 0.3;
  return Math.round((d / top) * 10000) / 10000;
}

/** The half-width a deck item may take between u0 and u1 at height y: inside the hull's side less 0.4 m (or unlimited without a hull). */
function fitWidth(c: ShipCtx, u0: number, u1: number, y: number): number {
  if (!c.hull) return Infinity;
  return Math.min(c.side(u0, Math.min(y, c.deck(u0))), c.side(u1, Math.min(y, c.deck(u1))), c.side((u0 + u1) / 2, Math.min(y, c.deck((u0 + u1) / 2)))) - 0.4;
}

function tierWidth(c: ShipCtx, t: Tier): (u: number) => number {
  const [u0, u1] = t.u;
  const [ra, rf] = t.round ?? [0, 0];
  return (u: number): number => {
    let w = t.hw ?? c.side(u, t.y[0]) - (t.inset ?? 0.3);
    if (t.hw !== undefined && c.hull) w = Math.min(w, c.side(u, Math.max(t.y[0], c.deck(u))) - 0.05);
    w = Math.min(roundEnd(w, ra, u - u0), roundEnd(w, rf, u1 - u));
    if (t.taper) w -= Math.max(0, u - (u1 - t.taper[1])) * t.taper[0];
    return w;
  };
}

function drawTier(c: ShipCtx, t: Tier, i: number): void {
  const { m } = c;
  const mat = t.mat ?? "house";
  const w = tierWidth(c, t);
  const [u0, u1] = t.u;
  const [y0, y1] = t.y;
  m.scope(t.name ?? `tier ${i + 1}`, () => {
    const nRing = Math.max(4, Math.min(24, Math.round((u1 - u0) / 4)));
    const ring = planRing(c.x(u0), c.x(u1), (x) => w(x + c.L / 2), nRing);
    if (t.lip) {
      // the deck edge: the walls stop under a slab that overhangs them, its underside closing the gap
      const lt = Math.min(0.3, (y1 - y0) * 0.2);
      const lw = t.lip;
      const xa = c.x(u0) + 1e-6;
      const xb = c.x(u1) - 1e-6;
      const outer: Ring = ring.map(([px, pz]) => [px <= xa ? px - lw : px >= xb ? px + lw : px, pz + Math.sign(pz) * lw]);
      m.prism(mat, ring, y0, y1 - lt, false);
      m.scope("deck edge", () => {
        m.prism(mat, outer, y1 - lt, y1, false);
        m.cap(t.top ?? (mat === "house" ? "roof" : mat), outer, y1);
        for (let k = 0; k < ring.length; k++) {
          const j = (k + 1) % ring.length;
          const a: Vec3 = [ring[k]![0], y1 - lt, ring[k]![1]];
          const b: Vec3 = [ring[j]![0], y1 - lt, ring[j]![1]];
          const d: Vec3 = [outer[j]![0], y1 - lt, outer[j]![1]];
          const e: Vec3 = [outer[k]![0], y1 - lt, outer[k]![1]];
          m.facets(mat, [a, b, d, a, d, e], [0, -1, 0]);
        }
      });
    } else {
      m.prism(mat, ring, y0, y1, false);
      m.cap(t.top ?? (mat === "house" ? "roof" : mat), ring, y1);
    }
    if (t.windows?.length) {
      m.scope("windows", () => {
        for (const win of t.windows!) {
          const a = win.from ?? u0 + Math.max(1, (t.round?.[0] ?? 0) + 0.6);
          const b = win.to ?? u1 - Math.max(1, (t.round?.[1] ?? 0) + 0.6);
          if (b <= a) continue;
          const groups = new Map<number, number[]>();
          for (const s of spaced(a, b, win.pitch)) {
            const ww = Math.round(Math.max(w(s - win.w / 2), w(s + win.w / 2)) * 100) / 100;
            groups.set(ww, [...(groups.get(ww) ?? []), s]);
          }
          for (const side of win.side ? [win.side] : [1, -1]) {
            const batch = new TriBatch();
            for (const [ww, list] of [...groups.entries()].sort((p, q) => p[0] - q[0])) {
              const z = side * (ww + 0.03);
              for (const s of list) {
                const xa = c.x(s - win.w / 2);
                const xb = c.x(s + win.w / 2);
                batch.quad([xa, y0 + win.y, z], [xb, y0 + win.y, z], [xb, y0 + win.y + win.h, z], [xa, y0 + win.y + win.h, z], [0, 0, side]);
              }
            }
            batch.draw(m, win.mat ?? "glass");
          }
        }
        if (t.front) {
          const f = t.front;
          const hw = w(u1);
          const batch = new TriBatch();
          const xf = c.x(u1) + 0.03;
          for (const zc of spaced(-hw + f.w * 0.7, hw - f.w * 0.7, (2 * hw - f.w * 1.4) / Math.max(1, f.n - 1)).slice(0, f.n)) {
            batch.quad([xf, y0 + f.y, zc - f.w / 2], [xf, y0 + f.y, zc + f.w / 2], [xf, y0 + f.y + f.h, zc + f.w / 2], [xf, y0 + f.y + f.h, zc - f.w / 2], [1, 0, 0]);
          }
          batch.draw(m, "glass");
        }
      });
    }
    if (t.wings) {
      const wg = t.wings;
      const len = wg.len ?? Math.min(4, (u1 - u0) * 0.3);
      const ua = u1 - len - 0.2;
      const hwIn = w(u1 - len / 2) - 0.2;
      m.scope("bridge wings", () => {
        for (const side of [1, -1]) {
          const zc = side * (hwIn + wg.hw) / 2;
          m.box(mat, c.x(ua + len / 2), zc, len, wg.hw - hwIn, y1 - wg.h, y1 - 0.06);
          const zg = side * (wg.hw + 0.03);
          const batch = new TriBatch();
          batch.quad([c.x(ua + 0.3), y1 - wg.h + 0.4, zg], [c.x(ua + len - 0.3), y1 - wg.h + 0.4, zg], [c.x(ua + len - 0.3), y1 - 0.4, zg], [c.x(ua + 0.3), y1 - 0.4, zg], [0, 0, side]);
          batch.draw(m, "glass");
        }
      });
    }
  });
}

/** A superellipse plan about (cx, cz), `rx` along x, `rz` across. */
function ovalRing(cx: number, cz: number, rx: number, rz: number, n = 16, ex = 2.6): Ring {
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    ring.push([cx + rx * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / ex), cz + rz * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / ex)]);
  }
  return orient(ring);
}

function drawItem(c: ShipCtx, it: Item, i: number): void {
  const { m, x } = c;
  const nm = (fallback: string): string => it.name ?? `${fallback} ${i + 1}`;
  switch (it.k) {
    case "tier": drawTier(c, it, i); return;
    case "box":
      m.scope(nm("block"), () => m.box(it.mat, x((it.u[0] + it.u[1]) / 2), (it.z[0] + it.z[1]) / 2, it.u[1] - it.u[0], it.z[1] - it.z[0], it.y[0], it.y[1], 0, it.top ?? true));
      return;
    case "cyl":
      m.scope(nm("post"), () => m.prism(it.mat, ngon(it.n ?? 10, it.r, 0, x(it.u), it.z ?? 0), it.y[0], it.y[1]));
      return;
    case "rod":
      m.scope(nm("rod"), () => m.rod(it.mat, [x(it.a[0]), it.a[1], it.a[2]], [x(it.b[0]), it.b[1], it.b[2]], it.r, it.n ?? 6));
      return;
    case "funnel": {
      m.scope(nm("funnel"), () => {
        const [y0, y1] = it.y;
        const rake = it.rake ?? 0;
        const z = it.z ?? 0;
        const rx = (it.u[1] - it.u[0]) / 2;
        const ring = (y: number): Ring => (it.round
          ? ngon(16, it.hw, 0, x((it.u[0] + it.u[1]) / 2) - rake * ((y - y0) / (y1 - y0)), z)
          : ovalRing(x((it.u[0] + it.u[1]) / 2) - rake * ((y - y0) / (y1 - y0)), z, rx, it.hw));
        let lo = y0;
        it.bands.forEach(([mat, frac], k) => {
          const hi = k === it.bands.length - 1 ? y1 : y0 + (y1 - y0) * frac;
          m.loft(mat, ring(lo), lo, ring(hi), hi, k === it.bands.length - 1);
          lo = hi;
        });
        if (it.smoke !== false) m.emit("smoke", [x((it.u[0] + it.u[1]) / 2) - rake, y1, z], Math.max(0.2, Math.min(rx, it.hw) * 0.5));
      });
      return;
    }
    case "mast": {
      m.scope(nm("mast"), () => {
        const r = it.r ?? 0.2;
        const z = it.z ?? 0;
        const mat = it.mat ?? "mast";
        m.prism(mat, ngon(8, r, 0, x(it.u), z), it.y[0], it.y[1]);
        for (const [y, span] of it.yards ?? []) m.box(mat, x(it.u), z, r * 1.4, span * 2, y - r * 0.6, y);
        if (it.radar) m.box("black", x(it.u), z, r * 2, Math.max(1.2, r * 10), it.y[1] + 0.1, it.y[1] + 0.4);
      });
      return;
    }
    case "crane": {
      m.scope(nm("crane"), () => {
        const mat = it.mat ?? "crane";
        const px = x(it.u);
        const ped = Math.max(0.6, it.jib * 0.06);
        m.prism(mat, ngon(10, ped, 0, px, it.z), it.y, it.y + it.h);
        m.box(mat, px, it.z, ped * 2.6, ped * 2.2, it.y + it.h, it.y + it.h + ped * 2.4);
        const lift = it.lift ?? 0.6;
        const a: Vec3 = [px + Math.cos(it.dir) * ped, it.y + it.h + ped * 0.8, it.z + Math.sin(it.dir) * ped];
        const b: Vec3 = [a[0] + Math.cos(it.dir) * Math.cos(lift) * it.jib, a[1] + Math.sin(lift) * it.jib, a[2] + Math.sin(it.dir) * Math.cos(lift) * it.jib];
        m.rod(mat, a, b, Math.max(0.15, ped * 0.35), 6);
        m.rod("rope", b, [b[0], Math.max(it.y + it.h * 0.5, b[1] - it.jib * 0.4), b[2]], 0.06, 3);
      });
      return;
    }
    case "derrick": {
      m.scope(nm("derrick"), () => {
        const mat = it.mat ?? "mast";
        const r = Math.max(0.15, it.h * 0.025);
        const zs = it.pair ? [-r * 6, r * 6] : [0];
        for (const z of zs) m.prism(mat, ngon(8, r, 0, x(it.u), z), it.y, it.y + it.h);
        if (it.pair) m.box(mat, x(it.u), 0, r * 2, r * 14, it.y + it.h - r * 2, it.y + it.h);
        for (const z of zs) {
          const a: Vec3 = [x(it.u), it.y + 1.2, z];
          const b: Vec3 = [x(it.u) + Math.cos(it.dir) * it.boom * 0.8, it.y + 1.2 + it.boom * 0.6, z + Math.sin(it.dir) * it.boom * 0.1];
          m.rod(mat, a, b, r * 0.6, 5);
          m.rod("rope", [x(it.u), it.y + it.h - r, z], b, 0.05, 3);
        }
      });
      return;
    }
    case "hatches": {
      m.scope(nm("hatch covers"), () => {
        const gap = it.gap ?? 1.5;
        const len = (it.u[1] - it.u[0] - gap * (it.n - 1)) / it.n;
        for (let k = 0; k < it.n; k++) {
          const u = it.u[0] + k * (len + gap) + len / 2;
          const hw = Math.min(it.hw, fitWidth(c, u - len / 2, u + len / 2, it.y));
          if (!it.coaming && !it.ridge && !it.ribs) {
            m.box(it.mat ?? "hatch", x(u), 0, len, hw * 2, it.y, it.y + it.h);
            continue;
          }
          // the detailed hatch: a coaming under the cover, a ridged top, ribs across it
          const co = it.coaming ?? 0;
          const ridge = Math.min(it.ridge ?? 0, it.h * 0.6);
          const y0 = it.y + co;
          const ya = y0 + it.h - ridge;
          if (co > 0) m.box(it.coamingMat ?? "steel", x(u), 0, len - 0.6, hw * 2 - 0.6, it.y - 0.05, y0, 0, false);
          m.box(it.mat ?? "hatch", x(u), 0, len, hw * 2, y0, ya, 0, ridge <= 0);
          if (ridge > 0) m.sweep(it.mat ?? "hatch", "x", [[hw, ya], [0, ya + ridge], [-hw, ya]], x(u - len / 2), [[hw, ya], [0, ya + ridge], [-hw, ya]], x(u + len / 2), true);
          for (let r = 1; r <= (it.ribs ?? 0); r++) {
            const ur = u - len / 2 + (len * r) / ((it.ribs ?? 0) + 1);
            m.box(it.mat ?? "hatch", x(ur), 0, 0.35, hw * 2 + 0.16, y0 + (ya - y0) * 0.25, ya + ridge * 0.35);
          }
        }
      });
      return;
    }
    case "containers": {
      m.scope(nm("containers"), () => {
        const groups = it.groups ?? Math.max(2, Math.min(8, Math.round(it.hw / 2.5)));
        const len = (it.u[1] - it.u[0] - 0.6 * (it.bays - 1)) / it.bays;
        let seed = it.seed ?? 7;
        const rnd = (): number => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        for (let b = 0; b < it.bays; b++) {
          const u = it.u[0] + b * (len + 0.6) + len / 2;
          // a bay narrows with the hull, a stack's width at a time
          const fit = fitWidth(c, u - len / 2, u + len / 2, it.y);
          const hw = Math.min(it.hw, fit);
          if (it.rows) {
            // one stack per row of boxes, its lower and upper boxes in two colours
            const nr = Math.max(1, Math.round((hw * 2) / it.rows));
            const rw = (hw * 2) / nr;
            for (let g = 0; g < nr; g++) {
              const tiers = Math.max(1, it.tiers - (rnd() < 0.3 ? 1 + Math.floor(rnd() * 3) : 0));
              const split = tiers > 1 && rnd() < 0.7 ? 1 + Math.floor(rnd() * (tiers - 1)) : tiers;
              const ca = BOXES[Math.floor(rnd() * BOXES.length)]!;
              const cb = BOXES[Math.floor(rnd() * BOXES.length)]!;
              const zc = -hw + (g + 0.5) * rw;
              m.box(ca, x(u), zc, len, rw - 0.1, it.y, it.y + split * 2.6, 0, split === tiers);
              if (split < tiers) m.box(cb, x(u), zc, len, rw - 0.1, it.y + split * 2.6, it.y + tiers * 2.6, 0, true);
            }
            continue;
          }
          const ng = Math.max(1, Math.round((groups * hw) / it.hw));
          const gw = (hw * 2) / ng;
          for (let g = 0; g < ng; g++) {
            const tiers = Math.max(1, it.tiers - (rnd() < 0.35 ? 1 + Math.floor(rnd() * 2) : 0));
            const z0 = -hw + g * gw + 0.04;
            m.box(BOXES[Math.floor(rnd() * BOXES.length)]!, x(u), z0 + gw / 2 - 0.04, len, gw - 0.08, it.y, it.y + tiers * 2.6, 0, true);
          }
        }
      });
      return;
    }
    case "domes": {
      m.scope(nm("tank domes"), () => {
        for (const u of spaced(it.u[0], it.u[1], (it.u[1] - it.u[0]) / Math.max(1, it.n - 1)).slice(0, it.n)) {
          m.prism(it.mat ?? "tank", ngon(10, it.r, 0, x(u), it.z ?? 0), it.y, it.y + it.h, false);
          m.spire(it.mat ?? "tank", ngon(10, it.r, 0, x(u), it.z ?? 0), it.y + it.h, it.y + it.h + it.r * 0.5);
        }
      });
      return;
    }
    case "spheres": {
      m.scope(nm("spherical tanks"), () => {
        const pitch = (it.u[1] - it.u[0]) / Math.max(1, it.n);
        for (let k = 0; k < it.n; k++) {
          const u = it.u[0] + pitch * (k + 0.5);
          const st: Array<[number, number, number]> = [];
          for (let j = 0; j <= 6; j++) {
            const a = (j / 6) * (Math.PI / 2);
            st.push([it.y + Math.sin(a) * it.r, Math.max(0.02, Math.cos(a) * it.r), 0]);
          }
          // the dome above the deck: rings from its equator to its top
          const rings = st.map(([y, r]) => [y, ngon(16, r, 0, x(u), 0)] as const);
          for (let j = 0; j + 1 < rings.length; j++) m.loft(it.mat ?? "tank", rings[j]![1], rings[j]![0], rings[j + 1]![1], rings[j + 1]![0], j + 2 === rings.length);
          // the skirt down to the deck, in the cover colour
          m.prism(it.cover ?? it.mat ?? "tank", ngon(16, it.r * 1.02, 0, x(u), 0), it.base ?? c.deck(u) - 0.2, it.y - 0.01, true);
        }
      });
      return;
    }
    case "tanks": {
      m.scope(nm("gas tanks"), () => {
        const pitch = (it.u[1] - it.u[0]) / Math.max(1, it.n);
        for (let k = 0; k < it.n; k++) {
          const u0 = it.u[0] + pitch * k + 0.4;
          const u1 = u0 + pitch - 0.8;
          for (const z of it.z ?? [0]) spindle(m, it.mat ?? "tank", z, it.y, [[x(u0), 0.05, 0.05], [x(u0 + it.r * 0.3), it.r * 0.9, it.r * 0.9], [x(u0 + it.r * 0.8), it.r, it.r], [x(u1 - it.r * 0.8), it.r, it.r], [x(u1 - it.r * 0.3), it.r * 0.9, it.r * 0.9], [x(u1), 0.05, 0.05]], 10);
        }
      });
      return;
    }
    case "pipes": {
      m.scope(nm("deck piping"), () => {
        for (const z of it.z) m.rod(it.mat ?? "steel", [x(it.u[0]), it.y, z], [x(it.u[1]), it.y, z], it.r, 5);
      });
      return;
    }
    case "helideck": {
      m.scope(nm("helideck"), () => {
        const ring = ngon(8, it.r, Math.PI / 8, x(it.u), it.z ?? 0);
        m.prism("green", ring, it.y, it.y + 0.25);
        // the H, 3 cm above the deck
        const hx = x(it.u);
        const hz = it.z ?? 0;
        const s = it.r * 0.35;
        const yy = it.y + 0.28;
        for (const dz of [-s * 0.6, s * 0.6]) m.facets("white", [[hx - s, yy, hz + dz - s * 0.12], [hx + s, yy, hz + dz - s * 0.12], [hx + s, yy, hz + dz + s * 0.12], [hx - s, yy, hz + dz - s * 0.12], [hx + s, yy, hz + dz + s * 0.12], [hx - s, yy, hz + dz + s * 0.12]], [0, 1, 0]);
        m.facets("white", [[hx - s * 0.1, yy, hz - s * 0.48], [hx + s * 0.1, yy, hz - s * 0.48], [hx + s * 0.1, yy, hz + s * 0.48], [hx - s * 0.1, yy, hz - s * 0.48], [hx + s * 0.1, yy, hz + s * 0.48], [hx - s * 0.1, yy, hz + s * 0.48]], [0, 1, 0]);
        for (let k = 0; k < (it.legs ?? 0); k++) {
          const a = (k / (it.legs ?? 1)) * Math.PI * 2;
          m.rod("steel", [hx + Math.cos(a) * it.r * 0.7, it.y, hz + Math.sin(a) * it.r * 0.7], [hx + Math.cos(a) * it.r * 0.3, c.deck(it.u) - 0.1, hz + Math.sin(a) * it.r * 0.3], 0.15, 4);
        }
      });
      return;
    }
    case "gantry": {
      m.scope(nm("gantry"), () => {
        const t = it.t ?? Math.max(0.3, it.h * 0.06);
        const mat = it.mat ?? "orange";
        const lean = it.lean ?? 0;
        for (const side of [1, -1]) m.rod(mat, [x(it.u), it.y, side * it.hw], [x(it.u) - lean, it.y + it.h - t, side * it.hw], t * 0.6, 6);
        m.box(mat, x(it.u) - lean, 0, t * 1.4, it.hw * 2 + t * 1.2, it.y + it.h - t, it.y + it.h);
      });
      return;
    }
    case "boom":
      m.scope(nm("boom"), () => m.rod(it.mat ?? "steel", [x(it.a[0]), it.a[1], it.a[2]], [x(it.b[0]), it.b[1], it.b[2]], it.w, 6));
      return;
    case "boats": {
      m.scope(nm("boats"), () => {
        for (const u of it.at) {
          for (const side of [1, -1]) {
            spindle(m, it.mat ?? "boat", side * it.z, it.y, [
              [x(u - it.len / 2), it.r * 0.25, it.r * 0.4], [x(u - it.len * 0.38), it.r * 0.8, it.r * 0.95], [x(u - it.len * 0.2), it.r, it.r * 1.1],
              [x(u + it.len * 0.2), it.r, it.r * 1.1], [x(u + it.len * 0.38), it.r * 0.8, it.r * 0.95], [x(u + it.len / 2), it.r * 0.25, it.r * 0.4],
            ], 8);
          }
        }
      });
      return;
    }
    case "canopy": {
      m.scope(nm("canopy"), () => {
        const sec: Ring = [];
        const n = 8;
        for (let k = 0; k <= n; k++) {
          const a = (k / n) * Math.PI;
          sec.push([Math.cos(a) * it.hw, it.y + Math.sin(a) * it.h]);
        }
        m.sweep(it.mat, "x", sec, x(it.u[0]), sec, x(it.u[1]), true);
        if (it.posts) for (const u of [it.u[0] + 0.15, it.u[1] - 0.15]) for (const sd of [1, -1]) m.box(it.posts, x(u), sd * (it.hw - 0.12), 0.12, 0.12, c.deck(u) - 0.05, it.y - 0.01);
      });
      return;
    }
    case "paddle": {
      m.scope(nm("paddle wheel"), () => {
        const mat = it.mat ?? "red";
        const xc = x(it.u);
        const zs = it.stern ? [-it.w / 2, it.w / 2] : [it.z - it.w / 2, it.z + it.w / 2, -it.z - it.w / 2, -it.z + it.w / 2];
        // the rims
        for (const z of zs) m.tube(mat, "z", xc, it.y, it.r, it.r * 0.9, z - 0.08, z + 0.08, 16);
        // the floats, across each wheel
        const pairs = it.stern ? [[-it.w / 2, it.w / 2]] : [[it.z - it.w / 2, it.z + it.w / 2], [-it.z - it.w / 2, -it.z + it.w / 2]];
        for (const [za, zb] of pairs) {
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            const p0: Vec3 = [xc + Math.cos(a) * it.r * 0.55, it.y + Math.sin(a) * it.r * 0.55, za!];
            const p1: Vec3 = [xc + Math.cos(a) * it.r * 0.97, it.y + Math.sin(a) * it.r * 0.97, za!];
            const t = it.r * 0.03;
            m.slab("wood", [[p0[0] - Math.sin(a) * t, p0[1] + Math.cos(a) * t, za!], [p1[0] - Math.sin(a) * t, p1[1] + Math.cos(a) * t, za!], [p1[0] + Math.sin(a) * t, p1[1] - Math.cos(a) * t, za!], [p0[0] + Math.sin(a) * t, p0[1] - Math.cos(a) * t, za!]], [0, 0, zb! - za!]);
          }
          m.rod("steel", [xc, it.y, za! - 0.1], [xc, it.y, zb! + 0.1], it.r * 0.06, 6);
        }
        if (it.box) {
          // the paddle boxes: half drums over the wheels' upper halves
          const sec: Ring = [];
          for (let k = 0; k <= 8; k++) {
            const a = (k / 8) * Math.PI;
            sec.push([xc + Math.cos(a) * it.r * 1.12, it.y + Math.sin(a) * it.r * 1.12]);
          }
          for (const [za, zb] of pairs) m.sweep(it.box, "z", sec, za! - 0.15, sec, zb! + 0.15, true);
        }
      });
      return;
    }
    case "foil": {
      m.scope(nm("foil"), () => {
        const mat = it.mat ?? "steel";
        const xc = x(it.u);
        const inner = it.inner ?? it.span * 0.5;
        const t = Math.max(0.08, it.chord * 0.08);
        const pts: Array<[number, number]> = [[-it.span, it.y + it.span * 0.12], [-inner, it.y], [inner, it.y], [it.span, it.y + it.span * 0.12]];
        for (let k = 0; k + 1 < pts.length; k++) {
          const [za, ya] = pts[k]!;
          const [zb, yb] = pts[k + 1]!;
          m.slab(mat, [[xc - it.chord / 2, ya, za], [xc + it.chord / 2, ya, za], [xc + it.chord / 2, yb, zb], [xc - it.chord / 2, yb, zb]], [0, t, 0]);
        }
        for (const z of [-inner * 0.9, inner * 0.9]) m.box(mat, xc, z, it.chord * 0.5, 0.12, it.y + t, it.y + it.strut);
      });
      return;
    }
    case "skirt": {
      m.scope(nm("skirt"), () => {
        const mat = it.mat ?? "skirt";
        const xc = x((it.u[0] + it.u[1]) / 2);
        const lx = it.u[1] - it.u[0];
        const lo = chamferedRect(lx - 0.8, it.hw * 2 - 0.8, it.c * 0.9, xc, 0);
        const hi = chamferedRect(lx, it.hw * 2, it.c, xc, 0);
        m.loft(mat, lo, 0, hi, it.h * 0.6, false);
        m.loft(mat, hi, it.h * 0.6, chamferedRect(lx - 0.4, it.hw * 2 - 0.4, it.c, xc, 0), it.h, true);
        m.cap(mat, lo, 0, false);
      });
      return;
    }
    case "prop": {
      m.scope(nm("air propeller"), () => {
        const mat = it.mat ?? "grey";
        const xc = x(it.u);
        if (it.pylon) m.box("white", xc + 0.3, it.z, 1.2, 0.6, it.y - it.pylon, it.y - it.r * 0.1);
        m.rod(mat, [xc - 0.4, it.y, it.z], [xc + 0.6, it.y, it.z], 0.35, 8);
        const n = it.blades ?? 4;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + 0.3;
          const tip: [number, number] = [it.y + Math.sin(a) * it.r, it.z + Math.cos(a) * it.r];
          const w = it.r * 0.08;
          m.slab(mat, [[xc - 0.45, it.y + Math.cos(a) * w, it.z - Math.sin(a) * w], [xc - 0.45, tip[0] + Math.cos(a) * w, tip[1] - Math.sin(a) * w], [xc - 0.45, tip[0] - Math.cos(a) * w, tip[1] + Math.sin(a) * w], [xc - 0.45, it.y - Math.cos(a) * w, it.z + Math.sin(a) * w]], [0.08, 0, 0]);
        }
      });
      return;
    }
    case "plate":
      m.scope(nm("plate"), () => m.slab(it.mat, it.pts.map(([u, y]): Vec3 => [x(u), y, it.z - it.t / 2]), [0, 0, it.t]));
      return;
    case "portholes": {
      m.scope(nm("portholes"), () => {
        for (const side of [1, -1]) {
          const batch = new TriBatch();
          for (const u of spaced(it.u[0], it.u[1], it.pitch)) {
            const z = side * (c.side(u, it.y) + 0.03);
            const ring = ngon(6, it.r, 0, x(u), it.y);
            for (let k = 1; k + 1 < ring.length; k++) batch.add([ring[0]![0], ring[0]![1], z], [ring[k]![0], ring[k]![1], z], [ring[k + 1]![0], ring[k + 1]![1], z], [0, 0, side]);
          }
          batch.draw(m, it.mat ?? "glass");
        }
      });
      return;
    }
    case "rig": drawRig(c, it); return;
    case "bulwark": {
      m.scope(nm("bulwark"), () => {
        const t = it.t ?? 0.25;
        const us = [...new Set([...spaced(it.u[0], Math.min(c.L, it.u[1]), Math.max(1, Math.min(6, (it.u[1] - it.u[0]) / 24))), ...(c.hull?.stations ?? []).filter((v) => v > it.u[0] && v < Math.min(c.L, it.u[1]))].map((v) => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
        for (const side of [1, -1]) {
          const out = new TriBatch();
          const inn = new TriBatch();
          const top = new TriBatch();
          const pts = us.map((u) => {
            const yd = c.deck(u);
            const zo = Math.max(0, c.side(u, yd) - 0.01);
            return { x: x(u), yd, zo: side * zo, zi: side * Math.max(0, zo - t) };
          });
          for (let k = 0; k + 1 < pts.length; k++) {
            const a = pts[k]!;
            const b = pts[k + 1]!;
            out.quad([a.x, a.yd - 0.05, a.zo], [b.x, b.yd - 0.05, b.zo], [b.x, b.yd + it.h, b.zo], [a.x, a.yd + it.h, a.zo], [0, 0, side]);
            // at a pointed bow both sides meet: no inner face on the centreline
            if (Math.abs(a.zi) > 1e-3 || Math.abs(b.zi) > 1e-3) inn.quad([a.x, a.yd - 0.05, a.zi], [b.x, b.yd - 0.05, b.zi], [b.x, b.yd + it.h, b.zi], [a.x, a.yd + it.h, a.zi], [0, 0, -side]);
            top.quad([a.x, a.yd + it.h, a.zi], [b.x, b.yd + it.h, b.zi], [b.x, b.yd + it.h, b.zo], [a.x, a.yd + it.h, a.zo], [0, 1, 0]);
          }
          out.draw(m, it.mat ?? "hull");
          inn.draw(m, it.mat ?? "hull");
          top.draw(m, it.mat ?? "hull");
        }
      });
      return;
    }
    case "anchors": {
      m.scope(nm("anchors"), () => {
        const s = it.s;
        for (const side of [1, -1]) {
          // a decal on the hull: each corner at the hull's side there, `off` proud of it
          const decal = (mat: string, off: number, pts: ReadonlyArray<readonly [number, number]>): void => {
            const batch = new TriBatch();
            const P = ([u, y]: readonly [number, number]): Vec3 => [x(u), y, side * (c.side(u, y) + off)];
            for (let k = 1; k + 1 < pts.length; k++) batch.add(P(pts[0]!), P(pts[k]!), P(pts[k + 1]!), [0, 0, side]);
            batch.draw(m, mat);
          };
          const u = it.u;
          const y = it.y;
          decal("black", 0.05, [[u - s * 0.45, y - s * 0.15], [u + s * 0.45, y - s * 0.15], [u + s * 0.5, y + s * 0.5], [u - s * 0.4, y + s * 0.5]]);
          decal(it.mat ?? "black", 0.14, [[u - s * 0.06, y + s * 0.35], [u + s * 0.06, y + s * 0.35], [u + s * 0.06, y - s * 0.55], [u - s * 0.06, y - s * 0.55]]);
          decal(it.mat ?? "black", 0.14, [[u - s * 0.4, y - s * 0.45], [u + s * 0.4, y - s * 0.45], [u + s * 0.16, y - s * 0.72], [u - s * 0.16, y - s * 0.72]]);
        }
      });
      return;
    }
    case "mooring": {
      m.scope(nm("mooring gear"), () => {
        const s = it.s ?? 1;
        const mat = it.mat ?? "black";
        for (const u of it.at) {
          const y = c.deck(u);
          const hw = Math.min(it.hw, c.side(u, y) - 0.8 * s);
          for (const side of [1, -1]) {
            for (const du of [-0.6 * s, 0.6 * s]) m.prism(mat, ngon(8, 0.28 * s, 0, x(u + du), side * hw), y - 0.05, y + 0.7 * s);
            m.box(mat, x(u), side * hw, 1.9 * s, 0.5 * s, y - 0.05, y + 0.15 * s, 0, true);
            if (it.winch) {
              const zw = side * Math.max(0.8 * s, hw * 0.45);
              m.box("steel", x(u - 1.6 * s), zw, 1.4 * s, 2.2 * s, y - 0.05, y + 0.7 * s);
              m.rod("red", [x(u - 1.6 * s), y + 1.1 * s, zw - 1.2 * s], [x(u - 1.6 * s), y + 1.1 * s, zw + 1.2 * s], 0.55 * s, 8);
            }
          }
        }
      });
      return;
    }
    case "catwalk": {
      m.scope(nm("catwalk"), () => {
        const mat = it.mat ?? "steel";
        const w = it.w ?? 1.2;
        const z = it.z ?? 0;
        const xa = x(it.u[0]);
        const xb = x(it.u[1]);
        m.box(mat, (xa + xb) / 2, z, xb - xa, w, it.y - 0.15, it.y);
        for (const sd of [1, -1]) m.box(mat, (xa + xb) / 2, z + sd * (w / 2 - 0.04), xb - xa, 0.08, it.y + 0.95, it.y + 1.05);
        for (const u of spaced(it.u[0] + 0.5, it.u[1] - 0.5, it.pitch ?? 8)) m.box(mat, x(u), z, 0.3, 0.3, c.deck(u) - 0.05, it.y - 0.15, 0, false);
      });
      return;
    }
    case "vents": {
      m.scope(nm("ventilators"), () => {
        const mat = it.mat ?? "white";
        for (const [u, z] of it.at) {
          const y = it.y ?? c.deck(u);
          m.prism(mat, ngon(8, it.r, 0, x(u), z), y - 0.05, y + it.h, !it.cowl);
          if (it.cowl) {
            // the cowl: a bell turned to face forward, its mouth dark
            const hy = y + it.h + it.r * 0.9;
            m.rod(mat, [x(u - it.r * 0.6), hy, z], [x(u + it.r * 1.1), hy, z], it.r * 1.5, 8);
            m.facets("black", ngon(8, it.r * 1.2, 0, 0, 0).flatMap((p, k, ring): Vec3[] => {
              const q = ring[(k + 1) % ring.length]!;
              return [[x(u + it.r * 1.1) + 0.02, hy, z], [x(u + it.r * 1.1) + 0.02, hy + p[0], z + p[1]], [x(u + it.r * 1.1) + 0.02, hy + q[0], z + q[1]]];
            }), [1, 0, 0]);
          } else {
            m.prism(mat, ngon(8, it.r * 1.8, 0, x(u), z), y + it.h, y + it.h + it.r * 0.7);
          }
        }
      });
      return;
    }
    case "freefall": {
      m.scope(nm("freefall lifeboat"), () => {
        const mat = it.mat ?? "boat";
        const r = it.r ?? it.len * 0.17;
        const a = it.tilt ?? 0.55;
        // the boat's axis points aft and down its launch ramp; rings square to it
        const d: Vec3 = [-Math.cos(a), -Math.sin(a), 0];
        const n: Vec3 = [-Math.sin(a), Math.cos(a), 0];
        const C: Vec3 = [x(it.u), it.y + r, 0];
        const st: Array<readonly [number, number, number]> = [[-0.5, 0.25, 0.6], [-0.42, 0.85, 1], [-0.2, 1, 1.15], [0.2, 1, 1.15], [0.4, 0.8, 1], [0.5, 0.15, 0.3]];
        const ring = ([t, rz, ry]: readonly [number, number, number]): Vec3[] => Array.from({ length: 8 }, (_, k) => {
          const f = (k / 8) * Math.PI * 2;
          const o: Vec3 = [C[0] + d[0] * t * it.len, C[1] + d[1] * t * it.len, C[2]];
          const cy = Math.sin(f) * r * ry;
          const cz = Math.cos(f) * r * rz;
          return [o[0] + n[0] * cy, o[1] + n[1] * cy, o[2] + cz];
        });
        const rings = st.map(ring);
        const batch = new TriBatch();
        for (let i = 0; i + 1 < rings.length; i++) {
          const ra = rings[i]!;
          const rb = rings[i + 1]!;
          const mid: Vec3 = [C[0] + d[0] * (st[i]![0] + st[i + 1]![0]) * 0.5 * it.len, C[1] + d[1] * (st[i]![0] + st[i + 1]![0]) * 0.5 * it.len, 0];
          for (let k = 0; k < 8; k++) {
            const j = (k + 1) % 8;
            const pc: Vec3 = [(ra[k]![0] + rb[j]![0]) / 2 - mid[0], (ra[k]![1] + rb[j]![1]) / 2 - mid[1], (ra[k]![2] + rb[j]![2]) / 2];
            batch.quad(ra[k]!, ra[j]!, rb[j]!, rb[k]!, pc);
          }
        }
        for (const [i, dir] of [[0, -1], [rings.length - 1, 1]] as const) {
          const rr = rings[i]!;
          for (let k = 1; k + 1 < 8; k++) batch.add(rr[0]!, rr[k]!, rr[k + 1]!, [d[0] * dir, d[1] * dir, 0]);
        }
        batch.draw(m, mat);
        // the ramp under it: two rails and their frame
        for (const sd of [1, -1]) m.rod("steel", [C[0] - d[0] * it.len * 0.45 - n[0] * r, C[1] - d[1] * it.len * 0.45 - n[1] * r, sd * r * 0.7], [C[0] + d[0] * it.len * 0.55 - n[0] * r, C[1] + d[1] * it.len * 0.55 - n[1] * r, sd * r * 0.7], 0.12, 4);
        m.box("steel", C[0] - d[0] * it.len * 0.45, 0, 0.4, r * 1.8, it.y - 0.05, C[1] - d[1] * it.len * 0.45 - n[1] * r);
      });
      return;
    }
    case "fender": {
      m.scope(nm("fender"), () => {
        const [ya, yb] = it.y;
        const ym = (ya + yb) / 2;
        const hi = Math.min(c.L, it.u[1]);
        const us = [...new Set([...spaced(it.u[0], hi, Math.max(0.5, Math.min(4, (hi - it.u[0]) / 24))), ...(c.hull?.stations ?? []).filter((v) => v > it.u[0] && v < hi)].map((v) => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
        for (const side of [1, -1]) {
          const face = new TriBatch();
          const top = new TriBatch();
          const bot = new TriBatch();
          const pts = us.map((u) => {
            const zi = c.side(u, ym);
            return { x: x(u), zi: side * Math.max(0, zi - 0.05), zo: side * (zi + it.out) };
          });
          for (let k = 0; k + 1 < pts.length; k++) {
            const a = pts[k]!;
            const b = pts[k + 1]!;
            face.quad([a.x, ya, a.zo], [b.x, ya, b.zo], [b.x, yb, b.zo], [a.x, yb, a.zo], [0, 0, side]);
            top.quad([a.x, yb, a.zi], [b.x, yb, b.zi], [b.x, yb, b.zo], [a.x, yb, a.zo], [0, 1, 0]);
            bot.quad([a.x, ya, a.zi], [b.x, ya, b.zi], [b.x, ya, b.zo], [a.x, ya, a.zo], [0, -1, 0]);
          }
          for (const bt of [face, top, bot]) bt.draw(m, it.mat ?? "skirt");
        }
      });
      return;
    }
    case "strakes": {
      m.scope(nm("strakes"), () => {
        const w = it.w ?? 0.06;
        const hi = Math.min(c.L, it.u[1]);
        const us = [...new Set([...spaced(it.u[0], hi, Math.max(0.3, (hi - it.u[0]) / 16)), ...(c.hull?.stations ?? []).filter((v) => v > it.u[0] && v < hi)].map((v) => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
        for (const side of [1, -1]) {
          const batch = new TriBatch();
          const P = (u: number, y: number): Vec3 => [x(u), y, side * (c.side(u, y) + 0.02)];
          for (const y of it.y) {
            for (let k = 0; k + 1 < us.length; k++) {
              const a = us[k]!;
              const b = us[k + 1]!;
              if (c.side(a, y) < 0.05 || c.side(b, y) < 0.05) continue;
              batch.quad(P(a, y - w / 2), P(b, y - w / 2), P(b, y + w / 2), P(a, y + w / 2), [0, 0, side]);
            }
          }
          batch.draw(m, it.mat ?? "black");
        }
      });
      return;
    }
    case "marks": {
      m.scope(nm("hull marks"), () => {
        const mat = it.mat ?? "white";
        const s = it.s ?? 0.6;
        const step = it.step ?? 1;
        for (const side of [1, -1]) {
          const batch = new TriBatch();
          const P = (u: number, y: number): Vec3 => [x(u), y, side * (c.side(u, y) + 0.05)];
          const quad = (u0: number, u1: number, y0: number, y1: number): void => batch.quad(P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1), [0, 0, side]);
          // the draft marks: a tick each `step` metres, every other one longer
          for (const u of it.at) {
            for (let k = 0, y = it.y[0]; y <= it.y[1] + 1e-6; k++, y += step) quad(u - s * (k % 2 ? 0.5 : 1), u + s * 0.15, y, y + step * 0.18);
            quad(u - s * 0.05, u + s * 0.15, it.y[0], it.y[1] + step * 0.18);
          }
          // the bow thruster sign: a ring with a cross
          if (it.thruster !== undefined) {
            const r = s * 2.2;
            const yc = (it.y[0] + it.y[1]) / 2 + 0.5;
            const u = it.thruster;
            for (let k = 0; k < 10; k++) {
              const a = (k / 10) * Math.PI * 2;
              const b = ((k + 1) / 10) * Math.PI * 2;
              batch.quad(P(u + Math.cos(a) * r, yc + Math.sin(a) * r), P(u + Math.cos(b) * r, yc + Math.sin(b) * r), P(u + Math.cos(b) * r * 0.8, yc + Math.sin(b) * r * 0.8), P(u + Math.cos(a) * r * 0.8, yc + Math.sin(a) * r * 0.8), [0, 0, side]);
            }
            if (it.eye) {
              // a painted eye: the ring filled, its pupil dark, a little proud of it
              for (let k = 0; k < 10; k++) {
                const a = (k / 10) * Math.PI * 2;
                const b = ((k + 1) / 10) * Math.PI * 2;
                batch.add(P(u, yc), P(u + Math.cos(a) * r * 0.8, yc + Math.sin(a) * r * 0.8), P(u + Math.cos(b) * r * 0.8, yc + Math.sin(b) * r * 0.8), [0, 0, side]);
              }
              const pupil = new TriBatch();
              const Q = (uu: number, y: number): Vec3 => [x(uu), y, side * (c.side(uu, y) + 0.09)];
              for (let k = 0; k < 8; k++) {
                const a = (k / 8) * Math.PI * 2;
                const b = ((k + 1) / 8) * Math.PI * 2;
                pupil.add(Q(u, yc), Q(u + Math.cos(a) * r * 0.4, yc + Math.sin(a) * r * 0.4), Q(u + Math.cos(b) * r * 0.4, yc + Math.sin(b) * r * 0.4), [0, 0, side]);
              }
              pupil.draw(m, "black");
            } else {
              quad(u - r * 0.8, u + r * 0.8, yc - r * 0.08, yc + r * 0.08);
              quad(u - r * 0.08, u + r * 0.08, yc - r * 0.8, yc - r * 0.08);
              quad(u - r * 0.08, u + r * 0.08, yc + r * 0.08, yc + r * 0.8);
            }
          }
          batch.draw(m, mat);
        }
      });
      return;
    }
    case "lashing": {
      m.scope(nm("lashing bridges"), () => {
        for (const u of it.at) {
          const hw = Math.min(it.hw, fitWidth(c, u - 0.3, u + 0.3, it.y));
          m.box(it.mat ?? "grey", x(u), 0, 0.45, hw * 2, it.y, it.y + it.h);
        }
      });
      return;
    }
    case "rail": {
      m.scope(nm("railing"), () => {
        const h = it.h ?? 1;
        const mat = it.mat ?? "white";
        for (const side of [1, -1]) {
          m.box(mat, x((it.u[0] + it.u[1]) / 2), side * it.hw, it.u[1] - it.u[0], 0.05, it.y + h - 0.05, it.y + h);
          for (const u of spaced(it.u[0], it.u[1], 3)) m.box(mat, x(u), side * it.hw, 0.05, 0.05, it.y, it.y + h - 0.05, 0, false);
        }
      });
      return;
    }
  }
}

// --- sails and rigging ---------------------------------------------------------------

/** A flat sail: a convex polygon of points (u, y, z), fanned, one double-sided face. */
function sailFace(c: ShipCtx, pts: ReadonlyArray<readonly [number, number, number]>, n: Vec3): void {
  const p = pts.map(([u, y, z]): Vec3 => [c.x(u), y, z]);
  const tris: Vec3[] = [];
  for (let k = 1; k + 1 < p.length; k++) tris.push(p[0]!, p[k]!, p[k + 1]!);
  c.m.facets("sail", tris, n);
}

function drawRig(c: ShipCtx, it: Extract<Item, { k: "rig" }>): void {
  const { m, x } = c;
  m.scope(it.name ?? "rig", () => {
    it.masts.forEach((ms, mi) => {
      m.scope(`mast ${mi + 1}`, () => {
        const base = c.deck(ms.u) - 0.1;
        const rake = ms.rake ?? 0;
        const top: Vec3 = [x(ms.u) - rake, ms.y[1], 0];
        m.rod("spar", [x(ms.u), base, 0], top, ms.r, 8);
        const at = (y: number): number => ms.u - rake * ((y - base) / (ms.y[1] - base));
        for (const s of ms.sails) drawSail(c, ms, s, at);
      });
    });
    if (it.bowsprit) {
      const L = c.L;
      const y = c.deck(L);
      m.scope("bowsprit", () => m.rod("spar", [x(L - 1), y, 0], [x(L + it.bowsprit!.len), y + it.bowsprit!.rise, 0], 0.15 + it.bowsprit!.len * 0.01, 6));
    }
    if (it.stays !== false) {
      m.scope("stays", () => {
        // the forestay of each mast to the next forward (the bow for the foremost), the shrouds to the sides
        const masts = [...it.masts].sort((a, b) => a.u - b.u);
        masts.forEach((ms, k) => {
          const top: Vec3 = [x(ms.u) - (ms.rake ?? 0), ms.y[1] - 0.3, 0];
          const nextU = k + 1 < masts.length ? masts[k + 1]!.u : c.L + (it.bowsprit?.len ?? 0);
          const nextY = k + 1 < masts.length ? c.deck(masts[k + 1]!.u) + 1 : c.deck(c.L) + (it.bowsprit?.rise ?? 0);
          m.rod("rope", top, [x(nextU), nextY, 0], 0.04, 3);
          const hw = Math.max(0.3, c.side(ms.u, c.deck(ms.u)) - 0.1);
          for (const sd of [1, -1]) m.rod("rope", [top[0], top[1] - 1, 0], [x(ms.u - Math.min(2, ms.y[1] * 0.08)), c.deck(ms.u), sd * hw], 0.035, 3);
        });
      });
    }
  });
}

function drawSail(c: ShipCtx, ms: Mast, s: Sail, at: (y: number) => number): void {
  const { m, x } = c;
  const [y0, y1] = s.y;
  switch (s.kind) {
    case "square": {
      const [w0, w1] = s.w ?? [4, 3];
      const u0 = at(y0) + ms.r + 0.15;
      const u1 = at(y1) + ms.r + 0.15;
      const belly = (w0 + w1) * 0.06;
      const um = (u0 + u1) / 2 + belly;
      const ym = (y0 + y1) / 2;
      const wm = (w0 + w1) / 2;
      // two panels a side, bellied forward at the middle
      sailFace(c, [[u0, y0, -w0], [u0, y0, 0], [um, ym, 0], [um, ym, -wm]], [1, 0, 0]);
      sailFace(c, [[u0, y0, 0], [u0, y0, w0], [um, ym, wm], [um, ym, 0]], [1, 0, 0]);
      sailFace(c, [[um, ym, -wm], [um, ym, 0], [u1, y1, 0], [u1, y1, -w1]], [1, 0, 0]);
      sailFace(c, [[um, ym, 0], [um, ym, wm], [u1, y1, w1], [u1, y1, 0]], [1, 0, 0]);
      m.rod("spar", [x(u1 - 0.05), y1 + 0.1, -w1 - 0.4], [x(u1 - 0.05), y1 + 0.1, w1 + 0.4], Math.max(0.08, w1 * 0.025), 5);
      return;
    }
    case "gaff": case "bermuda": case "sprit": {
      const len = s.len ?? 6;
      const head = s.kind === "bermuda" ? 0.15 : s.head ?? len * 0.7;
      const ua = at(y0) - ms.r - 0.05;
      const ub = at(y1) - ms.r - 0.05;
      const peak = s.kind === "gaff" ? y1 + head * 0.45 : s.kind === "sprit" ? y1 + head * 0.25 : y1;
      sailFace(c, [[ua, y0, 0], [ua - len, y0 + 0.2, 0], [ub - head, peak, 0], [ub, y1, 0]], [0, 0, 1]);
      m.rod("spar", [x(ua), y0, 0], [x(ua - len - 0.3), y0 + 0.2, 0], 0.08 + len * 0.006, 5);
      if (s.kind === "gaff") m.rod("spar", [x(ub), y1, 0], [x(ub - head - 0.2), peak + 0.1, 0], 0.07 + head * 0.005, 5);
      if (s.kind === "sprit") m.rod("spar", [x(ua), y0 + 0.4, 0], [x(ub - head - 0.2), peak + 0.1, 0], 0.08 + head * 0.006, 5);
      return;
    }
    case "jib": {
      const tack = s.tack ?? c.L;
      const ub = at(y1);
      const yt = c.deck(Math.min(c.L, tack)) + (tack > c.L ? 0.6 : 0.5);
      sailFace(c, [[tack, yt, 0], [ub + 0.3, y1, 0], [Math.max(ub + 1, tack - (s.len ?? (tack - ub) * 0.65)), y0, 0]], [0, 0, 1]);
      return;
    }
    case "lateen": case "crabclaw": {
      const len = s.len ?? 8;
      const fwd = s.fwd ?? len * 0.45;
      const um = at((y0 + y1) / 2);
      // the yard from the tack forward and low to the peak aft and high
      const tack: [number, number, number] = [um + fwd, y0, 0];
      const peak: [number, number, number] = [um - (len - fwd), y1, 0];
      const clew: [number, number, number] = s.kind === "crabclaw" ? [um - (len - fwd) * 0.95, y0 + (y1 - y0) * 0.35, 0] : [um - (len - fwd) * 0.6, y0, 0];
      sailFace(c, [tack, peak, clew], [0, 0, 1]);
      m.rod("spar", [x(tack[0] + 0.3), tack[1] - 0.15, 0], [x(peak[0] - 0.3), peak[1] + 0.3, 0], 0.08 + len * 0.006, 5);
      if (s.kind === "crabclaw") m.rod("spar", [x(tack[0] + 0.2), tack[1] - 0.1, 0], [x(clew[0] - 0.3), clew[1] - 0.1, 0], 0.07 + len * 0.005, 5);
      return;
    }
    case "junk": {
      const len = s.len ?? 6;
      const fwd = len * 0.22;
      const ua = at(y0);
      const battens = 6;
      const pts: Array<[number, number]> = [];
      for (let k = 0; k <= battens; k++) {
        const t = k / battens;
        const y = y0 + (y1 - y0) * t;
        // a fan: the leech curving out aft as it rises
        pts.push([ua - (len - fwd) * (0.85 + 0.3 * Math.sin(t * Math.PI * 0.8)), y]);
      }
      const luff = (t: number): number => ua + fwd * (1 - 0.3 * t);
      for (let k = 0; k < battens; k++) {
        const t0 = k / battens;
        const t1 = (k + 1) / battens;
        const ya = pts[k]![1];
        const yb = pts[k + 1]![1];
        sailFace(c, [[luff(t0), ya, 0], [pts[k]![0], ya, 0], [pts[k + 1]![0], yb, 0], [luff(t1), yb, 0]], [0, 0, 1]);
        m.rod("spar", [x(luff(t1) + 0.1), yb, 0.05], [x(pts[k + 1]![0] - 0.1), yb, 0.05], 0.05 + len * 0.003, 3);
      }
      return;
    }
  }
}

// --- the builds ----------------------------------------------------------------------

/** Builds a ship from its spec. */
export function worldShip(s: ShipSpec): MeshBuilder {
  const m = new MeshBuilder(shipPalette(s.livery));
  const c = ctxOf(m, s);
  drawHull(c);
  m.scope("deck furniture", () => s.items.forEach((it, i) => drawItem(c, it, i)));
  return m;
}

// --- the distant model ---------------------------------------------------------------

interface LodPrim { tris: number; weight: number; draw: (m: MeshBuilder) => void }

/** How far the block being drawn is drawn in from its edges (and up at its top): a part's own few centimetres, so no two parts' faces share a plane. */
let lodInset = 0;

/** A box from afar: four walls and a top, no bottom (10 triangles). */
function lodBox(m: MeshBuilder, mat: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number): void {
  const d = Math.min(lodInset, (x1 - x0) / 4, (z1 - z0) / 4);
  [x0, x1, z0, z1, y1] = [x0 + d, x1 - d, z0 + d, z1 - d, y1 + d / 2];
  const P = (x: number, y: number, z: number): Vec3 => [x, y, z];
  lodPolygon(m, mat, [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], [0, 0, -1]);
  lodPolygon(m, mat, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], [0, 0, 1]);
  lodPolygon(m, mat, [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], [-1, 0, 0]);
  lodPolygon(m, mat, [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], [1, 0, 0]);
  lodPolygon(m, mat, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], [0, 1, 0]);
}

/** The hull from afar: plan rings at the keel, the waterline and the deck, in the bottom and hull colours. */
function lodHull(c: ShipCtx): LodPrim[] {
  const hull = c.hull!;
  const f = hull.form;
  const L = c.L;
  const entry = f.entry ?? BOW[f.bow].entry;
  const run = f.run ?? STERN[f.stern].run;
  const us = [0, L * run, L * (1 - entry), L * (1 - entry * 0.45), L];
  const deckY = Math.min(...hull.stations.map(hull.deck));
  const ring = (y: number, zc: number): Array<[number, number]> => {
    const pts: Array<[number, number]> = [];
    const hb = (u: number): number => (u >= L - 1e-6 && f.bow !== "barge" ? 0 : u <= 1e-6 && f.stern === "canoe" ? 0 : hull.halfBeam(u, Math.max(y, hull.keel(u) + 0.05)));
    for (const u of us) if (hb(u) > 1e-3) pts.push([c.x(u), zc + hb(u)]);
    if (hb(L) <= 1e-3) pts.push([c.x(L), zc]);
    for (const u of [...us].reverse()) if (hb(u) > 1e-3) pts.push([c.x(u), zc - hb(u)]);
    if (hb(0) <= 1e-3) pts.push([c.x(0), zc]);
    return orientLod(pts);
  };
  return hull.centres.map((zc) => ({
    tris: 1000, weight: Infinity,
    draw: (m: MeshBuilder) => m.scope("hull", () => lodStack(m, [f.lift ?? 0, f.draft, deckY].map((y) => [y, ring(y, zc)] as const), ["bottom", "hull"], "deck")),
  }));
}

function orientLod(ring: Array<[number, number]>): Array<[number, number]> {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i]!;
    const [x1, z1] = ring[(i + 1) % ring.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a > 0 ? [...ring].reverse() : ring;
}

/** An item from afar, or none: a box, a bar or a flat face, weighed by its size. */
function lodItem(c: ShipCtx, it: Item): LodPrim[] {
  const { x } = c;
  const box = (mat: string, u0: number, u1: number, z0: number, z1: number, y0: number, y1: number): LodPrim => ({
    tris: 10, weight: (u1 - u0) * (z1 - z0) * (y1 - y0),
    draw: (m) => m.scope("block", () => lodBox(m, mat, x(u0), x(u1), z0, z1, y0, y1)),
  });
  const bar = (mat: string, a: Vec3, b: Vec3, r: number): LodPrim => ({
    tris: 6, weight: Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * r * r * 4,
    draw: (m) => m.scope("bar", () => lodBar(m, mat, [x(a[0]), a[1], a[2]], [x(b[0]), b[1], b[2]], r, 3)),
  });
  switch (it.k) {
    case "tier": {
      const w = tierWidth(c, it);
      const hw = Math.max(0.2, w((it.u[0] + it.u[1]) / 2));
      return [box(it.mat ?? "house", it.u[0] + (it.round?.[0] ?? 0) * 0.3, it.u[1] - (it.round?.[1] ?? 0) * 0.3, -hw, hw, it.y[0], it.y[1])];
    }
    case "box": return [box(it.mat, it.u[0], it.u[1], it.z[0], it.z[1], it.y[0], it.y[1])];
    case "cyl": return [box(it.mat, it.u - it.r, it.u + it.r, (it.z ?? 0) - it.r, (it.z ?? 0) + it.r, it.y[0], it.y[1])];
    case "funnel": {
      const z = it.z ?? 0;
      return [box(it.bands[0]![0], it.u[0] - (it.rake ?? 0) * 0.5, it.u[1] - (it.rake ?? 0) * 0.5, z - it.hw, z + it.hw, it.y[0], it.y[1])];
    }
    case "mast": return [bar(it.mat ?? "mast", [it.u, it.y[0], it.z ?? 0], [it.u, it.y[1], it.z ?? 0], Math.max(0.3, (it.r ?? 0.2) * 1.5))];
    case "crane": {
      const ped = Math.max(0.6, it.jib * 0.06);
      return [box(it.mat ?? "crane", it.u - ped, it.u + ped, it.z - ped, it.z + ped, it.y, it.y + it.h + ped * 2)];
    }
    case "derrick": return [bar(it.mat ?? "mast", [it.u, it.y, 0], [it.u, it.y + it.h, 0], Math.max(0.3, it.h * 0.03))];
    case "hatches": {
      const hw = Math.min(it.hw, fitWidth(c, it.u[0], it.u[1], it.y));
      return [box(it.mat ?? "hatch", it.u[0], it.u[1], -hw, hw, it.y, it.y + it.h)];
    }
    case "containers": {
      const hw = Math.min(it.hw, fitWidth(c, it.u[0], it.u[1], it.y));
      return [box("c1", it.u[0], it.u[1], -hw, hw, it.y, it.y + it.tiers * 2.6)];
    }
    case "domes": return [box(it.mat ?? "tank", it.u[0] - it.r, it.u[1] + it.r, (it.z ?? 0) - it.r, (it.z ?? 0) + it.r, it.y, it.y + it.h)];
    case "spheres": {
      // each tank a square frustum: its equator up to a top half as wide
      const pitch = (it.u[1] - it.u[0]) / Math.max(1, it.n);
      return Array.from({ length: it.n }, (_, k): LodPrim => {
        const xc = x(it.u[0] + pitch * (k + 0.5));
        const sq = (r: number): Array<[number, number]> => [[xc + r, 0], [xc, r], [xc - r, 0], [xc, -r]];
        return {
          tris: 10, weight: it.r * it.r * it.r * 3,
          draw: (m) => m.scope("tank", () => lodStack(m, [[it.y - it.r * 0.3, sq(it.r * 1.1)], [it.y + it.r * 0.9, sq(it.r * 0.45)]], [it.mat ?? "tank"], it.mat ?? "tank")),
        };
      });
    }
    case "tanks": {
      const zs = it.z ?? [0];
      return [box(it.mat ?? "tank", it.u[0], it.u[1], Math.min(...zs) - it.r, Math.max(...zs) + it.r, it.y - it.r, it.y + it.r)];
    }
    case "helideck": return [box("green", it.u - it.r, it.u + it.r, (it.z ?? 0) - it.r, (it.z ?? 0) + it.r, it.y, it.y + 0.25)];
    case "gantry": return [box(it.mat ?? "orange", it.u - 0.5, it.u + 0.5, -it.hw, it.hw, it.y + it.h - 1, it.y + it.h)];
    case "boom": return [bar(it.mat ?? "steel", it.a, it.b, it.w)];
    case "canopy": return [box(it.mat, it.u[0], it.u[1], -it.hw, it.hw, it.y, it.y + it.h * 0.8)];
    case "paddle": {
      const z0 = it.stern ? -it.w / 2 : it.z - it.w / 2;
      const z1 = it.stern ? it.w / 2 : it.z + it.w / 2;
      const prims = [box(it.box ?? it.mat ?? "red", it.u - it.r, it.u + it.r, z0, z1, it.y - it.r * 0.6, it.y + it.r)];
      if (!it.stern) prims.push(box(it.box ?? it.mat ?? "red", it.u - it.r, it.u + it.r, -z1, -z0, it.y - it.r * 0.6, it.y + it.r));
      return prims;
    }
    case "skirt": return [];
    case "rig": {
      const out: LodPrim[] = [];
      for (const ms of it.masts) {
        out.push(bar("spar", [ms.u, c.deck(ms.u), 0], [ms.u, ms.y[1], 0], Math.max(0.2, ms.r * 1.5)));
        const sq = ms.sails.filter((s) => s.kind === "square");
        if (sq.length) {
          const y0 = Math.min(...sq.map((s) => s.y[0]));
          const y1 = Math.max(...sq.map((s) => s.y[1]));
          const w0 = Math.max(...sq.map((s) => s.w?.[0] ?? 4));
          const w1 = Math.min(...sq.map((s) => s.w?.[1] ?? 3));
          const u = ms.u + ms.r + 0.4;
          out.push({ tris: 2, weight: (y1 - y0) * (w0 + w1) * 2, draw: (m) => m.scope("sails", () => lodPolygon(m, "sail", [[x(u), y0, -w0], [x(u), y0, w0], [x(u), y1, w1], [x(u), y1, -w1]], [1, 0, 0])) });
        }
        for (const s of ms.sails.filter((q) => q.kind !== "square")) {
          const len = s.len ?? 6;
          const ua = s.kind === "jib" ? (s.tack ?? c.L) : ms.u + (s.kind === "lateen" || s.kind === "crabclaw" ? (s.fwd ?? len * 0.45) : 0);
          const ub = s.kind === "jib" ? ms.u + 0.4 : ua - len;
          out.push({
            tris: 1, weight: (s.y[1] - s.y[0]) * len * 0.5,
            draw: (m) => m.scope("sails", () => lodPolygon(m, "sail", [[x(ua), s.y[0], 0.02], [x(ub), s.y[0] + 0.2, 0.02], [x(s.kind === "jib" ? ms.u + 0.4 : (ua + ub) / 2), s.y[1], 0.02]], [0, 0, 1])),
          });
        }
      }
      return out;
    }
    default: return [];
  }
}

/**
 * The items as the distant model draws them: a stack of tiers (each standing on
 * the one below and overlapping it by half) as one block of the stack's middle
 * plan up to its top; hatch covers under containers are left out.
 */
function lodGroups(c: ShipCtx, items: readonly Item[]): Item[] {
  const out: Item[] = [];
  const stacks: Tier[][] = [];
  for (const it of items) {
    if (it.k === "hatches" && items.some((o) => o.k === "containers" && o.u[0] < it.u[1] && o.u[1] > it.u[0])) continue;
    if (it.k !== "tier") { out.push(it); continue; }
    const st = stacks.find((g) => {
      const top = g[g.length - 1]!;
      const overlap = Math.min(top.u[1], it.u[1]) - Math.max(top.u[0], it.u[0]);
      return Math.abs(top.y[1] - it.y[0]) < 0.6 && overlap > 0.5 * (it.u[1] - it.u[0]) && (top.mat ?? "house") === (it.mat ?? "house");
    });
    if (st) st.push(it);
    else { const g = [it]; stacks.push(g); out.push(it); }
  }
  return out.map((it) => {
    const g = it.k === "tier" ? stacks.find((q) => q[0] === it) : undefined;
    if (!g || g.length === 1) return it;
    const midTier = g[Math.floor((g.length - 1) / 3)]!;
    const w = tierWidth(c, midTier);
    return { ...midTier, y: [g[0]!.y[0], g[g.length - 1]!.y[1]], hw: Math.max(0.2, w((midTier.u[0] + midTier.u[1]) / 2)) } as Tier;
  });
}

/** The ship's distant model: the hull's plan rings, then its largest blocks that fit the budget (lod.ts: 100). */
export function shipLod(s: ShipSpec, budget = 100): MeshBuilder {
  const m = new MeshBuilder({ ...LOD_PALETTE, ...shipPalette(s.livery) });
  const c = ctxOf(m, s);
  let left = budget;
  if (c.hull) {
    for (const h of lodHull(c)) h.draw(m);
    left = budget - m.triangleCount();
  } else {
    const sk = s.items.find((it): it is Extract<Item, { k: "skirt" }> => it.k === "skirt");
    if (sk) {
      m.scope("skirt", () => lodBox(m, sk.mat ?? "skirt", c.x(sk.u[0]), c.x(sk.u[1]), -sk.hw, sk.hw, 0, sk.h));
      left -= 10;
    }
  }
  const prims = lodGroups(c, s.items).flatMap((it) => lodItem(c, it)).map((p, i) => ({ p, i }));
  prims.sort((a, b) => b.p.weight - a.p.weight || a.i - b.i);
  const chosen: number[] = [];
  for (const { p, i } of prims) {
    if (p.tris <= left) { chosen.push(i); left -= p.tris; }
  }
  const set = new Set(chosen);
  m.scope("furniture", () => prims.filter((q) => set.has(q.i)).sort((a, b) => a.i - b.i).forEach(({ p }, k) => m.scope(`part ${k + 1}`, () => { lodInset = 0.02 * (1 + (k % 5)); p.draw(m); })));
  lodInset = 0;
  return m;
}

// --- the kit options -----------------------------------------------------------------

/** The kit options a ship spec uses (worldFleet.ts): its hull form, each furniture kind, each sail kind, each parameter. */
export function shipFeatures(s: ShipSpec, params: readonly string[]): string[] {
  const h = s.hull;
  const out = new Set<string>();
  out.add(`kind:${s.kind}`);
  if (h) {
    out.add(`bow:${h.bow}`);
    out.add(`stern:${h.stern}`);
    out.add(`section:${h.section}`);
    if (h.twin) out.add("twin-hull");
    if (h.forecastle) out.add("forecastle");
    if (h.poop) out.add("poop");
    if (h.stripe) out.add("sheer-stripe");
  } else out.add("hull:none");
  for (const it of s.items) {
    out.add(`item:${it.k}`);
    if (it.k === "tier" && it.wings) out.add("bridge-wings");
    if (it.k === "tier" && it.front) out.add("bridge-front");
    if (it.k === "rig") for (const ms of it.masts) for (const sl of ms.sails) out.add(`sail:${sl.kind}`);
    if (it.k === "paddle") out.add(it.stern ? "paddle:stern" : "paddle:side");
  }
  for (const p of params) out.add(`param:${p}`);
  return [...out].sort();
}
