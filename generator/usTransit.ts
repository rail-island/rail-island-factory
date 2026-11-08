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
import { crownPoint, halfSlice, sideAt, sideDecal, sideLettering, sidePanel, sliceCabin, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { openable, plugMove } from "./doors.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, endDiaphragm, faceLamps, type CarbodySpec, type Painter } from "./carbodyKit.ts";
import { decalX, knuckleCoupler } from "./usHoodKit.ts";
import { centreCoupler, enumParam } from "./emuParts.ts";
import { METRO_CATALOG } from "./metro.ts";
import { RAIL_CATALOG, coil } from "./cd163.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, type UnitBody } from "./lodUnits.ts";

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
  /** Window rows: their sill and head, their d spans, frame paint; `onSide` (+1 or -1) a row on that side only (default both); `cornerR` rounds the frame's and the glass's corners (default square). */
  windows: ReadonlyArray<{ y: readonly [number, number]; spans: ReadonlyArray<readonly [number, number]>; frame: string; onSide?: number; cornerR?: number }>;
  /** Passenger doors on both sides: d spans, sill and head, the leaf's window; `spanSides[i]` (+1 or -1) puts span i on that side only (default both). */
  doors: { spans: ReadonlyArray<readonly [number, number]>; y: readonly [number, number]; glass: readonly [number, number]; slides?: readonly number[]; glassW?: number; glassPair?: number; spanSides?: readonly number[] };
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
        const w = c.doors.glassW, dm = (d0 + d1) / 2, pair = c.doors.glassPair;
        // a double leaf: two narrow windows `glassPair` apart, the leaves' seam between them
        if (w && pair) for (const k of [-1, 1]) sidePanel(mm, b, X, s, "glass", dm + (k * pair) / 2 - w / 2, dm + (k * pair) / 2 + w / 2, c.doors.glass[0], c.doors.glass[1], 0.012, 0.004);
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
              roundedSidePanel(m, b, X, s, "glass", a + 0.04, e - 0.04, w.y[0] + 0.04, w.y[1] - 0.04, Math.max(0.01, w.cornerR - 0.03), 0.012, 0);
              return;
            }
            sidePanel(m, b, X, s, w.frame, a, e, w.y[0], w.y[1], 0.006, 0.03);
            sidePanel(m, b, X, s, "glass", a + 0.04, e - 0.04, w.y[0] + 0.04, w.y[1] - 0.04, 0.012, 0.004);
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
            block(m, "underframe", ...((e > 0 ? [beam - 0.25, beam] : [-beam, -beam + 0.25]) as [number, number]), c.couplerY - 0.25, c.couplerY + 0.22, -1.3, 1.3);
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

/** Spans of n windows w wide, evenly over d0..d1. */
const row = (d0: number, d1: number, n: number, w: number): Array<[number, number]> =>
  Array.from({ length: n }, (_, i): [number, number] => { const d = d0 + ((d1 - d0) * (i + 0.5)) / n; return [d - w / 2, d + w / 2]; });

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

function r160Def(u: MetroCar): CarDef {
  const L = R160_LENGTH - 0.5;
  const doorAt = [-6.9, -2.3, 2.3, 6.9].map((x) => L / 2 + x);
  const doors = doorAt.map((d): [number, number] => [d - 0.635, d + 0.635]);
  const gaps: Array<[number, number]> = [[1.0, doors[0]![0] - 0.2], ...doors.slice(0, -1).map((dd, i): [number, number] => [dd[1] + 0.2, doors[i + 1]![0] - 0.2]), [doors[3]![1] + 0.2, L - 1.0]];
  const windows = gaps.flatMap(([a, b]) => row(a, b, b - a > 2.5 ? 2 : 1, Math.min(1.3, (b - a) / (b - a > 2.5 ? 2 : 1) - 0.25)));
  const trucks = [L / 2 - 6.285, L / 2 + 6.285];
  return {
    spec: { length: L, W: 1.52, Y: 1.15, S: 3.3, C: 3.66, lean: 0.985, arc: 5, B: 0.92, wl: 1.48, A: 1.0, wa: 1.51, edges: [], step: 1.0 },
    bands: [[0, 9, "ss"]], roof: "ss", skirt: "ssDark", under: "under",
    windows: [{ y: [1.95, 2.75], spans: windows, frame: "mask" }],
    doors: { spans: doors, y: [1.13, 3.08], glass: [1.95, 2.7] },
    fluting: { y0: 1.2, y1: 1.85, pitch: 0.1, mat: "ssDark" },
    cab: { mask: [1.0, 3.4, "mask"], panes: [[0.55, 1.35, 1.95, 2.85], [-0.35, 0.35, 1.9, 2.95], [-1.35, -0.55, 1.95, 2.85]], lamps: [[-0.95, 1.4, 0.08, "lampHead"], [0.95, 1.4, 0.08, "lampHead"], [-1.2, 1.4, 0.05, "lampRed"], [1.2, 1.4, 0.05, "lampRed"]] },
    cabEnds: u === "cabCar" ? [1] : [], diaphragm: [1.2, 3.0],
    trucks, truck: truckSpec(ft(7), ft(0, 14), 0.92),
    coupler: "centre", couplerY: 0.82, gap: [0.25, 0.25],
    lettering: [{ text: "8713", d: L / 2, y: 3.0, h: 0.14, mat: "mask" }],
    extras: (m, _b, X) => m.scope("underfloor", () => block(m, "under", X(L / 2 + 3.5), X(L / 2 - 3.5), 0.45, 0.93, -1.1, 1.1)),
  };
}

function ctaDef(): CarDef {
  const L = CTA_LENGTH - 0.5;
  const doors: Array<[number, number]> = [L / 2 - 3.6, L / 2 + 3.6].map((d) => [d - 0.635, d + 0.635]);
  const windows = [...row(1.0, doors[0]![0] - 0.25, 2, 1.0), ...row(doors[0]![1] + 0.25, doors[1]![0] - 0.25, 3, 1.2), ...row(doors[1]![1] + 0.25, L - 1.0, 2, 1.0)];
  const trucks = [L / 2 - ft(32, 6) / 2, L / 2 + ft(32, 6) / 2];
  return {
    spec: { length: L, W: 1.42, Y: 1.15, S: 3.25, C: 3.62, lean: 0.985, arc: 5, B: 0.9, wl: 1.38, A: 1.0, wa: 1.41, edges: [], step: 1.0 },
    bands: [[0, 1.62, "ss"], [1.62, 1.7, "ctaBlue"], [1.7, 1.76, "ss"], [1.76, 1.84, "ctaRed"], [1.84, 9, "ss"]], roof: "ss", skirt: "ssDark", under: "under",
    windows: [{ y: [1.95, 2.8], spans: windows, frame: "mask" }],
    doors: { spans: doors, y: [1.1, 3.05], glass: [1.95, 2.75] },
    cab: { mask: [1.0, 3.35, "mask"], panes: [[0.45, 1.25, 1.95, 2.9], [-0.3, 0.3, 1.9, 2.95], [-1.25, -0.45, 1.95, 2.9]], lamps: [[-0.9, 1.4, 0.08, "lampHead"], [0.9, 1.4, 0.08, "lampHead"], [-1.15, 1.4, 0.05, "lampRed"], [1.15, 1.4, 0.05, "lampRed"]] },
    cabEnds: [1], diaphragm: [1.2, 3.0],
    trucks, truck: truckSpec(ft(7), ft(0, 14), 0.9),
    coupler: "centre", couplerY: 0.8, gap: [0.25, 0.25],
    lettering: [{ text: "5001", d: L / 2, y: 2.95, h: 0.14, mat: "mask" }],
    extras: (m, _b, X) => m.scope("underfloor", () => block(m, "under", X(L / 2 + 2.6), X(L / 2 - 2.6), 0.45, 0.91, -1.0, 1.0)),
  };
}

export function nycR160(params?: ParamValues): MeshBuilder {
  const u = resolveParams(R160_PARAMS, params).unit as MetroCar;
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...METRO_PAL });
  drawCar(m, r160Def(u), (d) => R160_LENGTH / 2 - 0.25 - d);
  return m;
}
export function nycR160Lod(params?: ParamValues): MeshBuilder {
  const u = resolveParams(R160_PARAMS, params).unit as MetroCar;
  return carLod(r160Def(u), (d) => R160_LENGTH / 2 - 0.25 - d, { ...CARBODY_PALETTE, ...METRO_PAL });
}
export function cta5000(): MeshBuilder {
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...METRO_PAL });
  drawCar(m, ctaDef(), (d) => CTA_LENGTH / 2 - 0.25 - d);
  return m;
}
export function cta5000Lod(): MeshBuilder {
  return carLod(ctaDef(), (d) => CTA_LENGTH / 2 - 0.25 - d, { ...CARBODY_PALETTE, ...METRO_PAL });
}

// ---------------------------------------------------------------------------
// Designs

const UNIT_CATALOG = { ...RAIL_CATALOG, group: "unit" };

export const US_TRANSIT: ProceduralDesign[] = [
  { id: "proc-vehicle-budd-rdc", title: "Budd RDC", build: buddRdc, buildLod: buddRdcLod, params: RDC_PARAMS, game: { weight: 54, power: 410, maxspeed: 137, accel: null }, catalog: { ...UNIT_CATALOG, traction: "diesel" }, loadingGauge: "us", references: "budd-rdc" },
  { id: "proc-vehicle-nyc-r160", title: "NYC Subway R160", build: nycR160, buildLod: nycR160Lod, params: R160_PARAMS, game: { weight: 38, power: 345, maxspeed: 89, accel: null, variants: [{ params: { unit: "trailer" }, weight: 36 }] }, catalog: METRO_CATALOG, loadingGauge: "us", references: "nyc-r160" },
  { id: "proc-vehicle-cta-5000", title: "Chicago 'L' 5000-series", build: cta5000, buildLod: cta5000Lod, game: { weight: 30, power: 320, maxspeed: 89, accel: null }, catalog: METRO_CATALOG, loadingGauge: "us", references: "cta-5000" },
];
