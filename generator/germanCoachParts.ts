// Pieces the German coaches share (dbNWagen.ts, dbDoubleDeck.ts, drDoubleDeck.ts)
// on top of the CSD coach builder (csdCoachParts.ts): the DB logo, panels laid
// on a sloped nose (a volume's clamped top near an end), and the side work of a
// list of measured windows. Source coordinates as in csdCoachParts.ts: x along
// the coach, y up, z across (+z the z_dec side). See docs/models/german-coaches.md.

import type { Vec3 } from "./meshCore.ts";
import { Coach, px, sectionHalf, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { lettering, letteringWidth } from "./cd163.ts";
import type { PxBox } from "./csdCoaches.ts";

export type { PxBox };

/** A window: its native frame box, optionally frosted. */
export type Win = PxBox | [PxBox, "frosted"];

const lerp = (pts: Pt[], x: number): number => {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1]!;
    const [xb, yb] = pts[i]!;
    if (x <= xb + 1e-9) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return pts[pts.length - 1]![1];
};

/** Framed windows on side s of `v` (canvas `h` metres tall), each in its own scope. */
export function sideWindows(c: Coach, v: Volume, s: number, h: number, list: Win[], opts: { fw?: number; sash?: (b: Box) => number | undefined; first?: number } = {}): void {
  list.forEach((w, i) => {
    const [b, glass] = typeof w[0] === "number" ? [w as PxBox, "glass"] : [(w as [PxBox, string])[0], "frosted"];
    const box = px(b, h);
    c.m.scope(`window ${i + (opts.first ?? 1)}`, () => c.window(v, s, box, { fw: opts.fw ?? 0.06, glass, sash: opts.sash?.(box) }));
  });
}

/**
 * The DB logo ("Keks") on side s over the native box `b`: a rounded frame and
 * "DB", reading left to right from outside. `plate` fills the frame first (a
 * red logo on a white band carries a white field).
 */
export function dbLogo(c: Coach, v: Volume, s: number, b: Box, mat: string, plate?: string): void {
  const m = c.m;
  const h = b.y1 - b.y0;
  const t = Math.max(0.025, h * 0.13);
  if (plate) m.scope("field", () => c.sidePanel(v, plate, s, b, 0.005, 0.003));
  m.scope("frame", () => {
    for (const bb of [
      { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y0 + t },
      { x0: b.x0, y0: b.y1 - t, x1: b.x1, y1: b.y1 },
      { x0: b.x0, y0: b.y0 + t, x1: b.x0 + t, y1: b.y1 - t },
      { x0: b.x1 - t, y0: b.y0 + t, x1: b.x1, y1: b.y1 - t },
    ])
      c.sidePanel(v, mat, s, bb, 0.008, 0.002);
  });
  const th = h * 0.56;
  m.scope("letters", () => c.inscription(v, s, (b.x0 + b.x1) / 2, [{ text: "DB", y: (b.y0 + b.y1) / 2 - th / 2, h: th }], 0.009, mat));
}

/**
 * A flat panel on the sloped nose of `v` at end e (+1 the high-x end): the
 * front-view box `b` (x0..x1 is z across, y up) laid on the surface the
 * volume's clamped top sweeps between its stations, or on the end cap below
 * the top's lowest point there. Split at the profile's corners so every piece
 * lies on the skin; `proud` metres out along x. `edge` keeps the panel that far
 * inside the skin's width (layered panels take different edges, so their sides
 * never share a plane).
 */
export function nosePanel(c: Coach, v: Volume, e: number, mat: string, b: Box, proud: number, depth = 0.03, edge = 0.03): void {
  const top = [...(v.top ?? [])].sort((p, q) => e * (q[0] - p[0]));
  const xEnd = e > 0 ? v.plan[v.plan.length - 1]![0] : v.plan[0]![0];
  // from the end inward while the top rises
  const prof: Pt[] = [];
  for (const p of top) {
    if (prof.length && p[1] <= prof[prof.length - 1]![1] + 1e-9) break;
    prof.push(p);
  }
  const yCap = prof.length ? prof[0]![1] : Infinity;
  const xAt = (y: number): number => {
    if (y <= yCap + 1e-9) return xEnd;
    for (let i = 1; i < prof.length; i++) {
      const [xa, ya] = prof[i - 1]!;
      const [xb, yb] = prof[i]!;
      if (y <= yb + 1e-9) return xa + ((y - ya) / (yb - ya)) * (xb - xa);
    }
    return prof[prof.length - 1]![0];
  };
  const cuts = [b.y0, ...prof.map((p) => p[1]).filter((y) => y > b.y0 + 1e-6 && y < b.y1 - 1e-6), b.y1].sort((p, q) => p - q);
  const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
  for (let i = 0; i + 1 < cuts.length; i++) {
    const [y0, y1] = [cuts[i]!, cuts[i + 1]!];
    // keep inside the skin's width at both heights
    const lim = (y: number) => (sectionHalf(v.section, Math.min(y, Math.max(...v.section.map((p) => p[1])) - 1e-6)) * lerp(v.plan, xAt(y))) / hw0 - edge;
    const z0 = Math.max(b.x0, -Math.min(lim(y0), lim(y1)));
    const z1 = Math.min(b.x1, Math.min(lim(y0), lim(y1)));
    if (z1 - z0 < 1e-3) continue;
    const pt = (z: number, y: number): Vec3 => [c.X(xAt(y)) + e * proud, y, z];
    c.m.slab(mat, [pt(z0, y0), pt(z1, y0), pt(z1, y1), pt(z0, y1)], [-e * depth, 0, 0]);
  }
}


/**
 * A class numeral on side s that follows the skin across a section corner (the
 * double-deck coaches' sloped upper walls): each vertex of the lettering sits
 * `proud` metres off the skin at its own height. Centred at source x, foot at y.
 */
export function skinNumeral(c: Coach, v: Volume, s: number, text: string, x: number, y: number, h: number, proud: number, mat: string): void {
  const w = h * 0.55;
  const width = letteringWidth(text, w, w * 0.25);
  const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
  const top = Math.max(...v.section.map((p) => p[1])) - 1e-6;
  const k = lerp(v.plan, x) / hw0;
  const u0 = c.X(x) + (s > 0 ? -width / 2 : width / 2);
  c.m.facets(mat, lettering(text, u0, y, h, w, w * 0.25, s < 0).map(([u, vv]): Vec3 => [u, vv, s * (sectionHalf(v.section, Math.min(vv, top)) * k + proud)]), [0, 0, s]);
}

/**
 * A sloped nose's top profile with a station wherever it crosses a paint band's
 * edge. The volume clamps each band to the top at every station and sweeps
 * between them, so without these stations a band would run on from the last
 * station where it is whole to a sliver at the next one, a wedge standing proud
 * of the slope; with them every band ends on the slope itself.
 */
export function noseTop(top: Pt[], bands: Array<[number, number, string]>): Pt[] {
  const edges = [...new Set(bands.flatMap(([a, b]) => [a, b]))];
  const out: Pt[] = [top[0]!];
  for (let i = 1; i < top.length; i++) {
    const [xa, ya] = top[i - 1]!;
    const [xb, yb] = top[i]!;
    const cross = edges
      .filter((y) => (y - ya) * (y - yb) < -1e-12)
      .map((y): Pt => [xa + ((y - ya) / (yb - ya)) * (xb - xa), y])
      .sort((p, q) => (xb > xa ? p[0] - q[0] : q[0] - p[0]));
    out.push(...cross, top[i]!);
  }
  return out;
}
