// The shared builder of the Czech and Slovak coaches in their later liveries
// (cdYCoach.ts, zsrCoach.ts, uicZCoach.ts): one data-driven coach on the
// Coach class of csdCoachParts.ts. A spec names the XML body (section, plan,
// elevation, bogie centres, the side canvas height), the paint bands, and per
// side the windows, doors, painted stripes and polygons, class signs and the
// emblem, all as boxes or outlines measured on the native BMPs at 0.1 m a
// pixel. z_dec is the right (+Z) side, z_inc the left; the source x = 0 end is
// the rear (-X). Painted stripes and polygons are one-sided decals laid on the
// skin, so they never share a plane with the body or the panels over them.
// See docs/models/czsk-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { Coach, px, sectionHalf, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { emblem } from "./cd163.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import type { DoorMotion } from "./doors.ts";
import { endName, fpx, headstock, lamp, mirror, roofVents, sides, sideName, type PxBox } from "./csdCoaches.ts";

/** A window box, optionally with frosted glass (the toilets). */
/** A window box, optionally with frosted glass (the toilets) or bars over the glass (a kitchen). */
export type Win = PxBox | [PxBox, "frosted" | "barred"];

export interface DoorSpec {
  box: PxBox;
  glass: PxBox[];
  /** The leaf's material, "bands" for the body's own paint bands, or bands of its own ([y0, y1, material]). */
  paint: string | Array<[number, number, string]>;
  /** How the door opens (doors.ts); a door without it stays shut. */
  opens?: DoorMotion;
}

/**
 * A painted area on one side: a box or a convex outline in native pixels (u
 * along source x, v down). Areas on the same `layer` (default 0) must not
 * overlap; a higher layer lies 1 mm further out (a line over a stripe).
 */
export type Paint = ({ box: PxBox } | { poly: Pt[] }) & { mat: string; layer?: number };

export interface LiverySide {
  windows: Win[];
  doors: DoorSpec[];
  /** Painted bands and shapes over the body bands, in drawing order (later ones lie over earlier ones). */
  paint?: Paint[];
  /** Class numerals: the box they fill and the text ("1", "2"), optionally on a plate. */
  signs?: Array<{ box: PxBox; text: string; mat: string; plate?: string }>;
  /** The emblem's box on the side. */
  emblem?: PxBox;
  /** The running number's centre, native column. */
  numberAt: number;
  /** Door outlines painted over by the livery (a service door): seams only, no leaf. */
  seams?: PxBox[];
}

/** An XML body: length over buffers, section, plan, elevation, bogie centres. */
export interface BodyGeo {
  length: number;
  section: Pt[];
  plan: Pt[];
  top: Pt[];
  bottom?: Pt[];
  bogies: readonly [number, number];
  /** The side and end canvases' height in metres (50 px BMPs: 5, UIC-Z 40 px BMPs: 4). */
  canvas: number;
}

/** The end fittings on the end BMP (30 px wide, the canvas tall): shared by both ends. */
export interface EndSpec {
  gangway: PxBox;
  door: PxBox;
  doorWindows: PxBox[];
  /** The tail lamps' centre height, metres. */
  lampY: number;
  /** The tail lamps' distance from the centreline, metres. */
  lampZ: number;
}

export interface LiveryCoachSpec {
  body: BodyGeo;
  palette: Record<string, MaterialSpec>;
  /** The body's paint bands, bottom up: [y0, y1, material]; the last one reaches over the roof. */
  bands: Array<[number, number, string]>;
  /** The end walls' paint; omit to show the bands on the ends. */
  endPaint?: string;
  endDoor: string;
  end: EndSpec;
  /**
   * The emblem kind (CD: the cd163 emblem; ZSR: a simplified ZSR mark; DB: the
   * framed letters on a plate, `plate` its material; OBB: a simplified mark).
   */
  emblem?: { kind: "cd" | "zsr" | "db" | "obb"; mat: string; plate?: string };
  number: string;
  numberMat: string;
  /** The running number's foot, metres. */
  numberY: number;
  /** The guard's lookout bay of the BDs (XML alongy 3.2..4.4, alongx y 2.1..3.1), with the bay windows' frame boxes. */
  bay?: { mat: string; windows: PxBox[] };
  /** Roof ventilators: source x ranges. */
  vents: Array<[number, number]>;
  ventMat: string;
  /** Larger roof boxes (the dining cars' kitchen exhausts): x0, x1, half width, height over the roof. */
  roofBoxes?: Array<[number, number, number, number]>;
  /** Underframe boxes of the XML alongz, source (x, y) outlines. */
  underframe: Pt[][];
  /** The UIC-Z coach's skirt between the bogies (XML door polygon, 0.4..0.9 m). */
  skirt?: { x0: number; x1: number; mat: string };
  /** Entrance steps: "y" two steps from 0.5 m at the end doors, "low" from 0.3 m, "plug" inside the UIC-Z skirt. */
  steps: "y" | "low" | "plug";
  /** Which ends have entrance doors (steps and handrails): rear (x = 0) and front. */
  entrances: { rear: boolean; front: boolean };
  /** Grab handrails: source x, y0, y1. */
  handrails: Array<[number, number, number]>;
  right: LiverySide;
  left: LiverySide;
}

/** The end template the Y-family BMPs share (cd_bee, csd_a and their relatives). */
export const Y_END: EndSpec = { gangway: [7, 17, 23, 37], door: [9, 19, 21, 37], doorWindows: [[10, 20, 13, 29], [17, 20, 20, 29]], lampY: 1.5, lampZ: 1.0 };

const lerp = (pts: Pt[], x: number): number => {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1]!;
    const [xb, yb] = pts[i]!;
    if (x <= xb + 1e-9) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return pts[pts.length - 1]![1];
};

/** The convex polygon `poly` (x, y) cut to x0 <= x <= x1. */
function clipX(poly: Pt[], x0: number, x1: number): Pt[] {
  const cut = (ring: Pt[], h: number, above: boolean): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      const inA = above ? a[0] >= h - 1e-9 : a[0] <= h + 1e-9;
      const inB = above ? b[0] >= h - 1e-9 : b[0] <= h + 1e-9;
      if (inA) out.push(a);
      if (inA !== inB) {
        const t = (h - a[0]) / (b[0] - a[0]);
        out.push([h, a[1] + t * (b[1] - a[1])]);
      }
    }
    return out;
  };
  return cut(cut(poly, x0, true), x1, false);
}

/**
 * A one-sided painted decal on side s of volume v: the convex outline `poly`
 * (source x, y; within the vertical part of the section) `proud` metres off the
 * skin, split at the plan's stations so each piece lies on one flat facet.
 */
export function skinDecal(c: Coach, v: Volume, mat: string, s: number, poly: Pt[], proud: number): void {
  const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
  const xs = poly.map((p) => p[0]);
  const [lo, hi] = [Math.min(...xs), Math.max(...xs)];
  const cuts = [lo, ...v.plan.map((p) => p[0]).filter((x) => x > lo + 1e-6 && x < hi - 1e-6), hi];
  const out: Vec3[] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const piece = clipX(poly, cuts[i]!, cuts[i + 1]!);
    if (piece.length < 3) continue;
    const p3 = piece.map(([x, y]): Vec3 => [c.X(x), y, s * ((sectionHalf(v.section, y) * lerp(v.plan, x)) / hw0 + proud)]);
    for (let k = 1; k + 1 < p3.length; k++) out.push(p3[0]!, p3[k]!, p3[k + 1]!);
  }
  if (out.length) c.m.facets(mat, out, [0, 0, s]);
}

/** A native-pixel box on a canvas `h` metres tall as a source-metre outline. */
const boxPoly = (b: PxBox, h: number): Pt[] => {
  const q = px(b, h);
  return [[q.x0, q.y0], [q.x1, q.y0], [q.x1, q.y1], [q.x0, q.y1]];
};

/**
 * The simplified ZSR mark as triangles (u, v) at height h, u0 its left edge:
 * a rhombus ring with a horizontal bar through it, symmetric, so it reads the
 * same from either side.
 */
export function zsrMark(u0: number, v0: number, h: number, w = h * 1.3): Array<[number, number]> {
  const cx = u0 + w / 2;
  const cy = v0 + h / 2;
  const t = 0.22; // ring thickness as a fraction of the half sizes
  const outer: Pt[] = [[cx, v0], [u0 + w, cy], [cx, v0 + h], [u0, cy]];
  const inner: Pt[] = outer.map(([u, v]): Pt => [cx + (u - cx) * (1 - t), cy + (v - cy) * (1 - t)]);
  const tris: Array<[number, number]> = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    tris.push(outer[i]!, outer[j]!, inner[j]!, outer[i]!, inner[j]!, inner[i]!);
  }
  // the bar: across the inner rhombus, a little narrower than the ring is wide
  const bh = h * 0.12;
  const bw = (w / 2) * (1 - t) * 0.72;
  tris.push([cx - bw, cy - bh / 2], [cx + bw, cy - bh / 2], [cx + bw, cy + bh / 2], [cx - bw, cy - bh / 2], [cx + bw, cy + bh / 2], [cx - bw, cy + bh / 2]);
  return tris;
}

/** The CD emblem's width at height 1. */
const EMBLEM_W = ((us: number[]) => Math.max(...us) - Math.min(...us))(emblem(0, 0, 1, false).map((q) => q[0]));

/** One coach from its spec. */
export function buildLiveryCoach(spec: LiveryCoachSpec): MeshBuilder {
  const geo = spec.body;
  const H = geo.canvas;
  const c = new Coach(spec.palette, geo.length / 2);
  const m = c.m;
  const roofTop = Math.max(...geo.top.map((p) => p[1]));
  const body: Volume = {
    name: "body",
    section: geo.section,
    plan: geo.plan,
    top: geo.top,
    ...(geo.bottom ? { bottom: geo.bottom } : {}),
    bands: spec.bands,
    ...(spec.endPaint ? { endPaint: spec.endPaint } : {}),
  };
  const bay: Volume | undefined = spec.bay && {
    name: "bay",
    section: [[1.525, 2.1], [-1.525, 2.1], [-1.525, 3.1], [1.525, 3.1]],
    plan: [[3.2, 1.5], [3.5, 1.525], [4.1, 1.525], [4.4, 1.5]],
    bands: [[2.1, 3.1, spec.bay.mat]],
  };
  const wall = [geo.plan[0]![0], geo.plan[geo.plan.length - 1]![0]] as const;
  m.scope("body", () => {
    c.volume(body);
    if (bay) m.scope("lookout bay", () => c.volume(bay));
    for (const s of sides)
      m.scope(sideName(s), () => {
        const sp = s > 0 ? spec.right : spec.left;
        if (sp.paint?.length)
          m.scope("paint", () =>
            sp.paint!.forEach((p) => {
              const poly = "box" in p ? boxPoly(p.box, H) : p.poly.map(([u, v]): Pt => [u / 10, H - v / 10]);
              // 1.2 to 3.2 mm off the skin, a millimetre a layer: under the
              // numerals (4.5 mm), seams and door outlines (6 mm)
              skinDecal(c, body, p.mat, s, poly, 0.0012 + 0.001 * Math.min(2, p.layer ?? 0));
            }),
          );
        sp.windows.forEach((w, i) => {
          const kind = typeof w[0] === "number" ? "clear" : (w as [PxBox, string])[1];
          const b = typeof w[0] === "number" ? (w as PxBox) : (w as [PxBox, string])[0];
          const box = px(b, H);
          m.scope(`window ${i + 1}`, () => {
            c.window(body, s, box, { fw: 0.07, glass: kind === "frosted" ? "frosted" : "glass", sash: box.x1 - box.x0 > 1 && H === 5 && kind === "clear" ? 2.5 : undefined });
            // a kitchen window's vertical bars, over the glass
            if (kind === "barred")
              m.scope("bars", () => {
                const n = Math.round((box.x1 - box.x0) / 0.22);
                for (let k = 1; k < n; k++) {
                  const x = box.x0 + ((box.x1 - box.x0) * k) / n;
                  c.sidePanel(body, "bars", s, { x0: x - 0.02, y0: box.y0 + 0.07, x1: x + 0.02, y1: box.y1 - 0.07 }, 0.03, 0.007);
                }
              });
          });
        });
        if (sp.seams?.length)
          m.scope("seams", () =>
            sp.seams!.forEach((sb) => {
              const b = px(sb, H);
              const t = 0.025;
              for (const q of [{ ...b, x1: b.x0 + t }, { ...b, x0: b.x1 - t }, { ...b, y0: b.y1 - t }, { ...b, y1: b.y0 + t }]) c.sidePanel(body, "seam", s, q, 0.0045, 0.002);
            }),
          );
        sp.doors.forEach((d, i) =>
          m.scope(`door ${i + 1}`, () => {
            const b = px(d.box, H);
            const [v, paint] = typeof d.paint === "string" ? [body, d.paint] : [{ ...body, bands: d.paint }, "bands"];
            if (d.opens) {
              // the windows ride on the leaves, which part where a centre seam would be
              c.door(v, s, b, paint, {
                opens: d.opens,
                leafWork: (clip) =>
                  d.glass.forEach((g, k) => {
                    const w = clip(px(g, H));
                    if (w) c.m.scope(`window ${k + 1}`, () => c.window(body, s, w, { fw: 0.04 }));
                  }),
              });
              return;
            }
            c.door(v, s, b, paint);
            d.glass.forEach((g, k) => m.scope(`window ${k + 1}`, () => c.window(body, s, px(g, H), { fw: 0.04 })));
            const mid = (b.x0 + b.x1) / 2;
            if (d.glass.length === 2) m.scope("centre seam", () => c.sidePanel(body, "seam", s, { x0: mid - 0.02, y0: Math.max(b.y0, 0.9) + 0.03, x1: mid + 0.02, y1: b.y1 - 0.03 }, 0.016));
          }),
        );
        if (sp.signs?.length)
          m.scope("class marks", () =>
            sp.signs!.forEach((g) => {
              const b = px(g.box, H);
              if (g.plate) c.sidePanel(body, g.plate, s, b, 0.008, 0.004);
              const inset = g.plate ? 0.04 : 0.02;
              c.numeral(body, s, g.text, (b.x0 + b.x1) / 2, b.y0 + inset, b.y1 - b.y0 - 2 * inset, g.plate ? 0.0095 : 0.0045, g.mat);
            }),
          );
        if (bay)
          m.scope("lookout bay", () => spec.bay!.windows.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(bay, s, px(b, H), { fw: 0.04 }))));
        m.scope("handrails", () => {
          for (const [x, y0, y1] of spec.handrails) c.handrail(body, s, x, y0, y1);
        });
        if (spec.emblem && sp.emblem)
          m.scope("emblem", () => {
            const b = px(sp.emblem!, H);
            const h = Math.min(0.36, b.y1 - b.y0);
            const z = s * (1.5 + 0.007);
            if (spec.emblem!.kind === "cd") {
              const w = EMBLEM_W * h;
              const x0 = (b.x0 + b.x1) / 2 - w / 2;
              // read left to right from outside: toward +x on the +z side, toward -x on the -z side
              const u0 = s > 0 ? c.X(x0) : c.X(x0 + w);
              m.facets(spec.emblem!.mat, emblem(u0, (b.y0 + b.y1) / 2 - h / 2, h, s < 0).map(([u, vv]): Vec3 => [u, vv, z]), [0, 0, s]);
            } else if (spec.emblem!.kind === "zsr") {
              const hh = b.y1 - b.y0;
              const w = Math.max(hh * 1.3, b.x1 - b.x0);
              m.facets(spec.emblem!.mat, zsrMark(c.X((b.x0 + b.x1) / 2 - w / 2), b.y0, hh, w).map(([u, vv]): Vec3 => [u, vv, z]), [0, 0, s]);
            } else if (spec.emblem!.kind === "db") {
              // the plate, then its frame and the letters a millimetre further out
              const z2 = z + s * 0.001;
              const [u0, u1] = [c.X(b.x0), c.X(b.x1)];
              const rect = (a: number, bb: number, v0: number, v1: number, zz: number): Vec3[] => [[a, v0, zz], [bb, v0, zz], [bb, v1, zz], [a, v0, zz], [bb, v1, zz], [a, v1, zz]];
              m.facets(spec.emblem!.plate ?? "plate", rect(u0, u1, b.y0, b.y1, z), [0, 0, s]);
              const t = (b.y1 - b.y0) * 0.1;
              const frame = [...rect(u0, u1, b.y0, b.y0 + t, z2), ...rect(u0, u1, b.y1 - t, b.y1, z2), ...rect(u0, u0 + t, b.y0 + t, b.y1 - t, z2), ...rect(u1 - t, u1, b.y0 + t, b.y1 - t, z2)];
              m.facets(spec.emblem!.mat, frame, [0, 0, s]);
              const lh = (b.y1 - b.y0) * 0.56;
              const lw = lh * 0.62;
              const width = strokeWidth("DB", lw, lh * 0.12);
              const mid = (b.x0 + b.x1) / 2;
              const start = s > 0 ? c.X(mid) - width / 2 : c.X(mid) + width / 2;
              m.facets(spec.emblem!.mat, strokeText("DB", start, (b.y0 + b.y1) / 2 - lh / 2, lh, lw, lh * 0.12, s < 0, lh * 0.16).map(([u, vv]): Vec3 => [u, vv, z2]), [0, 0, s]);
            } else {
              // three slanted bars rising toward the coach's front on both sides
              const hh = b.y1 - b.y0;
              const w = b.x1 - b.x0;
              const bar = hh / 5;
              const tris: Vec3[] = [];
              for (let k = 0; k < 3; k++) {
                const v0 = b.y0 + k * 2 * bar;
                const lean = w * 0.18;
                const xa = b.x0 + w * 0.08 * k;
                const xb = b.x1 - w * 0.08 * (2 - k);
                const q: Pt[] = [[xa, v0], [xb - lean, v0], [xb, v0 + bar], [xa + lean, v0 + bar]];
                const p3 = q.map(([x, y]): Vec3 => [c.X(x), y, z]);
                tris.push(p3[0]!, p3[1]!, p3[2]!, p3[0]!, p3[2]!, p3[3]!);
              }
              m.facets(spec.emblem!.mat, tris, [0, 0, s]);
            }
          });
        m.scope("running number", () => c.inscription(body, s, sp.numberAt / 10, [{ text: spec.number, y: spec.numberY, h: 0.1 }], 0.008, spec.numberMat));
      });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const w = e > 0 ? wall[1] : wall[0];
      const head = e > 0 ? geo.length : 0;
      const fb = (b: PxBox): Box => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      m.scope("gangway", () => {
        const [a, b] = [c.X(w) - e * 0.02, c.X(head + -e * 0.01)].sort((p, q) => p - q) as [number, number];
        const fr = fpx(spec.end.gangway, H);
        for (const z of [-1, 1]) block(m, "rubber", a, b, fr.y0, fr.y1 - 0.2, ...side(z, 0.62, 0.8));
        block(m, "rubber", a, b, fr.y1 - 0.2, fr.y1, -0.8, 0.8);
      });
      m.scope("end door", () => {
        c.door(body, e, fb(spec.end.door), spec.endDoor, { end: true });
        for (const [k, b] of spec.end.doorWindows.entries()) m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.04 }));
      });
      m.scope("tail lamps", () => {
        for (const [k, z] of [-1, 1].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z * spec.end.lampZ, spec.end.lampY, 0.09, "lampRed"));
      });
      m.scope("headstock", () => headstock(c, e, w, 0.66, 0.92, 1.4));
      m.scope("buffers", () => c.buffers(e, head, w));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, w));
      if (e > 0 ? spec.entrances.front : spec.entrances.rear)
        m.scope("steps", () => {
          const low = spec.steps !== "y";
          const inset = low ? 0.25 : 0.2;
          const [x0, x1] = spec.steps === "plug" ? (e > 0 ? [w - 1.6, w - 0.6] : [w + 0.6, w + 1.6]) : e > 0 ? [w - 1.3, w - inset] : [w + inset, w + 1.3];
          for (const s of sides) {
            if (spec.steps === "plug") {
              // the UIC-Z plug door's two steps sit in a recess of the skirt
              for (const [y, d] of [[0.45, 1.3], [0.68, 1.36]] as const) block(m, "steel", c.X(x0), c.X(x1), y, y + 0.04, ...side(s, 1.0, d));
              for (const x of [x0 + 0.03, x1 - 0.07]) block(m, "underframe", c.X(x), c.X(x + 0.04), 0.42, 0.9, ...side(s, 1.02, 1.38));
              continue;
            }
            for (const y of low ? [0.3, 0.55] : [0.5, 0.74]) block(m, "steel", c.X(x0), c.X(x1), y, y + 0.04, ...side(s, 1.06, 1.42));
            for (const x of [x0 + 0.03, x1 - 0.07]) block(m, "underframe", c.X(x), c.X(x + 0.04), low ? 0.26 : 0.46, 0.9, ...side(s, 1.08, 1.36));
          }
        });
    });
  if (spec.skirt) {
    const sk = spec.skirt;
    m.scope("skirt", () =>
      c.volume({
        name: "skirt",
        section: [[1.2, 0.4], [-1.2, 0.4], [-1.4, 0.6], [-1.49, 0.92], [1.49, 0.92], [1.4, 0.6]],
        plan: [[sk.x0, 1.5], [sk.x1, 1.5]],
        bands: [[0.4, 0.92, sk.mat]],
      }),
    );
  }
  m.scope("underframe", () => {
    block(m, "underframe", c.X(1.0), c.X(geo.length - 1.0), 0.72, 0.9, -1.2, 1.2);
    for (const poly of spec.underframe) c.sideSweep("underframe", poly, -1.15, 1.15);
  });
  m.scope("running gear", () => geo.bogies.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => c.bogie(x, 2.5, 0.45, 0.9))));
  m.scope("roof equipment", () => {
    roofVents(c, spec.vents, roofTop - 0.1, roofTop + 0.07, 0.3, spec.ventMat);
    if (spec.roofBoxes?.length)
      m.scope("roof boxes", () => {
        for (const [a, b, half, h] of spec.roofBoxes!) block(m, spec.ventMat, c.X(a), c.X(b), roofTop - 0.12, roofTop + h, -half, half);
      });
  });
  return m;
}
