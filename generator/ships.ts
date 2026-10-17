import { lodBox, lodLoft } from './lodPrimitives.ts';
import { lodBar, lodStack } from './lodAir.ts';
import { lodBlock, LOD_GLASS, LOD_PALETTE, lodPolygon, lodRod } from './lodKit.ts';
// The procedural ships: a Viking Line style cruise ferry, a Soviet Kometa
// hydrofoil and a white lake passenger motor ship, modelled on the photos in
// assets/<folder>/ and reproducing the hand-authored GLBs of the same names in
// the webapp's model database (rail-island-webapp db/ships/glb). See
// docs/models/ships.md.
//
// Each design keeps its reference's axes, bow direction and bounding box,
// because the webapp's ships.meta.json entry (yaw, draftFrac) was measured off
// that model: the cruise ferry and the hydrofoil lie along +X with the bow at
// +X, the passenger ferry along +Z with the bow at +Z; all float with the keel
// (or the foils) on y = 0 and are centred on the beam.
//
// A hull is a set of cross-sections at stations along the length, joined by
// strips of triangles (`hullShell`): each section runs from the keel up to the
// deck edge, cut at the paint lines (boot topping, the hull colour, a sheer
// stripe), so every band is its own material and a waterline is a real edge.
// Superstructure decks are prisms over plan rings that follow the hull; windows
// are flat panes a few centimetres proud of their wall, one source-tree leaf per
// row. Units are metres. The ids are stored in the game's saved maps, so a
// design is never renamed once shipped.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";

const PALETTE: Record<string, MaterialSpec> = {
  // the cruise ferry
  bootTopping: { color: "#2f3338", roughness: 0.7 },
  hullRed: { color: "#c42a1e", roughness: 0.5 },
  whitePaint: { color: "#f2efe8", roughness: 0.6 },
  deckGrey: { color: "#9aa0a2" },
  glassDark: { color: "#232b31", metallic: 0.2, roughness: 0.15 },
  funnelGreen: { color: "#1f7a4d", roughness: 0.5 },
  blackTrim: { color: "#1b1e21" },
  lifeboatOrange: { color: "#e2691f", roughness: 0.5 },
  steelGrey: { color: "#b9bcbd", metallic: 0.2, roughness: 0.5 },
  // the hydrofoil
  signalRed: { color: "#c0202c", roughness: 0.5 },
  hullWhite: { color: "#e9ebe8", roughness: 0.6 },
  foilDeck: { color: "#8d918c" },
  foilGlass: { color: "#22303b", metallic: 0.2, roughness: 0.15 },
  foilBlue: { color: "#2d5ca8", metallic: 0.2, roughness: 0.45 },
  // the passenger ferry
  lakeWhite: { color: "#f3f4f1", roughness: 0.6 },
  bootStripe: { color: "#33413f", roughness: 0.6 },
  lakeSteel: { color: "#b8bcbb", metallic: 0.2, roughness: 0.5 },
  lakeDeck: { color: "#9d9e98" },
  glassTinted: { color: "#30474a", metallic: 0.2, roughness: 0.15 },
  signalGreen: { color: "#3f7d4a", roughness: 0.4 },
};

// --- shared helpers ------------------------------------------------------------------

/** Piecewise-linear interpolation through (x, y) knots sorted by x, clamped at both ends. */
function lerpTable(table: ReadonlyArray<readonly [number, number]>, x: number): number {
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

/** Maps a hull's local (length, height, beam) to the model: the length runs along x or z. */
type Frame = (s: number, y: number, b: number) => Vec3;
const ALONG_X: Frame = (s, y, b) => [s, y, b];
const ALONG_Z: Frame = (s, y, b) => [b, y, s];

const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * A batch of triangles that all face away from the inside of the model, drawn
 * as `facets` (one source-tree leaf): the hint is their average normal, and a
 * triangle that leans too far from it gets a call of its own, so none is ever
 * flipped the wrong way.
 */
class TriBatch {
  private readonly pts: Vec3[] = [];
  private readonly nrm: Vec3[] = [];
  /** Adds triangle a, b, c, wound so that its normal points along `out`. */
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

interface HullBand {
  mat: string;
  /** The band's top at station s (ignored for the last band, which ends at the deck). */
  top?: (s: number) => number;
  /** Where the band is cut between its bottom (0) and top (1), ending with 1; [1] by default. */
  cuts?: number[];
}

interface HullSpec {
  frame: Frame;
  /** Stations along the length, ascending; the first is the transom. */
  stations: number[];
  keel: (s: number) => number;
  deck: (s: number) => number;
  /** The hull's half-breadth at station s and height y. */
  halfBeam: (s: number, y: number) => number;
  /** The paint bands from the keel up. */
  bands: HullBand[];
  /** The deck's material, or null for an open shell. */
  deckMat: string | null;
}

/**
 * The hull shell: per station a cross-section from the keel to the deck edge
 * (both sides), cut at the band boundaries, joined station to station. Draws the
 * sides, the bottom, the deck and the transom; a bow whose half-breadth reaches
 * zero closes itself.
 */
function hullShell(m: MeshBuilder, spec: HullSpec): void {
  const { frame: F, stations, bands } = spec;
  // per station: the levels (height, band index of the row above it)
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
  const outSide = (side: number): Vec3 => F(0, 0, side);

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
    const down = F(0, -1, 0);
    for (let i = 0; i + 1 < sections.length; i++) {
      const a = sections[i]!;
      const b = sections[i + 1]!;
      batch.quad(P(a, 0, -1), P(b, 0, -1), P(b, 0, 1), P(a, 0, 1), down);
    }
    batch.draw(m, bands[0]!.mat);
  });
  if (spec.deckMat) {
    m.scope("deck", () => {
      const batch = new TriBatch();
      const up = F(0, 1, 0);
      const top = rows.length;
      for (let i = 0; i + 1 < sections.length; i++) {
        const a = sections[i]!;
        const b = sections[i + 1]!;
        batch.quad(P(a, top, -1), P(b, top, -1), P(b, top, 1), P(a, top, 1), up);
      }
      batch.draw(m, spec.deckMat!);
    });
  }
  const end = (sec: (typeof sections)[number], dir: number, name: string): void => {
    m.scope(name, () => {
      bands.forEach((band, k) => {
        const batch = new TriBatch();
        for (let j = 0; j < rows.length; j++) {
          if (rows[j] === k) batch.quad(P(sec, j, -1), P(sec, j, 1), P(sec, j + 1, 1), P(sec, j + 1, -1), F(dir, 0, 0));
        }
        batch.draw(m, band.mat);
      });
    });
  };
  end(sections[0]!, -1, "transom");
  end(sections[sections.length - 1]!, 1, "stem");
}

/** A ring wound like `rect` (clockwise in x/z, which is counter-clockwise seen from above). */
function orient(ring: Ring): Ring {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i]!;
    const [x1, z1] = ring[(i + 1) % ring.length]!;
    a += x0 * z1 - x1 * z0;
  }
  return a > 0 ? [...ring].reverse() : ring;
}

/**
 * The plan of a deckhouse along the length (s from s0 to s1), as an (x, z) ring:
 * half-width `w(s)`, its ends closed straight across. `along` decides whether
 * the length is x or z. `w` must be concave so the ring stays convex. Sampled
 * every (s1 - s0) / n, and finer within 12 m of either end.
 */
function planRing(s0: number, s1: number, w: (s: number) => number, n: number, along: "x" | "z"): Ring {
  // evenly spaced, plus a finer run near each end where a rounded end curves
  const at = new Set<number>();
  for (let i = 0; i <= n; i++) at.add(Math.round((s0 + ((s1 - s0) * i) / n) * 1000) / 1000);
  const end = Math.min(12, (s1 - s0) / 2);
  const near = [0, 0.04, 0.12, 0.25, 0.45, 0.75, 1.1];
  for (let d = 1.5; d <= end; d += 0.75) near.push(d);
  for (const d of near.filter((v) => v <= end)) {
    at.add(Math.round((s0 + d) * 1000) / 1000);
    at.add(Math.round((s1 - d) * 1000) / 1000);
  }
  const pts: Array<[number, number]> = [...at].sort((a, b) => a - b).map((s) => [s, Math.max(0.01, w(s))]);
  const ring: Array<[number, number]> = [];
  for (const [s, h] of pts) ring.push([s, h]);
  for (let i = pts.length - 1; i >= 0; i--) ring.push([pts[i]![0], -pts[i]![1]]);
  return orient(along === "x" ? ring : ring.map(([s, b]) => [b, s]));
}

/** An elliptical end: the half-width of a rounded end of radius `r` at distance `d` from its tip. */
function roundEnd(hw: number, r: number, d: number): number {
  if (d >= r) return hw;
  const t = (r - Math.max(0, d)) / r;
  return hw * Math.sqrt(Math.max(0, 1 - t * t));
}

/**
 * A body of revolution (an elliptical section, `n` sides) along the x or z axis:
 * consecutive stations `(a, rx, ry)` about the axis line through (c0, cy), where
 * rx is the radius across. End stations should be small; the ends stay open.
 */
function spindle(m: MeshBuilder, mat: string, axis: "x" | "z", c0: number, cy: number, st: Array<[number, number, number]>, n = 10): void {
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
    m.sweep(mat, axis, ring(Math.max(0.01, rx0), Math.max(0.01, ry0)), a0, ring(Math.max(0.01, rx1), Math.max(0.01, ry1)), a1, false);
  }
}

/** A rough sphere: a spindle of `n` sides with a cosine profile. */
function ball(m: MeshBuilder, mat: string, x: number, y: number, z: number, r: number, n = 10): void {
  const st: Array<[number, number, number]> = [];
  const k = 6;
  for (let i = 0; i <= k; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / k;
    const rr = Math.max(0.01 * r, r * Math.cos(a));
    st.push([x + r * Math.sin(a), rr, rr]);
  }
  // about the x axis through (z, y): the section's first coordinate is z
  spindle(m, mat, "x", z, y, st, n);
}

/** A straight round bar between two points (a vertical-ish post or a slanted strut), `n` sides. */
function bar(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, r: number, n = 6): void {
  // a slab of an n-gon around a, extruded to b: faces the ends, walls round the side
  const d = sub3(b, a);
  const len = Math.hypot(d[0], d[1], d[2]);
  if (len < 1e-6) return;
  const t: Vec3 = [d[0] / len, d[1] / len, d[2] / len];
  const helper: Vec3 = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = cross3(t, helper);
  const lu = Math.hypot(u[0], u[1], u[2]);
  u = [u[0] / lu, u[1] / lu, u[2] / lu];
  const v = cross3(t, u);
  const outline: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const c = Math.cos(ang) * r;
    const s = Math.sin(ang) * r;
    outline.push([a[0] + u[0] * c + v[0] * s, a[1] + u[1] * c + v[1] * s, a[2] + u[2] * c + v[2] * s]);
  }
  m.slab(mat, outline, d);
}

/**
 * A railing along a polyline of (x, z) points at deck height y: a top rail, a
 * mid rail and posts about every `pitch` metres, all thin square bars.
 */
function railing(m: MeshBuilder, mat: string, path: Array<[number, number]>, y: number | ((x: number, z: number) => number), h = 1.0, pitch = 2.0): void {
  const yAt = typeof y === "number" ? () => y : y;
  for (let i = 0; i + 1 < path.length; i++) {
    const [x0, z0] = path[i]!;
    const [x1, z1] = path[i + 1]!;
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (len < 1e-3) continue;
    const ry = Math.atan2(-(z1 - z0), x1 - x0);
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const ys = yAt(cx, cz);
    m.box(mat, cx, cz, len, 0.05, ys + h - 0.05, ys + h, ry);
    m.box(mat, cx, cz, len, 0.03, ys + h * 0.5 - 0.02, ys + h * 0.5 + 0.02, ry);
    const posts = Math.max(1, Math.round(len / pitch));
    for (let p = 0; p < posts; p++) {
      const f = p / posts;
      const px = x0 + (x1 - x0) * f;
      const pz = z0 + (z1 - z0) * f;
      m.box(mat, px, pz, 0.05, 0.05, yAt(px, pz) - 0.05, ys + h - 0.05, ry, false);
    }
  }
  const [xe, ze] = path[path.length - 1]!;
  m.box(mat, xe, ze, 0.05, 0.05, yAt(xe, ze) - 0.05, yAt(xe, ze) + h - 0.05, 0, false);
}

/**
 * A row of rectangular panes on a wall whose outer face is the plane
 * beam = +-`b` (both sides), one source-tree leaf per side: centres `ss` along the
 * length, `w` wide, from y0 to y1, 3 cm proud of the wall.
 */
function paneRow(m: MeshBuilder, mat: string, F: Frame, ss: number[], w: number, y0: number, y1: number, b: number, sides = [1, -1]): void {
  for (const side of sides) {
    const batch = new TriBatch();
    const z = side * (b + 0.03);
    for (const s of ss) {
      batch.quad(F(s - w / 2, y0, z), F(s + w / 2, y0, z), F(s + w / 2, y1, z), F(s - w / 2, y1, z), F(0, 0, side));
    }
    batch.draw(m, mat);
  }
}

/** Panes on an end wall, the plane length = `s` facing along `dir` (+-1): beam centres `bs`, `w` wide. */
function paneEnd(m: MeshBuilder, mat: string, F: Frame, s: number, dir: number, bs: number[], w: number, y0: number, y1: number): void {
  const batch = new TriBatch();
  const x = s + dir * 0.03;
  for (const b of bs) batch.quad(F(x, y0, b - w / 2), F(x, y0, b + w / 2), F(x, y1, b + w / 2), F(x, y1, b - w / 2), F(dir, 0, 0));
  batch.draw(m, mat);
}

/** Evenly spaced positions from a to b (inclusive) about `pitch` apart. */
function spaced(a: number, b: number, pitch: number): number[] {
  const n = Math.max(1, Math.round((b - a) / pitch));
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
}

// --- the cruise ferry ----------------------------------------------------------------
//
// A Baltic cruise ferry in the Viking Line mould (assets/cruise-ferry): a red
// hull over dark boot topping with a white waterline, a raked bow over a
// bulbous forefoot, a long white superstructure with rows of windows, lifeboats
// in davits along the boat deck, a stepped forward block topped by the bridge
// and its wings, a radar mast, and the raked funnel aft - green, white with the
// red emblem, red, black top. 155 m long, 24.4 m in the beam, 45.9 m to the
// mast top; bow at +X.

const CF_PLAN: Array<[number, number]> = [
  [-77.5, 9.4], [-75, 9.7], [-70, 10.5], [-64, 11.0], [-60, 11.4], [-50, 11.85], [-40, 11.97], [-30, 12.0],
  [10, 12.0], [20, 11.85], [30, 11.55], [40, 10.65], [45, 10.1], [50, 9.2], [55, 8.1], [60, 7.2], [65, 5.2],
  [70, 3.7], [72, 2.6], [74, 1.9], [76, 0.9], [77.5, 0.12],
];
const CF_KEEL: Array<[number, number]> = [
  [-77.5, 2.9], [-75, 2.4], [-70, 1.05], [-64, 0.4], [-60, 0.08], [-58, 0], [38, 0], [50, 0.6], [56, 1.4],
  [60, 2.4], [64, 3.6], [68, 5.0], [72, 6.2], [74.3, 7.8], [76, 9.0], [77.5, 10.2],
];
const CF_DECK: Array<[number, number]> = [
  [-77.5, 13.9], [-40, 13.5], [0, 13.35], [30, 13.6], [45, 14.1], [55, 14.6], [62, 15.2], [68, 16.0], [72, 16.7], [77.5, 17.6],
];
/** Midship section: half-breadth fraction by height above the keel (round bilge). */
const CF_MID: Array<[number, number]> = [[0, 0.4], [0.5, 0.46], [1.2, 0.6], [2, 0.71], [3, 0.82], [4, 0.88], [6, 0.94], [8, 0.975], [10, 0.99], [12, 1]];
/** Stern section: fuller still, over a raised transom. */
const CF_STERN: Array<[number, number]> = [[0, 0.6], [0.8, 0.74], [1.6, 0.83], [3.6, 0.94], [5.6, 0.975], [8, 1]];
/** How far a station has gone over to the bow's V section (0 midship, 1 at the stem). */
const CF_BOWNESS: Array<[number, number]> = [[20, 0], [30, 0.15], [45, 0.4], [55, 0.6], [60, 0.95], [63, 1]];
const CF_STERNNESS: Array<[number, number]> = [[-65, 0], [-72, 0.5], [-75, 1]];

const cfPlan = (s: number): number => lerpTable(CF_PLAN, s);
const cfKeel = (s: number): number => lerpTable(CF_KEEL, s);
const cfDeck = (s: number): number => lerpTable(CF_DECK, s);

function cfHalfBeam(s: number, y: number): number {
  const keel = cfKeel(s);
  const h = Math.max(0, y - keel);
  const depth = Math.max(0.1, cfDeck(s) - keel);
  const mid = lerpTable(CF_MID, h);
  const stern = lerpTable(CF_STERN, h);
  const vee = Math.pow(Math.min(1, h / depth), 0.6);
  const ws = lerpTable(CF_STERNNESS, s);
  const wb = lerpTable(CF_BOWNESS, s);
  const g = (mid * (1 - ws) + stern * ws) * (1 - wb) + vee * wb;
  return cfPlan(s) * g;
}

/** The superstructure's half-width at s: `hw`, held inside the hull's deck edge, with a rounded aft end. */
function cfHouse(hw: number, s0: number, aftR: number, inset = 0.45): (s: number) => number {
  return (s) => Math.min(roundEnd(hw, aftR, s - s0), cfPlan(s) - inset);
}

// the forward block's stepped decks: rounded aft, tapering to the front
const CF_D5 = (s: number): number => Math.min(roundEnd(10.85, 1.5, s - 6.1), roundEnd(10.85, 7, 55 - s), cfPlan(s) - 1.9, 10.85 - Math.max(0, s - 40) * 0.42);
const CF_D6 = (s: number): number => Math.min(roundEnd(9.9, 1.5, s - 10), roundEnd(9.9, 6.5, 50 - s), 9.9 - Math.max(0, s - 36) * 0.45);
const CF_D7 = (s: number): number => Math.min(roundEnd(9.35, 1.5, s - 13.9), roundEnd(9.35, 6, 45 - s), 9.35 - Math.max(0, s - 33) * 0.45);
const CF_BRIDGE = (s: number): number => Math.min(roundEnd(8.65, 1.5, s - 18), roundEnd(8.65, 5, 41 - s), 8.65 - Math.max(0, s - 31) * 0.5);
const CF_MONKEY = (s: number): number => Math.min(roundEnd(5, 1.0, s - 21), roundEnd(5, 3, 38 - s), 5 - Math.max(0, s - 33) * 0.6);

/** One deck of the superstructure: white walls from y0 to y1, the deck on top white unless an open deck. */
function cfTier(m: MeshBuilder, name: string, s0: number, s1: number, y0: number, y1: number, w: (s: number) => number, n = 40, top = "whitePaint"): void {
  m.scope(name, () => {
    const ring = planRing(s0, s1, w, n, "x");
    m.prism("whitePaint", ring, y0, y1, false);
    m.cap(top, ring, y1);
  });
}

/** A lifeboat in its davits, centred at x on the side `side`. */
function cfLifeboat(m: MeshBuilder, x: number, side: number): void {
  const zc = side * 10.85;
  const yc = 24.7;
  m.scope("hull", () => spindle(m, "lifeboatOrange", "x", zc, yc, [
    [x - 4.15, 0.25, 0.5], [x - 3.6, 0.8, 1.05], [x - 2.6, 1.08, 1.3], [x + 2.6, 1.1, 1.32], [x + 3.6, 0.85, 1.1], [x + 4.15, 0.25, 0.55],
  ], 10));
  m.scope("canopy", () => block(m, "whitePaint", x - 2.4, x + 2.4, yc + 0.6, yc + 1.45, zc - 0.75, zc + 0.75));
  m.scope("davits", () => {
    for (const dx of [-3.0, 3.0]) {
      bar(m, "steelGrey", [x + dx, 23.4, side * 10.1], [x + dx, 26.6, side * 10.4], 0.12, 6);
      bar(m, "steelGrey", [x + dx, 26.6, side * 10.4], [x + dx, 26.6, side * 11.3], 0.1, 6);
    }
  });
}

/** The funnel's plan at a height: an egg from the vertical aft edge at xa to the raked front at xf. */
function cfFunnelRing(xa: number, xf: number, hw: number): Ring {
  const n = 20;
  const cx = (xa + xf) / 2;
  const rx = (xf - xa) / 2;
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    // a superellipse, fuller aft than forward
    const ex = c >= 0 ? 1.8 : 2.6;
    const px = Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
    const pz = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / 2.6);
    ring.push([cx + rx * px, hw * pz]);
  }
  return orient(ring);
}

function cfFunnel(m: MeshBuilder): void {
  const xa = -27.1;
  const front = (y: number): number => -17.5 - ((y - 26.4) / (40 - 26.4)) * 3.5;
  const half = (y: number): number => 2.95 - ((y - 26.4) / (40 - 26.4)) * 0.98;
  const ring = (y: number): Ring => cfFunnelRing(xa, front(y), half(y));
  const bands: Array<[string, number, number]> = [
    ["funnelGreen", 26.4, 30.9], ["whitePaint", 30.9, 33.1], ["hullRed", 33.1, 38.25], ["blackTrim", 38.25, 40.0],
  ];
  m.scope("casing", () => {
    for (const [mat, y0, y1] of bands) m.loft(mat, ring(y0), y0, ring(y1), y1, mat === "blackTrim");
  });
  m.scope("exhaust pipes", () => {
    for (const z of [-0.7, 0.7]) {
      m.emit("smoke", [-24.4, 41.3, z], 0.42);
      m.prism("blackTrim", ngon(10, 0.42, 0, -24.4, z), 39.8, 41.3);
    }
  });
  m.scope("emblem", () => {
    // a red diamond outline on the white band, both sides
    const cx = -23.3;
    const cy = 32.0;
    const rx = 1.45;
    const ry = 0.85;
    const t = 0.22;
    for (const side of [1, -1]) {
      const z = side * (half(cy) + 0.04);
      const batch = new TriBatch();
      const outer: Array<[number, number]> = [[cx + rx, cy], [cx, cy + ry], [cx - rx, cy], [cx, cy - ry]];
      const inner: Array<[number, number]> = [[cx + rx - t * 1.7, cy], [cx, cy + ry - t], [cx - rx + t * 1.7, cy], [cx, cy - ry + t]];
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        batch.quad([outer[i]![0], outer[i]![1], z], [outer[j]![0], outer[j]![1], z], [inner[j]![0], inner[j]![1], z], [inner[i]![0], inner[i]![1], z], [0, 0, side]);
      }
      batch.draw(m, "hullRed");
    }
  });
}

export function cruiseFerry(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const F = ALONG_X;
  const stations = [
    -77.5, -76.5, -75, -73, -70, -67, -64, -60, -55, -50, -40, -30, -10, 10, 20, 30, 36, 42, 46, 50, 53, 56, 58, 60,
    62, 64, 66, 68, 70, 71.5, 73, 74.3, 75.5, 76.5, 77.5,
  ];
  m.scope("hull", () => {
    hullShell(m, {
      frame: F,
      stations,
      keel: cfKeel,
      deck: cfDeck,
      halfBeam: cfHalfBeam,
      bands: [
        { mat: "bootTopping", top: () => 7.6, cuts: [0.04, 0.1, 0.18, 0.28, 0.42, 0.6, 0.8, 1] },
        { mat: "whitePaint", top: () => 8.1 },
        { mat: "hullRed", top: (s) => cfDeck(s) - lerpTable([[45, 0.35], [62, 0.8], [77.5, 1.0]], s), cuts: [0.3, 0.6, 1] },
        { mat: "whitePaint" },
      ],
      deckMat: "deckGrey",
    });
    m.scope("bulbous bow", () => spindle(m, "bootTopping", "x", 0, 3.5, [
      [61.5, 0.5, 0.6], [64, 1.25, 1.6], [67, 1.5, 1.95], [70.5, 1.45, 1.9], [73, 1.15, 1.45], [74.4, 0.7, 0.85], [75, 0.1, 0.1],
    ], 12));
    m.scope("portholes", () => {
      for (const side of [1, -1]) {
        const batch = new TriBatch();
        for (const x of spaced(-58, 52, 4.4)) {
          const z = side * (cfHalfBeam(x, 11.6) + 0.03);
          const ring = ngon(8, 0.3, 0, x, 11.6);
          for (let i = 1; i + 1 < ring.length; i++) {
            batch.add([ring[0]![0], ring[0]![1], z], [ring[i]![0], ring[i]![1], z], [ring[i + 1]![0], ring[i + 1]![1], z], [0, 0, side]);
          }
        }
        batch.draw(m, "glassDark");
      }
    });
    m.scope("anchor pockets", () => {
      // dark recesses drawn as panes on the flared bow, 4 cm off its surface
      for (const side of [1, -1]) {
        const batch = new TriBatch();
        const p = (x: number, y: number): Vec3 => [x, y, side * (cfHalfBeam(x, y) + 0.04)];
        batch.quad(p(64.1, 11.7), p(66.6, 11.7), p(66.6, 12.8), p(64.6, 12.8), [0.3, 0, side]);
        batch.draw(m, "blackTrim");
      }
    });
  });

  m.scope("superstructure", () => {
    // held inside the flared bow below the deck, too
    cfTier(m, "decks 1-2", -74, 66, 13.2, 20.4, (s) => Math.min(cfHouse(11.45, -74, 8)(s), cfHalfBeam(s, 13.2) - 0.2), 40, "deckGrey");
    cfTier(m, "deck 3", -69.9, 62.9, 20.4, 23.4, cfHouse(11.0, -69.9, 8, 1.0), 40, "deckGrey");
    cfTier(m, "boat deck", -66, 60, 23.4, 26.4, cfHouse(10.3, -66, 8, 1.5));
    cfTier(m, "deck 5", 6.1, 55, 26.4, 29.4, CF_D5);
    cfTier(m, "deck 6", 10, 50, 29.4, 32.4, CF_D6);
    cfTier(m, "deck 7", 13.9, 45, 32.4, 35.4, CF_D7);
    cfTier(m, "bridge deck", 18, 41, 35.4, 38.3, CF_BRIDGE);
    cfTier(m, "monkey island", 21, 38, 38.3, 40.0, CF_MONKEY, 16);
    cfTier(m, "aft sun deck", -60, -24, 26.4, 27.6, (s) => Math.min(roundEnd(7.6, 6, s + 60), 7.6), 24, "deckGrey");
    m.scope("funnel house", () => {
      m.prism("whitePaint", planRing(-28.5, -16.5, (s) => Math.min(roundEnd(4.2, 2, s + 28.5), 4.2 - Math.max(0, s + 19) * 0.6), 14, "x"), 26.4, 28.6);
    });
    m.scope("bridge wings", () => {
      block(m, "whitePaint", 28, 34, 36.4, 38.25, -11.25, 11.25);
      for (const side of [1, -1]) {
        block(m, "glassDark", 28.6, 33.4, 36.7, 37.9, side > 0 ? 11.25 : -11.28, side > 0 ? 11.28 : -11.25);
      }
    });
    m.scope("aft deckhouse", () => {
      // the low house on the stern deck, below the first tier's rounded end
      m.prism("whitePaint", planRing(-76.6, -73, (s) => Math.min(roundEnd(7.5, 3, s + 76.6), cfPlan(s) - 0.6), 12, "x"), 13.4, 15.1);
    });
  });

  m.scope("windows", () => {
    const pitch = 3.43;
    const row = (name: string, a: number, b: number, y: number, hw: (s: number) => number, skip?: (s: number) => boolean): void => {
      m.scope(name, () => {
        const ss = spaced(a, b, pitch).filter((s) => !skip || !skip(s));
        // panes follow the wall where it narrows towards the bow
        const groups = new Map<number, number[]>();
        for (const s of ss) {
          const w = Math.round(Math.max(hw(s - 0.8), hw(s + 0.8)) * 100) / 100;
          groups.set(w, [...(groups.get(w) ?? []), s]);
        }
        for (const [w, list] of [...groups.entries()].sort((p, q) => p[0] - q[0])) paneRow(m, "glassDark", F, list, 1.6, y - 0.72, y + 0.72, w);
      });
    };
    const lower = cfHouse(11.45, -74, 8);
    const d3 = cfHouse(11.0, -69.9, 8, 1.0);
    const d4 = cfHouse(10.3, -66, 8, 1.5);
    const boats = [-58, -47.6, -37, -26.6, -16, -5.6];
    row("deck 1", -64.8, 42.5, 16.0, lower);
    row("deck 2", -64.8, 42.5, 19.1, lower);
    row("deck 3", -60.9, 39.6, 21.9, d3);
    row("boat deck", -56, 40, 24.9, d4, (s) => s < 0 && boats.some((b) => Math.abs(s - b) < 4.6));
    row("deck 5", 11.9, 47.7, 28.0, CF_D5);
    row("deck 6", 12.4, 41.4, 30.9, CF_D6);
    row("deck 7", 16.4, 38.6, 33.9, CF_D7);
    m.scope("bridge", () => {
      // the wheelhouse windows across the wings' fronts, and the monkey island's
      paneEnd(m, "glassDark", F, 34, 1, [-10.4, -8.9, -7.4, 7.4, 8.9, 10.4], 1.25, 36.7, 37.9);
      paneEnd(m, "glassDark", F, 41, 1, [-1.2, 0, 1.2], 1.0, 36.2, 37.6);
      paneEnd(m, "glassDark", F, 38, 1, [-0.8, 0.8], 1.3, 38.7, 39.6);
      paneRow(m, "glassDark", F, [24, 27, 30], 2.2, 38.65, 39.6, 5);
    });
  });

  m.scope("lifeboats", () => {
    [-58, -47.6, -37, -26.6, -16, -5.6].forEach((x, i) => {
      for (const side of [1, -1]) m.scope(`boat ${i + 1} ${side > 0 ? "starboard" : "port"}`, () => cfLifeboat(m, x, side));
    });
  });

  m.scope("funnel", () => cfFunnel(m));

  m.scope("mast", () => {
    m.scope("main mast", () => {
      bar(m, "steelGrey", [26.6, 40, 0], [25.2, 45.9, 0], 0.22, 8);
      block(m, "steelGrey", 25.35, 25.65, 43.8, 44.1, -4.5, 4.5);
      block(m, "steelGrey", 25.9, 26.2, 41.6, 41.8, -2.5, 2.5);
    });
    m.scope("radar scanners", () => {
      block(m, "steelGrey", 30.5, 31.0, 40.6, 40.8, -2.4, 2.4);
      m.prism("steelGrey", ngon(8, 0.25, 0, 30.75, 0), 40.0, 40.6);
      block(m, "steelGrey", 34.5, 35.0, 40.6, 40.8, -2.0, 2.0);
      m.prism("steelGrey", ngon(8, 0.25, 0, 34.75, 0), 40.0, 40.6);
    });
    m.scope("satcom dome", () => {
      m.prism("steelGrey", ngon(8, 0.25, 0, 22.0, 0), 40.0, 40.4);
      ball(m, "whitePaint", 22.0, 41.05, 0, 0.75, 10);
    });
  });

  m.scope("deck fittings", () => {
    m.scope("foremast", () => bar(m, "steelGrey", [62.0, 23.4, 0], [62.0, 25.2, 0], 0.12, 6));
    m.scope("windlass", () => {
      for (const side of [1, -1]) {
        m.prism("blackTrim", ngon(10, 0.55, 0, 69.5, side * 1.3), cfDeck(69.5) - 0.2, cfDeck(69.5) + 0.7);
        block(m, "steelGrey", 69.1, 69.9, cfDeck(69.5) - 0.2, cfDeck(69.5) + 0.4, side > 0 ? 1.9 : -2.5, side > 0 ? 2.5 : -1.9);
      }
    });
    m.scope("ensign staff", () => bar(m, "steelGrey", [-76.8, 15.1, 0], [-77.2, 18.6, 0], 0.07, 6));
    m.scope("rails", () => {
      const fwd: Array<[number, number]> = [];
      for (const s of [66.5, 69, 71, 73, 75, 76.8]) fwd.push([s, cfPlan(s) - 0.15]);
      const deckY = (x: number): number => cfDeck(x);
      railing(m, "steelGrey", fwd, deckY, 1.0, 2.0);
      railing(m, "steelGrey", fwd.map(([s, z]) => [s, -z]), deckY, 1.0, 2.0);
      railing(m, "steelGrey", [[-58, 7.4], [-30, 7.4]], 27.6, 1.0, 3.0);
      railing(m, "steelGrey", [[-58, -7.4], [-30, -7.4]], 27.6, 1.0, 3.0);
      railing(m, "steelGrey", [[28.2, 11.1], [33.8, 11.1]], 38.3, 1.0, 2.0);
      railing(m, "steelGrey", [[28.2, -11.1], [33.8, -11.1]], 38.3, 1.0, 2.0);
    });
  });
  return m;
}

// --- the hydrofoil ferry ---------------------------------------------------------------
//
// A Soviet Kometa type sea-going hydrofoil (assets/hydrofoil-ferry): a narrow
// hull with a long pointed bow, white with a red bottom band and a red sheer
// stripe, a long white passenger saloon with a red roof and a row of square
// windows, the wheelhouse forward with a raked windscreen, a mast, and the blue
// foils - a dihedral bow foil and a wider stern foil on struts, the propeller
// shaft and the rudder behind. 34.5 m long, 7.8 m over the foil tips, 8.63 m to
// the radar; bow at +X. The foils reach y = 0.

const HF_PLAN: Array<[number, number]> = [
  [-17.25, 1.45], [-16.5, 1.8], [-15.75, 2.1], [-14, 2.4], [-12.5, 2.55], [-8, 2.62], [4, 2.62], [7.5, 2.45],
  [9.75, 2.05], [11.5, 1.45], [13.75, 0.9], [15, 0.6], [17.25, 0.04],
];
const HF_KEEL: Array<[number, number]> = [[-17.25, 1.85], [-14, 1.7], [-10, 1.63], [4, 1.65], [6.5, 1.72], [9, 1.95], [11.5, 2.35], [14, 2.85], [17.25, 3.55]];
const HF_DECK: Array<[number, number]> = [[-17.25, 4.6], [-12, 4.45], [-5, 4.3], [3, 4.4], [8, 4.6], [12, 4.9], [17.25, 5.5]];
/** The chine's height above the keel: a shallow V midships, steeper towards the bow. */
const HF_CHINE: Array<[number, number]> = [[-17.25, 0.6], [6, 0.85], [11, 1.05], [17.25, 1.3]];

const hfPlan = (s: number): number => lerpTable(HF_PLAN, s);
const hfKeel = (s: number): number => lerpTable(HF_KEEL, s);
const hfDeck = (s: number): number => lerpTable(HF_DECK, s);

function hfHalfBeam(s: number, y: number): number {
  const h = Math.max(0, y - hfKeel(s));
  const c = lerpTable(HF_CHINE, s);
  const g = h < c ? 0.05 + 0.91 * (h / c) : 0.96 + 0.04 * Math.min(1, (h - c) / 0.8);
  return hfPlan(s) * g;
}

/** The height of the hull's bottom at station s and beam |z|, plus `into` (where a strut meets the hull). */
function hfBottomAt(s: number, z: number, into: number): number {
  const c = lerpTable(HF_CHINE, s);
  const f = Math.abs(z) / hfPlan(s);
  return hfKeel(s) + Math.max(0, Math.min(1, (f - 0.05) / 0.91)) * c + into;
}

/** A foil: a flat blue blade spanning z from -span to span, chord x0..x1, with dihedral tips up to `tipY`. */
function hfFoil(m: MeshBuilder, x0: number, x1: number, y: number, inner: number, span: number, tipY: number): void {
  const t = 0.12;
  m.scope("blade", () => block(m, "foilBlue", x0, x1, y, y + t, -inner, inner));
  m.scope("tips", () => {
    for (const side of [1, -1]) {
      const q: Ring = [[side * inner, y], [side * span, tipY], [side * span, tipY + t], [side * inner, y + t]];
      m.sweep("foilBlue", "x", q, x0 + 0.05, q, x1 - 0.05);
    }
  });
}

export function hydrofoilFerry(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const F = ALONG_X;
  const stations = [-17.25, -16.5, -15.75, -14, -12.5, -10, -6, -2, 2, 4, 6, 7.5, 8.5, 9.75, 10.75, 11.5, 12.5, 13.75, 15, 16.2, 17.25];
  m.scope("hull", () => {
    hullShell(m, {
      frame: F,
      stations,
      keel: hfKeel,
      deck: hfDeck,
      halfBeam: hfHalfBeam,
      bands: [
        { mat: "signalRed", top: (s) => Math.max(2.4, hfKeel(s) + 0.8), cuts: [0.5, 1] },
        { mat: "hullWhite", top: (s) => hfDeck(s) - 0.55 },
        { mat: "signalRed" },
      ],
      deckMat: "foilDeck",
    });
  });

  const SUP_X0 = -15.55;
  const SUP_X1 = 11.55;
  const supHalf = (s: number): number => Math.min(2.4, 1.85 + (s - SUP_X0) * 0.7, hfPlan(s) - 0.2, 2.4 - Math.max(0, s - 8.5) * 0.3);
  m.scope("saloon", () => {
    const ring = planRing(SUP_X0, SUP_X1, supHalf, 30, "x");
    m.prism("hullWhite", ring, 4.2, 6.4, false);
    m.scope("roof", () => {
      const roof = planRing(SUP_X0 - 0.05, SUP_X1 + 0.05, (s) => supHalf(s) + 0.05, 30, "x");
      m.loft("signalRed", roof, 6.4, planRing(SUP_X0 + 0.2, SUP_X1 - 0.3, (s) => supHalf(s) - 0.2, 30, "x"), 6.65);
    });
    m.scope("windows", () => {
      const xs = Array.from({ length: 15 }, (_, i) => -13.7 + i * 1.52);
      paneRow(m, "foilGlass", F, xs.slice(1, 14), 0.82, 5.2, 5.95, 2.4);
      paneRow(m, "foilGlass", F, [xs[0]!], 0.55, 5.2, 5.95, 2.4);
      paneRow(m, "foilGlass", F, [xs[14]!], 0.82, 5.25, 6.0, supHalf(xs[14]!));
    });
    m.scope("aft door", () => paneEnd(m, "foilGlass", F, SUP_X0, -1, [0], 0.9, 4.6, 6.1));
  });

  m.scope("wheelhouse", () => {
    const hw = 1.65;
    m.scope("shell", () => {
      const prof: Ring = [[4.45, 6.6], [9.45, 6.6], [9.9, 6.6], [9.4, 7.42], [4.45, 7.65]];
      m.sweep("hullWhite", "z", prof, -hw, prof, hw);
    });
    m.scope("roof edge", () => {
      const prof: Ring = [[4.4, 7.6], [9.45, 7.37], [9.5, 7.47], [4.4, 7.72]];
      m.sweep("signalRed", "z", prof, -hw - 0.05, prof, hw + 0.05);
    });
    m.scope("windscreen", () => {
      // a dark pane just proud of the raked front
      const a: [number, number] = [9.86, 6.75];
      const b: [number, number] = [9.43, 7.36];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = (b[1] - a[1]) / len;
      const ny = -(b[0] - a[0]) / len;
      const off = (p: [number, number], d: number): [number, number] => [p[0] + nx * d, p[1] + ny * d];
      const pane: Ring = [off(a, -0.01), off(a, 0.03), off(b, 0.03), off(b, -0.01)];
      m.sweep("foilGlass", "z", pane, -hw + 0.12, pane, hw - 0.12);
    });
    m.scope("side windows", () => paneRow(m, "foilGlass", F, [5.1, 6.0, 6.9, 7.8], 0.6, 6.95, 7.4, hw));
  });

  m.scope("mast", () => {
    bar(m, "foilDeck", [3.25, 6.6, 0], [3.25, 8.5, 0], 0.07, 6);
    block(m, "foilDeck", 3.2, 3.3, 8.0, 8.06, -1.05, 1.05);
    block(m, "hullWhite", 3.05, 3.45, 8.5, 8.63, -0.78, 0.78);
  });

  m.scope("bow foil", () => {
    hfFoil(m, 9.5, 10.63, 0.17, 2.45, 3.15, 0.65);
    m.scope("struts", () => {
      for (const z of [-1.45, -0.75, 0.75, 1.45]) {
        const zb = z * 1.35;
        const top = hfBottomAt(10.05, z + Math.sign(z) * 0.08, 0.25);
        const q: Ring = [[zb - 0.08, 0.25], [zb + 0.08, 0.25], [z + 0.08, top], [z - 0.08, top]];
        m.sweep("foilBlue", "x", q, 9.65, q, 10.45);
      }
    });
  });
  m.scope("stern foil", () => {
    hfFoil(m, -12.2, -11.05, 0.0, 2.45, 3.9, 0.62);
    m.scope("struts", () => {
      for (const z of [-2.15, -1.4, 1.4, 2.15]) {
        const zb = z * 1.1;
        const top = hfBottomAt(-11.6, z + Math.sign(z) * 0.09, 0.25);
        const q: Ring = [[zb - 0.09, 0.08], [zb + 0.09, 0.08], [z + 0.09, top], [z - 0.09, top]];
        m.sweep("foilBlue", "x", q, -12.05, q, -11.2);
      }
    });
  });
  m.scope("propulsion", () => {
    m.scope("shaft bracket", () => block(m, "foilBlue", -12.0, -11.3, 0.7, 1.75, -0.12, 0.12));
    m.scope("nacelle", () => spindle(m, "foilBlue", "x", 0, 0.72, [[-14.6, 0.08, 0.08], [-14.2, 0.17, 0.17], [-12.4, 0.2, 0.2], [-11.9, 0.08, 0.08]], 8));
    m.scope("shaft", () => spindle(m, "foilDeck", "x", 0, 0.72, [[-15.75, 0.05, 0.05], [-14.5, 0.05, 0.05]], 6));
    m.scope("propeller", () => {
      ball(m, "foilDeck", -15.85, 0.72, 0, 0.14, 8);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
        const tip: Vec3 = [-15.85, 0.72 + Math.sin(a) * 0.62, Math.cos(a) * 0.62];
        const nz = Math.cos(a + Math.PI / 2) * 0.16;
        const ny = Math.sin(a + Math.PI / 2) * 0.16;
        m.slab("foilDeck", [[-15.8, 0.72 + ny, nz], [-15.8, 0.72 - ny, -nz], [tip[0], tip[1], tip[2]]], [-0.1, 0, 0]);
      }
    });
    m.scope("rudder", () => block(m, "foilBlue", -17.05, -16.1, 0.57, 2.0, -0.05, 0.05));
  });
  return m;
}

// --- the passenger ferry ---------------------------------------------------------------
//
// A white lake passenger motor ship (assets/passenger-ferry): a full white hull
// with a dark boot stripe at the waterline and a rubbing strake, a pointed bow
// over a plumb stem, a long glazed saloon on the main deck with lifebuoys on its
// sides, the railed upper deck on its roof, a small glazed upper house with the
// bridge, and the mast with the green masthead ball. 39.1 m long along +Z (bow at
// +Z), 8.28 m in the beam, 13.33 m to the masthead.

const PF_BOW0 = 5.15;
const PF_BOW1 = 20.42;
const PF_STERN = -18.67;

function pfPlan(s: number): number {
  if (s >= PF_BOW0) {
    const u = Math.min(1, (s - PF_BOW0) / (PF_BOW1 - PF_BOW0));
    return Math.max(0.03, 4.14 * (1 - Math.pow(u, 2.2)));
  }
  // a square stern with rounded quarters
  const d = s - PF_STERN;
  if (d >= 1.6) return 4.14;
  const t = (1.6 - d) / 1.6;
  return 2.6 + 1.54 * Math.sqrt(Math.max(0, 1 - t * t));
}
const PF_KEEL: Array<[number, number]> = [[-18.67, 0.9], [-18.4, 0.35], [-18, 0.1], [-17.5, 0], [19.2, 0], [19.7, 0.25], [20.0, 0.6], [20.42, 4.3]];
const PF_DECK: Array<[number, number]> = [[-18.67, 4.6], [0, 4.55], [8, 4.6], [15, 4.8], [20.42, 5.1]];
/** The section: a flat floor rounding into near-vertical sides, a touch of tumblehome at the top. */
const PF_SECTION: Array<[number, number]> = [[0, 0.8], [0.15, 0.9], [0.4, 0.955], [0.8, 0.98], [3.7, 1.0], [4.6, 0.985]];

const pfKeel = (s: number): number => lerpTable(PF_KEEL, s);
const pfDeck = (s: number): number => lerpTable(PF_DECK, s);
const pfHalfBeam = (s: number, y: number): number => pfPlan(s) * lerpTable(PF_SECTION, y);

/** A lifebuoy: a dark ring on the saloon's side at length z, the wall's beam `b`. */
function pfLifebuoy(m: MeshBuilder, z: number, y: number, side: number, b: number): void {
  const n = 10;
  const r0 = 0.24;
  const r1 = 0.42;
  const x = side * (b + 0.02);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const p = (r: number, a: number): Vec3 => [x, y + r * Math.sin(a), z + r * Math.cos(a)];
    m.slab("bootStripe", [p(r0, a0), p(r1, a0), p(r1, a1), p(r0, a1)], [side * 0.12, 0, 0]);
  }
}

export function passengerFerry(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const F = ALONG_Z;
  const stations = [
    -18.67, -18.55, -18.4, -18.2, -18.0, -17.7, -17.4, -17.07, -14, -8, 0, 5.15, 7, 9, 11, 13, 15, 16.5, 17.8, 18.8, 19.5, 19.85, 20.1, 20.42,
  ];
  m.scope("hull", () => {
    hullShell(m, {
      frame: F,
      stations,
      keel: pfKeel,
      deck: pfDeck,
      halfBeam: pfHalfBeam,
      bands: [
        { mat: "lakeWhite", top: () => 1.7, cuts: [0.1, 0.25, 0.5, 1] },
        { mat: "bootStripe", top: () => 2.2 },
        { mat: "lakeWhite", top: (s) => pfDeck(s) - 0.42 },
        { mat: "lakeSteel", top: (s) => pfDeck(s) - 0.28 },
        { mat: "lakeWhite" },
      ],
      deckMat: "lakeDeck",
    });
    m.scope("keel bar", () => block(m, "bootStripe", -0.12, 0.12, -0.005, 0.06, -17.4, 19.1));
    m.scope("skeg", () => {
      const q: Ring = [[-18.0, 0.06], [-14.5, 0.06], [-14.5, 0.3], [-16.0, 1.1], [-18.0, 1.1]];
      m.sweep("bootStripe", "x", q.map(([z, y]) => [z, y]), -0.1, q.map(([z, y]) => [z, y]), 0.1);
    });
    m.scope("rudder", () => block(m, "lakeSteel", -0.05, 0.05, 0.25, 1.5, -16.9, -16.0));
    m.scope("propeller", () => {
      spindle(m, "lakeSteel", "z", 0, 0.75, [[-15.85, 0.05, 0.05], [-15.75, 0.14, 0.14], [-15.4, 0.14, 0.14], [-15.3, 0.05, 0.05]], 8);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const tip: Vec3 = [Math.cos(a) * 0.55, 0.75 + Math.sin(a) * 0.55, -15.6];
        const px = Math.cos(a + Math.PI / 2) * 0.13;
        const py = Math.sin(a + Math.PI / 2) * 0.13;
        m.slab("lakeSteel", [[px, 0.75 + py, -15.58], [-px, 0.75 - py, -15.58], tip], [0, 0, -0.06]);
      }
    });
  });

  const SAL_Z0 = -15.5;
  const SAL_Z1 = 11.9;
  const salHalf = (s: number): number => Math.min(roundEnd(3.3, 0.6, s - SAL_Z0), pfPlan(s) - 0.35);
  m.scope("saloon", () => {
    m.scope("walls", () => m.prism("lakeWhite", planRing(SAL_Z0, SAL_Z1, salHalf, 24, "z"), 4.45, 7.4, false));
    m.scope("side glazing", () => {
      // one long dark band per side, white mullions over it every two metres
      for (const side of [1, -1]) {
        const batch = new TriBatch();
        const x = side * 3.33;
        batch.quad([x, 5.47, -15.0], [x, 5.47, 5.15], [x, 7.0, 5.15], [x, 7.0, -15.0], [side, 0, 0]);
        batch.draw(m, "glassTinted");
        const tb = new TriBatch();
        // the forward part runs along the tapering wall
        const pts = [5.15, 7, 9, 11.4];
        for (let i = 0; i + 1 < pts.length; i++) {
          const z0 = pts[i]!;
          const z1 = pts[i + 1]!;
          const x0 = side * (salHalf(z0) + 0.03);
          const x1 = side * (salHalf(z1) + 0.03);
          tb.quad([x0, 5.47, z0], [x1, 5.47, z1], [x1, 7.0, z1], [x0, 7.0, z0], [side, 0, 0.3]);
        }
        tb.draw(m, "glassTinted");
        const mull = new TriBatch();
        for (const z of spaced(-13.0, 9.0, 2.0)) {
          const xx = side * (salHalf(z) + 0.06);
          mull.quad([xx, 5.45, z - 0.07], [xx, 5.45, z + 0.07], [xx, 7.02, z + 0.07], [xx, 7.02, z - 0.07], [side, 0, 0]);
        }
        mull.draw(m, "lakeWhite");
      }
    });
    m.scope("front glazing", () => {
      const w = salHalf(SAL_Z1);
      paneEnd(m, "glassTinted", F, SAL_Z1, 1, [-w + 0.55, -0.85, 0, 0.85, w - 0.55].map((b) => b), 0.75, 5.5, 7.0);
    });
    m.scope("aft glazing", () => paneEnd(m, "glassTinted", F, SAL_Z0, -1, [-1.85, -0.6, 0.6, 1.85], 1.05, 5.5, 7.0));
    m.scope("side doors", () => {
      for (const side of [1, -1]) block(m, "glassTinted", side > 0 ? 3.31 : -3.36, side > 0 ? 3.36 : -3.31, 4.6, 5.45, 3.7, 4.9);
    });
    m.scope("lifebuoys", () => {
      for (const side of [1, -1]) for (const z of [-9.55, 6.0]) pfLifebuoy(m, z, 5.3, side, salHalf(z));
    });
  });

  m.scope("upper deck", () => {
    const w = (s: number): number => salHalf(s) + 0.12;
    const ring = planRing(SAL_Z0 - 0.12, SAL_Z1 + 0.12, w, 24, "z");
    m.scope("slab", () => {
      m.prism("lakeWhite", ring, 7.4, 7.6, false);
      m.cap("lakeDeck", ring, 7.6);
    });
    m.scope("rails", () => {
      const path: Array<[number, number]> = [];
      for (const z of [-15.4, -10, -5, 0, 5.15, 7.5, 9.7, 11.9]) path.push([w(z) - 0.1, z]);
      railing(m, "lakeSteel", path, 7.6, 1.0, 1.6);
      railing(m, "lakeSteel", path.map(([x, z]) => [-x, z]), 7.6, 1.0, 1.6);
      railing(m, "lakeSteel", [[-w(-15.4) + 0.1, -15.45], [w(-15.4) - 0.1, -15.45]], 7.6, 1.0, 1.6);
      railing(m, "lakeSteel", [[-w(11.9) + 0.1, 11.95], [w(11.9) - 0.1, 11.95]], 7.6, 1.0, 1.4);
    });
    m.scope("benches", () => {
      for (const z of [-13.5, -12.2, 8.2, 9.6]) {
        for (const side of [1, -1]) {
          block(m, "lakeSteel", side > 0 ? 1.0 : -2.4, side > 0 ? 2.4 : -1.0, 7.6, 8.05, z - 0.25, z + 0.25);
          block(m, "lakeSteel", side > 0 ? 1.0 : -2.4, side > 0 ? 2.4 : -1.0, 8.05, 8.5, z - 0.25, z - 0.17);
        }
      }
    });
    m.scope("liferafts", () => {
      for (const side of [1, -1]) {
        for (const z of [-11, -9.5]) spindle(m, "lakeWhite", "z", side * 2.55, 7.95, [[z - 0.55, 0.06, 0.06], [z - 0.5, 0.33, 0.33], [z + 0.5, 0.33, 0.33], [z + 0.55, 0.06, 0.06]], 10);
      }
    });
    m.emit("smoke", [0, 10.0, -8.0], 0.25);
    m.scope("exhaust stack", () => m.prism("lakeSteel", ngon(10, 0.25, 0, 0, -8.0), 7.6, 10.0));
  });

  m.scope("upper house", () => {
    const UZ0 = -6.97;
    const UZ1 = 5.15;
    const hw = 2.6;
    m.scope("walls", () => m.box("lakeWhite", 0, (UZ0 + UZ1) / 2, 2 * hw, UZ1 - UZ0, 7.6, 9.82, 0, false));
    m.scope("roof", () => m.box("lakeWhite", 0, (UZ0 + UZ1) / 2, 2 * hw + 0.2, UZ1 - UZ0 + 0.2, 9.82, 9.95));
    m.scope("side windows", () => paneRow(m, "glassTinted", F, [-5.4, -3.4, -1.4, 0.6, 2.6, 4.25], 1.75, 8.5, 9.5, hw));
    m.scope("bridge windows", () => paneEnd(m, "glassTinted", F, UZ1, 1, [-1.75, 0, 1.75], 1.6, 8.45, 9.55));
    m.scope("aft windows", () => paneEnd(m, "glassTinted", F, UZ0, -1, [-0.95, 0.95], 1.5, 8.5, 9.5));
    m.scope("bridge wings", () => {
      for (const side of [1, -1]) block(m, "lakeWhite", side > 0 ? hw : -3.5, side > 0 ? 3.5 : -hw, 9.55, 9.7, 3.9, 5.1);
    });
    m.scope("roof rail", () => railing(m, "lakeSteel", [[-2.4, 4.8], [2.4, 4.8]], 9.95, 0.5, 1.2));
  });

  m.scope("mast", () => {
    bar(m, "lakeSteel", [0, 9.95, 3.15], [0, 12.8, 2.7], 0.08, 8);
    block(m, "lakeSteel", -1.1, 1.1, 12.15, 12.23, 2.7, 2.8);
    for (const x of [-1.1, 1.1]) ball(m, "lakeSteel", x, 12.19, 2.75, 0.09, 6);
    block(m, "lakeSteel", -0.9, 0.9, 10.75, 10.82, 2.88, 2.98);
    ball(m, "signalGreen", 0, 13.05, 2.7, 0.28, 10);
    m.scope("radar post", () => {
      bar(m, "lakeSteel", [0, 9.95, 1.75], [0, 10.55, 1.75], 0.05, 6);
      block(m, "lakeSteel", -0.45, 0.45, 10.55, 10.62, 1.7, 1.8);
    });
    m.scope("searchlight", () => m.prism("lakeSteel", ngon(8, 0.16, 0, 0, 4.7), 9.95, 10.25));
  });

  m.scope("foredeck", () => {
    const y = (_x: number, z: number): number => pfDeck(z);
    m.scope("rails", () => {
      const path: Array<[number, number]> = [];
      for (const z of [12.4, 14, 15.7, 17.7]) path.push([pfPlan(z) - 0.15, z]);
      railing(m, "lakeSteel", path, y, 1.0, 1.0);
      railing(m, "lakeSteel", path.map(([x, z]) => [-x, z]), y, 1.0, 1.0);
      railing(m, "lakeSteel", [[pfPlan(17.7) - 0.15, 17.7], [-(pfPlan(17.7) - 0.15), 17.7]], y, 1.0, 1.0);
    });
    m.scope("windlass", () => {
      block(m, "lakeSteel", -0.45, 0.45, pfDeck(14.6) - 0.1, pfDeck(14.6) + 0.35, 14.3, 14.9);
      spindle(m, "bootStripe", "x", 14.6, pfDeck(14.6) + 0.45, [[-0.4, 0.2, 0.2], [0.4, 0.2, 0.2]], 8);
    });
    m.scope("bollards", () => {
      for (const side of [1, -1]) m.prism("lakeSteel", ngon(8, 0.13, 0, side * 2.6, 13.2), pfDeck(13.2) - 0.1, pfDeck(13.2) + 0.4);
    });
  });
  m.scope("afterdeck", () => {
    const y = pfDeck(-17);
    m.scope("rails", () => {
      railing(m, "lakeSteel", [[3.8, -15.7], [3.8, -17.6], [-3.8, -17.6], [-3.8, -15.7]], y, 1.0, 1.0);
    });
    m.scope("flag staff", () => bar(m, "lakeSteel", [0, y, -18.0], [0, y + 1.6, -18.1], 0.04, 6));
    m.scope("bollards", () => {
      for (const side of [1, -1]) m.prism("lakeSteel", ngon(8, 0.13, 0, side * 2.9, -16.8), y - 0.1, y + 0.4);
    });
  });
  return m;
}

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const SHIP_CATALOG: CatalogFields = {
  category: "Ships",
  group: "ship",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const SHIPS: ProceduralDesign[] = [
  { id: "proc-vehicle-cruise-ferry", game: { weight: 220, power: 1600, maxspeed: 40, accel: 0.5, draftFrac: 0.17 }, title: "Cruise Ferry", build: cruiseFerry, buildLod: cruiseFerryLod, references: "cruise-ferry", catalog: { ...SHIP_CATALOG, yaw:180 } },
  { id: "proc-vehicle-hydrofoil-ferry", game: { weight: 30, power: 600, maxspeed: 70, accel: 1.5, draftFrac: 0.28 }, title: "Hydrofoil Ferry", build: hydrofoilFerry, buildLod: hydrofoilFerryLod, references: "hydrofoil-ferry", catalog: { ...SHIP_CATALOG, yaw:180 } },
  { id: "proc-vehicle-passenger-ferry", game: { weight: 60, power: 400, maxspeed: 28, accel: 0.9, draftFrac: 0.15 }, title: "Passenger Ferry", build: passengerFerry, buildLod: passengerFerryLod, references: "passenger-ferry", catalog: { ...SHIP_CATALOG, yaw:270 } },
];

/** Stepped decks keep the bow and bridge distinct, within the ordinary ship budget. */
export function cruiseFerryLod(): MeshBuilder {
  const m=new MeshBuilder(PALETTE);
  const plan:Ring=[[-77.5,-8],[-77.5,8],[-55,12.5],[50,12.5],[77.5,0],[50,-12.5],[-55,-12.5]];
  lodLoft(m,'hullRed',plan.map(([x,z])=>[x*.97,z*.75]),0,plan,13.2);
  lodBox(m,'whitePaint',-4,0,140,22,13.2,26.4);
  lodBox(m,'whitePaint',30,0,49,20,26.4,32.4);
  lodBox(m,'whitePaint',30,0,30,17,32.4,40);
  lodBox(m,'funnelGreen',-23,0,8,5,26.4,40);
  return m;
}

// --- the distant hydrofoil and passenger ferry --------------------------------------------
//
// As the cruise ferry's: the hull as plan rings stacked in its paint bands (the
// full model's own plan, keel and section tables), the superstructure as prisms,
// and the windows as bands of the one LOD glass a few centimetres off their walls.

/** A hull's plan at the stations `ss` (rising), half-breadth `half(s)`: a station where it is nil is one point (a bow tip). */
function lodPlan(ss: readonly number[], half: (s: number) => number, along: "x" | "z"): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (const s of ss) if (half(s) > 1e-3) pts.push([s, half(s)]);
  for (const s of [...ss].reverse()) pts.push([s, half(s) > 1e-3 ? -half(s) : 0]);
  const ring = pts.filter((p, i) => pts.findIndex((q) => q[0] === p[0] && q[1] === p[1]) === i);
  return along === "x" ? ring : ring.map(([a, b]) => [b, a]);
}

/** A window band on a wall: the quad (a0..a1 along the length, y0..y1) at beam b, facing `side`, 3 cm proud. */
function lodPane(m: MeshBuilder, F: Frame, a0: number, a1: number, y0: number, y1: number, b0: number, b1: number, side: number): void {
  const [u0, u1] = [side * (b0 + 0.03), side * (b1 + 0.03)];
  lodPolygon(m, LOD_GLASS, [F(a0, y0, u0), F(a1, y0, u1), F(a1, y1, u1), F(a0, y1, u0)], F(0, 0, side));
}

export function hydrofoilFerryLod(): MeshBuilder {
  const m = new MeshBuilder({ ...LOD_PALETTE, ...PALETTE });
  // the bow tip at height y: as far forward as the keel lies below it
  const bow = (y: number): number => {
    let x = 4;
    while (x < 17.25 && hfKeel(x + 0.05) <= y) x += 0.05;
    return x;
  };
  const ring = (y: number) => lodPlan([-17.25, 4, Math.min(9.75, bow(y) - 0.5), bow(y)], (s) => (s >= bow(y) - 1e-9 ? 0 : hfHalfBeam(s, Math.max(y, hfKeel(s) + 0.3))), "x");
  m.scope("hull", () => lodStack(m, [1.9, 2.4, 4.05, 4.6].map((y) => [y, ring(y)] as const), ["signalRed", "hullWhite", "signalRed"], "foilDeck"));
  m.scope("saloon", () => {
    const w = (s: number): number => Math.min(2.4, 1.85 + (s + 15.55) * 0.7, hfPlan(s) - 0.2, 2.4 - Math.max(0, s - 8.5) * 0.3);
    const xs = [-15.55, 8.5, 11.55];
    lodStack(m, [[4.6, lodPlan(xs, w, "x")], [6.5, lodPlan(xs, w, "x")]], ["hullWhite"], "signalRed");
    for (const side of [1, -1]) lodPane(m, ALONG_X, -14.1, 8.4, 5.2, 5.95, 2.4, 2.4, side);
  });
  m.scope("wheelhouse", () => {
    // the profile swept across: white sides, the raked windscreen, the red roof (its back stands against the mast)
    const hw = 1.65;
    const p: Array<[number, number]> = [[4.45, 6.5], [9.9, 6.5], [9.4, 7.42], [4.45, 7.65]];
    for (const z of [-hw, hw]) lodPolygon(m, "hullWhite", p.map(([x, y]): Vec3 => [x, y, z]), [0, 0, z]);
    const wall = (i: number, j: number, mat: string, n: Vec3) => lodPolygon(m, mat, [[p[i]![0], p[i]![1], -hw], [p[j]![0], p[j]![1], -hw], [p[j]![0], p[j]![1], hw], [p[i]![0], p[i]![1], hw]], n);
    wall(1, 2, LOD_GLASS, [1, 0.6, 0]);
    wall(2, 3, "signalRed", [0.05, 1, 0]);
  });
  // the mast up to the radar, the full model's top
  m.scope("mast", () => lodRod(m, "hullWhite", [3.25, 7.4, 0], [3.25, 8.63, 0], 0.12));
  m.scope("foils", () => {
    // each foil's top, a shallow V reaching y = 0, under a plate standing for its struts
    const foil = (x0: number, x1: number, y: number, inner: number, span: number, tipY: number, struts: number) => {
      const cs: Array<[number, number]> = [[-span, tipY], [-inner, y], [inner, y], [span, tipY]];
      for (let i = 0; i + 1 < cs.length; i++) {
        const [a, b] = [cs[i]!, cs[i + 1]!];
        lodPolygon(m, "foilBlue", [[x0, a[1] + 0.12, a[0]], [x1, a[1] + 0.12, a[0]], [x1, b[1] + 0.12, b[0]], [x0, b[1] + 0.12, b[0]]], [0, 1, 0]);
      }
      const xm = (x0 + x1) / 2;
      for (const [dx, n] of [[0.08, 1], [-0.08, -1]] as const) {
        lodPolygon(m, "foilBlue", [[xm + dx, y + 0.12, -struts], [xm + dx, y + 0.12, struts], [xm + dx, 2.3, struts * 0.75], [xm + dx, 2.3, -struts * 0.75]], [n, 0, 0]);
      }
    };
    foil(9.5, 10.63, 0.17, 2.45, 3.15, 0.53, 1.6);
    foil(-12.2, -11.05, -0.12, 2.45, 3.9, 0.5, 2.3);
  });
  return m;
}

export function passengerFerryLod(): MeshBuilder {
  const m = new MeshBuilder({ ...LOD_PALETTE, ...PALETTE });
  const hull = (y: number) => lodPlan([-18.67, -17.07, 5.15, 14, 20.42], (s) => (s >= 20.42 ? 0 : s <= -18.6 ? 2.6 : pfHalfBeam(s, Math.max(y, 0.4))), "z");
  // the boot stripe down to the keel: below it the hull lies under the waterline (draftFrac 0.15, y 2.0)
  m.scope("hull", () => lodStack(m, [0, 2.2, 4.55].map((y) => [y, hull(y)] as const), ["bootStripe", "lakeWhite"], "lakeDeck"));
  const sal = (s: number): number => Math.min(roundEnd(3.3, 0.6, s + 15.5), pfPlan(s) - 0.35);
  m.scope("saloon", () => {
    // the rounded aft end cut square a little inside it
    const zs = [-15.3, -14.9, 5.15, 11.9];
    lodStack(m, [[4.55, lodPlan(zs, sal, "z")], [7.6, lodPlan(zs, sal, "z")]], ["lakeWhite"], "lakeDeck");
    for (const side of [1, -1]) lodPane(m, ALONG_Z, -14.9, 5.15, 5.47, 7.0, 3.3, 3.3, side);
    lodPolygon(m, LOD_GLASS, [[-2.6, 5.5, 11.93], [2.6, 5.5, 11.93], [2.6, 7.0, 11.93], [-2.6, 7.0, 11.93]], [0, 0, 1]);
  });
  m.scope("upper house", () => {
    lodBlock(m, -2.6, 2.6, 7.6, 9.95, -6.97, 5.15, { side: "lakeWhite" });
    for (const side of [1, -1]) lodPane(m, ALONG_Z, -6.4, 5.0, 8.5, 9.5, 2.6, 2.6, side);
    lodPolygon(m, LOD_GLASS, [[-2.5, 8.45, 5.18], [2.5, 8.45, 5.18], [2.5, 9.55, 5.18], [-2.5, 9.55, 5.18]], [0, 0, 1]);
  });
  m.scope("mast", () => lodBar(m, "lakeSteel", [0, 9.95, 3.15], [0, 13.314, 2.7], 0.12, 3));
  return m;
}
