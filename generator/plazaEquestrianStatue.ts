// A 19th-century bronze equestrian statue for a town or city square
// (docs/models/plaza-landmarks.md): a generic ruler on horseback in the manner of
// the St Wenceslas statue in Prague, the Marcus Aurelius on the Capitoline and the
// Great Elector in Berlin - the photos in assets/equestrian-statue/ - not a copy
// of any one of them.
//
// A three-step round granite base 12 m across carries a bronze railing between
// granite posts. On it stands a tall moulded granite pedestal (socle, die with
// bronze relief panels on its long sides and cartouches front and back, a
// polished frieze with gilt lettering, cornice, attic and a bronze ground plate)
// and at its four corners smaller bronze saints on their own plinths, facing
// out. On top a bronze horse walks forward with its right foreleg raised: the
// barrel lofted from oval sections, the arched neck with its mane, the head with
// ears, eyes and nostrils, jointed legs with knees, hocks, fetlocks and hooves,
// a full tail. The rider sits in armour and a cloak over a saddle cloth, a
// helmet on his head, the reins in his left hand and in his right a lance with
// a pennant and a gilt point, about 12 m overall.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin; the horse,
// the rider and the front inscription face +Z. Deterministic: the same code
// gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, chamferedRect, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  step: { color: "#a29d94", roughness: 0.95 },
  granite: { color: "#8c8780", roughness: 0.9 },
  graniteLight: { color: "#a8a39a", roughness: 0.85 },
  granitePolished: { color: "#4d4a48", metallic: 0.1, roughness: 0.4 },
  patina: { color: "#4f8a72", metallic: 0.35, roughness: 0.6 },
  patinaDark: { color: "#3c6656", metallic: 0.35, roughness: 0.6 },
  bronze: { color: "#3f3a30", metallic: 0.5, roughness: 0.5 },
  gilt: { color: "#cfa548", metallic: 0.7, roughness: 0.35 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const mean = (ps: readonly Vec3[]): Vec3 => mul(ps.reduce((s, p) => add(s, p), [0, 0, 0] as Vec3), 1 / ps.length);

/** A circle of n points about (cx, cz), wound like ngon. */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/** A triangle wound so it faces away from `inside`. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const g = mean([a, b, c]);
  if (dot(n, sub(g, inside)) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** A closed ellipsoid of radii rx, ry, rz about c: `lon` meridians, `lat` bands, turned `rot` about +Y. */
function blob(m: MeshBuilder, mat: string, c: Vec3, rx: number, ry: number, rz: number, lon = 8, lat = 4, rot = 0): void {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const P = (phi: number, th: number): Vec3 => {
    const x = rx * Math.sin(phi) * Math.cos(th);
    const z = rz * Math.sin(phi) * Math.sin(th);
    return [c[0] + x * cs + z * sn, c[1] + ry * Math.cos(phi), c[2] - x * sn + z * cs];
  };
  const top: Vec3 = [c[0], c[1] + ry, c[2]];
  const bot: Vec3 = [c[0], c[1] - ry, c[2]];
  for (let k = 1; k < lat; k++) {
    const p0 = (Math.PI * k) / lat, p1 = (Math.PI * (k + 1)) / lat;
    for (let i = 0; i < lon; i++) {
      const t0 = (2 * Math.PI * i) / lon, t1 = (2 * Math.PI * (i + 1)) / lon;
      if (k === 1) triOut(m, mat, top, P(p0, t0), P(p0, t1), c);
      if (k + 1 === lat) triOut(m, mat, bot, P(p0, t1), P(p0, t0), c);
      else {
        triOut(m, mat, P(p0, t0), P(p1, t0), P(p1, t1), c);
        triOut(m, mat, P(p0, t0), P(p1, t1), P(p0, t1), c);
      }
    }
  }
}

/** Closed rings of equal size skinned together, every face turned out from the rings' axis; the end rings capped unless asked not to. */
function skin(m: MeshBuilder, mat: string, rings: readonly Vec3[][], capStart = true, capEnd = true): void {
  const centres = rings.map(mean);
  const n = rings[0]!.length;
  for (let r = 0; r + 1 < rings.length; r++) {
    const A = rings[r]!, B = rings[r + 1]!;
    const inside = mul(add(centres[r]!, centres[r + 1]!), 0.5);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      triOut(m, mat, A[i]!, A[j]!, B[j]!, inside);
      triOut(m, mat, A[i]!, B[j]!, B[i]!, inside);
    }
  }
  const capOf = (ring: Vec3[], c: Vec3, toward: Vec3): void => {
    const inside = add(c, mul(sub(toward, c), 0.5));
    for (let i = 1; i + 1 < ring.length; i++) triOut(m, mat, ring[0]!, ring[i]!, ring[i + 1]!, inside);
  };
  if (capStart) capOf(rings[0]!, centres[0]!, centres[1]!);
  if (capEnd) capOf(rings[rings.length - 1]!, centres[rings.length - 1]!, centres[rings.length - 2]!);
}

/**
 * A round tube of radius r (or radii per point) along the points `pts`, `n` sides,
 * its rings square to the path, closed ends. `ref` is a direction the path never
 * runs along (it fixes the rings' turn).
 */
function pipe(m: MeshBuilder, mat: string, pts: Vec3[], r: number | number[], n: number, ref: Vec3, caps = true): void {
  const N = pts.length;
  const rad = (i: number): number => (typeof r === "number" ? r : r[i]!);
  const rings: Vec3[][] = [];
  for (let i = 0; i < N; i++) {
    const prev = pts[Math.max(0, i - 1)]!;
    const next = pts[Math.min(N - 1, i + 1)]!;
    const t = unit(sub(next, prev));
    const u = unit(cross(t, ref));
    const v = cross(t, u);
    const ring: Vec3[] = [];
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n;
      ring.push(add(pts[i]!, add(mul(u, rad(i) * Math.cos(a)), mul(v, rad(i) * Math.sin(a)))));
    }
    rings.push(ring);
  }
  skin(m, mat, rings, caps, caps);
}

/** A cone of `n` sides from a base ring of radius r about `base` (square to the axis) to `tip`. */
function cone(m: MeshBuilder, mat: string, base: Vec3, tip: Vec3, r: number, n: number, ref: Vec3): void {
  const t = unit(sub(tip, base));
  const u = unit(cross(t, ref));
  const v = cross(t, u);
  const ring: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    ring.push(add(base, add(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a)))));
  }
  const inside = add(base, mul(sub(tip, base), 0.2));
  for (let k = 0; k < n; k++) triOut(m, mat, ring[k]!, ring[(k + 1) % n]!, tip, inside);
  for (let k = 1; k + 1 < n; k++) triOut(m, mat, ring[0]!, ring[k]!, ring[k + 1]!, inside);
}

/** One station of a skinned body in the horse's frame: x (forward), centre height, half width, half height. */
type Station = readonly [number, number, number, number];

/** Stations smoothed through a Catmull-Rom spline, `sub` rings to each span. */
function smooth(st: readonly Station[], sub: number): Station[] {
  const out: Station[] = [];
  const n = st.length;
  for (let i = 0; i + 1 < n; i++) {
    const [p0, p1, p2, p3] = [st[Math.max(0, i - 1)]!, st[i]!, st[i + 1]!, st[Math.min(n - 1, i + 2)]!];
    for (let k = 0; k < sub; k++) {
      const t = k / sub;
      const c = (j: number): number => 0.5 * (2 * p1[j]! + (p2[j]! - p0[j]!) * t + (2 * p0[j]! - 5 * p1[j]! + 4 * p2[j]! - p3[j]!) * t * t + (3 * p1[j]! - p0[j]! - 3 * p2[j]! + p3[j]!) * t * t * t);
      out.push([c(0), c(1), Math.max(0.005, c(2)), Math.max(0.005, c(3))]);
    }
  }
  out.push(st[n - 1]!);
  return out;
}

// --- the base, steps and railing ------------------------------------------------------

const STEP_R = [6.0, 5.6, 5.2];
const Y_PLAT = 0.54; // the platform's top
const RAIL_R = 4.95; // the railing's line
const RAIL_TOP = 1.42;

function baseAndRailing(m: MeshBuilder): void {
  m.scope("steps", () => {
    for (let i = 0; i < 3; i++) m.prism("step", circle(48, STEP_R[i]!), i * 0.18, (i + 1) * 0.18);
  });
  m.scope("railing", () => {
    const posts = 8;
    const P = (a: number, r: number, y: number): Vec3 => [Math.cos(a) * r, y, -Math.sin(a) * r];
    for (let k = 0; k < posts; k++) {
      const a = (k / posts) * Math.PI * 2 + Math.PI / posts;
      m.scope(`post ${k + 1}`, () => {
        const [x, , z] = P(a, RAIL_R, 0);
        m.box("granite", x, z, 0.34, 0.34, Y_PLAT, 1.48, a, false);
        m.loft("graniteLight", rect(0.34, 0.34, x, z, a), 1.48, rect(0.42, 0.42, x, z, a), 1.54, false);
        m.prism("graniteLight", rect(0.42, 0.42, x, z, a), 1.54, 1.6);
        blob(m, "bronze", [x, 1.72, z], 0.11, 0.12, 0.11, 6, 3);
      });
      // the bronze railing to the next post: two rails and plain bars with spear tips
      m.scope(`rail ${k + 1}`, () => {
        const a0 = a + 0.045, a1 = a + (Math.PI * 2) / posts - 0.045;
        const segs = 5;
        for (const y of [0.72, RAIL_TOP - 0.06]) {
          const pts: Vec3[] = [];
          for (let i = 0; i <= segs; i++) pts.push(P(a0 + ((a1 - a0) * i) / segs, RAIL_R, y));
          for (let i = 0; i < segs; i++) m.rod("bronze", pts[i]!, pts[i + 1]!, 0.028, 4, i === 0 || i === segs - 1);
        }
        const bars = 7;
        for (let i = 1; i <= bars; i++) {
          const b = a0 + ((a1 - a0) * i) / (bars + 1);
          m.rod("bronze", P(b, RAIL_R, Y_PLAT), P(b, RAIL_R, RAIL_TOP), 0.018, 4, false);
          cone(m, "bronze", P(b, RAIL_R, RAIL_TOP), P(b, RAIL_R, RAIL_TOP + 0.12), 0.04, 4, [0, 0, 1]);
        }
      });
    }
  });
}

// --- the pedestal ----------------------------------------------------------------------

const DIE_W = 2.8, DIE_D = 4.4;
const DIE_Y0 = 1.3, FRIEZE_Y0 = 4.35, FRIEZE_Y1 = 4.75, DIE_Y1 = 5.2;
const PLATE_TOP = 6.46; // the bronze ground plate the horse stands on

/** An oval slab standing proud of the face whose outward normal is n, its back buried. */
function cartouche(m: MeshBuilder, mat: string, c: Vec3, n: Vec3, w: number, h: number, sides = 10, proud = 0.05): void {
  const u: Vec3 = [-n[2], 0, n[0]];
  const pts: Vec3[] = [];
  for (let i = 0; i < sides; i++) {
    const t = (2 * Math.PI * i) / sides;
    pts.push(add(c, add(mul(u, (w / 2) * Math.cos(t)), [0, (h / 2) * Math.sin(t), 0])));
  }
  m.slab(mat, pts.map((p) => add(p, mul(n, proud))), mul(n, -0.08 - 2 * proud));
}

/** A flat rectangle on the face with outward normal n: centre c, w across, h tall, standing `proud` out, its back buried. */
function panel(m: MeshBuilder, mat: string, c: Vec3, n: Vec3, w: number, h: number, proud: number): void {
  const u: Vec3 = [-n[2], 0, n[0]];
  const f = add(c, mul(n, proud));
  const pts = [add(f, add(mul(u, -w / 2), [0, -h / 2, 0])), add(f, add(mul(u, w / 2), [0, -h / 2, 0])), add(f, add(mul(u, w / 2), [0, h / 2, 0])), add(f, add(mul(u, -w / 2), [0, h / 2, 0]))];
  m.slab(mat, pts, mul(n, -0.04 - 2 * proud));
}

/** A low-relief figure on a panel: a robe outline and a head, standing proud by `proud`. */
function reliefFigure(m: MeshBuilder, c: Vec3, n: Vec3, h: number, lean: number, proud: number): void {
  const u: Vec3 = [-n[2], 0, n[0]];
  const at = (s: number, y: number): Vec3 => add(add(c, mul(n, proud)), add(mul(u, (s + lean * y) * h), [0, y * h, 0]));
  m.slab("patina", [at(-0.17, 0), at(0.17, 0), at(0.12, 0.5), at(0.15, 0.78), at(0, 0.84), at(-0.15, 0.78), at(-0.12, 0.5)], mul(n, -proud - 0.02));
  const hc = at(0, 0.92);
  const pts: Vec3[] = [];
  for (let i = 0; i < 6; i++) {
    const t = (2 * Math.PI * i) / 6;
    pts.push(add(hc, add(mul(u, 0.07 * h * Math.cos(t)), [0, 0.08 * h * Math.sin(t), 0])));
  }
  m.slab("patina", pts, mul(n, -proud - 0.02));
}

function pedestal(m: MeshBuilder): void {
  m.scope("socle", () => {
    m.prism("granite", chamferedRect(3.5, 5.1, 0.3), Y_PLAT, 0.98, false);
    m.loft("graniteLight", chamferedRect(3.5, 5.1, 0.3), 0.98, chamferedRect(3.3, 4.9, 0.28), 1.1, false);
    m.loft("graniteLight", chamferedRect(3.3, 4.9, 0.28), 1.1, chamferedRect(DIE_W, DIE_D, 0.22), DIE_Y0, false);
  });
  m.scope("die", () => {
    const die = chamferedRect(DIE_W, DIE_D, 0.22);
    const frieze = chamferedRect(DIE_W + 0.1, DIE_D + 0.1, 0.24);
    m.prism("granite", die, DIE_Y0, FRIEZE_Y0 - 0.02, false);
    m.loft("granitePolished", die, FRIEZE_Y0 - 0.02, frieze, FRIEZE_Y0, false);
    m.prism("granitePolished", frieze, FRIEZE_Y0, FRIEZE_Y1, false);
    m.loft("granitePolished", frieze, FRIEZE_Y1, die, FRIEZE_Y1 + 0.02, false);
    m.prism("granite", die, FRIEZE_Y1 + 0.02, DIE_Y1, false);
    // the bronze relief panels on the long sides: a framed ground with a procession
    for (const s of [-1, 1]) {
      const n: Vec3 = [s, 0, 0];
      m.scope(s > 0 ? "relief right" : "relief left", () => {
        const c: Vec3 = [s * (DIE_W / 2), 2.95, 0];
        panel(m, "bronze", c, n, 3.3, 1.9, 0.04);
        panel(m, "patinaDark", c, n, 3.1, 1.7, 0.06);
        for (let i = 0; i < 5; i++) {
          const z = -1.2 + i * 0.6;
          reliefFigure(m, add([c[0], 2.15, 0], [0, 0, s * z]), n, 1.35 - (i % 2) * 0.12, (i - 2) * 0.03, 0.1);
        }
      });
    }
    // front and back: an oval bronze cartouche with a shield of arms
    for (const s of [-1, 1]) {
      const n: Vec3 = [0, 0, s];
      m.scope(s > 0 ? "cartouche front" : "cartouche back", () => {
        const c: Vec3 = [0, 2.95, s * (DIE_D / 2)];
        cartouche(m, "bronze", c, n, 1.7, 2.0, 12, 0.04);
        cartouche(m, "patinaDark", c, n, 1.45, 1.75, 12, 0.07);
        const f = add(c, mul(n, 0.1));
        m.slab("patina", [add(f, [-0.4, 0.45, 0]), add(f, [0.4, 0.45, 0]), add(f, [0.4, -0.1, 0]), add(f, [0, -0.6, 0]), add(f, [-0.4, -0.1, 0])], mul(n, -0.06));
        blob(m, "gilt", add(f, [0, 0.08, s * 0.04]), 0.16, 0.2, 0.06, 6, 3);
      });
    }
  });
  m.scope("inscription", () => {
    // gilt letters on the polished frieze, front and back: blocks of varied width
    for (const s of [-1, 1]) {
      const n: Vec3 = [0, 0, s];
      const z = s * ((DIE_D + 0.1) / 2);
      const widths = [0.14, 0.1, 0.14, 0.12, 0.14, 0, 0.14, 0.12, 0.1, 0.14, 0.12, 0.14, 0.1, 0.14];
      const gap = 0.07;
      const total = widths.reduce((a, w) => a + (w === 0 ? 0.12 : w + gap), 0) - gap;
      let x = -total / 2;
      for (const w of widths) {
        if (w === 0) { x += 0.12; continue; }
        panel(m, "gilt", [x + w / 2, (FRIEZE_Y0 + FRIEZE_Y1) / 2, z], n, w, 0.24, 0.025);
        x += w + gap;
      }
    }
  });
  m.scope("cornice", () => {
    m.loft("graniteLight", chamferedRect(DIE_W, DIE_D, 0.22), DIE_Y1, chamferedRect(3.25, 4.85, 0.3), 5.44, false);
    m.prism("graniteLight", chamferedRect(3.25, 4.85, 0.3), 5.44, 5.62);
    m.prism("granite", chamferedRect(2.55, 4.15, 0.2), 5.62, 6.2, false);
    m.loft("graniteLight", chamferedRect(2.55, 4.15, 0.2), 6.2, chamferedRect(2.8, 4.4, 0.24), 6.3, false);
    m.prism("graniteLight", chamferedRect(2.8, 4.4, 0.24), 6.3, 6.4);
    m.prism("bronze", chamferedRect(1.7, 3.2, 0.3), 6.4, PLATE_TOP);
  });
}

// --- the corner saints --------------------------------------------------------------

type Pose = "raised" | "open" | "praying" | "staff";

/** A ring across a figure: half width a across, half depth b along the facing `face`. */
function figRing(cx: number, cz: number, a: number, b: number, face: number, n = 10, back = 0): Ring {
  const rx = Math.cos(face), rz = -Math.sin(face);
  const fx = Math.sin(face), fz = Math.cos(face);
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    const u = a * Math.cos(t), w = -b * Math.sin(t) + back;
    ring.push([cx + u * rx + w * fx, cz + u * rz + w * fz]);
  }
  return ring;
}

/** A robed standing figure h tall on y0 at (cx, cz), facing `face` (0 = +Z). */
function figure(m: MeshBuilder, mat: string, cx: number, cz: number, y0: number, h: number, face: number, pose: Pose): void {
  const fx = Math.sin(face), fz = Math.cos(face);
  const rx = Math.cos(face), rz = -Math.sin(face);
  const L = (s: number, y: number, f: number): Vec3 => [cx + s * rx * h + f * fx * h, y0 + y * h, cz + s * rz * h + f * fz * h];
  m.scope("robe", () => {
    const secs: Array<[number, number, number, number]> = [
      [0, 0.19, 0.15, 0], [0.1, 0.18, 0.14, 0], [0.45, 0.13, 0.1, -0.01], [0.68, 0.14, 0.1, -0.01], [0.79, 0.15, 0.085, -0.01], [0.83, 0.055, 0.05, 0],
    ];
    for (let i = 0; i + 1 < secs.length; i++) {
      const [y0f, a0, b0, k0] = secs[i]!;
      const [y1f, a1, b1, k1] = secs[i + 1]!;
      m.loft(mat, figRing(cx, cz, a0 * h, b0 * h, face, 10, k0 * h), y0 + y0f * h, figRing(cx, cz, a1 * h, b1 * h, face, 10, k1 * h), y0 + y1f * h, i + 2 === secs.length);
    }
  });
  m.scope("head", () => blob(m, mat, L(0, 0.9, 0.005), 0.06 * h, 0.075 * h, 0.065 * h, 8, 4, face));
  m.scope("arms", () => {
    for (const s of [-1, 1]) {
      let pts: Vec3[];
      if (pose === "raised") pts = [L(s * 0.12, 0.77, 0), L(s * 0.21, 0.86, 0.04), L(s * 0.25, 1.02, 0.07)];
      else if (pose === "open") pts = [L(s * 0.12, 0.77, 0), L(s * 0.2, 0.66, 0.06), L(s * 0.29, 0.7, 0.12)];
      else if (pose === "praying") pts = [L(s * 0.12, 0.77, 0), L(s * 0.13, 0.64, 0.09), L(s * 0.02, 0.73, 0.14)];
      else pts = s > 0 ? [L(0.12, 0.77, 0), L(0.2, 0.66, 0.07), L(0.2, 0.74, 0.14)] : [L(-0.12, 0.77, 0), L(-0.21, 0.88, 0.03), L(-0.2, 1.0, 0.08)];
      pipe(m, mat, pts, 0.034 * h, 6, [fx, 0, fz]);
    }
    if (pose === "staff") {
      pipe(m, mat, [L(0.2, 0.02, 0.15), L(0.2, 1.15, 0.15)], 0.014 * h, 5, [1, 0, 0]);
      pipe(m, mat, [L(0.13, 1.06, 0.15), L(0.27, 1.06, 0.15)], 0.014 * h, 5, [0, 1, 0]);
    }
  });
}

function cornerSaints(m: MeshBuilder): void {
  const poses: Pose[] = ["staff", "praying", "open", "raised"];
  const spots: Array<[number, number]> = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  spots.forEach(([sx, sz], k) => {
    const x = sx * 2.2, z = sz * 3.0;
    const face = Math.atan2(sx, sz);
    const ry = -face;
    m.scope(`saint ${k + 1}`, () => {
      m.scope("plinth", () => {
        m.box("granite", x, z, 0.86, 0.86, Y_PLAT, 1.86, ry, false);
        m.loft("graniteLight", rect(0.86, 0.86, x, z, ry), 1.86, rect(1.02, 1.02, x, z, ry), 1.96, false);
        m.prism("graniteLight", rect(1.02, 1.02, x, z, ry), 1.96, 2.06);
        const n: Vec3 = [Math.sin(face), 0, Math.cos(face)];
        panel(m, "patinaDark", [x + n[0] * 0.43, 1.3, z + n[2] * 0.43], n, 0.5, 0.6, 0.03);
      });
      figure(m, "patina", x, z, 2.06, 2.5, face, poses[k]!);
    });
  });
}

// --- the horse ----------------------------------------------------------------------

/** The horse's scale (a life-size horse is 1) and its frame: x forward along +Z, y up from the plate, z across along +X. */
const K = 1.7;
const X_MID = -0.05;
const H = (x: number, y: number, z: number): Vec3 => [z * K, PLATE_TOP + y * K, (x - X_MID) * K];

// stations after a riding horse: rump to chest, the arched neck and the head held up
const BARREL: readonly Station[] = [
  [-1.0, 1.36, 0.08, 0.09], [-0.95, 1.34, 0.21, 0.25], [-0.82, 1.32, 0.31, 0.34], [-0.62, 1.29, 0.36, 0.37], [-0.35, 1.25, 0.35, 0.38],
  [0.0, 1.24, 0.37, 0.41], [0.35, 1.27, 0.35, 0.41], [0.62, 1.33, 0.3, 0.39], [0.82, 1.3, 0.22, 0.3], [0.93, 1.24, 0.1, 0.14],
];
const NECK: readonly Station[] = [[0.56, 1.44, 0.27, 0.44], [0.74, 1.72, 0.22, 0.35], [0.88, 1.95, 0.175, 0.26], [0.98, 2.13, 0.14, 0.19]];
const HEAD: readonly Station[] = [
  [0.96, 2.21, 0.1, 0.12], [1.02, 2.13, 0.125, 0.16], [1.1, 2.0, 0.12, 0.165], [1.17, 1.86, 0.1, 0.13], [1.24, 1.72, 0.088, 0.105], [1.3, 1.61, 0.085, 0.095], [1.33, 1.55, 0.07, 0.075],
];

/** A body tube through stations in the horse's x-y plane at lateral offset zc, its rings square to the path. */
function bodyRings(st: readonly Station[], n: number, zc = 0): Vec3[][] {
  return st.map(([x, y, a, b], i) => {
    const p = st[Math.max(0, i - 1)]!, q = st[Math.min(st.length - 1, i + 1)]!;
    const d = unit([q[0] - p[0], q[1] - p[1], 0]);
    const up: Vec3 = [-d[1], d[0], 0];
    const ring: Vec3[] = [];
    for (let k = 0; k < n; k++) {
      const t = (2 * Math.PI * k) / n;
      ring.push(H(x + up[0] * b * Math.sin(t), y + up[1] * b * Math.sin(t), zc + a * Math.cos(t)));
    }
    return ring;
  });
}

type HLeg = { side: number; pts: Array<[number, number]>; r: number[] };

function horse(m: MeshBuilder): void {
  const P = "patina";
  m.scope("barrel", () => skin(m, P, bodyRings(smooth(BARREL, 2), 12)));
  m.scope("quarters", () => {
    for (const s of [-1, 1]) {
      blob(m, P, H(-0.6, 1.12, s * 0.17), 0.16 * K, 0.34 * K, 0.3 * K, 8, 4);
      blob(m, P, H(0.55, 1.12, s * 0.15), 0.13 * K, 0.27 * K, 0.17 * K, 8, 4);
    }
  });
  m.scope("neck", () => skin(m, P, bodyRings(smooth(NECK, 2), 10), false, false));
  m.scope("mane", () => {
    // a crest of hair along the neck's top line and the forelock
    const crest: Station[] = NECK.map(([x, y, , b], i) => [x - 0.74 * b, y + 0.5 * b, 0.05, i === 0 ? 0.05 : 0.07 - 0.005 * i]);
    skin(m, "patinaDark", bodyRings(smooth(crest, 2), 6));
    blob(m, "patinaDark", H(1.0, 2.3, 0), 0.07 * K, 0.06 * K, 0.06 * K, 6, 3);
  });
  m.scope("head", () => {
    skin(m, P, bodyRings(smooth(HEAD, 2), 10), true, true);
    for (const s of [-1, 1]) {
      // ears, eyes and nostrils
      cone(m, P, H(0.95, 2.29, s * 0.065), H(0.92, 2.49, s * 0.085), 0.035 * K, 5, [0, 0, 1]);
      blob(m, "bronze", H(1.06, 2.1, s * 0.112), 0.03 * K, 0.035 * K, 0.04 * K, 6, 3);
      blob(m, "bronze", H(1.32, 1.6, s * 0.05), 0.022 * K, 0.025 * K, 0.025 * K, 5, 3);
    }
    // the bridle's noseband and brow band
    pipe(m, "bronze", [H(1.24, 1.76, -0.1), H(1.27, 1.73, 0), H(1.24, 1.76, 0.1)], 0.012 * K, 4, [1, 0, 0], false);
  });
  m.scope("legs", () => {
    const legs: HLeg[] = [
      // front left planted, front right raised in the walk, hind legs planted in a stride
      { side: 1, pts: [[0.52, 1.2], [0.53, 0.88], [0.52, 0.56], [0.52, 0.38], [0.53, 0.2], [0.56, 0.1], [0.57, -0.006]], r: [0.13, 0.1, 0.072, 0.054, 0.056, 0.065, 0.088] },
      { side: -1, pts: [[0.52, 1.2], [0.66, 0.98], [0.82, 0.8], [0.82, 0.62], [0.8, 0.46], [0.85, 0.38], [0.92, 0.34]], r: [0.13, 0.1, 0.072, 0.054, 0.056, 0.065, 0.085] },
      { side: 1, pts: [[-0.62, 1.2], [-0.66, 0.92], [-0.8, 0.64], [-0.78, 0.42], [-0.76, 0.2], [-0.73, 0.1], [-0.72, -0.006]], r: [0.15, 0.1, 0.07, 0.054, 0.056, 0.065, 0.088] },
      { side: -1, pts: [[-0.62, 1.2], [-0.6, 0.92], [-0.68, 0.64], [-0.62, 0.42], [-0.56, 0.2], [-0.53, 0.1], [-0.52, -0.006]], r: [0.15, 0.1, 0.07, 0.054, 0.056, 0.065, 0.088] },
    ];
    legs.forEach((l, i) => m.scope(`leg ${i + 1}`, () => {
      const pts = l.pts.map(([x, y]) => H(x, y, l.side * 0.19));
      pipe(m, P, pts.slice(0, 5), l.r.slice(0, 5).map((r) => r * K * 1.12), 8, [1, 0, 0]);
      // the fetlock joint, the pastern and the hoof
      blob(m, P, pts[4]!, 0.065 * K, 0.06 * K, 0.07 * K, 6, 3);
      pipe(m, "bronze", pts.slice(4), l.r.slice(4).map((r) => r * K), 8, [1, 0, 0]);
    }));
  });
  m.scope("tail", () => {
    const pts = [H(-0.96, 1.5, 0), H(-1.08, 1.4, 0), H(-1.14, 1.12, 0), H(-1.12, 0.82, 0.02), H(-1.06, 0.6, 0.04)];
    pipe(m, "patinaDark", pts, [0.07, 0.11, 0.12, 0.1, 0.05].map((r) => r * K), 7, [1, 0, 0]);
  });
}

// --- the rider ----------------------------------------------------------------------

function rider(m: MeshBuilder): void {
  const P = "patina";
  m.scope("saddle cloth", () => {
    // a cloth draped over the barrel: its outer face over the barrel's top, the hems tucked into it
    const xs = [-0.3, -0.12, 0.08, 0.26];
    const n = 9;
    const arc = (x: number, s: number): Vec3[] => {
      const st = smooth(BARREL, 2);
      let j = 0;
      while (j + 1 < st.length && st[j + 1]![0] < x) j++;
      const [xa, ya, wa, ha] = st[j]!, [xb, yb, wb, hb] = st[j + 1]!;
      const t = (x - xa) / (xb - xa);
      const y = ya + (yb - ya) * t, w = wa + (wb - wa) * t, h = ha + (hb - ha) * t;
      const out: Vec3[] = [];
      for (let k = 0; k <= n; k++) {
        const a = -0.15 * Math.PI + (k / n) * 1.3 * Math.PI;
        out.push(H(x, y + h * s * Math.sin(a), w * s * Math.cos(a)));
      }
      return out;
    };
    const outer = xs.map((x) => arc(x, 1.05));
    const inner = xs.map((x) => arc(x, 0.94));
    const axis = (i: number): Vec3 => {
      const a = outer[i]!, b = inner[i]!;
      return mean([...a, ...b]);
    };
    for (let i = 0; i + 1 < xs.length; i++) {
      const c = mul(add(axis(i), axis(i + 1)), 0.5);
      const inside: Vec3 = [c[0], c[1] - 0.6, c[2]];
      for (let k = 0; k < n; k++) {
        triOut(m, "patinaDark", outer[i]![k]!, outer[i]![k + 1]!, outer[i + 1]![k + 1]!, inside);
        triOut(m, "patinaDark", outer[i]![k]!, outer[i + 1]![k + 1]!, outer[i + 1]![k]!, inside);
      }
      // the hems along the cloth's lower edges
      for (const k of [0, n]) {
        const A = outer[i]![k]!, B = outer[i + 1]![k]!, C = inner[i + 1]![k]!, D = inner[i]![k]!;
        const nn: Vec3 = k === 0 ? [1, -1, 0] : [-1, -1, 0];
        m.facets("patinaDark", [A, B, C, A, C, D], [nn[0] * K, nn[1], 0]);
      }
    }
    // the front and back edges
    for (const [i, dz] of [[0, -1], [xs.length - 1, 1]] as const) {
      const pts: Vec3[] = [];
      for (let k = 0; k < n; k++) pts.push(outer[i]![k]!, outer[i]![k + 1]!, inner[i]![k + 1]!, outer[i]![k]!, inner[i]![k + 1]!, inner[i]![k]!);
      m.facets("patinaDark", pts, [0, 0, dz]);
    }
  });
  m.scope("saddle", () => {
    blob(m, "bronze", H(0.02, 1.67, 0), 0.2 * K, 0.07 * K, 0.27 * K, 8, 3);
  });
  m.scope("torso", () => {
    const torso: Station[] = [[0.0, 1.66, 0.17, 0.14], [0.0, 1.78, 0.18, 0.14], [0.01, 1.95, 0.16, 0.13], [0.02, 2.1, 0.2, 0.14], [0.01, 2.22, 0.22, 0.12], [0.0, 2.3, 0.075, 0.065]];
    // a station's half width runs across the horse, its half height fore and aft
    skin(m, P, bodyRings(torso, 10));
    // the armour's skirt over the hips
    skin(m, "patinaDark", bodyRings([[0.0, 1.72, 0.2, 0.16], [0.0, 1.86, 0.17, 0.135]], 10), true, false);
  });
  m.scope("cloak", () => {
    const cloak: Station[] = [[-0.09, 2.25, 0.22, 0.04], [-0.19, 2.04, 0.3, 0.05], [-0.31, 1.84, 0.38, 0.05], [-0.42, 1.7, 0.43, 0.045]];
    skin(m, "patinaDark", bodyRings(cloak, 8));
  });
  m.scope("head", () => {
    blob(m, P, H(0.03, 2.43, 0), 0.11 * K, 0.13 * K, 0.12 * K, 8, 4);
    // the helmet: a dome with a brim and a crest
    blob(m, "patinaDark", H(0.01, 2.5, 0), 0.125 * K, 0.11 * K, 0.135 * K, 8, 4);
    pipe(m, "patinaDark", [H(-0.12, 2.55, 0), H(0.0, 2.64, 0), H(0.12, 2.57, 0)], 0.025 * K, 5, [0, 0, 1]);
  });
  m.scope("arms", () => {
    const sh = (s: number): Vec3 => H(0.0, 2.2, s * 0.22);
    // the right arm holds the lance up, the left the reins
    pipe(m, P, [sh(-1), H(0.12, 2.03, -0.31), H(0.3, 2.07, -0.31)], [0.065, 0.055, 0.045].map((r) => r * K), 7, [0, 1, 0]);
    pipe(m, P, [sh(1), H(0.1, 1.98, 0.27), H(0.28, 1.92, 0.12)], [0.065, 0.055, 0.045].map((r) => r * K), 7, [0, 1, 0]);
    for (const s of [-1, 1]) blob(m, P, sh(s), 0.08 * K, 0.07 * K, 0.08 * K, 6, 3);
    blob(m, P, H(0.31, 2.07, -0.31), 0.05 * K, 0.05 * K, 0.05 * K, 6, 3);
    blob(m, P, H(0.29, 1.92, 0.12), 0.05 * K, 0.05 * K, 0.05 * K, 6, 3);
  });
  m.scope("legs", () => {
    for (const s of [-1, 1]) {
      const pts = [H(0.02, 1.74, s * 0.15), H(0.14, 1.64, s * 0.33), H(0.22, 1.48, s * 0.45), H(0.18, 1.24, s * 0.48), H(0.13, 1.0, s * 0.47), H(0.29, 0.95, s * 0.46)];
      pipe(m, P, pts, [0.09, 0.085, 0.07, 0.06, 0.06, 0.04].map((r) => r * K), 7, [0, 0, 1]);
    }
  });
  m.scope("reins", () => {
    for (const s of [-1, 1]) pipe(m, "bronze", [H(1.27, 1.68, s * 0.09), H(0.85, 1.75, s * 0.12), H(0.3, 1.92, 0.12 + s * 0.02)], 0.01 * K, 4, [1, 0, 0]);
  });
  m.scope("lance", () => {
    const a = H(0.33, 1.4, -0.31), b = H(0.38, 3.55, -0.31);
    pipe(m, "bronze", [a, b], 0.022 * K, 6, [1, 0, 0]);
    cone(m, "gilt", b, H(0.385, 3.72, -0.31), 0.045 * K, 6, [1, 0, 0]);
    // the pennant flying back from the lance head, in a gentle wave
    const segs = 6;
    const top: Vec3[] = [], bot: Vec3[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = 0.375 - t * 0.75;
      const w = 0.06 * Math.sin(t * Math.PI * 1.5);
      const yt = 3.5 - t * 0.06, yb = 3.16 + t * 0.26;
      top.push(H(x, yt, -0.31 + w));
      bot.push(H(x, yb, -0.31 + w));
    }
    const th: Vec3 = [0.012 * K, 0, 0];
    const fr: Vec3[] = [], bk: Vec3[] = [], rims: Vec3[] = [];
    for (let i = 0; i < segs; i++) {
      const [a0, a1, b0, b1] = [top[i]!, top[i + 1]!, bot[i]!, bot[i + 1]!];
      fr.push(add(a0, th), add(a1, th), add(b1, th), add(a0, th), add(b1, th), add(b0, th));
      bk.push(sub(a0, th), sub(a1, th), sub(b1, th), sub(a0, th), sub(b1, th), sub(b0, th));
      m.facets("gilt", [add(a0, th), add(a1, th), sub(a1, th), add(a0, th), sub(a1, th), sub(a0, th)], [0, 1, 0]);
      m.facets("gilt", [add(b0, th), add(b1, th), sub(b1, th), add(b0, th), sub(b1, th), sub(b0, th)], [0, -1, 0]);
    }
    for (let i = 0; i < segs; i++) {
      // each strip faces along +X or -X (the wave is gentle)
      m.facets("gilt", fr.slice(i * 6, i * 6 + 6), [1, 0, 0]);
      m.facets("gilt", bk.slice(i * 6, i * 6 + 6), [-1, 0, 0]);
    }
    const e = segs;
    rims.push(add(top[e]!, th), add(bot[e]!, th), sub(bot[e]!, th), add(top[e]!, th), sub(bot[e]!, th), sub(top[e]!, th));
    m.facets("gilt", rims, [0, 0, -1]);
  });
}

/** The equestrian statue, about 12 m tall on its 12 m round stepped base. */
export function equestrianStatue(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("equestrian statue", () => {
    m.scope("base", () => baseAndRailing(m));
    m.scope("pedestal", () => pedestal(m));
    m.scope("corner saints", () => cornerSaints(m));
    m.scope("horse", () => horse(m));
    m.scope("rider", () => rider(m));
  });
  return m;
}

/** The low level of detail: the round steps, the railing as a band, the pedestal, the saints, and the horse and rider as blocks. */
export function equestrianStatueLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.prism("step", circle(16, STEP_R[0]! * 0.995), 0, 0.27);
  m.prism("step", circle(16, 5.35), 0.27, Y_PLAT);
  // the railing as a hollow band
  const outer = circle(16, RAIL_R + 0.06), inner = circle(16, RAIL_R - 0.06);
  m.prism("bronze", outer, Y_PLAT, RAIL_TOP, false);
  for (let i = 0; i < 16; i++) {
    const j = (i + 1) % 16;
    m.quad("bronze", [inner[j]![0], Y_PLAT, inner[j]![1]], [inner[i]![0], Y_PLAT, inner[i]![1]], [inner[i]![0], RAIL_TOP, inner[i]![1]], [inner[j]![0], RAIL_TOP, inner[j]![1]]);
    m.quad("bronze", [outer[i]![0], RAIL_TOP, outer[i]![1]], [outer[j]![0], RAIL_TOP, outer[j]![1]], [inner[j]![0], RAIL_TOP, inner[j]![1]], [inner[i]![0], RAIL_TOP, inner[i]![1]]);
  }
  m.prism("granite", rect(3.5, 5.1), Y_PLAT, 1.2);
  m.prism("granite", rect(DIE_W, DIE_D), 1.2, FRIEZE_Y0);
  m.prism("granitePolished", rect(DIE_W + 0.1, DIE_D + 0.1), FRIEZE_Y0, FRIEZE_Y1);
  m.prism("granite", rect(DIE_W, DIE_D), FRIEZE_Y1, 5.2);
  m.prism("graniteLight", rect(3.25, 4.85), 5.2, 5.62);
  m.prism("granite", rect(2.7, 4.3), 5.62, 6.4);
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const) {
    const x = sx * 2.2, z = sz * 3.0;
    m.prism("granite", rect(0.9, 0.9, x, z), Y_PLAT, 2.06);
    m.loft("patina", circle(6, 0.4, x, z), 2.06, circle(6, 0.18, x, z), 4.4);
  }
  // the horse: legs, barrel, neck and head
  const hx = (x: number): number => (x - X_MID) * K;
  const hy = (y: number): number => PLATE_TOP + y * K;
  m.prism("patina", rect(0.6, hx(0.6) - hx(-0.7)), 6.4, hy(0.95), false);
  const bz = (hx(0.95) + hx(-1.0)) / 2;
  m.prism("patina", rect(0.75 * K, hx(0.95) - hx(-1.0), 0, bz), hy(0.85), hy(1.62));
  m.cap("patina", rect(0.75 * K, hx(0.95) - hx(-1.0), 0, bz), hy(0.85), false);
  m.prism("patina", rect(0.3 * K, 0.5 * K, 0, hx(0.92)), hy(1.5), hy(2.3));
  m.prism("patina", rect(0.22 * K, 0.36 * K, 0, hx(1.15)), hy(1.6), hy(2.25));
  // the rider and his lance
  m.prism("patina", rect(0.9 * K, 0.4 * K, 0, hx(0.05)), hy(1.62), hy(2.25));
  m.prism("patinaDark", rect(0.22 * K, 0.24 * K, 0, hx(0.02)), hy(2.25), hy(2.65));
  m.prism("bronze", rect(0.06, 0.06, -0.31 * K, hx(0.36)), hy(1.4), hy(3.72));
  m.prism("gilt", rect(0.04, 0.75 * K, -0.31 * K, hx(0.0)), hy(3.2), hy(3.48));
  return m;
}

export const EQUESTRIAN_STATUE: ProceduralDesign[] = [
  { id: "bld-equestrian-statue", game: { plaza: { cities: ["town", "city"], layouts: ["radial"], round: true } }, title: "Equestrian Statue", build: equestrianStatue, buildLod: equestrianStatueLod, references: "equestrian-statue", catalog: PLAZA_CATALOG },
];
