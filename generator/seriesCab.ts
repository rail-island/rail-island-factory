// A series end car's cab face (shinkansen.ts `cabFace`): the front drawn as one
// painted surface (cabNose.ts) in place of the lofted nose, so a flat, raked or
// bowed cab front carries its windscreens, black surrounds, lamps, gangway door
// and number as exact paint boundaries and fittings on its own skin. The face's
// slices meet the body's own section `dJoin` behind the tip; the body itself
// ends square there. Also the distant model's end (lodUnits.ts noseEnd). See
// docs/models/shinkansen.md, "The series kit beyond the Shinkansen".

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { halfSlice, type SliceBody } from "./sliceBody.ts";
import { CabNose, inRoundRect, type NoseLayer, type NoseQuery, type NoseSpec } from "./cabNose.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { noseEnd, type UnitEnd } from "./lodUnits.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";

/** A rounded rectangle on the face: lateral span (viewer's right positive, seen from ahead), heights, corner radius. */
export interface FaceRect {
  lat: readonly [number, number];
  y: readonly [number, number];
  r: number;
  /** Its paint (a surround's; the panes are glass). */
  mat?: string;
}

/** Bands of paint by height: [y0, y1, material]. */
type Band = readonly [number, number, string];

export interface SeriesCabFace {
  /** Where the face meets the body's own section, back from the tip. */
  dJoin: number;
  /** Where the cab side starts at the latest, back from the tip (default dJoin / 2). */
  dSide?: number;
  /** The face's centre line: [y, d back from the tip], from the body's bottom to its crown (d = dJoin there). */
  profile: Pt[];
  /** The plan's corner radius by height: [y, r]. */
  corner: Pt[];
  /** The corner's depth back along the car by height: [y, depth] (default its radius): a deeper, elliptic corner tapers the face in plan. */
  cornerDepth?: Pt[];
  /** The grid's base columns per half (face, corner, run, side; default 8, 4, 1, 1) and a paint edge's straightness tolerance (m). */
  cols?: [number, number, number, number];
  tolerance?: number;
  /** The face's bow: its edges this much behind its centre (by height, [y, bulge], for a vee that deepens or flattens). */
  bulge?: number | readonly Pt[];
  /** The distant model's end in place of the face's own profile, plan and rows: a face with a low bonnet ahead of it drawn apart (the series' fittings). */
  lod?: { profile: Pt[]; corner: Pt[]; rows: number[]; bulge?: number | readonly Pt[]; glass?: boolean };
  /** The corner arc's depth over its radius by height (cabNose.ts `cornerRatio`). */
  cornerRatio?: Pt[];
  /** Grid rows, ascending, from the body's bottom to its crown (the profile's and the paint's heights). */
  rows: number[];
  /** The face's paint by height (default the livery's `front`, else its side bands); the roof's colour from `roofFrom` up. */
  bands?: (livery: { bands: readonly Band[]; front?: readonly Band[] }) => readonly Band[];
  roofFrom: number;
  /** The distant model's face bands (default the face's own): a face painted by its fields. */
  lodBands?: readonly Band[];
  /** Painted fields over the face's bands: surrounds and masks. */
  masks?: readonly FaceRect[];
  /** Painted polygons over the face's bands, [lat, y] corners (one y-interval at each lat): a livery's sweep or emblem. */
  fields?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  /** Convex polygons laid as decals on the face, [lat, y] corners, subdivided to follow its curve: a livery's point, an emblem (cheaper than a field). */
  decals?: ReadonlyArray<{ mat: string; pts: readonly Pt[]; fine?: number }>;
  /**
   * Paint over the whole surface, face and cab sides alike, between a front and a back edge, [y, d] by
   * height (d behind the tip, ascending y) and below `top` (default `roofFrom`); later ones over earlier
   * ones, drawn over the livery's sweeps and under the fields, masks and panes: a colour field that
   * runs from the face's front round its corners and back along the nose (a long, pointed nose).
   */
  paint?: ReadonlyArray<{ mat: string; front: readonly Pt[]; back: readonly Pt[]; top?: number }>;
  /** The face's bands wrap round onto the cab sides back to the join (default the sides' bands there). */
  wrap?: boolean;
  /** The windscreens and other panes, painted glass. */
  panes: readonly FaceRect[];
  /** Round lamps on the face: lat, y, radius, lens. */
  lamps?: ReadonlyArray<readonly [number, number, number, string]>;
  /** A gangway door: its frame standing off the face (half width, sill, head, bar width) and the leaf's paint. */
  gangway?: { hw: number; y0: number; y1: number; bar: number; leaf: string; light?: boolean };
  /** The running number on the face: lat of its start, foot, letter height and ink. */
  number?: { lat: number; y: number; h: number; mat: string };
  /** Wipers: [lat, y] of the pivot and of the blade's tip, each mirrored to the other side when `mirror`. */
  wipers?: ReadonlyArray<readonly [Pt, Pt]>;
  /** A lamp on the roof dome over the face (lat, y, r). */
  roofLamp?: readonly [number, number, number];
  /** The coupling plane's reach beyond the tip at the coupler (default 0.07; buffered ends use the buffers' gap). */
  reach?: number;
  /** The first door's d behind the tip on the end car (default 2.4 m). */
  first?: number;
  /**
   * Housings standing off the face, flat-fronted rounded rectangles (lat and y of the centre, width,
   * height, corner radius - default half the height -, how far the front stands proud, how deep the
   * back sinks in, paint): a lamp pod, a coupler cover. A pod's lamps (lat offset from its centre,
   * radius, lens) sit on its front.
   */
  pods?: ReadonlyArray<{ lat: number; y: number; w: number; h: number; r?: number; proud: number; depth: number; mat: string; lamps?: ReadonlyArray<readonly [number, number, string]>; level?: boolean }>;
  /** Lettering on the face: text, lat of its centre, foot, letter height, ink. */
  texts?: ReadonlyArray<{ text: string; lat: number; y: number; h: number; mat: string }>;
  /** The face's depth reshaped across it (cabNose.ts `reshape`; the distant model keeps the plain slices): a canopy, grooves and wing edges. */
  reshape?: (lat: number, y: number, d: number) => number;
}

/** The body's half widths by height ([y, half width], ascending, crown last), from its own section at d. */
export function bodyHalf(b: SliceBody, d: number): Pt[] {
  const pts = halfSlice(b, d).slice(1).map(([z, y]): Pt => [y, z]);
  const out: Pt[] = [];
  for (const p of pts) if (!out.length || p[0] > out[out.length - 1]![0] + 1e-6) out.push(p);
  return out;
}

/** Inside a polygon (ray casting). */
function inPoly(x: number, y: number, pts: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!, [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const inRect = (q: NoseQuery, f: FaceRect) => inRoundRect(q.lat, q.y, (f.lat[0] + f.lat[1]) / 2, (f.y[0] + f.y[1]) / 2, (f.lat[1] - f.lat[0]) / 2, (f.y[1] - f.y[0]) / 2, f.r);

/** The paint a cab face takes from the livery: its face bands, the cab sides' bands, roof and skirt. */
export interface FacePaint {
  sides: readonly Band[];
  face: readonly Band[];
  roof: string;
  skirt: string;
  /** The body's shoulder (the roof's colour from there on the cab sides) and skirt top. */
  S: number;
  A: number;
  number: string;
  /** The livery's sweeps (shinkansen.ts `endSweeps`, d behind the tip), painted on the face's cab sides too (and on its front and corners with `face`). */
  sweeps?: ReadonlyArray<{ mat: string; front: readonly Pt[]; back: readonly Pt[]; top?: number; face?: boolean }>;
  /** The livery's own painted polygons on the face ([lat, y], like the face's `fields`, drawn under them): a canopy painted round its glass. */
  fields?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
}

/** Value of a [y, d] edge at height y (held past its ends). */
export function edgeAt(pts: readonly Pt[], y: number): number {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!;
    if (y <= yb) return yb - ya < 1e-9 ? db : da + ((y - ya) / (yb - ya)) * (db - da);
  }
  return pts[pts.length - 1]![1];
}

function layers(f: SeriesCabFace, p: FacePaint): NoseLayer[] {
  const onFace = (q: NoseQuery) => Math.abs(q.u) <= 2;
  const banded = (q: NoseQuery) => f.wrap || onFace(q);
  const out: NoseLayer[] = p.sides.map(([y0, y1, mat]): NoseLayer => ({ mat, name: `${mat} side`, where: { side: true, y: [y0, y1] }, inside: (q) => !onFace(q) && q.y >= y0 && q.y < y1 }));
  out.push({ mat: p.skirt, name: "skirt", where: { side: true }, inside: (q) => !onFace(q) && q.y < p.A });
  for (const [y0, y1, mat] of p.face) out.push({ mat, name: `${mat} face`, inside: (q) => banded(q) && q.y >= y0 && q.y < y1 && (onFace(q) || q.y >= p.A) });
  out.push({ mat: p.roof, name: "roof", inside: (q) => (banded(q) ? q.y >= f.roofFrom : q.y >= p.S) });
  // a sweep on the cab sides, between the skirt's top and the shoulder (or its own top, over the cab's roof)
  (p.sweeps ?? []).forEach((w, i) => out.push({
    mat: w.mat, name: `sweep ${i + 1}`, where: { ...(w.face ? {} : { side: true }), y: [w.front[0]![0], w.front[w.front.length - 1]![0]] },
    inside: (q) => (w.face || q.side) && q.y >= p.A && q.y < (w.top ?? p.S) && q.y >= w.front[0]![0] && q.y <= w.front[w.front.length - 1]![0] && q.d >= edgeAt(w.front, q.y) && q.d <= edgeAt(w.back, q.y),
  }));
  (f.paint ?? []).forEach((w, i) => out.push({
    mat: w.mat, name: `paint ${i + 1}`, where: { y: [w.front[0]![0], w.front[w.front.length - 1]![0]] },
    inside: (q) => q.y >= w.front[0]![0] && q.y <= w.front[w.front.length - 1]![0] && q.y < (w.top ?? f.roofFrom) && q.d >= edgeAt(w.front, q.y) && q.d <= edgeAt(w.back, q.y),
  }));
  [...(p.fields ?? []), ...(f.fields ?? [])].forEach((r, i) => {
    // the polygon's bounds first: a point outside them is never inside it (inPoly is the scan's cost)
    const lats = r.pts.map((t) => t[0]), ys = r.pts.map((t) => t[1]);
    const [l0, l1, y0, y1] = [Math.min(...lats), Math.max(...lats), Math.min(...ys), Math.max(...ys)];
    out.push({ mat: r.mat, name: `field ${i + 1}`, where: { face: true, y: [y0, y1] }, inside: (q) => q.y >= y0 && q.y <= y1 && q.lat >= l0 && q.lat <= l1 && onFace(q) && inPoly(q.lat, q.y, r.pts) });
  });
  (f.masks ?? []).forEach((r, i) => out.push({ mat: r.mat ?? "cabMask", name: `surround ${i + 1}`, where: { face: true, y: [r.y[0] - 1e-6, r.y[1] + 1e-6] }, inside: (q) => onFace(q) && inRect(q, r) }));
  f.panes.forEach((r, i) => out.push({ mat: r.mat ?? "cabGlass", name: `pane ${i + 1}`, where: { face: true, y: [r.y[0] - 1e-6, r.y[1] + 1e-6] }, inside: (q) => onFace(q) && inRect(q, r) }));
  return out;
}

const spec = (f: SeriesCabFace, e: number, xTip: number, half: Pt[]): Pick<NoseSpec, "e" | "xTip" | "profile" | "half" | "corner" | "cornerDepth" | "cornerRatio" | "bulge" | "rows"> => ({
  e, xTip, profile: f.profile, half, corner: f.corner, rows: f.rows, ...(f.bulge ? { bulge: f.bulge } : {}), ...(f.cornerDepth ? { cornerDepth: f.cornerDepth } : {}), ...(f.cornerRatio ? { cornerRatio: f.cornerRatio } : {}),
});

const rect = (x0: number, x1: number, y0: number, y1: number): Pt[] => {
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  return [[x0 - cx, y0 - cy], [x1 - cx, y0 - cy], [x1 - cx, y1 - cy], [x0 - cx, y1 - cy]];
};

/** A convex polygon as a fan of triangles, each cut into k x k smaller ones (a decal that follows a curved face). */
function subdivide(pts: readonly Pt[], k: number): Pt[] {
  const out: Pt[] = [];
  const lerp2 = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (let i = 1; i + 1 < pts.length; i++) {
    const [a, b, c] = [pts[0]!, pts[i]!, pts[i + 1]!];
    // barycentric grid: point (p, q) = a + p/k (b - a) + q/k (c - a)
    const P = (p: number, q: number): Pt => { const u = lerp2(a, b, p / k); return [u[0] + ((c[0] - a[0]) * q) / k, u[1] + ((c[1] - a[1]) * q) / k]; };
    for (let p = 0; p < k; p++)
      for (let q = 0; p + q < k; q++) {
        out.push(P(p, q), P(p + 1, q), P(p, q + 1));
        if (p + q + 1 < k) out.push(P(p + 1, q), P(p + 1, q + 1), P(p, q + 1));
      }
  }
  return out;
}

/** Draws a cab face on end e (+1 the +X end), its tip at model x e * xTip, joined to the body's section `half`. */
export function drawCabFace(m: MeshBuilder, f: SeriesCabFace, e: number, xTip: number, half: Pt[], p: FacePaint): void {
  const n = new CabNose(m, {
    ...spec(f, e, xTip, half), dJoin: f.dJoin, dSide: f.dSide ?? f.dJoin / 2,
    base: p.face[0]?.[2] ?? p.sides[0]![2], layers: layers(f, p), cols: f.cols ?? [8, 4, 1, 1], ...(f.tolerance ? { tolerance: f.tolerance } : {}), capTop: p.roof, capBottom: p.skirt,
    ...(f.reshape ? { reshape: f.reshape } : {}),
  });
  m.scope("skin", () => n.draw());
  const g = f.gangway;
  if (g)
    m.scope("gangway door", () => {
      const bar = (name: string, x0: number, x1: number, y0: number, y1: number) =>
        m.scope(name, () => n.plate("rubber", (x0 + x1) / 2, (y0 + y1) / 2, rect(x0, x1, y0, y1), 0.06, 0.09));
      bar("frame left", -g.hw, -g.hw + g.bar, g.y0, g.y1);
      bar("frame right", g.hw - g.bar, g.hw, g.y0, g.y1);
      bar("frame top", -g.hw + g.bar, g.hw - g.bar, g.y1 - g.bar, g.y1);
      bar("frame bottom", -g.hw + g.bar, g.hw - g.bar, g.y0, g.y0 + g.bar);
      const [a, b, y0, y1] = [-g.hw + g.bar, g.hw - g.bar, g.y0 + g.bar, g.y1 - g.bar];
      m.scope("leaf", () => n.plate(g.leaf, 0, (y0 + y1) / 2, rect(a, b, y0, y1), 0.03, 0.05));
      if (g.light) m.scope("light", () => n.plate("cabGlass", 0, y1 - 0.5, rect(a + 0.1, b - 0.1, y1 - 0.9, y1 - 0.1), 0.035, 0.01));
    });
  if (f.decals?.length)
    m.scope("decals", () => f.decals!.forEach((dc, i) => m.scope(`decal ${i + 1}`, () => n.decal(dc.mat, subdivide(dc.pts, dc.fine ?? 5), 0.012))));
  if (f.pods?.length)
    m.scope("pods", () => f.pods!.forEach((pd, i) => m.scope(`pod ${i + 1}`, () => {
      const r = Math.min(pd.r ?? pd.h / 2, pd.h / 2, pd.w / 2), k = 4;
      const [hx, hy] = [pd.w / 2 - r, pd.h / 2 - r];
      // the rounded rectangle, counter-clockwise from its right edge
      const ring: Pt[] = [];
      for (const [cx, cy, a0] of [[hx, hy, 0], [-hx, hy, 90], [-hx, -hy, 180], [hx, -hy, 270]] as const)
        for (let j = 0; j <= k; j++) { const a = ((a0 + (90 * j) / k) * Math.PI) / 180; ring.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      if (pd.level) {
        // standing level off a face that slopes there: the housing's front upright, facing the face's plan normal
        const f = n.frameAt(pd.lat, pd.y);
        const k = Math.hypot(f.n[0], f.n[2]) || 1;
        const nn: [number, number, number] = [f.n[0] / k, 0, f.n[2] / k], tt: [number, number, number] = [-nn[2], 0, nn[0]];
        const t = tt[0] * f.t[0] + tt[2] * f.t[2] < 0 ? ([-tt[0], 0, -tt[2]] as [number, number, number]) : tt;
        const pts = ring.map(([a, b]): [number, number, number] => [f.p[0] + nn[0] * pd.proud + t[0] * a, f.p[1] + b, f.p[2] + nn[2] * pd.proud + t[2] * a]);
        m.scope("housing", () => m.slab(pd.mat, pts, [-nn[0] * pd.depth, 0, -nn[2] * pd.depth]));
      } else m.scope("housing", () => n.plate(pd.mat, pd.lat, pd.y, ring, pd.proud, pd.depth));
      const at = { lat: pd.lat, y: pd.y };
      const disc = (rr: number): Pt[] => Array.from({ length: 12 }, (_, j) => [rr * Math.cos((2 * Math.PI * j) / 12), rr * Math.sin((2 * Math.PI * j) / 12)]);
      (pd.lamps ?? []).forEach(([dl, rr, lens], j) => m.scope(`lamp ${j + 1}`, () => {
        m.scope("bezel", () => n.plate("frameSilver", pd.lat + dl, pd.y, disc(rr), pd.proud + 0.02, 0.03, at));
        m.scope("lens", () => n.plate(lens, pd.lat + dl, pd.y, disc(rr * 0.78), pd.proud + 0.026, 0.004, at));
      }));
    })));
  if (f.texts?.length)
    m.scope("lettering", () => f.texts!.forEach((t) => {
      const w = t.h * 0.58, gap = t.h * 0.18, width = strokeWidth(t.text, w, gap);
      // each stroke cut finer, so that it follows a face curving between the rows
      const tris = strokeText(t.text, t.lat - width / 2, t.y, t.h, w, gap, false, t.h * 0.14);
      const fine: Pt[] = [];
      for (let i = 0; i + 2 < tris.length; i += 3) fine.push(...subdivide([tris[i]!, tris[i + 1]!, tris[i + 2]!], 3));
      n.decal(t.mat, fine, 0.006);
    }));
  if (f.lamps?.length)
    m.scope("lamps", () => f.lamps!.forEach(([lat, y, r, lens], i) => m.scope(`lamp ${i + 1}`, () => n.lamp(lat, y, r, lens, "black", 12, 0))));
  if (f.roofLamp) {
    const [lat, y, r] = f.roofLamp;
    m.scope("roof lamp", () => n.lamp(lat, y, r, "lampHead", "black", 12, 0));
  }
  if (f.number) {
    const t = f.number;
    m.scope("running number", () => n.decal(t.mat, strokeText(p.number.replace(/ /g, ""), t.lat, t.y, t.h, t.h * 0.58, t.h * 0.16), 0.005));
  }
  if (f.wipers?.length)
    m.scope("wipers", () => {
      const tris: Pt[] = [];
      for (const [a, b] of f.wipers!) {
        const t = 0.012;
        tris.push([a[0] - t, a[1]], [a[0] + t, a[1]], [b[0] + t, b[1]], [a[0] - t, a[1]], [b[0] + t, b[1]], [b[0] - t, b[1]]);
      }
      n.decal("black", tris, 0.03);
    });
}

/** The distant model's end of a cab face: its profile and plan, the face's bands and the panes as glass. */
export function cabFaceLod(face: SeriesCabFace, e: number, xTip: number, half: Pt[], p: FacePaint, C: number): UnitEnd {
  const f: SeriesCabFace = face.lod ? { ...face, profile: face.lod.profile, corner: face.lod.corner, rows: face.lod.rows, ...(face.lod.bulge !== undefined ? { bulge: face.lod.bulge } : {}) } : face;
  const B = f.rows[0]!;
  const paint: LodBand[] = [...(f.lodBands ?? p.face).map(([a, b, mt]): LodBand => [Math.max(a, B), Math.min(b, f.roofFrom), mt]).filter(([a, b]) => b > a + 1e-6), [f.roofFrom, C, p.roof]];
  const lo = Math.min(...f.panes.map((r) => r.y[0])), hi = Math.max(...f.panes.map((r) => r.y[1]));
  const w = Math.max(...f.panes.map((r) => Math.max(Math.abs(r.lat[0]), Math.abs(r.lat[1]))));
  return noseEnd(spec(f, e, xTip, half), paint, f.panes.length && f.lod?.glass !== false ? [{ u: [-w, w], y: [lo, hi], mat: LOD_GLASS }] : []);
}
