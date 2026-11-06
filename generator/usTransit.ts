// North American passenger cars and urban rail on the carbody kit
// (carbodyKit.ts): the Budd RDC railcar (1949), the New York subway's R160
// (2005) and the Chicago 'L' 5000-series (2009); the Pioneer Zephyr's coach and
// observation car (pioneerZephyr.ts) are drawn by the same builder. One car
// builder (`drawCar`) draws any flat- or round-ended car from a
// `CarDef`: its lofted body, window rows, plug doors opening onto its cabin,
// cab ends with their windscreens and lamps, couplers and trucks. Real size on
// the US loading gauge. See docs/models/us-transit.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { MeshBuilder as Builder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { bogieGeometry, buffers, coupling, exhaust, horn, paint, type BogieSpec } from "./dieselParts.ts";
import { block } from "./vehicleParts.ts";
import type { Pt } from "./sliceLoft.ts";
import { sideDecal, sideLettering, sidePanel, sliceCabin, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { openable, plugMove } from "./doors.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, endDiaphragm, faceLamps, type CarbodySpec, type Painter } from "./carbodyKit.ts";
import { decalX, knuckleCoupler } from "./usHoodKit.ts";
import { centreCoupler, enumParam } from "./emuParts.ts";
import { METRO_CATALOG } from "./metro.ts";
import { RAIL_CATALOG } from "./cd163.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, type UnitBody } from "./lodUnits.ts";

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
  /** Window rows: their sill and head, their d spans, frame paint. */
  windows: ReadonlyArray<{ y: readonly [number, number]; spans: ReadonlyArray<readonly [number, number]>; frame: string }>;
  /** Passenger doors on both sides: d spans, sill and head, the leaf's window. */
  doors: { spans: ReadonlyArray<readonly [number, number]>; y: readonly [number, number]; glass: readonly [number, number] };
  /** Fluting: thin lines along the side between these heights (stainless cars). */
  fluting?: { y0: number; y1: number; pitch: number; mat: string };
  /** A flat cab end: windscreen panes (z0, z1, y0, y1), lamps (z, y, r, lens), the front's paint. */
  cab?: { panes: ReadonlyArray<readonly [number, number, number, number]>; lamps: ReadonlyArray<readonly [number, number, number, string]>; mask?: readonly [number, number, string] };
  /** Which ends are cabs (a flat cab end) and which carry a gangway diaphragm. */
  cabEnds: readonly number[];
  diaphragm: readonly [number, number] | null;
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
  /** Anything else: roof equipment, underfloor boxes, a nose's windscreen. */
  extras?: (m: MeshBuilder, b: SliceBody, X: (d: number) => number) => void;
}

const LEAF_INSET = 0.02;

/** The body of a car. */
export const carBody = (c: CarDef): SliceBody => {
  const edges = [...new Set([...c.bands.flatMap(([a, b]) => [a, b]), ...c.windows.flatMap((w) => [w.y[0], w.y[1]])])]
    .filter((y) => y > c.spec.Y + 0.01 && y < c.spec.S - 0.01).sort((a, b) => a - b);
  return carbody({ ...c.spec, edges: [...new Set([...c.spec.edges, ...edges])].sort((a, b) => a - b) });
};

/** The doors' leaf boxes on both sides: the doorways into the car's cabin. */
const leavesOf = (c: CarDef): SliceDoorway[] =>
  [1, -1].flatMap((s) => c.doors.spans.map(([a, b]) => ({ s, d0: a + LEAF_INSET, d1: b - LEAF_INSET, y0: c.doors.y[0] + LEAF_INSET, y1: c.doors.y[1] - LEAF_INSET })));

function door(m: MeshBuilder, c: CarDef, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number): void {
  const [y0, y1] = c.doors.y;
  const k = LEAF_INSET;
  m.scope("outline", () => {
    sidePanel(m, b, X, s, "rubber", d0, d0 + k, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d1 - k, d1, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.004, 0.03);
  });
  const slide = (d0 + d1) / 2 < b.length / 2 ? 1 : -1;
  const dx = X(d0 + slide * (d1 - d0)) - X(d0);
  openable(m, (mm, o) =>
    mm.moved(plugMove(o, s, dx), () => {
      mm.scope("leaf", () => {
        for (const [a, cc, mat] of c.bands) {
          const [lo, hi] = [Math.max(a, y0 + 0.02), Math.min(cc, y1 - 0.02)];
          if (hi - lo > 1e-6) sidePanel(mm, b, X, s, mat, d0 + 0.02, d1 - 0.02, lo, hi, 0.008, 0.003);
        }
      });
      mm.scope("glass", () => sidePanel(mm, b, X, s, "glass", d0 + 0.12, d1 - 0.12, c.doors.glass[0], c.doors.glass[1], 0.012, 0.004));
    }),
  );
  m.scope("step", () => sidePanel(m, b, X, s, c.under, d0, d1, y0 - 0.08, y0, 0.006, 0.2));
}

/** Fluting along a side from d0 to d1 between heights, broken over windows and doors. */
function fluting(m: MeshBuilder, c: CarDef, b: SliceBody, X: (d: number) => number, s: number): void {
  const f = c.fluting!;
  const holes: Array<readonly [number, number, number, number]> = [
    ...c.windows.flatMap((w) => w.spans.map(([a, e]) => [a - 0.04, e + 0.04, w.y[0] - 0.04, w.y[1] + 0.04] as const)),
    ...c.doors.spans.map(([a, e]) => [a - 0.04, e + 0.04, -9, 99] as const),
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
  const painter: Painter = bandPainter(c.bands, c.roof, c.under, c.skirt, c.spec.S);
  const leaves = leavesOf(c);
  const cut = leaves.map((l) => ({ ...l, d0: l.d0 - 0.002, d1: l.d1 + 0.002, y0: l.y0 - 0.002, y1: l.y1 + 0.002 }));
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter, cut));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        c.windows.forEach((w, r) =>
          m.scope(`windows ${r + 1}`, () => w.spans.forEach(([a, e], i) => m.scope(`window ${i + 1}`, () => {
            sidePanel(m, b, X, s, w.frame, a, e, w.y[0], w.y[1], 0.006, 0.03);
            sidePanel(m, b, X, s, "glass", a + 0.04, e - 0.04, w.y[0] + 0.04, w.y[1] - 0.04, 0.012, 0.004);
          }))));
        m.scope("doors", () => c.doors.spans.forEach(([a, e], i) => m.scope(`door ${i + 1}`, () => door(m, c, b, X, s, a, e))));
        if (c.fluting) m.scope("fluting", () => fluting(m, c, b, X, s));
        for (const l of c.lettering ?? []) m.scope("lettering", () => sideLettering(m, b, X, s, l.text, l.d, l.y, l.h, l.mat, 0.012));
      });
    if (leaves.length) {
      const panes = [1, -1].flatMap((s) => c.windows.flatMap((w) => w.spans.map(([a, e]) => ({ s, d0: a + 0.04, d1: e - 0.04, y0: w.y[0] + 0.04, y1: w.y[1] - 0.04 }))));
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
      } else if (c.diaphragm && !inside) endDiaphragm(m, e, x, c.diaphragm[0], c.diaphragm[1], 0.5);
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
const RDC_GAP = 0.4;
const RDC_BODY = RDC_LENGTH - 2 * RDC_GAP;
const RDC_TRUCKS = ft(59, 6);
const rdcEnd = { len: 0.5, tip: 0.9, power: 2, C: [[0, 3.78], [0.5, 4.0]] as Pt[], S: [[0, 3.55], [0.5, 3.6]] as Pt[] };
const RDC_PAL = { ss: paint("#c6cacd", 0.3), ssDark: paint("#9da1a4", 0.4), rdcRed: paint("#b8222a"), under: paint("#2a2c2f", 0.85) };

function rdcDef(t: RdcType): CarDef {
  const L = RDC_BODY;
  const win = t === "rdc1" ? row(2.0, L - 2.0, 14, 1.25) : row(9.6, L - 2.0, 10, 1.25);
  return {
    spec: { length: L, W: 1.52, Y: 1.3, S: 3.6, C: 4.0, lean: 0.97, arc: 6, B: 0.95, wl: 1.45, A: 1.1, wa: 1.51, front: rdcEnd, rear: rdcEnd,
      cuts: [L / 2 - RDC_TRUCKS / 2, L / 2 + RDC_TRUCKS / 2].map((d) => [d - 1.85, d + 1.85] as const), edges: [], step: 1.0, noseStep: 0.1 },
    bands: [[0, 1.2, "ss"], [1.2, 1.26, "rdcRed"], [1.26, 9, "ss"]], roof: "ss", skirt: "ssDark", under: "under",
    windows: [{ y: [2.1, 2.85], spans: win, frame: "ssDark" }],
    doors: { spans: [[0.75, 1.65], [L - 1.65, L - 0.75]], y: [1.25, 3.05], glass: [2.15, 2.8] },
    fluting: { y0: 1.32, y1: 2.0, pitch: 0.09, mat: "ssDark" },
    cab: { panes: [[-1.15, -0.45, 2.25, 2.95], [0.45, 1.15, 2.25, 2.95], [-0.3, 0.3, 2.25, 2.95]], lamps: [[-1.0, 1.55, 0.07, "lampRed"], [1.0, 1.55, 0.07, "lampRed"]] },
    cabEnds: [1, -1], diaphragm: null,
    trucks: [L / 2 - RDC_TRUCKS / 2, L / 2 + RDC_TRUCKS / 2], truck: truckSpec(ft(8, 6), ft(0, 16.5), 0.95),
    coupler: "knuckle", couplerY: 0.88, gap: [RDC_GAP, RDC_GAP],
    lettering: [{ text: t === "rdc1" ? "BUDD RDC-1" : "BUDD RDC-2", d: L / 2, y: 1.45, h: 0.18, mat: "ssDark" }],
    extras: (m, _b, X) => {
      if (t === "rdc2") m.scope("baggage doors", () => { for (const s of [-1, 1]) sidePanel(m, _b, X, s, "ssDark", 4.0, 5.5, 1.3, 3.1, 0.005, 0.006); });
      m.scope("roof", () => {
        for (const d of [L / 2 - 4.5, L / 2 + 4.5]) m.scope("radiator", () => block(m, "ssDark", X(d + 1.6), X(d - 1.6), 3.95, 4.15, -0.8, 0.8));
        exhaust(m, X(L / 2 - 6.4), 0.4, 4.0, 4.3, 0.18, 0.18);
        exhaust(m, X(L / 2 + 6.4), -0.4, 4.0, 4.3, 0.18, 0.18);
        horn(m, 1, X(1.2), 0.3, 4.05);
        horn(m, -1, X(L - 1.2), -0.3, 4.05);
      });
      m.scope("underfloor", () => { for (const d of [L / 2 - 4.0, L / 2 + 4.0]) block(m, "under", X(d + 1.5), X(d - 1.5), 0.45, 0.96, -1.05, 1.05); });
      for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => rdcEndFace(m, e, Math.abs(X(e > 0 ? 0 : L))));
    },
  };
}

/** The RDC end door's outline (z half width, sill, head) around the middle windscreen pane, and the headlight hood over it. */
const RDC_END_DOOR = { z: 0.4, y0: 1.3, y1: 3.12, seam: 0.025 };
const RDC_HOOD = { z: 0.44, y0: 3.24, y1: 3.62, r: 0.14, depth: 0.16 };

/** A rounded-top oblong in (z, y): half width w, from y0 to y1, top corners of radius r. */
function hoodRing(w: number, y0: number, y1: number, r: number): Pt[] {
  const ring: Pt[] = [[-w, y0], [w, y0]];
  for (let i = 0; i <= 4; i++) { const a = (i / 4) * (Math.PI / 2); ring.push([w - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 0; i <= 4; i++) { const a = Math.PI / 2 + (i / 4) * (Math.PI / 2); ring.push([-w + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  return ring;
}

/** An RDC cab end at |x| = face, facing e: the end door's seams and grab handle, the headlight hood and its twin lamps. */
function rdcEndFace(m: MeshBuilder, e: number, face: number): void {
  const x = e * face, { z, y0, y1, seam } = RDC_END_DOOR;
  m.scope("end door", () => {
    const on = x + e * 0.004;
    decalX(m, "rubber", on, e, -z, -z + seam, y0, y1);
    decalX(m, "rubber", on, e, z - seam, z, y0, y1);
    decalX(m, "rubber", on, e, -z + seam, z - seam, y1 - seam, y1);
    // the grab handle beside the door, on the engineer's side
    const hz = e * (z - 0.09);
    block(m, "ssDark", ...((e > 0 ? [x - 0.01, x + 0.04] : [x - 0.04, x + 0.01]) as [number, number]), 1.75, 2.05, hz - 0.015, hz + 0.015);
  });
  m.scope("headlight hood", () => {
    const h = RDC_HOOD, ring = hoodRing(h.z, h.y0, h.y1, h.r);
    m.sweep("ssDark", "x", ring, x - e * 0.03, ring, x + e * h.depth);
    faceLamps(m, e, face + h.depth, [[-0.16, (h.y0 + h.y1) / 2, 0.09, "lampHead"], [0.16, (h.y0 + h.y1) / 2, 0.09, "lampHead"]]);
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
  return carLod(rdcDef(t), (d) => RDC_LENGTH / 2 - RDC_GAP - d, { ...CARBODY_PALETTE, ...RDC_PAL });
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
