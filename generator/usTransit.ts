// North American passenger cars and urban rail on the carbody kit
// (carbodyKit.ts): the Budd RDC railcar (1949), the New York subway's R160
// (2005) and the Chicago 'L' 5000-series (2009); the Pioneer Zephyr's coach and
// observation car (pioneerZephyr.ts) are drawn by the same builder. One car
// builder (`drawCar`) draws any flat- or round-ended car from a
// `CarDef`: its lofted body, window rows, plug doors opening onto its cabin,
// cab ends with their windscreens and lamps, couplers and trucks. Real size on
// the US loading gauge. See docs/models/us-transit.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { MeshBuilder as Builder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { bogieGeometry, buffers, coupling, exhaust, extrude, horn, paint, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { add, mul, type Pt } from "./sliceLoft.ts";
import { crownPoint, halfSlice, sideAt, sideDecal, sideLettering, sidePanel, sliceCabin, surfaceDisc, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { openable, plugMove } from "./doors.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, endDiaphragm, faceLamps, type CarbodySpec, type Painter } from "./carbodyKit.ts";
import { decalX, knuckleCoupler } from "./usHoodKit.ts";
import { centreCoupler, enumParam } from "./emuParts.ts";
import { METRO_CATALOG } from "./metro.ts";
import { RAIL_CATALOG, coil } from "./cd163.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, underPart, type UnitBody } from "./lodUnits.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
type Band = readonly [number, number, string];

// ---------------------------------------------------------------------------
// The car builder

export interface CarDef {
  spec: CarbodySpec;
  /** Side paint bands (also the door leaves' paint), roof, skirt and underside. */
  bands: readonly Band[];
  roof: string;
  skirt: string;
  under: string;
  /** A painted field over the bands from the front end: up to d behind it, between two heights (a nose's warning panel). */
  field?: { d: number; y: readonly [number, number]; mat: string };
  /** Painted strips on both sides over the bands, the skirt and the roof's arc: d spans, between two heights (a double-deck coach's door strips). */
  strips?: ReadonlyArray<{ d: readonly [number, number]; y: readonly [number, number]; mat: string }>;
  /** Window rows: their sill and head, their d spans, frame paint; `onSide` (+1 or -1) a row on that side only (default both); `cornerR` rounds the frame's and the glass's corners (default square); `glass` the panes' paint (default "glass": a frosted toilet window). */
  windows: ReadonlyArray<{ y: readonly [number, number]; spans: ReadonlyArray<readonly [number, number]>; frame: string; onSide?: number; cornerR?: number; glass?: string }>;
  /** Passenger doors on both sides: d spans, sill and head, the leaf's window; `spanSides[i]` (+1 or -1) puts span i on that side only (default both); `glassCornerR` rounds a pair of narrow leaf windows (`glassW`, `glassPair`), or a single one (`glassW` alone: a porthole) (default square); `glassSurround` sets those rounded windows in a rubber surround with a bright rim (default none). */
  doors: { spans: ReadonlyArray<readonly [number, number]>; y: readonly [number, number]; glass: readonly [number, number]; slides?: readonly number[]; glassW?: number; glassPair?: number; spanSides?: readonly number[]; glassCornerR?: number; glassSurround?: boolean; glassInward?: number };
  /** The door leaves' own paint bands (default the side's bands). */
  doorBands?: readonly Band[];
  /** A cab front painted apart from the sides: its bands, on the shell from the +X tip back to d. */
  front?: { d: number; bands: readonly Band[]; roof?: string };
  /** Both ends painted apart from the middle: their bands on the sides up to d from each end, and the end walls' paint (`cap`). */
  ends?: { d: number; bands: readonly Band[]; cap?: string };
  /** Fluting: thin lines along the side between these heights (stainless cars). */
  /** Horizontal ribs on the sides, round the windows and doors: one band of them, or several. */
  fluting?: Flutes | readonly Flutes[];
  /** A flat cab end: windscreen panes (z0, z1, y0, y1), lamps (z, y, r, lens), the front's paint. */
  cab?: { panes: ReadonlyArray<readonly [number, number, number, number]>; lamps: ReadonlyArray<readonly [number, number, number, string]>; mask?: readonly [number, number, string] };
  /** Which ends are cabs (a flat cab end) and which carry a gangway diaphragm. */
  cabEnds: readonly number[];
  diaphragm: readonly [number, number] | null;
  /** The diaphragm's half width inside its frame (default 0.5). */
  diaphragmW?: number;
  /** Trucks at d, their spec; the coupler kind and height. */
  trucks: readonly number[];
  truck: BogieSpec;
  /** The coupler: AAR knuckle, a unit's centre coupler, or buffers and a screw coupling on a buffer beam (European stock). */
  coupler: "knuckle" | "centre" | "buffers";
  couplerY: number;
  /** With buffers: false leaves the buffer beam out, the buffers standing straight out of the end's own bodywork (default drawn). */
  bufferBeam?: boolean;
  /** The coupling planes beyond the body's ends. */
  gap: readonly [number, number];
  lettering?: ReadonlyArray<{ text: string; d: number; y: number; h: number; mat: string }>;
  /** The cabin's d span (default the whole body): behind a nose's cab. */
  cabin?: readonly [number, number];
  /** Repaints the shell over the bands' painter (default none): paint that changes along the car, its ends. */
  repaint?: (base: Painter) => Painter;
  /** Anything else: roof equipment, underfloor boxes, a nose's windscreen. */
  extras?: (m: MeshBuilder, b: SliceBody, X: (d: number) => number) => void;
}

const LEAF_INSET = 0.02;

/** Whether door span i, or a window row, is on side s (a side-only one, or both). */
const doorOn = (c: CarDef, i: number, s: number) => !c.doors.spanSides?.[i] || c.doors.spanSides[i] === s;
const rowOn = (w: CarDef["windows"][number], s: number) => !w.onSide || w.onSide === s;

/** The body of a car. */
export const carBody = (c: CarDef): SliceBody => {
  const edges = [...new Set([...c.bands.flatMap(([a, b]) => [a, b]), ...(c.front?.bands ?? []).flatMap(([a, b]) => [a, b]), ...(c.ends?.bands ?? []).flatMap(([a, b]) => [a, b]), ...c.windows.flatMap((w) => [w.y[0], w.y[1]])])]
    .filter((y) => y > c.spec.Y + 0.01 && y < c.spec.S - 0.01).sort((a, b) => a - b);
  const strips = (c.strips ?? []).flatMap((p) => [p.d[0], p.d[1]]);
  return carbody({ ...c.spec, edges: [...new Set([...c.spec.edges, ...edges])].sort((a, b) => a - b), ...(strips.length ? { stations: [...(c.spec.stations ?? []), ...strips] } : {}) });
};

/** The doors' leaf boxes on both sides: the doorways into the car's cabin. */
const leavesOf = (c: CarDef): SliceDoorway[] =>
  [1, -1].flatMap((s) => c.doors.spans.flatMap(([a, b], i) => (doorOn(c, i, s) ? [{ s, d0: a + LEAF_INSET, d1: b - LEAF_INSET, y0: c.doors.y[0] + LEAF_INSET, y1: c.doors.y[1] - LEAF_INSET }] : [])));

function door(m: MeshBuilder, c: CarDef, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, i: number): void {
  const [y0, y1] = c.doors.y;
  const k = LEAF_INSET;
  m.scope("outline", () => {
    sidePanel(m, b, X, s, "rubber", d0, d0 + k, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d1 - k, d1, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.004, 0.03);
  });
  const slide = c.doors.slides?.[i] ?? ((d0 + d1) / 2 < b.length / 2 ? 1 : -1);
  const dx = X(d0 + slide * (d1 - d0)) - X(d0);
  openable(m, (mm, o) =>
    mm.moved(plugMove(o, s, dx), () => {
      mm.scope("leaf", () => {
        for (const [a, cc, mat] of c.doorBands ?? c.bands) {
          const [lo, hi] = [Math.max(a, y0 + 0.02), Math.min(cc, y1 - 0.02)];
          if (hi - lo > 1e-6) sidePanel(mm, b, X, s, mat, d0 + 0.02, d1 - 0.02, lo, hi, 0.008, 0.003);
        }
      });
      mm.scope("glass", () => {
        // a narrow window centred on the leaf, or the leaf's full width
        // `glassInward` (default 0) moves a narrow window off the leaf's centre toward the car's middle (a folding door's inner leaf)
        const w = c.doors.glassW, pair = c.doors.glassPair;
        const dm = (d0 + d1) / 2 + (c.doors.glassInward ? ((d0 + d1) / 2 < b.length / 2 ? 1 : -1) * c.doors.glassInward : 0);
        // a double leaf: two narrow windows `glassPair` apart, the leaves' seam between them
        const gr = c.doors.glassCornerR;
        if (w && pair && gr && c.doors.glassSurround) for (const k of [-1, 1]) {
          const [g0, g1] = c.doors.glass, gm = dm + (k * pair) / 2;
          roundedSidePanel(mm, b, X, s, "rubber", gm - w / 2 - 0.035, gm + w / 2 + 0.035, g0 - 0.035, g1 + 0.035, gr + 0.035, 0.009, 0);
          roundedSidePanel(mm, b, X, s, "frameSilver", gm - w / 2 - 0.02, gm + w / 2 + 0.02, g0 - 0.02, g1 + 0.02, gr + 0.02, 0.0105, 0);
          roundedSidePanel(mm, b, X, s, "glass", gm - w / 2, gm + w / 2, g0, g1, gr, 0.012, 0);
        }
        else if (w && pair && gr) for (const k of [-1, 1]) roundedSidePanel(mm, b, X, s, "glass", dm + (k * pair) / 2 - w / 2, dm + (k * pair) / 2 + w / 2, c.doors.glass[0], c.doors.glass[1], gr, 0.012, 0.004);
        else if (w && !pair && gr) roundedSidePanel(mm, b, X, s, "glass", dm - w / 2, dm + w / 2, c.doors.glass[0], c.doors.glass[1], gr, 0.012, 0.004);
        else if (w && pair) for (const k of [-1, 1]) sidePanel(mm, b, X, s, "glass", dm + (k * pair) / 2 - w / 2, dm + (k * pair) / 2 + w / 2, c.doors.glass[0], c.doors.glass[1], 0.012, 0.004);
        else sidePanel(mm, b, X, s, "glass", w ? dm - w / 2 : d0 + 0.12, w ? dm + w / 2 : d1 - 0.12, c.doors.glass[0], c.doors.glass[1], 0.012, 0.004);
        if (w && pair) sidePanel(mm, b, X, s, "rubber", dm - 0.012, dm + 0.012, y0 + 0.04, y1 - 0.04, 0.011, 0.004);
      });
    }),
  );
  m.scope("step", () => sidePanel(m, b, X, s, c.under, d0, d1, y0 - 0.08, y0, 0.006, 0.2));
}

/** A rounded rectangle's outline in (u, v) from (u0, v0) to (u1, v1), corners of radius r in three points each. */
export function roundedOutline(u0: number, u1: number, v0: number, v1: number, r: number): Pt[] {
  const out: Pt[] = [];
  for (const [cu, cv, a0] of [[u1 - r, v0 + r, -Math.PI / 2], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, Math.PI / 2], [u0 + r, v0 + r, Math.PI]] as const)
    for (let i = 0; i <= 2; i++) { const a = a0 + (i / 2) * (Math.PI / 2); out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]); }
  return out;
}

/** A side panel with rounded corners (sidePanel's outline rounded): a slab `depth` deep, or with depth 0 its face alone. */
function roundedSidePanel(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, y0: number, y1: number, r: number, proud: number, depth: number): void {
  const dm = (d0 + d1) / 2;
  const pts = roundedOutline(d0, d1, y0, y1, Math.min(r, (d1 - d0) / 2, (y1 - y0) / 2)).map(([d, y]): Vec3 => {
    const q = sideAt(b, dm, y, s);
    return add([X(d), y, q.z], mul(q.n, proud));
  });
  const n = sideAt(b, dm, (y0 + y1) / 2, s).n;
  if (depth > 0) m.slab(mat, pts, mul(n, -depth));
  else m.facets(mat, pts.slice(1, -1).flatMap((p, i) => [pts[0]!, p, pts[i + 2]!]), n);
}

/** Fluting along a side from d0 to d1 between heights, broken over windows and doors. */
/** A band of side ribs: from y0 to y1, one every `pitch`, in `mat`. */
export interface Flutes { y0: number; y1: number; pitch: number; mat: string }

function fluting(m: MeshBuilder, c: CarDef, b: SliceBody, X: (d: number) => number, s: number): void {
  const all = c.fluting!;
  for (const f of "y0" in all ? [all] : all) flutes(m, c, b, X, s, f);
}

function flutes(m: MeshBuilder, c: CarDef, b: SliceBody, X: (d: number) => number, s: number, f: Flutes): void {
  const holes: Array<readonly [number, number, number, number]> = [
    ...c.windows.filter((w) => rowOn(w, s)).flatMap((w) => w.spans.map(([a, e]) => [a - 0.04, e + 0.04, w.y[0] - 0.04, w.y[1] + 0.04] as const)),
    ...c.doors.spans.filter((_, i) => doorOn(c, i, s)).map(([a, e]) => [a - 0.04, e + 0.04, -9, 99] as const),
  ];
  for (let y = f.y0; y < f.y1; y += f.pitch) {
    const cuts = holes.filter((h) => y + 0.018 > h[2] && y < h[3]).map((h) => [h[0], h[1]] as const).sort((p, q) => p[0] - q[0]);
    let from = 0.3;
    const runs: Array<[number, number]> = [];
    for (const [p, q] of cuts) { if (p > from + 0.05) runs.push([from, p]); from = Math.max(from, q); }
    if (b.length - 0.3 > from + 0.05) runs.push([from, b.length - 0.3]);
    const tris: Pt[] = [];
    for (const [p, q] of runs) tris.push([p, y], [q, y], [q, y + 0.018], [p, y], [q, y + 0.018], [p, y + 0.018]);
    if (tris.length) sideDecal(m, b, X, s, f.mat, tris, 0.003);
  }
}

/**
 * A car facing +X in m, X(d) its body's map to model x: `trucks` false at an
 * end whose truck a Jacobs bogie under the joint replaces (a set's inner ends),
 * `inside` the ends inside an articulated set (no diaphragm frame or coupler).
 */
export function drawCar(m: MeshBuilder, c: CarDef, X: (d: number) => number, o: { trucks?: readonly boolean[]; inside?: readonly number[] } = {}): SliceBody {
  const b = carBody(c);
  const sides: Painter = bandPainter(c.bands, c.roof, c.under, c.skirt, c.spec.S);
  const front = c.front && { d: c.front.d, paint: bandPainter(c.front.bands, c.front.roof ?? c.roof, c.under, c.skirt, c.spec.S) };
  const en = c.ends && { ...c.ends, paint: bandPainter(c.ends.bands, c.roof, c.under, c.skirt, c.spec.S) };
  const middle: Painter = en
    ? (d, y, r) => (r === "cap" && en.cap ? en.cap : (d < en.d || d > c.spec.length - en.d) && r !== "bottom" && r !== "skirt" ? en.paint(d, y, r) : sides(d, y, r))
    : sides;
  const banded: Painter = front ? (d, y, r) => (d < front.d && r !== "bottom" && r !== "skirt" ? front.paint : middle)(d, y, r) : middle;
  // a warning panel paints over both
  const f = c.field;
  const fielded: Painter = f ? (d, y, r) => (r !== "bottom" && d <= f.d && y >= f.y[0] && y <= f.y[1] ? f.mat : banded(d, y, r)) : banded;
  const strips = c.strips ?? [];
  const stripped: Painter = strips.length
    ? (d, y, r) => {
      const p = r === "bottom" || r === "cap" ? undefined : strips.find((q) => d >= q.d[0] && d <= q.d[1] && y >= q.y[0] && y <= q.y[1]);
      return p ? p.mat : fielded(d, y, r);
    }
    : fielded;
  const painter: Painter = c.repaint ? c.repaint(stripped) : stripped;
  const leaves = leavesOf(c);
  const cut = leaves.map((l) => ({ ...l, d0: l.d0 - 0.002, d1: l.d1 + 0.002, y0: l.y0 - 0.002, y1: l.y1 + 0.002 }));
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter, cut));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        c.windows.forEach((w, r) => rowOn(w, s) &&
          m.scope(`windows ${r + 1}`, () => w.spans.forEach(([a, e], i) => m.scope(`window ${i + 1}`, () => {
            if (w.cornerR) {
              roundedSidePanel(m, b, X, s, w.frame, a, e, w.y[0], w.y[1], w.cornerR, 0.006, 0.03);
              roundedSidePanel(m, b, X, s, w.glass ?? "glass", a + 0.04, e - 0.04, w.y[0] + 0.04, w.y[1] - 0.04, Math.max(0.01, w.cornerR - 0.03), 0.012, 0);
              return;
            }
            sidePanel(m, b, X, s, w.frame, a, e, w.y[0], w.y[1], 0.006, 0.03);
            sidePanel(m, b, X, s, w.glass ?? "glass", a + 0.04, e - 0.04, w.y[0] + 0.04, w.y[1] - 0.04, 0.012, 0.004);
          }))));
        m.scope("doors", () => c.doors.spans.forEach(([a, e], i) => doorOn(c, i, s) && m.scope(`door ${i + 1}`, () => door(m, c, b, X, s, a, e, i))));
        if (c.fluting) m.scope("fluting", () => fluting(m, c, b, X, s));
        for (const l of c.lettering ?? []) m.scope("lettering", () => sideLettering(m, b, X, s, l.text, l.d, l.y, l.h, l.mat, 0.012));
      });
    if (leaves.length) {
      const panes = [1, -1].flatMap((s) => c.windows.filter((w) => rowOn(w, s)).flatMap((w) => w.spans.map(([a, e]) => ({ s, d0: a + 0.04, d1: e - 0.04, y0: w.y[0] + 0.04, y1: w.y[1] - 0.04 }))));
      sliceCabin(m, b, X, c.cabin?.[0] ?? 0, c.cabin?.[1] ?? b.length, leaves, panes);
    }
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const x = X(e > 0 ? 0 : b.length);
      const inside = o.inside?.includes(e);
      if (c.cab && c.cabEnds.includes(e)) {
        m.scope("cab", () => {
          if (c.cab!.mask) { const [y0, y1, mt] = c.cab!.mask; decalX(m, mt, x + e * 0.003, e, -c.spec.W * 0.93, c.spec.W * 0.93, y0, y1); }
          for (const [z0, z1, y0, y1] of c.cab!.panes) {
            decalX(m, "rubber", x + e * 0.006, e, e * z0, e * z1, y0, y1);
            decalX(m, "cabGlass", x + e * 0.009, e, e * z0 + 0.03 * Math.sign(z1 - z0) * e, e * z1 - 0.03 * Math.sign(z1 - z0) * e, y0 + 0.03, y1 - 0.03);
          }
          faceLamps(m, e, e * x, c.cab!.lamps);
        });
      } else if (c.diaphragm && !inside && !(e > 0 ? c.spec.front : c.spec.rear)) endDiaphragm(m, e, x, c.diaphragm[0], c.diaphragm[1], c.diaphragmW ?? 0.5);
      if (!inside)
        m.scope("coupler", () => {
          const face = e * x + c.gap[e > 0 ? 0 : 1];
          if (c.coupler === "knuckle") knuckleCoupler(m, e, e * x - 0.3, face, c.couplerY);
          else if (c.coupler === "buffers") {
            // the beam under the end, the buffer heads at the coupling plane
            const beam = face - 0.62;
            if (c.bufferBeam !== false) block(m, "underframe", ...((e > 0 ? [beam - 0.25, beam] : [-beam, -beam + 0.25]) as [number, number]), c.couplerY - 0.25, c.couplerY + 0.22, -1.3, 1.3);
            buffers(m, e, beam, face, c.couplerY, "round");
            coupling(m, e, beam, c.couplerY - 0.05);
          } else centreCoupler(m, e, x - e * 0.6, e * face, c.couplerY, "knuckle");
        });
    });
  m.scope("running gear", () => {
    c.trucks.forEach((d, i) => { if (o.trucks?.[i] !== false) m.scope(`truck ${i + 1}`, () => m.bogie(() => bogieGeometry(m, X(d), c.truck))); });
  });
  c.extras?.(m, b, X);
  return b;
}

export const truckSpec = (wb: number, wheelR: number, bolster: number): BogieSpec => ({
  axles: [-wb / 2, wb / 2], wheelR, frameHalf: wb / 2 + wheelR + 0.15, frameTop: wheelR + 0.42, frameBottom: wheelR + 0.08, frameZ: [0.92, 1.04], primary: "coil",
  secondary: [-0.4, 0.4], secondaryZ: 1.08, bolster,
});

/** The LOD body of a car. */
export function carLodBody(c: CarDef, X: (d: number) => number, section?: number): UnitBody {
  const b = carbody({ ...c.spec, edges: [] });
  const mid = b.length / 2;
  const top = b.C(mid);
  const side: LodBand[] = [...c.bands.map(([a, e, mt]): [number, number, string] => [Math.max(a, c.spec.B), Math.min(e, c.spec.S), mt]).filter(([a, e]) => e > a + 1e-6), [c.spec.S, top, c.roof]];
  const nose = (rear: boolean) => {
    const n = rear ? c.spec.rear : c.spec.front;
    if (!n) return { tip: [[c.spec.B, X(rear ? b.length : 0)]] as Array<readonly [number, number]> };
    const ys = [c.spec.B, 1.4, 2.0, 2.6, 3.2, top].filter((y, i, a) => y <= top && (i === 0 || y > a[i - 1]!));
    const at = (y: number) => { for (let k = 0; k <= 600; k++) { const d = k * 0.01; const dd = rear ? b.length - d : d; if (b.B(dd) <= y && b.C(dd) >= y) return dd; } return rear ? b.length : 0; };
    return { tip: ys.map((y) => [y, X(at(Math.min(y, top - 0.01)))] as const), setback: [[c.spec.B, 0.8], [top, 0.5]] as Array<readonly [number, number]> };
  };
  const main = c.windows[0];
  return {
    y0: c.spec.B, hw: [[c.spec.B, c.spec.wl], [c.spec.A, c.spec.wa], [c.spec.Y, c.spec.W], [c.spec.S, c.spec.W * c.spec.lean], [top, 0.4]],
    side, roof: c.roof, front: nose(false), rear: nose(true),
    windows: main && main.spans.length ? [{ u: [Math.min(X(main.spans[0]![0]), X(main.spans[main.spans.length - 1]![1])), Math.max(X(main.spans[0]![0]), X(main.spans[main.spans.length - 1]![1]))] as const, y: [main.y[0], main.y[1]] as const, mat: LOD_GLASS }] : [],
    ...(section !== undefined ? { section } : {}),
  };
}

export function carLod(c: CarDef, X: (d: number) => number, palette: Record<string, MaterialSpec>): MeshBuilder {
  const body = carLodBody(c, X);
  const parts = bogieParts(c.trucks.map((d) => [X(d), c.truck.frameHalf] as const), c.spec.B);
  return fitUnit({ palette, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Budd RDC: the stainless-steel self-propelled railcar, a cab at each end

export type RdcType = "rdc1" | "rdc2";
export const RDC_PARAMS: readonly ParamSpec[] = [enumParam("variant", "Type", { rdc1: "RDC-1", rdc2: "RDC-2" })];
export const RDC_LENGTH = ft(85);
/** The coupling plane to the end wall (the CB drawing: 25.91 m over the coupling points, the end walls about 0.25 m inside). */
const RDC_GAP = 0.25;
const RDC_BODY = RDC_LENGTH - 2 * RDC_GAP;
const RDC_TRUCKS = ft(59, 6);
const RDC_TRUCK_D = [RDC_BODY / 2 - RDC_TRUCKS / 2, RDC_BODY / 2 + RDC_TRUCKS / 2];
/** The end: the corners swept 0.3 m back in plan, the end wall's top rolling back into the roof as a dome. */
const rdcEnd = {
  len: 0.3, tip: 0.88, power: 2,
  C: [[0, 3.5], [0.1, 3.7], [0.2, 3.81], [0.3, 3.89], [0.45, 3.95], [0.6, 3.98]] as Pt[],
  S: [[0, 3.2], [0.1, 3.25], [0.2, 3.28], [0.3, 3.3]] as Pt[],
};
const RDC_PAL = { ss: paint("#c6cacd", 0.3), ssDark: paint("#9da1a4", 0.4), under: paint("#2a2c2f", 0.85) };

/**
 * The side's openings, in metres from the coupling plane at that side's engineer end (the CB drawing,
 * 48.9 px/m): the engineer sits on the right at each end, so each side has his window and a door
 * behind it at one end and a door at the corner at the other (the B&M 6211, AEAX 6202 and Reading 9163
 * photographs). Eleven 1.4 m windows, a wider pier after the fifth.
 */
const RDC_WIN_P = [3.675, 5.485, 7.32, 9.16, 10.995, 13.185, 15.005, 16.815, 18.66, 20.47, 22.305];
const RDC_WIN = { w: 1.52, y: [2.06, 2.81] as const };
const RDC_CAB_WIN = { p: [0.45, 1.15] as const, y: [2.3, 3.0] as const };
const RDC_CAB_DOOR = [1.55, 2.5] as const;
/** From the other end's coupling plane: the door at the corner and the toilet's narrow window behind it. */
const RDC_CORNER_DOOR = [0.6, 1.55] as const;
const RDC_TOILET = { p: [1.85, 2.17] as const, y: [2.2, 2.85] as const };
/** The RDC-2's baggage section at the front: its door (d), the narrow window before the seats. */
const RDC_BAGGAGE = { d: [1.9, 3.3] as const, y: [1.1, 3.15] as const, glass: [2.0, 3.2, 2.38, 2.95] as const, small: [7.2, 7.62] as const };
/** The radiator canopy on the roof (d), its section, the ramps at its ends. */
const RDC_CANOPY = { d: [8.63, 14.85] as const, ramp: 0.75, half: 1.1 };
const CANOPY_SECTION: Pt[] = [[-1.08, 3.72], [1.08, 3.72], [1.05, 3.9], [0.93, 4.32], [0.76, 4.43], [-0.76, 4.43], [-0.93, 4.32], [-1.05, 3.9]];
/** Louvred roof vents near each end (d from the end) on the roof's slope (arc length from the shoulder). */
const RDC_VENTS = { d: [[2.3, 2.65], [2.85, 3.2]] as const, u: [0.32, 0.58] as const };

function rdcDef(t: RdcType): CarDef {
  const L = RDC_BODY;
  const bag = t === "rdc2";
  // a span measured from the coupling plane at side s's engineer end (or its other end) as d
  const at = (s: number, fromCab: boolean, [a, b]: readonly [number, number]): [number, number] =>
    (s > 0) === fromCab ? [a - RDC_GAP, b - RDC_GAP] : [L - (b - RDC_GAP), L - (a - RDC_GAP)];
  // the RDC-2 keeps the eight windows nearest its passenger end
  const wins = (s: number) => RDC_WIN_P.map((p) => [p - RDC_WIN.w / 2, p + RDC_WIN.w / 2] as const).filter((_, i) => !bag || (s > 0 ? i >= 3 : i <= 7)).map((p) => at(s, true, p));
  const small = (s: number): Array<[number, number]> => (bag ? [[...RDC_BAGGAGE.small]] : [at(s, false, RDC_TOILET.p)]);
  const doors: Array<[[number, number], number]> = [
    ...(bag ? [] : [[at(1, true, RDC_CAB_DOOR), 1] as [[number, number], number]]),
    [at(1, false, RDC_CORNER_DOOR), 1], [at(-1, true, RDC_CAB_DOOR), -1], [at(-1, false, RDC_CORNER_DOOR), -1],
  ];
  return {
    spec: { length: L, W: 1.533, Y: 1.15, S: 3.3, C: 3.98, lean: 0.975, arc: 8, B: 1.0, wl: 1.47, A: 1.08, wa: 1.52, front: rdcEnd, rear: rdcEnd, edges: [], step: 1.0, noseStep: 0.1 },
    bands: [[0, 9, "ss"]], roof: "ss", skirt: "ss", under: "under",
    windows: [1, -1].flatMap((s) => [
      { y: RDC_WIN.y, spans: wins(s), frame: "ssDark", onSide: s, cornerR: 0.13 },
      { y: RDC_CAB_WIN.y, spans: [at(s, true, RDC_CAB_WIN.p)], frame: "ssDark", onSide: s, cornerR: 0.1 },
      { y: RDC_TOILET.y, spans: small(s), frame: "ssDark", onSide: s, cornerR: 0.08 },
    ]),
    doors: { spans: doors.map(([sp]) => sp), spanSides: doors.map(([, s]) => s), y: [1.1, 3.22], glass: [2.3, 3.0], glassW: 0.5 },
    fluting: { y0: 1.16, y1: 2.0, pitch: 0.093, mat: "ssDark" },
    cab: { panes: [], lamps: [[-1.12, 3.03, 0.055, "lampRed"], [1.12, 3.03, 0.055, "lampRed"]] },
    cabEnds: [1, -1], diaphragm: null,
    // the Budd trucks are drawn with the extras (rdcTruck)
    trucks: [], truck: truckSpec(ft(8, 6), ft(0, 16.5), 0.95),
    coupler: "knuckle", couplerY: 0.88, gap: [RDC_GAP, RDC_GAP],
    lettering: [{ text: bag ? "BUDD RDC-2" : "BUDD RDC-1", d: L / 2, y: 1.45, h: 0.18, mat: "ssDark" }],
    extras: (m, b, X) => {
      if (bag) m.scope("baggage doors", () => { for (const s of [1, -1]) rdcBaggageDoor(m, b, X, s); });
      m.scope("door steps", () => doors.forEach(([[a, e], s]) => rdcSteps(m, X, s, a, e)));
      m.scope("roof", () => rdcRoof(m, b, X));
      m.scope("underfloor", () => rdcUnderfloor(m, X));
      m.scope("running gear", () => RDC_TRUCK_D.forEach((d, i) => m.scope(`truck ${i + 1}`, () => m.bogie(() => rdcTruck(m, X(d))))));
      for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => rdcEndFace(m, b, e, Math.abs(X(e > 0 ? 0 : L))));
    },
  };
}

/** A block between two d stations (in either order) mapped by X. */
const rdcBlock = (m: MeshBuilder, X: (d: number) => number, mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) =>
  block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, Math.min(z0, z1), Math.max(z0, z1));

/** The RDC-2's baggage door on side s: a sliding leaf with its seams and a window high up. */
function rdcBaggageDoor(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number): void {
  const [d0, d1] = RDC_BAGGAGE.d, [y0, y1] = RDC_BAGGAGE.y, k = 0.025;
  for (const [a, e, p, q] of [[d0, d0 + k, y0, y1], [d1 - k, d1, y0, y1], [d0 + k, d1 - k, y1 - k, y1], [d0 + k, d1 - k, y0, y0 + k]] as const) sidePanel(m, b, X, s, "rubber", a, e, p, q, 0.008, 0.02);
  const [g0, g1, h0, h1] = RDC_BAGGAGE.glass;
  sidePanel(m, b, X, s, "ssDark", g0, g1, h0, h1, 0.008, 0.02);
  sidePanel(m, b, X, s, "glass", g0 + 0.04, g1 - 0.04, h0 + 0.04, h1 - 0.04, 0.012, 0.004);
  // the leaf's track over it
  sidePanel(m, b, X, s, "ssDark", d0 - 0.1, d1 + 1.4, y1 + 0.03, y1 + 0.07, 0.02, 0.03);
}

/** The step well under a side door (d0..d1) on side s: two treads between cheek plates, and the grab irons beside the door. */
function rdcSteps(m: MeshBuilder, X: (d: number) => number, s: number, d0: number, d1: number): void {
  const zo = 1.47, zi = 1.12;
  rdcBlock(m, X, "under", d0 + 0.03, d1 - 0.03, 0.44, 0.995, s * zi, s * (zi + 0.03));
  for (const d of [d0, d1 - 0.03]) rdcBlock(m, X, "ss", d, d + 0.03, 0.4, 0.995, s * zi, s * zo);
  for (const y of [0.42, 0.71]) rdcBlock(m, X, "ssDark", d0 + 0.03, d1 - 0.03, y, y + 0.04, s * (zi + 0.03), s * (zo - 0.02));
  for (const d of [d0 - 0.07, d1 + 0.07]) m.rod("handrail", [X(d), 1.3, s * 1.575], [X(d), 2.55, s * 1.575], 0.014, 6);
}

/** The roof's arc at d on its outer side: the point at arc length u from the shoulder, and the facet's outward normal (z, y). */
function rdcArc(b: SliceBody, d: number): { len: number; at: (u: number) => { p: Pt; n: Pt; seg: number } } {
  const h = halfSlice(b, d), arc = h.slice(4 + b.edges(d).length);
  const cum = [0];
  for (let i = 0; i + 1 < arc.length; i++) cum.push(cum[i]! + Math.hypot(arc[i + 1]![0] - arc[i]![0], arc[i + 1]![1] - arc[i]![1]));
  return {
    len: cum[cum.length - 1]!,
    at: (u) => {
      let i = 0;
      while (i + 2 < cum.length && u > cum[i + 1]!) i++;
      const [a, c] = [arc[i]!, arc[i + 1]!], l = cum[i + 1]! - cum[i]!, t = (u - cum[i]!) / l;
      return { p: [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t], n: [(c[1] - a[1]) / l, -(c[0] - a[0]) / l], seg: i };
    },
  };
}

/** The roof: its flutes, the radiator canopy with its grilles and exhausts, the end vents and the horns. */
function rdcRoof(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const L = b.length, arc = rdcArc(b, L / 2), [c0, c1] = RDC_CANOPY.d, cm = (c0 + c1) / 2;
  const vents = [...RDC_VENTS.d.map(([a, e]) => [a, e] as const), ...RDC_VENTS.d.map(([a, e]) => [L - e, L - a] as const)];
  // a flat strip on the arc from u0 to u1 (one facet), d0..d1, `proud` off it
  const strip = (s: number, mat: string, u0: number, u1: number, d0: number, d1: number, proud: number) => {
    const p = arc.at(u0), q = arc.at(u1), n = p.n;
    const P = (d: number, r: Pt): Vec3 => [X(d), r[1] + n[1] * proud, s * (r[0] + n[0] * proud)];
    m.facets(mat, [P(d0, p.p), P(d1, p.p), P(d1, q.p), P(d0, p.p), P(d1, q.p), P(d0, q.p)], [0, n[1], s * n[0]]);
  };
  m.scope("flutes", () => {
    for (let u = 0.07; u + 0.03 < arc.len - 0.05; u += 0.1) {
      const p = arc.at(u), q = arc.at(u + 0.024);
      if (p.seg !== q.seg) continue;
      const cuts: Array<readonly [number, number]> = [];
      if (p.p[0] < RDC_CANOPY.half + 0.04) cuts.push([c0 - 0.05, c1 + 0.05]);
      if (u + 0.03 > RDC_VENTS.u[0] - 0.03 && u < RDC_VENTS.u[1] + 0.03) cuts.push(...vents.map(([a, e]) => [a - 0.04, e + 0.04] as const));
      cuts.sort((x, y) => x[0] - y[0]);
      let from = 0.9;
      const runs: Array<[number, number]> = [];
      for (const [a, e] of cuts) { if (a > from + 0.05) runs.push([from, a]); from = Math.max(from, e); }
      if (L - 0.9 > from + 0.05) runs.push([from, L - 0.9]);
      for (const s of [1, -1]) for (const [a, e] of runs) strip(s, "ssDark", u, u + 0.024, a, e, 0.004);
    }
  });
  m.scope("vents", () => {
    for (const s of [1, -1]) for (const [a, e] of vents) {
      const p = arc.at(RDC_VENTS.u[0]), q = arc.at(RDC_VENTS.u[1]), n: Vec3 = [0, p.n[1], s * p.n[0]];
      const P = (d: number, r: Pt, o: number): Vec3 => [X(d), r[1] + n[1] * o, s * r[0] + n[2] * o];
      m.slab("louvre", [P(a, p.p, 0.03), P(e, p.p, 0.03), P(e, q.p, 0.03), P(a, q.p, 0.03)], [-n[0] * 0.05, -n[1] * 0.05, -n[2] * 0.05]);
      for (let k = 1; k < 4; k++) {
        const r = arc.at(RDC_VENTS.u[0] + ((RDC_VENTS.u[1] - RDC_VENTS.u[0]) * k) / 4);
        m.rod("grille", P(a + 0.02, r.p, 0.035), P(e - 0.02, r.p, 0.035), 0.012, 4);
      }
    }
  });
  m.scope("radiator canopy", () => {
    const low = CANOPY_SECTION.map(([z, y]): Pt => [z * 0.85, 3.75 + (y - 3.75) * 0.2]);
    const r = RDC_CANOPY.ramp;
    m.sweep("ss", "x", low, X(c0), CANOPY_SECTION, X(c0 + r), false);
    m.sweep("ss", "x", CANOPY_SECTION, X(c0 + r), CANOPY_SECTION, X(c1 - r), false);
    m.sweep("ss", "x", CANOPY_SECTION, X(c1 - r), low, X(c1), false);
    // the radiator grilles on its sloped sides, the engine air intake between them
    const [a, c] = [CANOPY_SECTION[2]!, CANOPY_SECTION[3]!];
    const nz = c[1] - a[1], ny = -(c[0] - a[0]), nl = Math.hypot(nz, ny);
    for (const s of [1, -1]) {
      const n: Vec3 = [0, ny / nl, (s * nz) / nl];
      const P = (d: number, t: number, o: number): Vec3 => [X(d), a[1] + (c[1] - a[1]) * t + n[1] * o, s * (a[0] + (c[0] - a[0]) * t) + n[2] * o];
      for (const [d0, d1] of [[c0 + r + 0.15, cm - 0.55], [cm + 0.55, c1 - r - 0.15]] as const) {
        m.slab("grille", [P(d0, 0.1, 0.006), P(d1, 0.1, 0.006), P(d1, 0.9, 0.006), P(d0, 0.9, 0.006)], [-n[0] * 0.01, -n[1] * 0.01, -n[2] * 0.01]);
        for (let k = 1; k < 6; k++) m.rod("louvre", P(d0 + 0.03, 0.1 + (0.8 * k) / 6, 0.012), P(d1 - 0.03, 0.1 + (0.8 * k) / 6, 0.012), 0.01, 4);
      }
    }
    block(m, "grille", Math.min(X(cm - 0.4), X(cm + 0.4)), Math.max(X(cm - 0.4), X(cm + 0.4)), 4.425, 4.445, -0.55, 0.55);
    exhaust(m, X(cm - 0.75), 0.32, 4.4, 4.58, 0.17, 0.17);
    exhaust(m, X(cm + 0.75), -0.32, 4.4, 4.58, 0.17, 0.17);
  });
  // the horns behind each end's dome, pointing ahead
  for (const e of [1, -1]) {
    const d = (k: number) => (e > 0 ? k : L - k);
    horn(m, e, X(d(0.95)), 0.15, 4.08);
    horn(m, e, X(d(1.15)), -0.15, 4.08);
  }
}

/** Under the floor: an engine with its torque converter by each truck, driving the truck's inner axle, the fuel tank, batteries and air reservoirs. */
function rdcUnderfloor(m: MeshBuilder, X: (d: number) => number): void {
  const L = RDC_BODY, tc = [L / 2 - RDC_TRUCKS / 2, L / 2 + RDC_TRUCKS / 2], axle = ft(8, 6) / 2;
  for (const [k, dir] of [[0, 1], [1, -1]] as const) {
    const at = (o: number) => tc[k]! + dir * o;
    m.scope("engine", () => {
      rdcBlock(m, X, "under", at(2.3), at(4.8), 0.42, 0.99, -0.6, 0.62);
      rdcBlock(m, X, "black", at(2.5), at(4.6), 0.32, 0.42, -0.42, 0.42);
      rdcBlock(m, X, "under", at(1.85), at(2.3), 0.48, 0.92, -0.38, 0.38);
      // the louvred side of the engine's casing
      for (const s of [1, -1]) for (let y = 0.52; y < 0.92; y += 0.09) rdcBlock(m, X, "grille", at(2.55), at(4.55), y, y + 0.04, s * 0.6, s * 0.64);
      m.rod("underframe", [X(at(1.85)), 0.62, 0], [X(at(axle + 0.15)), 0.46, 0], 0.05, 6);
    });
  }
  const tank: Pt[] = [[-0.75, 0.45], [0.75, 0.45], [0.88, 0.58], [0.88, 0.99], [-0.88, 0.99], [-0.88, 0.58]];
  m.scope("fuel tank", () => m.sweep("under", "x", tank, X(13.4), tank, X(15.6)));
  m.scope("batteries", () => { rdcBlock(m, X, "under", 9.4, 11.3, 0.55, 0.99, 0.35, 1.28); rdcBlock(m, X, "under", 11.5, 12.9, 0.6, 0.99, -1.25, -0.3); });
  m.scope("air reservoirs", () => { for (const z of [-1.05, -0.65]) m.sweep("under", "x", ngon(10, 0.17, 0, z, 0.78), X(9.0), ngon(10, 0.17, 0, z, 0.78), X(11.3)); });
}

/** The RDC end door's outline (z half width, sill, head) around the middle windscreen pane, and the headlight housing over it. */
const RDC_END_DOOR = { z: 0.44, y0: 1.12, y1: 3.08, seam: 0.025 };
const RDC_HOOD = { z: 0.29, y0: 3.17, y1: 3.5, r: 0.11, back: 0.5, out: 0.04 };

/** A rounded oblong in (z, y): half width w, from y0 to y1, corners of radius r. */
function hoodRing(w: number, y0: number, y1: number, r: number): Pt[] {
  const ring: Pt[] = [];
  for (const [cz, cy, a0] of [[w - r, y0 + r, -Math.PI / 2], [w - r, y1 - r, 0], [-w + r, y1 - r, Math.PI / 2], [-w + r, y0 + r, Math.PI]] as const)
    for (let i = 0; i <= 3; i++) { const a = a0 + (i / 3) * (Math.PI / 2); ring.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return ring;
}

/** The end windows (z0, z1, sill, head): tall, with rounded corners (B&M 6211, Farina). */
const RDC_END_PANES = [[-1.26, -0.58, 2.18, 2.95], [0.58, 1.26, 2.18, 2.95], [-0.29, 0.29, 2.2, 2.97]] as const;

/** An RDC cab end at |x| = face, facing e: three rounded end windows, the end door's seams and grab irons, the headlight housing with its twin lamps and the brow over it, and under the floor the anticlimber, the end sheet with the coupler pocket, the step, the MU sockets and the air hoses. */
function rdcEndFace(m: MeshBuilder, b: SliceBody, e: number, face: number): void {
  const x = e * face, { z, y0, y1, seam } = RDC_END_DOOR;
  const ax = (a: number, c: number): [number, number] => (e > 0 ? [x + a, x + c] : [x - c, x - a]);
  const flat = (mat: string, off: number, z0: number, z1: number, v0: number, v1: number, r: number) => {
    const p = roundedOutline(z0, z1, v0, v1, r).map(([zz, yy]): Vec3 => [x + e * off, yy, zz]);
    m.facets(mat, p.slice(1, -1).flatMap((q, i) => [p[0]!, q, p[i + 2]!]), [e, 0, 0]);
  };
  m.scope("end windows", () => {
    for (const [z0, z1, v0, v1] of RDC_END_PANES) {
      flat("rubber", 0.006, z0, z1, v0, v1, 0.1);
      flat("cabGlass", 0.009, z0 + 0.03, z1 - 0.03, v0 + 0.03, v1 - 0.03, 0.07);
    }
  });
  m.scope("end door", () => {
    const on = x + e * 0.004;
    decalX(m, "rubber", on, e, -z, -z + seam, y0, y1);
    decalX(m, "rubber", on, e, z - seam, z, y0, y1);
    decalX(m, "rubber", on, e, -z + seam, z - seam, y1 - seam, y1);
    for (const s of [-1, 1]) m.rod("handrail", [x + e * 0.06, 1.45, s * (z + 0.08)], [x + e * 0.06, 2.6, s * (z + 0.08)], 0.013, 6);
  });
  // the rain gutter along the top of the end wall, under the dome
  m.scope("gutter", () => block(m, "ss", ...ax(-0.02, 0.03), 3.11, 3.14, -1.3, 1.3));
  m.scope("headlight", () => {
    const h = RDC_HOOD, ring = hoodRing(h.z, h.y0, h.y1, h.r);
    m.sweep("ss", "x", ring, x - e * h.back, ring, x + e * h.out);
    const bezel = hoodRing(h.z - 0.03, h.y0 + 0.03, h.y1 - 0.03, h.r - 0.03);
    m.sweep("black", "x", bezel, x + e * h.out, bezel, x + e * (h.out + 0.012));
    faceLamps(m, e, face + h.out + 0.012, [[-0.125, (h.y0 + h.y1) / 2, 0.08, "lampHead"], [0.125, (h.y0 + h.y1) / 2, 0.08, "lampHead"]]);
    // the brow over the housing, rising from the end wall's top corners over the dome (B&M 6211)
    const onDome = (zz: number, yy: number): Vec3 => {
      let dd = 0;
      for (let k = 0; k <= 80; k++) { dd = k * 0.01; if (crownPoint(b, e > 0 ? dd : b.length - dd, Math.abs(zz))[1] >= yy) break; }
      return [e * (face - dd + 0.02), yy + 0.012, zz];
    };
    const brow: Pt[] = [[-0.85, 3.16], [-0.62, 3.42], [-0.42, 3.57], [0.42, 3.57], [0.62, 3.42], [0.85, 3.16]];
    for (let i = 0; i + 1 < brow.length; i++) m.rod("ss", onDome(...brow[i]!), onDome(...brow[i + 1]!), 0.022, 6);
  });
  m.scope("end sill", () => {
    // the anticlimber along the floor, the step plate before the end door
    block(m, "ss", ...ax(-0.05, 0.07), 0.98, 1.08, -1.32, 1.32);
    block(m, "ssDark", ...ax(0.06, 0.2), 1.05, 1.085, -0.5, 0.5);
    // the end sheet down to 0.52 m, the coupler in its pocket, the MU sockets, air hoses and corner steps
    const [a, c] = ax(-0.32, -0.01);
    for (const s of [-1, 1]) {
      const sec: Pt[] = [[s * 0.33, 1.06], [s * 1.32, 1.06], [s * 1.22, 0.52], [s * 0.33, 0.52]];
      m.sweep("ss", "x", sec, a, sec, c);
      block(m, "black", ...ax(-0.01, 0.05), 0.78, 0.9, ...((s > 0 ? [0.62, 0.74] : [-0.74, -0.62]) as [number, number]));
      m.rod("black", [x + e * 0.03, 0.74, s * 0.48], [x + e * 0.16, 0.5, s * 0.42], 0.028, 6);
      block(m, "ssDark", ...ax(-0.02, 0.12), 0.5, 0.53, ...((s > 0 ? [1.0, 1.25] : [-1.25, -1.0]) as [number, number]));
    }
    block(m, "ss", a, c, 0.52, 0.62, -0.33, 0.33);
    block(m, "black", ...ax(-0.36, -0.3), 0.62, 1.05, -0.33, 0.33);
  });
}

/** The Budd truck at model x xc: an outside frame with rounded ends over SKF roller-bearing boxes, a drop equalizer under each side with its springs, swing hangers and bolster springs, disc brakes on the axles. */
function rdcTruck(m: MeshBuilder, xc: number): void {
  const R = ft(0, 16.5), ay = R * Math.cos(Math.PI / 20), a2 = ft(8, 6) / 2;
  for (const dx of [-a2, a2])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -0.9, axle, 0.9);
      for (const s of [-1, 1]) {
        extrude(m, "steel", "z", ngon(20, R, Math.PI / 20, x, ay), side(s, 0.665, 0.8));
        extrude(m, "wheel", "z", ngon(16, R * 0.82, 0, x, ay), side(s, 0.8, 0.82));
        m.scope("axle box", () => extrude(m, "bogie", "z", ngon(10, 0.13, 0, x, ay), side(s, 0.82, 1.03)));
        m.scope("box cover", () => extrude(m, "spring", "z", ngon(10, 0.085, 0, x, ay), side(s, 1.03, 1.07)));
        // the disc brake on the axle and its caliper
        m.scope("brake disc", () => extrude(m, "steel", "z", ngon(14, 0.27, 0, x, ay), side(s, 0.3, 0.36)));
        block(m, "bogie", x - 0.08, x + 0.08, ay + 0.2, ay + 0.33, ...side(s, 0.27, 0.39));
      }
    });
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      // the deep cast side frame (the CB drawing at 48.9 px/m): its top member from 0.74 to 0.91 m,
      // 3.4 m long with sloping ends, legs either side of each axle box down to 0.24 m with a tie
      // under the box, and the box's saddle up to the top member
      const sf = (pts: Pt[], z0 = 0.9, z1 = 1.04) => extrude(m, "bogie", "z", pts.map(([u, v]): [number, number] => [xc + u, v]), side(s, z0, z1));
      sf([[-1.6, 0.74], [1.6, 0.74], [1.72, 0.8], [1.66, 0.91], [-1.66, 0.91], [-1.72, 0.8]]);
      for (const k of [-1, 1]) {
        const a = k * a2;
        // the outer leg slopes out to the frame's end, the inner one stands by the springs
        sf(k > 0 ? [[a + 0.17, 0.22], [a + 0.3, 0.22], [a + 0.42, 0.76], [a + 0.17, 0.76]] : [[a - 0.3, 0.22], [a - 0.17, 0.22], [a - 0.17, 0.76], [a - 0.42, 0.76]]);
        const [i0, i1] = k > 0 ? [a - 0.3, a - 0.17] : [a + 0.17, a + 0.3];
        sf([[i0, 0.22], [i1, 0.22], [i1, 0.76], [i0, 0.76]]);
        sf([[a - 0.36, 0.19], [a + 0.36, 0.19], [a + 0.36, 0.24], [a - 0.36, 0.24]]);
        sf([[a - 0.11, ay + 0.13], [a + 0.11, ay + 0.13], [a + 0.11, 0.76], [a - 0.11, 0.76]], 0.9, 1.0);
      }
      // the drop equalizer under the frame, sagging between the axles, its coil springs up to the top member
      const eq = (pts: Pt[]) => extrude(m, "bogie", "z", pts.map(([u, v]): [number, number] => [xc + u, v]), side(s, 0.93, 1.0));
      eq([[-0.95, 0.22], [-0.72, 0.16], [-0.72, 0.24], [-0.95, 0.3]]);
      eq([[-0.72, 0.16], [0.72, 0.16], [0.72, 0.24], [-0.72, 0.24]]);
      eq([[0.72, 0.16], [0.95, 0.22], [0.95, 0.3], [0.72, 0.24]]);
      for (const u of [-0.6, 0.6]) coil(m, "spring", xc + u, s * 0.97, 0.24, 0.74, 0.1, 4, 8);
      for (const u of [-0.16, 0.16]) coil(m, "spring", xc + u, s * 0.78, 0.52, 0.8, 0.09, 3, 6);
    }
    // the spring plank, the bolster, the transoms
    block(m, "bogie", xc - 0.4, xc + 0.4, 0.46, 0.52, -0.88, 0.88);
    block(m, "bogie", xc - 0.26, xc + 0.26, 0.8, 0.95, -0.88, 0.88);
    for (const u of [-0.95, 0.95]) block(m, "bogie", xc + u - 0.08, xc + u + 0.08, 0.76, 0.88, -0.9, 0.9);
  });
}

export function buddRdc(params?: ParamValues): MeshBuilder {
  const t = resolveParams(RDC_PARAMS, params).variant as RdcType;
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...RDC_PAL });
  drawCar(m, rdcDef(t), (d) => RDC_LENGTH / 2 - RDC_GAP - d);
  return m;
}
export function buddRdcLod(params?: ParamValues): MeshBuilder {
  const t = resolveParams(RDC_PARAMS, params).variant as RdcType;
  const c = rdcDef(t), X = (d: number) => RDC_LENGTH / 2 - RDC_GAP - d;
  const parts = [
    ...bogieParts(RDC_TRUCK_D.map((d) => [X(d), 1.78] as const), c.spec.B),
    roofPart("ss", X(RDC_CANOPY.d[0] + 0.4), X(RDC_CANOPY.d[1] - 0.4), 1.05, 0.8, 3.9, 4.43),
  ];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...RDC_PAL }, bodies: [carLodBody(c, X)], parts }, 100);
}

// ---------------------------------------------------------------------------
// Subway and 'L' cars

export type MetroCar = "cabCar" | "trailer";
export const R160_PARAMS: readonly ParamSpec[] = [enumParam("unit", "Car", { cabCar: "Cab car", trailer: "Trailer" })];
export const R160_LENGTH = ft(60, 2.5);
export const CTA_LENGTH = ft(48);
const METRO_PAL = { ss: paint("#c3c7ca", 0.3), ssDark: paint("#9a9ea1", 0.4), mask: paint("#1c1d1f", 0.4), ctaRed: paint("#c8102e"), ctaBlue: paint("#00a1de"), under: paint("#2a2c2f", 0.85) };

// NYC Subway R160 (Kawasaki and Alstom, 2005 - 2010), measured on the photographs in
// assets/nyc-r160/ (SOURCES.md): the 9184 side (a 1-D projective fit over its door edges), the
// F-train cab ends head-on (133 px/m on the 10 ft width), the 8539 delivery (the trucks).
const R160_GAP = 0.25;
const R160_BODY = R160_LENGTH - 2 * R160_GAP;
/** The door centres from the car's middle, the 50 in opening and sill to head, the dark door pocket's frame beside it, the leaf windows. */
const R160_DOOR = { c: [-7.01, -2.34, 2.34, 7.01], w: 1.27, y: [1.14, 3.15] as const, frame: 0.14, head: 3.22, glass: [2.1, 3.05] as const };
/** One window centred between each pair of doors: rounded corners, its upper light over a transom (the LED destination sign in the window nearest the front). */
const R160_WIN = { c: [-4.68, 0, 4.68], w: 1.33, y: [2.1, 3.08] as const, bar: [2.79, 2.84] as const, r: 0.12 };
/** Truck centres 1.675 m inside the body's ends (the 8539 delivery photograph), a 2.0 m wheelbase, 28 in wheels. */
const R160_TRUCK_D = [1.675, R160_BODY - 1.675];
const R160_WB = 2.0;
const R160_WHEEL = ft(0, 14);
/** Each end: the corners rounded 0.12 m back in plan, the roof rolling down into the end wall (about 0.35 m radius). */
const r160End = {
  len: 0.12, tip: 0.92, power: 2,
  C: [[0, 3.31], [0.04, 3.45], [0.09, 3.53], [0.15, 3.59], [0.24, 3.63], [0.37, 3.65]] as Pt[],
  S: [[0, 3.28]] as Pt[],
};
/** The air-conditioning shroud at each end of the roof: d from that end, its flat top and half widths. */
const R160_AC = { d: [0.42, 5.3] as const, ramp: 0.3, top: 3.7, half: 0.78, foot: 0.9 };
/** The cab end (z: + the train's right, where the cab is): the door's frame and leaf, the black fields, the windscreen, the lamps (z, r, lens) and the route sign. */
const R160_CAB = {
  door: { z: [-0.58, 0.42] as const, leaf: [-0.5, 0.34] as const, y: [1.14, 3.19] as const, glass: [-0.36, 0.2, 2.17, 3.02] as const },
  screen: [0.53, 1.26, 1.97, 2.96] as const,
  lampY: 1.6,
  lamps: [[0.75, 0.085, "lampHead"], [-0.75, 0.085, "lampHead"], [1.12, 0.075, "r160Marker"], [-1.12, 0.075, "r160Marker"]] as const,
  sign: [-0.33, 0.17, 3.28, 3.63] as const,
};
/** The cab's side window on the right: d from the cab end, sill and head. */
const R160_CAB_SIDE = { d: [0.3, 0.95] as const, y: [1.95, 2.92] as const };
const R160_PAL = {
  ss: paint("#c3c7ca", 0.3), ssDark: paint("#9a9ea1", 0.4), ssBright: paint("#dfe2e4", 0.2), mask: paint("#1c1d1f", 0.4), under: paint("#2a2c2f", 0.85),
  doorFrame: paint("#857f77", 0.4), anticlimber: paint("#3a3c3f", 0.7), barrier: paint("#9b8a70", 0.7), shoeBeam: paint("#3f3428", 0.85), fuse: paint("#b8322b", 0.6),
  led: paint("#ffa62b", 0.3), display: paint("#262628", 0.5), routeRed: paint("#e8303c", 0.3), flagRed: paint("#b22234", 0.5), flagBlue: paint("#3c3b6e", 0.5),
  logoWhite: paint("#eef0f2", 0.4), mtaBlue: paint("#0039a6", 0.4), numberWhite: paint("#f4f4f2", 0.4),
  // the marker lamps' clear lenses, lit red at the rear
  r160Marker: { color: "#e3d9d6", roughness: 0.2, lamp: { role: "tail" } } as MaterialSpec,
};

function r160Def(u: MetroCar): CarDef {
  const L = R160_BODY, cab = u === "cabCar";
  const doors = R160_DOOR.c.map((c): [number, number] => [L / 2 + c - R160_DOOR.w / 2, L / 2 + c + R160_DOOR.w / 2]);
  return {
    spec: { length: L, W: 1.524, Y: 1.15, S: 3.28, C: 3.65, lean: 0.985, arc: 6, B: 0.92, wl: 1.48, A: 1.0, wa: 1.51, front: r160End, rear: r160End, edges: [], step: 1.0, noseStep: 0.12 },
    bands: [[0, 9, "ss"]], roof: "ss", skirt: "ssDark", under: "under",
    windows: [
      { y: R160_WIN.y, spans: R160_WIN.c.map((c): [number, number] => [L / 2 + c - R160_WIN.w / 2, L / 2 + c + R160_WIN.w / 2]), frame: "frameSilver", cornerR: R160_WIN.r },
      // the cab's side window on the operator's (right) side, in the end panel before the first door (the 21 St photograph)
      ...(cab ? [{ y: R160_CAB_SIDE.y, spans: [R160_CAB_SIDE.d], frame: "frameSilver", onSide: 1, cornerR: 0.06 }] : []),
    ],
    doors: { spans: doors, y: R160_DOOR.y, glass: R160_DOOR.glass, glassW: 0.27, glassPair: 0.635, glassCornerR: 0.12, glassSurround: true },
    cabEnds: [], diaphragm: null,
    // the trucks are drawn with the extras (r160Truck)
    trucks: [], truck: truckSpec(R160_WB, R160_WHEEL, 0.92),
    coupler: "centre", couplerY: 0.82, gap: [R160_GAP, R160_GAP],
    // the cab end's black crown over the windscreen and the door
    repaint: (base) => (d, y, r) => (cab && d < 0.3 && (r === "arc" || (r === "cap" && y > 3.25)) ? "mask" : base(d, y, r)),
    extras: (m, b, X) => {
      m.scope("door frames", () => { for (const s of [1, -1]) doors.forEach(([a, e]) => r160DoorFrame(m, b, X, s, a, e)); });
      m.scope("side details", () => { for (const s of [1, -1]) r160Side(m, b, X, s, doors, cab ? "8713" : "8714", cab && s > 0); });
      m.scope("roof", () => r160Roof(m, b, X));
      m.scope("underfloor", () => r160Underfloor(m, X));
      m.scope("running gear", () => R160_TRUCK_D.forEach((d, i) => m.scope(`truck ${i + 1}`, () => m.bogie(() => r160Truck(m, X(d))))));
      for (const e of [1, -1])
        m.scope(e > 0 ? "front end" : "rear end", () => {
          const face = Math.abs(X(e > 0 ? 0 : L));
          if (cab && e > 0) r160CabEnd(m, e, face);
          else r160InnerEnd(m, e, face);
          r160Sill(m, e, face);
        });
    },
  };
}

import { endText } from "./usHoodKit.ts";

// The Chicago 'L' 5000-series (Bombardier, 2009 - 2015): a married-pair car with its
// cab behind a fibreglass bonnet at the #1 (+X) end and a plain end with the end door at
// the #2 end, where it couples to its mate. Measured on the photographs in assets/cta-5000/
// (SOURCES.md): the face on the Grand photograph (211 px/m), the side on the Fullerton and
// Randolph photographs (a projective fit over the doors and the car's ends). Its two sides
// differ: the left one has a wide window behind the cab window, the right one a narrow dark
// window; each side carries its number and door lamps by the other pair of doors.

const CTA_BODY = CTA_LENGTH - 0.5;
/** The doors' centres from the car's middle, their half width (two leaves). */
const CTA_DOOR = { off: 3.15, half: 0.635 };
/** The window rows: sill and head, the transom over the main windows. */
const CTA_WIN = { y: [1.95, 3.0] as const, transom: 2.78 };
/** The cab's side window (taller, a drop sash) and the face's openings (z0, z1, sill, head). */
const CTA_CAB_WIN = { d: [0.24, 0.86] as const, y: [1.9, 3.08] as const };
const CTA_SCREENS = [[0.57, 1.19, 2.0, 3.12], [-1.19, -0.45, 2.0, 3.12]] as const;
const CTA_END_DOOR = { z: 0.34, y: [1.12, 3.2] as const, glass: [-0.19, 0.19, 2.25, 3.0] as const };
/** The plain end door's taller window. */
const CTA_PLAIN_GLASS = [-0.23, 0.23, 1.95, 3.02] as const;
/** Truck centres (33 ft 6 in, the Fullerton photograph), the wheelbase and wheel radius (28 in wheels). */
const CTA_TRUCKS = ft(33, 6);
const CTA_WB = ft(7);
const CTA_WHEEL_R = ft(0, 14);
const CTA_PAL = {
  ctaBonnet: paint("#d4d7d8", 0.45),
  ctaFrame: { color: "#dfe2e4", metallic: 0.4, roughness: 0.25 },
  ctaFlute: paint("#909497", 0.45),
  ctaLogo: paint("#1d5fae", 0.4),
  ctaSign: { color: "#ff6a26", metallic: 0, roughness: 0.3 },
  ctaAmber: paint("#eba01e", 0.3),
  ctaMarkerBlue: paint("#2c62c4", 0.3),
};

/** The face's plan and crown: the bonnet a little narrower than the body, its top rolling back into the roof. */
const ctaCabEnd = { len: 0.2, tip: 0.9, power: 2.5, C: [[0, 3.6], [0.06, 3.64], [0.2, 3.66]] as Pt[], S: [[0, 3.4], [0.1, 3.3], [0.2, 3.2]] as Pt[] };
const ctaPlainEnd = { len: 0.2, tip: 0.92, power: 2.5, C: [[0, 3.6], [0.08, 3.65], [0.2, 3.66]] as Pt[], S: [[0, 3.36], [0.1, 3.28], [0.2, 3.2]] as Pt[] };

/** A convex outline (z, y) flat on the end wall at |x| = face + off, facing e. */
function r160Flat(m: MeshBuilder, mat: string, e: number, face: number, off: number, pts: readonly Pt[]): void {
  const p = pts.map(([z, y]): Vec3 => [e * (face + off), y, z]);
  m.facets(mat, p.slice(1, -1).flatMap((q, i) => [p[0]!, q, p[i + 2]!]), [e, 0, 0]);
}

/** Text on the end wall at |x| = face + off facing e, centred at z, its foot at y, reading left to right from outside. */
function r160EndText(m: MeshBuilder, mat: string, e: number, face: number, off: number, text: string, z: number, y: number, h: number): void {
  const w = h * 0.6, gap = h * 0.2, width = strokeWidth(text, w, gap);
  const tris = strokeText(text, -width / 2, y, h, w, gap, false, h * 0.16).map(([u, v]): Vec3 => [e * (face + off), v, z - e * u]);
  m.facets(mat, tris, [e, 0, 0]);
}

/** The x span from a to c outside the end wall at |x| = face (negative inside it), ordered. */
const r160Ax = (e: number, face: number, a: number, c: number): [number, number] => (e > 0 ? [face + a, face + c] : [-face - c, -face - a]);

/** The door pocket's dark frame on side s beside and over the door opening d0..d1. */
function r160DoorFrame(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number): void {
  const { frame: f, head } = R160_DOOR, [y0, y1] = R160_DOOR.y;
  sidePanel(m, b, X, s, "doorFrame", d0 - f, d0, y0 - 0.08, head, 0.008, 0.03);
  sidePanel(m, b, X, s, "doorFrame", d1, d1 + f, y0 - 0.08, head, 0.008, 0.03);
  sidePanel(m, b, X, s, "doorFrame", d0, d1, y1, head, 0.008, 0.03);
}

/**
 * Side s's fittings: the rain strip under the roof, the belt seam, the round plate under each window,
 * the windows' transoms (the LED destination sign in the front window), the flag decal, and at each
 * end the car number on its black plate and the MTA logo (`cabSide`: not at the front, where the cab's side window is).
 */
function r160Side(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, doors: ReadonlyArray<readonly [number, number]>, number: string, cabSide: boolean): void {
  const L = b.length, f = R160_DOOR.frame;
  // runs from 0.13 to L - 0.13 broken over the door frames
  const runs: Array<[number, number]> = [];
  let from = 0.13;
  for (const [a, e] of doors) { runs.push([from, a - f - 0.01]); from = e + f + 0.01; }
  runs.push([from, L - 0.13]);
  m.scope("rain strip", () => sidePanel(m, b, X, s, "ss", 0.13, L - 0.13, R160_DOOR.head, 3.27, 0.012, 0.02));
  m.scope("belt seam", () => sideDecal(m, b, X, s, "ssDark", runs.flatMap(([p, q]): Pt[] => [[p, 1.925], [q, 1.925], [q, 1.937], [p, 1.925], [q, 1.937], [p, 1.937]]), 0.003));
  R160_WIN.c.forEach((c, i) => {
    const dc = L / 2 + c, [a, e] = [dc - R160_WIN.w / 2 + 0.04, dc + R160_WIN.w / 2 - 0.04];
    m.scope(`window ${i + 1} transom`, () => sidePanel(m, b, X, s, "frameSilver", a, e, R160_WIN.bar[0], R160_WIN.bar[1], 0.016, 0.006));
    m.scope("plate", () => {
      surfaceDisc(m, b, X, dc, 1.48, s, "anticlimber", 0.075, 0.004, 0.01, 14);
      surfaceDisc(m, b, X, dc, 1.48, s, "ssDark", 0.05, 0.009, 0.004, 12);
    });
    // the destination sign behind the upper light of the front window (the E-train photograph)
    if (i === 0)
      m.scope("destination sign", () => {
        sidePanel(m, b, X, s, "display", a + 0.04, e - 0.04, R160_WIN.bar[1] + 0.012, R160_WIN.y[1] - 0.075, 0.014, 0.002);
        sideLettering(m, b, X, s, "F  JAMAICA 179 ST", dc, R160_WIN.bar[1] + 0.045, 0.085, "led", 0.0165);
      });
  });
  m.scope("flag", () => {
    const [d0, d1, y0, y1] = [2.85, 3.4, 2.78, 3.07], h = (y1 - y0) / 13;
    sidePanel(m, b, X, s, "logoWhite", d0, d1, y0, y1, 0.005, 0.003);
    for (let k = 0; k < 13; k += 2) sidePanel(m, b, X, s, "flagRed", d0, d1, y0 + k * h, y0 + (k + 1) * h, 0.007, 0.001);
    // the canton toward the front, as the flag flies when the car runs forward
    sidePanel(m, b, X, s, "flagBlue", d0, d0 + 0.22, y0 + 6 * h, y1, 0.009, 0.001);
  });
  // (the cab's side window takes the front end panel on the cab side)
  for (const dc of cabSide ? [L - 0.48] : [0.48, L - 0.48])
    m.scope("number and logo", () => {
      sidePanel(m, b, X, s, "mask", dc - 0.29, dc + 0.29, 2.8, 3.04, 0.006, 0.004);
      sideLettering(m, b, X, s, number, dc, 2.84, 0.16, "numberWhite", 0.009);
      surfaceDisc(m, b, X, dc, 2.45, s, "logoWhite", 0.23, 0.005, 0.004, 18);
      // the MTA disc at the logo's upper left, the lettering under it
      surfaceDisc(m, b, X, dc + s * 0.07, 2.53, s, "mtaBlue", 0.065, 0.008, 0.002, 12);
      sidePanel(m, b, X, s, "mtaBlue", dc - 0.14, dc + 0.12, 2.39, 2.41, 0.008, 0.002);
      sidePanel(m, b, X, s, "mtaBlue", dc - 0.14, dc + 0.04, 2.35, 2.37, 0.008, 0.002);
    });
}

/** The roof: its flutes and the air-conditioning shroud at each end with the condenser grilles. */
function r160Roof(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const L = b.length, arc = rdcArc(b, L / 2), ac = R160_AC;
  const shrouds = [[ac.d[0], ac.d[1]], [L - ac.d[1], L - ac.d[0]]] as const;
  m.scope("flutes", () => {
    for (let u = 0.06; u + 0.03 < arc.len - 0.04; u += 0.095) {
      const p = arc.at(u), q = arc.at(u + 0.022);
      if (p.seg !== q.seg) continue;
      const n = p.n;
      const cuts = p.p[0] < ac.foot + 0.04 ? shrouds.map(([a, e]) => [a - 0.05, e + 0.05] as const) : [];
      let from = 0.42;
      const runs: Array<[number, number]> = [];
      for (const [a, e] of cuts) { if (a > from + 0.05) runs.push([from, a]); from = Math.max(from, e); }
      if (L - 0.42 > from + 0.05) runs.push([from, L - 0.42]);
      for (const s of [1, -1])
        for (const [a, e] of runs) {
          const P = (d: number, r: Pt): Vec3 => [X(d), r[1] + n[1] * 0.004, s * (r[0] + n[0] * 0.004)];
          m.facets("ssDark", [P(a, p.p), P(e, p.p), P(e, q.p), P(a, p.p), P(e, q.p), P(a, q.p)], [0, n[1], s * n[0]]);
        }
    }
  });
  m.scope("air conditioning", () => {
    const foot = crownPoint(b, L / 2, ac.foot)[1] - 0.03;
    const sec: Pt[] = [[-ac.foot, foot], [ac.foot, foot], [ac.foot - 0.04, ac.top - 0.04], [ac.half, ac.top], [-ac.half, ac.top], [-(ac.foot - 0.04), ac.top - 0.04]];
    const low = sec.map(([z, y]): Pt => [z * 0.96, foot + (y - foot) * 0.15]);
    for (const [d0, d1] of shrouds) {
      m.sweep("ss", "x", low, X(d0), sec, X(d0 + ac.ramp), false);
      m.sweep("ss", "x", sec, X(d0 + ac.ramp), sec, X(d1 - ac.ramp), false);
      m.sweep("ss", "x", sec, X(d1 - ac.ramp), low, X(d1), false);
    }
    // the condenser grilles near each end, on the shroud's top
    for (const e of [1, -1])
      for (const [g0, g1] of [[0.85, 1.6], [1.75, 2.5]] as const) {
        const [a, c] = e > 0 ? [g0, g1] : [L - g1, L - g0];
        const [x0, x1] = [Math.min(X(a), X(c)), Math.max(X(a), X(c))];
        block(m, "grille", x0, x1, ac.top - 0.01, ac.top + 0.008, -0.62, 0.62);
        for (let k = 1; k < 5; k++) { const x = x0 + ((x1 - x0) * k) / 5; m.rod("louvre", [x, ac.top + 0.012, -0.6], [x, ac.top + 0.012, 0.6], 0.01, 4); }
      }
  });
}

/** Under the floor between the trucks (the 9184 and 8539 photographs): the propulsion and auxiliary boxes, the battery box, the braking resistor grids and the air reservoir; the other side the same turned end for end. */
function r160Underfloor(m: MeshBuilder, X: (d: number) => number): void {
  const L = R160_BODY;
  for (const s of [1, -1]) {
    const at = (d: number) => (s > 0 ? d : L - d);
    const box = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => rdcBlock(m, X, mat, at(d0), at(d1), y0, y1, s * z0, s * z1);
    m.scope("auxiliary inverter", () => box("under", 3.4, 5.25, 0.48, 0.95, 0.3, 1.2));
    m.scope("propulsion", () => {
      box("under", 5.5, 7.6, 0.42, 0.95, 0.25, 1.22);
      box("grille", 5.75, 7.35, 0.52, 0.85, 1.22, 1.235);
      for (let y = 0.57; y < 0.82; y += 0.06) m.rod("louvre", [X(at(5.78)), y, s * 1.24], [X(at(7.32)), y, s * 1.24], 0.01, 4);
    });
    m.scope("battery box", () => { box("under", 7.8, 8.45, 0.52, 0.95, 0.4, 1.18); box("safety", 7.85, 8.4, 0.56, 0.84, 1.18, 1.2); });
    m.scope("equipment", () => box("under", 8.7, 10.9, 0.5, 0.95, 0.2, 1.2));
    m.scope("resistor grids", () => {
      for (const [d0, d1] of [[11.1, 11.65], [11.72, 12.27]] as const) {
        box("under", d0, d1, 0.46, 0.95, 0.45, 1.16);
        box("grille", d0 + 0.03, d1 - 0.03, 0.5, 0.86, 1.16, 1.2);
      }
    });
    m.scope("air reservoir", () => m.sweep("under", "x", ngon(10, 0.2, 0, s * 0.95, 0.7), X(at(12.45)), ngon(10, 0.2, 0, s * 0.95, 0.7), X(at(13.45))));
    m.scope("compressor", () => box("under", 13.6, 14.55, 0.5, 0.95, 0.35, 1.1));
  }
  m.scope("centre sill", () => rdcBlock(m, X, "under", 3.3, L - 3.3, 0.6, 0.95, -0.22, 0.22));
}

/** The R160 truck at model x xc: wheelsets with outside axle boxes and chevron springs, an H frame dropped between the axles, air springs, the third-rail shoe beam and shoe on each side with its fuse box, and the traction motors. */
function r160Truck(m: MeshBuilder, xc: number): void {
  const R = R160_WHEEL, ay = R * Math.cos(Math.PI / 20), a2 = R160_WB / 2;
  for (const dx of [-a2, a2])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.075, 0, x, ay);
      m.sweep("steel", "z", axle, -0.9, axle, 0.9);
      for (const s of [-1, 1]) {
        extrude(m, "steel", "z", ngon(20, R, Math.PI / 20, x, ay), side(s, 0.665, 0.8));
        extrude(m, "wheel", "z", ngon(16, R * 0.8, 0, x, ay), side(s, 0.8, 0.82));
        m.scope("axle box", () => extrude(m, "bogie", "z", ngon(10, 0.12, 0, x, ay), side(s, 0.82, 1.02)));
        m.scope("box cover", () => extrude(m, "spring", "z", ngon(10, 0.08, 0, x, ay), side(s, 1.02, 1.06)));
        // the chevron rubber springs over the box, under the frame's end
        m.scope("chevron spring", () => block(m, "rubber", x - 0.17, x + 0.17, ay + 0.1, 0.61, ...side(s, 0.84, 1.0)));
        // the traction motor inboard of the axle
        if (s > 0) m.scope("motor", () => block(m, "bogie", ...((dx < 0 ? [x + 0.15, xc - 0.12] : [xc + 0.12, x - 0.15]) as [number, number]), 0.22, 0.58, -0.42, 0.42));
      }
    });
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      extrude(m, "bogie", "z", [[xc - 1.3, 0.6], [xc + 1.3, 0.6], [xc + 1.3, 0.76], [xc - 1.3, 0.76]], side(s, 0.86, 0.98));
      extrude(m, "bogie", "z", [[xc - 0.62, 0.42], [xc + 0.62, 0.42], [xc + 0.75, 0.62], [xc - 0.75, 0.62]], side(s, 0.87, 0.97));
      // the air spring on the frame, under the bolster
      m.rod("rubber", [xc, 0.74, s * 0.92], [xc, 0.9, s * 0.92], 0.14, 10);
      // the third-rail shoe beam outside the axle boxes, its hanger and shoe, the shoe fuse box
      block(m, "shoeBeam", xc - 1.18, xc + 1.18, 0.3, 0.38, ...side(s, 1.07, 1.13));
      block(m, "steel", xc - 0.06, xc + 0.06, 0.19, 0.31, ...side(s, 1.1, 1.14));
      block(m, "steel", xc - 0.16, xc + 0.16, 0.17, 0.205, ...side(s, 1.11, 1.42));
      block(m, "fuse", xc - 0.34, xc - 0.1, 0.4, 0.56, ...side(s, 1.0, 1.16));
    }
    block(m, "bogie", xc - 0.22, xc + 0.22, 0.46, 0.6, -0.9, 0.9);
    block(m, "bogie", xc - 0.3, xc + 0.3, 0.88, 0.915, -1.05, 1.05);
  });
}

/** The anticlimber across the end at the floor and the boxes under it beside the coupler. */
function r160Sill(m: MeshBuilder, e: number, face: number): void {
  const ax = (a: number, c: number) => r160Ax(e, face, a, c);
  m.scope("anticlimber", () => {
    block(m, "anticlimber", ...ax(-0.02, 0.1), 1.0, 1.14, -1.38, 1.38);
    for (const y of [1.025, 1.06, 1.095]) block(m, "anticlimber", ...ax(0.08, 0.125), y, y + 0.02, -1.34, 1.34);
    for (const s of [-1, 1]) block(m, "under", ...ax(-0.1, 0.06), 0.62, 0.92, ...side(s, 0.35, 0.78));
  });
}

/** The cab end at |x| = face facing e: the black fields with the windscreen, the stainless door with its window and safety chains, the lamps, the route sign in the crown, the flag and the MTA logo. */
function r160CabEnd(m: MeshBuilder, e: number, face: number): void {
  const F = (mat: string, off: number, pts: readonly Pt[]) => r160Flat(m, mat, e, face, off, pts);
  const ax = (a: number, c: number) => r160Ax(e, face, a, c);
  const x = (off: number) => e * (face + off);
  const { door, screen, lampY, sign } = R160_CAB;
  m.scope("mask", () => {
    // the cab side's field down past the lamps, the other side's with its inner corner cut back, the band over the door
    F("mask", 0.003, [[door.z[1], 3.28], [door.z[1], 1.36], [door.z[1] + 0.04, 1.31], [door.z[1] + 0.13, 1.29], [1.2, 1.4], [1.3, 1.45], [1.36, 1.55], [1.36, 3.28]]);
    F("mask", 0.003, [[door.z[0], 3.28], [-1.36, 3.28], [-1.36, 1.55], [-1.3, 1.45], [-1.2, 1.4], [door.z[0] - 0.16, 1.29], [door.z[0] - 0.08, 1.36], [door.z[0], 1.72]]);
    F("mask", 0.003, [[door.z[0], door.y[1]], [door.z[1], door.y[1]], [door.z[1], 3.28], [door.z[0], 3.28]]);
  });
  m.scope("windscreen", () => {
    F("cabGlass", 0.006, roundedOutline(screen[0], screen[1], screen[2], screen[3], 0.06));
    // the wiper hanging from its spindle over the glass
    m.rod("black", [x(0.02), 3.02, 0.98], [x(0.02), 2.42, 0.8], 0.012, 5);
    m.rod("black", [x(0.03), 2.75, 0.89], [x(0.03), 2.2, 0.74], 0.01, 5);
    // the grab handle under it
    for (const z of [0.62, 1.18]) m.rod("handrail", [x(0), 1.87, z], [x(0.06), 1.87, z], 0.012, 5);
    m.rod("handrail", [x(0.06), 1.87, 0.62], [x(0.06), 1.87, 1.18], 0.014, 6);
  });
  m.scope("end door", () => {
    const [l0, l1] = door.leaf;
    // the seams round the leaf, the leaf standing out of the frame, its window's rim and glass
    for (const [z0, z1, y0, y1] of [[l0 - 0.02, l0, door.y[0], door.y[1] - 0.06], [l1, l1 + 0.02, door.y[0], door.y[1] - 0.06], [l0 - 0.02, l1 + 0.02, door.y[1] - 0.08, door.y[1] - 0.06]] as const) F("rubber", 0.004, [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]);
    block(m, "ss", ...ax(-0.01, 0.012), door.y[0] + 0.02, door.y[1] - 0.08, l0, l1);
    const [g0, g1, h0, h1] = door.glass;
    F("rubber", 0.013, roundedOutline(g0 - 0.015, g1 + 0.015, h0 - 0.015, h1 + 0.015, 0.09));
    F("ssBright", 0.014, roundedOutline(g0, g1, h0, h1, 0.08));
    F("cabGlass", 0.016, roundedOutline(g0 + 0.035, g1 - 0.035, h0 + 0.035, h1 - 0.035, 0.05));
    // the safety chains strung across the door in vees
    const zm = (l0 + l1) / 2;
    for (const h of [2.48, 2.04, 1.6]) {
      m.rod("black", [x(0.05), h, l0 + 0.02], [x(0.05), h - 0.42, zm], 0.014, 5);
      m.rod("black", [x(0.05), h - 0.42, zm], [x(0.05), h, l1 - 0.02], 0.014, 5);
    }
    m.rod("handrail", [x(0.03), 1.4, l1 - 0.06], [x(0.03), 1.4, l1 - 0.18], 0.012, 5);
  });
  m.scope("lamps", () => {
    for (const [z, r, lens] of R160_CAB.lamps) {
      extrude(m, "ssBright", "x", ngon(16, r + 0.04, 0, z, lampY), ax(-0.01, 0.03));
      extrude(m, lens, "x", ngon(16, r, 0, z, lampY), ax(0.03, 0.04));
    }
  });
  m.scope("route sign", () => {
    const [z0, z1, y0, y1] = sign, zc = (z0 + z1) / 2, yc = (y0 + y1) / 2;
    extrude(m, "mask", "x", roundedOutline(z0, z1, y0, y1, 0.06), ax(-0.28, 0.03));
    F("display", 0.033, roundedOutline(z0 + 0.04, z1 - 0.04, y0 + 0.03, y1 - 0.03, 0.04));
    const ring: Vec3[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 2 * Math.PI, c = ((i + 1) / 16) * 2 * Math.PI;
      const P = (r: number, t: number): Vec3 => [x(0.036), yc + r * Math.sin(t), zc + r * Math.cos(t)];
      ring.push(P(0.115, a), P(0.135, a), P(0.135, c), P(0.115, a), P(0.135, c), P(0.115, c));
    }
    m.facets("routeRed", ring, [e, 0, 0]);
    r160EndText(m, "routeRed", e, face, 0.036, "F", zc, yc - 0.07, 0.14);
  });
  m.scope("flag", () => {
    const [z0, z1, y0, y1] = [-1.27, -0.66, 2.88, 3.2], h = (y1 - y0) / 13;
    F("logoWhite", 0.005, [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]);
    for (let k = 0; k < 13; k += 2) F("flagRed", 0.007, [[z0, y0 + k * h], [z1, y0 + k * h], [z1, y0 + (k + 1) * h], [z0, y0 + (k + 1) * h]]);
    // the canton at the upper left seen from ahead
    F("flagBlue", 0.009, [[z1 - 0.25, y0 + 6 * h], [z1, y0 + 6 * h], [z1, y1], [z1 - 0.25, y1]]);
  });
  m.scope("logo", () => {
    F("logoWhite", 0.005, ngon(20, 0.23, 0, -0.97, 2.55));
    F("mtaBlue", 0.008, ngon(12, 0.065, 0, -0.97 + 0.07, 2.63));
    F("mtaBlue", 0.008, [[-1.1, 2.48], [-0.85, 2.48], [-0.85, 2.5], [-1.1, 2.5]]);
    F("mtaBlue", 0.008, [[-1.1, 2.44], [-0.95, 2.44], [-0.95, 2.46], [-1.1, 2.46]]);
  });
  m.scope("grab irons", () => {
    for (const [y0, y1] of [[2.5, 2.99], [1.98, 2.31]] as const) {
      m.rod("handrail", [x(0.05), y0, -1.2], [x(0.05), y1, -1.2], 0.013, 5);
      for (const y of [y0, y1]) m.rod("handrail", [x(0), y, -1.2], [x(0.05), y, -1.2], 0.01, 4);
    }
  });
}

/** An inner end at |x| = face facing e: the stainless end door with its window, and the safety barriers either side of it between the corner posts and the door posts. */
function r160InnerEnd(m: MeshBuilder, e: number, face: number): void {
  const F = (mat: string, off: number, pts: readonly Pt[]) => r160Flat(m, mat, e, face, off, pts);
  const x = (off: number) => e * (face + off);
  m.scope("end door", () => {
    const [z0, z1, y0, y1] = [-0.46, 0.46, 1.16, 3.12];
    for (const [a, c, p, q] of [[z0 - 0.025, z0, y0, y1], [z1, z1 + 0.025, y0, y1], [z0 - 0.025, z1 + 0.025, y1, y1 + 0.025]] as const) F("rubber", 0.004, [[a, p], [c, p], [c, q], [a, q]]);
    F("frameSilver", 0.006, roundedOutline(-0.33, 0.33, 2.05, 3.06, 0.1));
    F("glass", 0.008, roundedOutline(-0.3, 0.3, 2.08, 3.03, 0.07));
    m.rod("handrail", [x(0.03), 1.95, 0.32], [x(0.03), 1.95, 0.42], 0.012, 5);
  });
  m.scope("barriers", () => {
    for (const s of [-1, 1]) {
      for (const z of [1.32, 0.56]) m.rod("handrail", [x(0.07), 1.3, s * z], [x(0.07), 2.75, s * z], 0.02, 6);
      // each a sagging spring: four straight runs through a parabola
      for (const h of [2.62, 2.05, 1.48]) {
        const P = (t: number): Vec3 => [x(0.09), h - 0.18 * (1 - (2 * t - 1) ** 2), s * (1.32 - 0.76 * t)];
        for (let k = 0; k < 4; k++) m.rod("barrier", P(k / 4), P((k + 1) / 4), 0.025, 6);
      }
    }
  });
}

/** The LOD: the body with its cab end's black field and windscreen, the trucks, the roof shrouds and the underfloor equipment. */
function r160Lod(u: MetroCar): MeshBuilder {
  const c = r160Def(u), L = R160_BODY, X = (d: number) => R160_LENGTH / 2 - R160_GAP - d;
  const body = carLodBody(c, X), top = c.spec.C;
  const flat = (end: UnitBody["front"]): UnitBody["front"] => ({ ...end, setback: [[c.spec.B, 0.1], [top, 0.1]] });
  const windows = R160_WIN.c.map((cc) => ({ u: [X(L / 2 + cc + R160_WIN.w / 2 - 0.04), X(L / 2 + cc - R160_WIN.w / 2 + 0.04)] as const, y: [R160_WIN.y[0] + 0.04, R160_WIN.y[1] - 0.04] as const, mat: LOD_GLASS }));
  const front = u === "cabCar"
    ? { ...flat(body.front), paint: [[c.spec.B, 1.3, "ss"], [1.3, top, "mask"]] as LodBand[], windows: [{ u: [R160_CAB.screen[0], R160_CAB.screen[1]] as const, y: [R160_CAB.screen[2], R160_CAB.screen[3]] as const, mat: LOD_GLASS }] }
    : flat(body.front);
  const parts = [
    ...bogieParts(R160_TRUCK_D.map((d) => [X(d), 1.3] as const), c.spec.B),
    ...[[R160_AC.d[0], R160_AC.d[1]], [L - R160_AC.d[1], L - R160_AC.d[0]]].map(([a, e]) => roofPart("ss", X(a!), X(e!), R160_AC.foot, R160_AC.half, 3.55, R160_AC.top)),
    underPart(X(3.3), X(L - 3.3), 0.45, 0.95, 1.2),
  ];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...R160_PAL }, bodies: [{ ...body, front, rear: flat(body.rear), windows }], parts }, 100);
}

function ctaDef(): CarDef {
  const L = CTA_BODY, mid = L / 2;
  const doors: Array<[number, number]> = [mid - CTA_DOOR.off, mid + CTA_DOOR.off].map((d) => [d - CTA_DOOR.half, d + CTA_DOOR.half]);
  // three windows between the doors, 1.04 m frames at 1.18 m
  const middle: Array<[number, number]> = [-1.18, 0, 1.18].map((o) => [mid + o - 0.52, mid + o + 0.52]);
  return {
    spec: { length: L, W: 1.42, Y: 1.15, S: 3.2, C: 3.66, lean: 0.985, arc: 6, B: 0.85, wl: 1.4, A: 0.95, wa: 1.415, front: ctaCabEnd, rear: ctaPlainEnd, edges: [], step: 1.0 },
    bands: [[0, 9, "ss"]], roof: "ss", skirt: "ss", under: "under",
    windows: [
      { y: CTA_WIN.y, spans: [...middle, [L - 2.6, L - 1.62]], frame: "ctaFrame", cornerR: 0.06 },
      { y: CTA_CAB_WIN.y, spans: [[...CTA_CAB_WIN.d]], frame: "ctaFrame", cornerR: 0.06 },
      { y: CTA_WIN.y, spans: [[1.26, 2.36]], frame: "ctaFrame", onSide: -1, cornerR: 0.06 },
      { y: CTA_WIN.y, spans: [[1.25, 1.92]], frame: "rubber", onSide: 1, cornerR: 0.1 },
      { y: CTA_WIN.y, spans: [[L - 1.29, L - 0.68]], frame: "rubber", cornerR: 0.1 },
    ],
    doors: { spans: doors, y: [1.1, 3.05], glass: [1.98, 2.93], glassW: 0.42, glassPair: 0.635, glassCornerR: 0.1 },
    cabEnds: [1], diaphragm: null,
    trucks: [], truck: truckSpec(CTA_WB, CTA_WHEEL_R, 0.9),
    coupler: "centre", couplerY: 0.8, gap: [0.25, 0.25],
    // the bonnet over the cab end; the ends' walls dark under the anticlimber
    repaint: (base) => (d, y, r) => {
      if (r === "cap") return y < 0.99 ? "under" : d < L / 2 ? "ctaBonnet" : "ss";
      return d < ctaCabEnd.len - 1e-6 && r !== "bottom" ? "ctaBonnet" : base(d, y, r);
    },
    extras: (m, b, X) => {
      for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => ctaSide(m, b, X, s, doors, middle));
      m.scope("roof", () => ctaRoof(m, b, X));
      m.scope("underfloor", () => ctaUnderfloor(m, X));
      m.scope("running gear", () => [mid - CTA_TRUCKS / 2, mid + CTA_TRUCKS / 2].forEach((d, i) => m.scope(`truck ${i + 1}`, () => m.bogie(() => ctaTruck(m, X(d), i === 0 ? 1 : -1)))));
      m.scope("front end", () => ctaCabFace(m, Math.abs(X(0))));
      m.scope("rear end", () => ctaPlainFace(m, Math.abs(X(L))));
    },
  };
}

/** One side's fittings: the fluted panels, the transoms and the side sign, the cab's sash, the logo, the number, the door lamps and the gutter. */
function ctaSide(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, doors: ReadonlyArray<readonly [number, number]>, middle: ReadonlyArray<readonly [number, number]>): void {
  const L = b.length;
  const [dB, dA] = [doors[0]!, doors[1]!];
  // the fluted panels under the windows: plain at the ends and beside the doors
  m.scope("fluting", () => {
    const runs: Array<[number, number]> = [[0.95, dB[0] - 0.12], [dB[1] + 0.12, dA[0] - 0.12], [dA[1] + 0.12, L - 1.32]];
    const dark: Pt[] = [], light: Pt[] = [];
    for (let y = 1.08; y + 0.04 < 1.88; y += 0.058)
      for (const [p, q] of runs) {
        dark.push([p, y], [q, y], [q, y + 0.022], [p, y], [q, y + 0.022], [p, y + 0.022]);
        light.push([p, y + 0.022], [q, y + 0.022], [q, y + 0.036], [p, y + 0.022], [q, y + 0.036], [p, y + 0.036]);
      }
    sideDecal(m, b, X, s, "ctaFlute", dark, 0.003);
    sideDecal(m, b, X, s, "ctaFrame", light, 0.003);
  });
  // the transom bar over each framed window; the middle window's upper light is the side sign
  m.scope("transoms", () => {
    const framed = [...middle, [L - 2.6, L - 1.62] as const, ...(s < 0 ? [[1.26, 2.36] as const] : [])];
    for (const [a, e] of framed) sidePanel(m, b, X, s, "ctaFrame", a + 0.04, e - 0.04, CTA_WIN.transom, CTA_WIN.transom + 0.035, 0.016, 0.006);
    const [a, e] = middle[1]!;
    sidePanel(m, b, X, s, "ctaSign", a + 0.12, e - 0.12, CTA_WIN.transom + 0.06, CTA_WIN.y[1] - 0.07, 0.015, 0.002);
  });
  // the cab window's sliding sash: its frame's upright over the glass
  m.scope("cab sash", () => sidePanel(m, b, X, s, "ctaFrame", 0.6, 0.635, CTA_CAB_WIN.y[0] + 0.04, CTA_CAB_WIN.y[1] - 0.04, 0.016, 0.006));
  // the right side's narrow slot behind its dark window
  if (s > 0) m.scope("slot", () => sidePanel(m, b, X, s, "rubber", 2.15, 2.27, 2.35, 2.95, 0.006, 0.02));
  // the CTA roundel under the cab window
  m.scope("logo", () => {
    surfaceDisc(m, b, X, 0.55, 1.45, s, "white", 0.225, 0.003, 0.001, 20);
    surfaceDisc(m, b, X, 0.55, 1.45, s, "ctaLogo", 0.2, 0.005, 0.001, 20);
    sideLettering(m, b, X, s, "CTA", 0.55, 1.4, 0.1, "white", 0.007);
  });
  // the number and the door lamps by the forward side of each door on the left side, by the rear side on the right
  m.scope("number", () => sideLettering(m, b, X, s, CTA_NUMBER, s < 0 ? 2.85 : L - 2.85, 3.04, 0.11, "black", 0.004));
  m.scope("door lamps", () => {
    for (const [a, e] of [dB, dA]) {
      const d = s < 0 ? a - 0.16 : e + 0.08;
      sidePanel(m, b, X, s, "black", d - 0.02, d + 0.1, 2.68, 2.96, 0.006, 0.02);
      sidePanel(m, b, X, s, "ctaAmber", d, d + 0.08, 2.72, 2.92, 0.014, 0.004);
    }
  });
  m.scope("gutter", () => sidePanel(m, b, X, s, "ctaFrame", 0.3, L - 0.3, 3.15, 3.19, 0.025, 0.03));
}

/** The car number (5636, the Fullerton photograph). */
const CTA_NUMBER = "5636";

/** The roof's ribs along its arc on both sides. */
function ctaRoof(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const L = b.length, h = halfSlice(b, L / 2), pts = h.slice(4 + b.edges(L / 2).length);
  // ribs evenly over each facet of the arc, about 0.1 m apart
  const ribs: Array<[Pt, Pt, Pt]> = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, c] = [pts[i]!, pts[i + 1]!], l = Math.hypot(c[0] - a[0], c[1] - a[1]), k = Math.max(1, Math.round(l / 0.1));
    const at = (t: number): Pt => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
    for (let j = 0; j < k; j++) {
      const t = (j + 0.5) / k, dt = 0.015 / l;
      ribs.push([at(t - dt), at(t + dt), [(c[1] - a[1]) / l, -(c[0] - a[0]) / l]]);
    }
  }
  for (const [p, q, n] of ribs)
    for (const s of [1, -1]) {
      const P = (d: number, r: Pt): Vec3 => [X(d), r[1] + n[1] * 0.004, s * (r[0] + n[0] * 0.004)];
      m.facets("ssDark", [P(0.45, p), P(L - 0.4, p), P(L - 0.4, q), P(0.45, p), P(L - 0.4, q), P(0.45, q)], [0, n[1], s * n[0]]);
    }
}

/** Under the floor between the trucks: the propulsion inverter, the braking resistor's grille box, the auxiliary inverter, batteries, the compressor and air reservoirs. */
function ctaUnderfloor(m: MeshBuilder, X: (d: number) => number): void {
  const L = CTA_BODY, mid = L / 2;
  const bx = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => rdcBlock(m, X, mat, d0, d1, y0, y1, z0, z1);
  m.scope("propulsion", () => { bx("under", mid - 2.0, mid + 0.4, 0.36, 0.8, -1.15, -0.05); bx("black", mid - 1.9, mid + 0.3, 0.33, 0.36, -1.05, -0.15); });
  m.scope("braking resistor", () => {
    bx("under", mid - 2.95, mid - 2.2, 0.4, 0.8, -1.2, -0.45);
    for (let y = 0.45; y < 0.76; y += 0.06) bx("grille", mid - 2.9, mid - 2.25, y, y + 0.03, -1.22, -1.2);
  });
  m.scope("auxiliary", () => bx("under", mid - 1.6, mid + 0.9, 0.4, 0.8, 0.1, 1.18));
  m.scope("batteries", () => bx("under", mid + 1.2, mid + 2.4, 0.45, 0.8, 0.3, 1.2));
  m.scope("compressor", () => { bx("under", mid + 0.8, mid + 1.9, 0.42, 0.8, -1.1, -0.35); bx("grille", mid + 0.85, mid + 1.85, 0.48, 0.74, -1.12, -1.1); });
  m.scope("air reservoirs", () => { for (const z of [-0.85, -0.45]) m.sweep("under", "x", ngon(10, 0.15, 0, z, 0.6), X(mid + 2.2), ngon(10, 0.15, 0, z, 0.6), X(mid + 3.2)); });
  m.scope("cables", () => { for (const s of [1, -1]) bx("black", mid - 3.4, mid + 3.4, 0.74, 0.8, s * 1.25, s * 1.3); });
}

/** A truck at model x xc: wheelsets, an outside frame over chevron springs, the traction motors, disc brakes, and the third-rail shoe beam with its collector shoe on each side. */
function ctaTruck(m: MeshBuilder, xc: number, out: number): void {
  const R = CTA_WHEEL_R, ay = R * Math.cos(Math.PI / 20), a2 = CTA_WB / 2;
  for (const dx of [-a2, a2])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.075, 0, x, ay);
      m.sweep("steel", "z", axle, -0.9, axle, 0.9);
      for (const s of [-1, 1]) {
        extrude(m, "wheel", "z", ngon(20, R, Math.PI / 20, x, ay), side(s, 0.665, 0.79));
        extrude(m, "bogie", "z", ngon(14, R * 0.8, 0, x, ay), side(s, 0.79, 0.81));
        m.scope("axle box", () => extrude(m, "bogie", "z", ngon(10, 0.12, 0, x, ay), side(s, 0.81, 0.98)));
        m.scope("brake disc", () => extrude(m, "steel", "z", ngon(14, 0.24, 0, x, ay), side(s, 0.36, 0.41)));
      }
      // the traction motor and its gear case, inboard of the axle
      m.scope("motor", () => {
        const mx = x - Math.sign(dx) * 0.5;
        m.sweep("bogie", "z", ngon(12, 0.24, 0, mx, 0.48), -0.5, ngon(12, 0.24, 0, mx, 0.48), 0.42);
        block(m, "bogie", Math.min(x, mx), Math.max(x, mx), ay - 0.12, ay + 0.14, 0.42, 0.56);
      });
    });
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      const sf = (pts: Pt[], z0 = 0.84, z1 = 0.98) => extrude(m, "bogie", "z", pts.map(([u, v]): [number, number] => [xc + u, v]), side(s, z0, z1));
      // the side frame: over the boxes at each end, dropping between them to the bolster
      sf([[-1.42, 0.56], [1.42, 0.56], [1.48, 0.62], [1.42, 0.7], [-1.42, 0.7], [-1.48, 0.62]]);
      sf([[-0.62, 0.56], [-0.42, 0.42], [0.42, 0.42], [0.62, 0.56]]);
      // the chevron springs between each box and the frame
      for (const k of [-1, 1]) {
        sf([[k * a2 - 0.16, ay + 0.1], [k * a2 + 0.16, ay + 0.1], [k * a2 + 0.16, 0.56], [k * a2 - 0.16, 0.56]], 0.85, 0.97);
        for (const v of [0.48, 0.52]) block(m, "black", xc + k * a2 - 0.18, xc + k * a2 + 0.18, v, v + 0.02, ...side(s, 0.83, 0.99));
      }
      // the shoe beam on the axle boxes, its collector shoe out over the third rail beyond the outer axle
      m.scope("shoe beam", () => {
        const sx = xc + out * (a2 + 0.36);
        block(m, "black", Math.min(xc - out * (a2 + 0.12), sx + out * 0.1), Math.max(xc - out * (a2 + 0.12), sx + out * 0.1), 0.26, 0.34, ...side(s, 0.99, 1.07));
        block(m, "black", sx - 0.1, sx + 0.1, 0.2, 0.32, ...side(s, 1.07, 1.3));
        block(m, "steel", sx - 0.16, sx + 0.16, 0.17, 0.2, ...side(s, 1.22, 1.42));
        m.rod("black", [sx, 0.32, s * 1.18], [sx - out * 0.3, 0.76, s * 1.22], 0.02, 6);
      });
    }
    // the transoms and the bolster
    for (const u of [-0.32, 0.32]) block(m, "bogie", xc + u - 0.1, xc + u + 0.1, 0.42, 0.6, -0.86, 0.86);
    block(m, "bogie", xc - 0.24, xc + 0.24, 0.62, 0.76, -0.95, 0.95);
  });
}

/** A lamp on a face at |x| = face facing e: a black housing and its lens. */
function ctaLamp(m: MeshBuilder, e: number, face: number, z: number, y: number, r: number, lens: string, n = 12, rim = 0.025): void {
  const ring = ngon(n, r + rim, 0, z, y), glass = ngon(n, r, 0, z, y);
  m.sweep("black", "x", ring, e * (face - 0.01), ring, e * (face + 0.03));
  m.sweep(lens, "x", glass, e * (face + 0.03), glass, e * (face + 0.045));
}

/** A rounded flat panel on the face at |x| = face + off, facing e. */
function ctaFlat(m: MeshBuilder, e: number, face: number, off: number, mat: string, z0: number, z1: number, y0: number, y1: number, r: number): void {
  const p = roundedOutline(z0, z1, y0, y1, Math.min(r, (z1 - z0) / 2, (y1 - y0) / 2)).map(([z, y]): Vec3 => [e * (face + off), y, z]);
  m.facets(mat, p.slice(1, -1).flatMap((q, i) => [p[0]!, q, p[i + 2]!]), [e, 0, 0]);
}

/** The end door on a face: its seams, its window in a broad black frame, the grab irons either side and the anticlimber under it. */
function ctaEndDoor(m: MeshBuilder, e: number, face: number, glass: readonly [number, number, number, number] = CTA_END_DOOR.glass): void {
  const { z, y: [y0, y1] } = CTA_END_DOOR, [g0, g1, h0, h1] = glass;
  m.scope("end door", () => {
    const on = e * (face + 0.004);
    decalX(m, "rubber", on, e, -z, -z + 0.025, y0, y1);
    decalX(m, "rubber", on, e, z - 0.025, z, y0, y1);
    decalX(m, "rubber", on, e, -z + 0.025, z - 0.025, y1 - 0.025, y1);
    // the window in its raised stainless frame and broad black rubber
    ctaFlat(m, e, face, 0.006, "ctaFrame", g0 - 0.04, g1 + 0.04, h0 - 0.04, h1 + 0.04, 0.15);
    ctaFlat(m, e, face, 0.009, "black", g0, g1, h0, h1, 0.12);
    ctaFlat(m, e, face, 0.013, "cabGlass", g0 + 0.05, g1 - 0.05, h0 + 0.05, h1 - 0.05, 0.08);
    for (const s of [-1, 1]) {
      m.rod("handrail", [e * (face + 0.07), 1.25, s * (z + 0.08)], [e * (face + 0.07), 2.7, s * (z + 0.08)], 0.016, 6);
      // the safety chains slung from the posts to the door's middle
      for (const y of [2.45, 1.95]) {
        m.rod("steel", [e * (face + 0.09), y, s * (z + 0.08)], [e * (face + 0.1), y - 0.3, s * 0.18], 0.009, 4);
        m.rod("steel", [e * (face + 0.1), y - 0.3, s * 0.18], [e * (face + 0.1), y - 0.36, 0], 0.009, 4);
      }
    }
  });
  m.scope("anticlimber", () => {
    const ax = (a: number, c: number): [number, number] => (e > 0 ? [face + a, face + c] : [-face - c, -face - a]);
    block(m, "ss", ...ax(-0.02, 0.09), 0.99, 1.11, -1.18, 1.18);
    for (const y of [1.02, 1.06]) block(m, "ssDark", ...ax(0.09, 0.11), y, y + 0.02, -1.15, 1.15);
  });
}

/** The cab face at |x| = face (+X): two big windscreens, the end door with its window, the LED sign, four marker lamps a side, head and tail lamps, wipers and the anticlimber. */
function ctaCabFace(m: MeshBuilder, face: number): void {
  const e = 1;
  m.scope("windscreens", () => {
    for (const [z0, z1, y0, y1] of CTA_SCREENS) {
      ctaFlat(m, e, face, 0.006, "rubber", z0, z1, y0, y1, 0.14);
      ctaFlat(m, e, face, 0.01, "cabGlass", z0 + 0.06, z1 - 0.06, y0 + 0.06, y1 - 0.06, 0.09);
      // the slot under the screen with its bar, the parked wiper
      const zm = (z0 + z1) / 2;
      decalX(m, "black", face + 0.004, e, zm - 0.24, zm + 0.24, y0 - 0.12, y0 - 0.07);
      m.rod("handrail", [face + 0.03, y0 - 0.095, zm - 0.22], [face + 0.03, y0 - 0.095, zm + 0.22], 0.012, 6);
      m.rod("black", [face + 0.022, y0 + 0.1, zm + 0.05], [face + 0.022, y0 + 0.75, zm + 0.12], 0.01, 4);
    }
  });
  ctaEndDoor(m, e, face);
  m.scope("sign", () => {
    // the LED destination sign: its black panel and the line's terminal in orange
    ctaFlat(m, e, face, 0.006, "black", -0.33, 0.33, 3.26, 3.53, 0.03);
    endText(m, "ctaSign", "HOWARD", e, face + 0.01, 0, 3.34, 0.11);
  });
  m.scope("marker lamps", () => {
    const lens = ["lampHead", "ctaMarkerBlue", "ctaAmber", "lampRed"];
    [0.64, 0.8, 0.95, 1.09].forEach((z, i) => { for (const s of [-1, 1]) ctaLamp(m, e, face, s * z, 3.36, 0.058, lens[i]!, 10, 0.014); });
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1]) {
      ctaLamp(m, e, face, s * 0.72, 1.68, 0.09, "lampHead", 14, 0.03);
      ctaLamp(m, e, face, s * 1.0, 1.68, 0.08, "lampRed", 14, 0.03);
    }
  });
  m.scope("number", () => endText(m, "black", CTA_NUMBER, e, face + 0.006, 0, 1.6, 0.12));
  // the crew's stirrup steps under the side sills by the corners (Fullerton)
  m.scope("corner steps", () => {
    for (const s of [-1, 1]) {
      const P = (dx: number, y: number): Vec3 => [face - dx, y, s * 1.33];
      m.rod("handrail", P(0.12, 0.86), P(0.14, 0.42), 0.014, 6);
      m.rod("handrail", P(0.14, 0.42), P(0.42, 0.42), 0.014, 6);
      m.rod("handrail", P(0.42, 0.42), P(0.44, 0.86), 0.014, 6);
    }
  });
}

/** The plain #2 end at |x| = face (-X): the end door with its window and grab irons, the anticlimber. */
function ctaPlainFace(m: MeshBuilder, face: number): void {
  const e = -1;
  ctaEndDoor(m, e, face, CTA_PLAIN_GLASS);
  // the curved grab handles by each corner
  m.scope("grab handles", () => {
    for (const s of [-1, 1]) for (const y of [1.75, 2.2, 2.65]) {
      const P = (z: number, o: number): Vec3 => [e * (face + o), y, s * z];
      m.rod("handrail", P(0.92, 0.0), P(0.95, 0.07), 0.014, 6);
      m.rod("handrail", P(0.95, 0.07), P(1.12, 0.07), 0.014, 6);
      m.rod("handrail", P(1.12, 0.07), P(1.15, 0.0), 0.014, 6);
    }
  });
}

export function nycR160(params?: ParamValues): MeshBuilder {
  const u = resolveParams(R160_PARAMS, params).unit as MetroCar;
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...R160_PAL });
  drawCar(m, r160Def(u), (d) => R160_LENGTH / 2 - R160_GAP - d);
  return m;
}
export function nycR160Lod(params?: ParamValues): MeshBuilder {
  return r160Lod(resolveParams(R160_PARAMS, params).unit as MetroCar);
}
const ctaX = (d: number) => CTA_LENGTH / 2 - 0.25 - d;
export function cta5000(): MeshBuilder {
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...METRO_PAL, ...CTA_PAL });
  drawCar(m, ctaDef(), ctaX);
  return m;
}
export function cta5000Lod(): MeshBuilder {
  const c = ctaDef(), mid = CTA_BODY / 2;
  // one glass band from the cab window to the plain end's narrow window
  const body: UnitBody = { ...carLodBody({ ...c, spec: { ...c.spec, front: undefined, rear: undefined } }, ctaX), windows: [{ u: [ctaX(CTA_BODY - 0.68), ctaX(CTA_CAB_WIN.d[0])], y: [CTA_WIN.y[0], CTA_WIN.y[1]], mat: LOD_GLASS }] };
  const parts = bogieParts([mid - CTA_TRUCKS / 2, mid + CTA_TRUCKS / 2].map((d) => [ctaX(d), 1.48] as const), c.spec.B);
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...METRO_PAL, ...CTA_PAL }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Designs

const UNIT_CATALOG = { ...RAIL_CATALOG, group: "unit" };

export const US_TRANSIT: ProceduralDesign[] = [
  { id: "proc-vehicle-budd-rdc", title: "Budd RDC", build: buddRdc, buildLod: buddRdcLod, params: RDC_PARAMS, game: { weight: 54, power: 410, maxspeed: 137, accel: null }, catalog: { ...UNIT_CATALOG, traction: "diesel" }, loadingGauge: "us", references: "budd-rdc" },
  { id: "proc-vehicle-nyc-r160", title: "NYC Subway R160", build: nycR160, buildLod: nycR160Lod, params: R160_PARAMS, game: { weight: 38, power: 345, maxspeed: 89, accel: null, variants: [{ params: { unit: "trailer" }, weight: 36 }] }, catalog: METRO_CATALOG, loadingGauge: "us", references: "nyc-r160" },
  { id: "proc-vehicle-cta-5000", title: "Chicago 'L' 5000-series", build: cta5000, buildLod: cta5000Lod, game: { weight: 30, power: 320, maxspeed: 89, accel: null }, catalog: METRO_CATALOG, loadingGauge: "us", references: "cta-5000" },
];
