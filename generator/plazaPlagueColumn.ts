// A Central European baroque Marian / plague column for a village or town square
// (docs/models/plaza-landmarks.md): a generic composite of the columns of Kremnica,
// Zwettl, Prague (the Old Town Square Marian column) and Munich (Mariensaule) - the
// photos in assets/plague-column/ - not a copy of any one of them.
//
// A three-step octagonal base 10.6 m across carries a stone balustrade with ball
// finials, open to the front (+Z), and four saint statues on pedestals on its
// diagonal sides. In the middle stands the richly moulded pedestal (a scrolled
// die with cartouches, a cornice with four smaller saints, an upper stage), then
// a Corinthian column wreathed in clouds with cherub heads, and on its capital a
// cloud globe with the crescent moon under the gilded Virgin (Immaculata) with her
// halo of twelve stars, about 17 m overall.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin; the Virgin, the
// front inscription and the balustrade's opening face +Z. Deterministic: the same
// code gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, chamferedRect, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  step: { color: "#b3ab9b", roughness: 0.95 },
  sandstone: { color: "#cdbc9a", roughness: 0.9 },
  sandstoneLight: { color: "#e0d4b8", roughness: 0.85 },
  sandstoneShade: { color: "#b19f80", roughness: 0.9 },
  statue: { color: "#d6ccb8", roughness: 0.85 },
  cloud: { color: "#e6dfcf", roughness: 0.85 },
  gilt: { color: "#d4a53e", metallic: 0.7, roughness: 0.35 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

/** A circle of n points about (cx, cz), wound like ngon. */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/** A regular octagon with flat sides facing the axes, `apo` from the centre to each side. */
const octagon = (apo: number): Ring => ngon(8, apo / Math.cos(Math.PI / 8), Math.PI / 8);

/** A triangle wound so it faces away from `inside`. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const g: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
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

/**
 * A round tube of radius r (or radii per point) along the points `pts`, `n` sides,
 * its rings square to the path; closed ends unless `loop` joins the last point to
 * the first. `ref` is a direction the path never runs along (it fixes the rings' turn).
 */
function pipe(m: MeshBuilder, mat: string, pts: Vec3[], r: number | number[], n: number, ref: Vec3, loop = false): void {
  const N = pts.length;
  const rad = (i: number): number => (typeof r === "number" ? r : r[i]!);
  const at = (i: number): Vec3 => pts[(i + N) % N]!;
  const rings: Vec3[][] = [];
  for (let i = 0; i < N; i++) {
    const prev = loop || i > 0 ? at(i - 1) : at(i);
    const next = loop || i < N - 1 ? at(i + 1) : at(i);
    const t = unit(sub(next, prev));
    const u = unit(cross(t, ref));
    const v = cross(t, u);
    const ring: Vec3[] = [];
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n;
      ring.push(add(at(i), add(mul(u, rad(i) * Math.cos(a)), mul(v, rad(i) * Math.sin(a)))));
    }
    rings.push(ring);
  }
  const segs = loop ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const A = rings[i]!, B = rings[(i + 1) % N]!;
    const mid = mul(add(at(i), at(i + 1)), 0.5);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      triOut(m, mat, A[k]!, A[j]!, B[j]!, mid);
      triOut(m, mat, A[k]!, B[j]!, B[k]!, mid);
    }
  }
  if (loop) return;
  for (const [i, inward] of [[0, 1], [N - 1, N - 2]] as const) {
    const R = rings[i]!;
    const inside = add(at(i), mul(unit(sub(at(inward), at(i))), 0.01));
    for (let k = 1; k + 1 < n; k++) triOut(m, mat, R[0]!, R[k]!, R[k + 1]!, inside);
  }
}

/** A box spanning its centre and size, turned ry, closed underneath as well. */
function block(m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, ry = 0): void {
  m.box(mat, cx, cz, w, d, y0, y1, ry);
  m.cap(mat, rect(w, d, cx, cz, ry), y0, false);
}

// --- statues ------------------------------------------------------------------------

type Pose = "raised" | "open" | "praying" | "staff";

/** A ring across a figure: half width a across, half depth b along the facing `face`. */
function figRing(cx: number, cz: number, a: number, b: number, face: number, n = 10, back = 0): Ring {
  const rx = Math.cos(face), rz = -Math.sin(face); // across (right)
  const fx = Math.sin(face), fz = Math.cos(face); // forward
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    const u = a * Math.cos(t), w = -b * Math.sin(t) + back;
    ring.push([cx + u * rx + w * fx, cz + u * rz + w * fz]);
  }
  return ring;
}

/**
 * A robed standing figure h tall on y0 at (cx, cz), facing `face` (0 = +Z): a
 * flaring robe lofted from oval sections, the head, two arms in the given pose.
 */
function figure(m: MeshBuilder, mat: string, cx: number, cz: number, y0: number, h: number, face: number, pose: Pose): void {
  const fx = Math.sin(face), fz = Math.cos(face);
  const rx = Math.cos(face), rz = -Math.sin(face);
  const L = (s: number, y: number, f: number): Vec3 => [cx + s * rx * h + f * fx * h, y0 + y * h, cz + s * rz * h + f * fz * h];
  m.scope("robe", () => {
    // [height, half width, half depth, lean back]
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
      // a crozier or cross-staff held in the right hand
      const a = L(0.2, 0.02, 0.15), b = L(0.2, 1.15, 0.15);
      pipe(m, mat, [a, b], 0.014 * h, 5, [1, 0, 0]);
      pipe(m, mat, [L(0.13, 1.06, 0.15), L(0.27, 1.06, 0.15)], 0.014 * h, 5, [0, 1, 0]);
    }
  });
}

// --- the base, steps and balustrade -------------------------------------------------

const Y_PLAT = 0.54; // the platform's top
const BAL_APO = 4.45; // the balustrade's centre line from the middle

/** A balustrade run from p to q (centre line, on the platform): plinth, vase balusters, rail. */
function balustradeRun(m: MeshBuilder, p: Vec3, q: Vec3): void {
  const d = sub(q, p);
  const len = Math.hypot(d[0], d[2]);
  const dir: Vec3 = [d[0] / len, 0, d[2] / len];
  const ry = Math.atan2(-dir[2], dir[0]);
  const c: Vec3 = mul(add(p, q), 0.5);
  m.box("sandstoneShade", c[0], c[2], len, 0.34, Y_PLAT, Y_PLAT + 0.16, ry);
  block(m, "sandstone", c[0], c[2], len, 0.38, 1.42, 1.56, ry);
  const count = Math.max(1, Math.round((len - 0.1) / 0.27));
  const pitch = len / count;
  // a vase baluster: [height above the plinth, half width]
  const prof: Array<[number, number]> = [[0.15, 0.075], [0.32, 0.1], [0.6, 0.045], [0.73, 0.07]];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) * pitch;
    const x = p[0] + dir[0] * t, z = p[2] + dir[2] * t;
    for (let k = 0; k + 1 < prof.length; k++) {
      const [y0, w0] = prof[k]!, [y1, w1] = prof[k + 1]!;
      m.loft("sandstoneLight", rect(2 * w0, 2 * w0, x, z, ry), Y_PLAT + y0, rect(2 * w1, 2 * w1, x, z, ry), Y_PLAT + y1, false);
    }
  }
}

/** A balustrade post at (x, z), turned ry, with its cap and ball finial. */
function post(m: MeshBuilder, x: number, z: number, ry: number): void {
  m.box("sandstone", x, z, 0.44, 0.44, Y_PLAT, 1.5, ry, false);
  block(m, "sandstoneLight", x, z, 0.54, 0.54, 1.5, 1.62, ry);
  blob(m, "sandstoneLight", [x, 1.8, z], 0.16, 0.17, 0.16, 7, 4);
  m.prism("sandstoneLight", circle(6, 0.07, x, z), 1.62, 1.66);
}

function baseAndBalustrade(m: MeshBuilder): void {
  m.scope("steps", () => {
    const apo = [5.3, 5.0, 4.7];
    for (let i = 0; i < 3; i++) m.prism("step", octagon(apo[i]!), i * 0.18, (i + 1) * 0.18);
  });
  m.scope("balustrade", () => {
    const V = octagon(BAL_APO).map(([x, z]): Vec3 => [x, Y_PLAT, z]);
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k * Math.PI) / 4;
      m.scope(`post ${k + 1}`, () => post(m, V[k]![0], V[k]![2], a));
    }
    for (let k = 0; k < 8; k++) {
      const P = V[k]!, Q = V[(k + 1) % 8]!;
      const dir = unit(sub(Q, P));
      const M = mul(add(P, Q), 0.5);
      const ry = Math.atan2(-dir[2], dir[0]);
      const inset = (A: Vec3, B: Vec3, ha: number, hb: number): void => {
        const u = unit(sub(B, A));
        balustradeRun(m, add(A, mul(u, ha - 0.04)), sub(B, mul(u, hb - 0.04)));
      };
      const diagonal = k % 2 === 0;
      const front = k === 5;
      m.scope(`side ${k + 1}`, () => {
        if (diagonal) {
          // a saint on a pedestal in the middle of the side, facing out
          const a = Math.PI / 4 + (k * Math.PI) / 4;
          const out: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
          const pc = add(M, mul(out, 0.08));
          m.scope("saint pedestal", () => {
            m.box("sandstone", pc[0], pc[2], 0.92, 0.92, Y_PLAT, 1.78, ry, false);
            m.loft("sandstoneLight", rect(0.92, 0.92, pc[0], pc[2], ry), 1.78, rect(1.1, 1.1, pc[0], pc[2], ry), 1.88, false);
            m.prism("sandstoneLight", rect(1.1, 1.1, pc[0], pc[2], ry), 1.88, 1.98);
            m.slab("sandstoneShade", [
              add(pc, [-dir[0] * 0.28 + out[0] * 0.49, 0.85, -dir[2] * 0.28 + out[2] * 0.49]),
              add(pc, [dir[0] * 0.28 + out[0] * 0.49, 0.85, dir[2] * 0.28 + out[2] * 0.49]),
              add(pc, [dir[0] * 0.28 + out[0] * 0.49, 1.55, dir[2] * 0.28 + out[2] * 0.49]),
              add(pc, [-dir[0] * 0.28 + out[0] * 0.49, 1.55, -dir[2] * 0.28 + out[2] * 0.49]),
            ], mul(out, -0.1));
          });
          const face = Math.atan2(out[0], out[2]);
          const poses: Pose[] = ["staff", "raised", "open", "praying"];
          m.scope(`saint ${k / 2 + 1}`, () => figure(m, "statue", pc[0], pc[2], 1.98, 2.0, face, poses[k / 2]!));
          inset(P, sub(M, mul(dir, 0.46)), 0.22, 0);
          inset(add(M, mul(dir, 0.46)), Q, 0, 0.22);
        } else if (front) {
          // the opening to the front, between two gate posts
          const g0 = sub(M, mul(dir, 0.85)), g1 = add(M, mul(dir, 0.85));
          post(m, g0[0], g0[2], ry);
          post(m, g1[0], g1[2], ry);
          inset(P, g0, 0.22, 0.22);
          inset(g1, Q, 0.22, 0.22);
        } else inset(P, Q, 0.22, 0.22);
      });
    }
  });
}

// --- the central pedestal ---------------------------------------------------------

/** A console scroll on the die's corner at angle a: a C-curve with a curl at its foot. */
function scroll(m: MeshBuilder, a: number): void {
  const ox = Math.cos(a), oz = -Math.sin(a);
  const pts: Vec3[] = [];
  const P = (d: number, y: number): Vec3 => [ox * d, y, oz * d];
  // the curl at the foot, then the rise to the cornice
  for (let i = 0; i <= 6; i++) {
    const t = Math.PI * 1.5 - (i / 6) * Math.PI * 1.6;
    const r = 0.14 + 0.18 * (i / 6);
    pts.push(P(2.1 + r * Math.cos(t), 1.42 + r * Math.sin(t)));
  }
  pts.push(P(2.24, 2.0), P(2.1, 2.6), P(1.98, 3.02), P(2.1, 3.22));
  const tang: Vec3 = [-oz, 0, ox];
  pipe(m, "sandstoneLight", pts, 0.13, 6, tang);
}

/** A cartouche: an oval slab standing proud of the face whose outward normal is n, its back buried. */
function cartouche(m: MeshBuilder, mat: string, c: Vec3, n: Vec3, w: number, h: number, sides = 10): void {
  const u: Vec3 = [-n[2], 0, n[0]];
  const pts: Vec3[] = [];
  for (let i = 0; i < sides; i++) {
    const t = (2 * Math.PI * i) / sides;
    pts.push(add(c, add(mul(u, (w / 2) * Math.cos(t)), [0, (h / 2) * Math.sin(t), 0])));
  }
  m.slab(mat, pts.map((p) => add(p, mul(n, 0.05))), mul(n, -0.12));
}

function pedestal(m: MeshBuilder): void {
  m.scope("socle", () => {
    m.prism("sandstoneShade", chamferedRect(4.0, 4.0, 0.62), Y_PLAT, 0.82);
    m.loft("sandstone", chamferedRect(3.86, 3.86, 0.6), 0.82, chamferedRect(3.4, 3.4, 0.52), 0.98);
  });
  m.scope("die", () => {
    m.prism("sandstone", chamferedRect(3.4, 3.4, 0.52), 0.98, 3.3, false);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const n: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
      m.scope(`face ${k + 1}`, () => {
        // a sunk-looking frame and a cartouche (the front's gilt inscription plate)
        const c: Vec3 = mul(n, 1.7);
        const u: Vec3 = [-n[2], 0, n[0]];
        const fr = [add(add(c, mul(u, -0.62)), [0, 1.2, 0]), add(add(c, mul(u, 0.62)), [0, 1.2, 0]), add(add(c, mul(u, 0.62)), [0, 3.08, 0]), add(add(c, mul(u, -0.62)), [0, 3.08, 0])];
        m.slab("sandstoneShade", fr.map((p) => add(p, mul(n, 0.04))), mul(n, -0.1));
        cartouche(m, "sandstoneLight", add(c, [0, 2.14, 0]), n, 0.92, 1.38, 10);
        if (k === 3) cartouche(m, "gilt", add(add(c, mul(n, 0.06)), [0, 2.14, 0]), n, 0.62, 0.82, 8);
        else blob(m, "statue", add(add(c, mul(n, 0.12)), [0, 2.2, 0]), 0.2, 0.26, 0.1, 6, 3, a);
      });
      m.scope(`scroll ${k + 1}`, () => scroll(m, a + Math.PI / 4));
    }
  });
  m.scope("cornice", () => {
    m.loft("sandstoneLight", chamferedRect(3.4, 3.4, 0.52), 3.3, chamferedRect(3.8, 3.8, 0.56), 3.48, false);
    m.prism("sandstoneLight", chamferedRect(3.8, 3.8, 0.56), 3.48, 3.66);
  });
  m.scope("corner saints", () => {
    const poses: Pose[] = ["praying", "open", "raised", "praying"];
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const d = 1.96;
      figure(m, "statue", Math.cos(a) * d, -Math.sin(a) * d, 3.66, 1.45, Math.atan2(Math.cos(a), -Math.sin(a)), poses[k]!);
    }
  });
  m.scope("upper stage", () => {
    m.prism("sandstone", chamferedRect(2.5, 2.5, 0.4), 3.66, 5.4, false);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const n: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
      cartouche(m, "sandstoneLight", add(mul(n, 1.25), [0, 4.55, 0]), n, 0.8, 1.15, 8);
    }
    m.loft("sandstoneLight", chamferedRect(2.5, 2.5, 0.4), 5.4, chamferedRect(2.9, 2.9, 0.46), 5.56, false);
    m.prism("sandstoneLight", chamferedRect(2.9, 2.9, 0.46), 5.56, 5.74);
    m.prism("sandstone", rect(1.5, 1.5), 5.74, 6.3);
  });
}

// --- the column ---------------------------------------------------------------------

const SHAFT_Y0 = 6.55;
const SHAFT_Y1 = 13.3;

function column(m: MeshBuilder): void {
  m.scope("base", () => {
    m.prism("sandstoneLight", circle(16, 0.64), 6.3, 6.42);
    m.loft("sandstoneLight", circle(16, 0.62), 6.42, circle(16, 0.5), SHAFT_Y0);
  });
  m.scope("shaft", () => {
    m.loft("sandstone", circle(16, 0.46), SHAFT_Y0, circle(16, 0.39), SHAFT_Y1, false);
  });
  m.scope("clouds", () => {
    // a cloud mass wreathing the lower shaft: a lumpy core and billows spiralling
    // up it, cherub heads with little wings peeping out of them
    m.loft("cloud", circle(10, 0.82), SHAFT_Y0, circle(10, 0.5), 10.9, false);
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const a = i * 1.7;
      const y = 6.85 + t * 4.1;
      const s = 1 - 0.45 * t;
      const r = 0.55 * s + 0.2;
      const c: Vec3 = [Math.cos(a) * r, y, -Math.sin(a) * r];
      blob(m, "cloud", c, 0.48 * s + 0.12, 0.36 * s + 0.12, 0.4 * s + 0.1, 8, 4, a);
      if (i % 3 === 1) {
        const hr = 0.16 * s + 0.07;
        const out = r + 0.4 * s + 0.12;
        const hc: Vec3 = [Math.cos(a) * out, y + 0.12, -Math.sin(a) * out];
        blob(m, "statue", hc, hr, hr * 1.05, hr, 7, 4);
        for (const w of [-1, 1]) {
          const side: Vec3 = [Math.sin(a) * w, 0, Math.cos(a) * w];
          blob(m, "statue", add(add(hc, mul(side, hr * 1.4)), [0, 0.02, 0]), hr * 0.9, hr * 0.45, hr * 0.25, 5, 3, a + Math.PI / 2);
        }
      }
    }
  });
  m.scope("capital", () => {
    m.prism("sandstoneLight", circle(16, 0.44), SHAFT_Y1 - 0.08, SHAFT_Y1 + 0.04);
    m.loft("sandstoneLight", circle(16, 0.39), SHAFT_Y1 + 0.04, circle(16, 0.52), 14.22, false);
    // two rows of acanthus leaves curling out of the bell
    const bellR = (y: number): number => 0.39 + ((y - SHAFT_Y1) / (14.22 - SHAFT_Y1)) * 0.13;
    for (let row = 0; row < 2; row++) {
      const yb = SHAFT_Y1 + 0.06 + row * 0.24;
      const yt = yb + 0.5;
      for (let i = 0; i < 8; i++) {
        const a = ((i + row * 0.5) / 8) * Math.PI * 2;
        const R = (ang: number, r: number, y: number): Vec3 => [Math.cos(ang) * r, y, -Math.sin(ang) * r];
        const bl = R(a - 0.32, bellR(yb) - 0.02, yb), br = R(a + 0.32, bellR(yb) - 0.02, yb);
        const back = R(a, bellR(yt - 0.08) - 0.03, yt - 0.08);
        const tip = R(a, bellR(yt) + 0.17 + row * 0.03, yt);
        const belly = R(a, bellR(yb + 0.25) + 0.06, yb + 0.25);
        const inside = R(a, 0.1, yb + 0.2);
        triOut(m, "sandstoneLight", bl, belly, tip, inside);
        triOut(m, "sandstoneLight", br, tip, belly, inside);
        triOut(m, "sandstoneLight", bl, br, belly, inside);
        triOut(m, "sandstoneLight", bl, tip, back, inside);
        triOut(m, "sandstoneLight", br, back, tip, inside);
      }
    }
    // the corner volutes under the abacus
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const o: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
      const P = (d: number, y: number): Vec3 => add(mul(o, d), [0, y, 0]);
      pipe(m, "sandstoneLight", [P(0.45, 13.86), P(0.62, 14.08), P(0.76, 14.04), P(0.78, 13.92), P(0.68, 13.88)], 0.06, 6, [-o[2], 0, o[0]]);
    }
    const ab = chamferedRect(1.18, 1.18, 0.2);
    m.cap("sandstoneLight", ab, 14.22, false);
    m.prism("sandstoneLight", ab, 14.22, 14.42);
  });
}

// --- the Virgin -------------------------------------------------------------------

function virgin(m: MeshBuilder): void {
  m.scope("cloud globe", () => {
    blob(m, "cloud", [0, 14.68, 0], 0.5, 0.34, 0.5, 9, 4);
    blob(m, "cloud", [0.28, 14.6, 0.18], 0.3, 0.2, 0.28, 6, 3, 0.6);
    blob(m, "cloud", [-0.26, 14.62, -0.16], 0.3, 0.2, 0.28, 6, 3, 2.2);
  });
  m.scope("crescent", () => {
    const pts: Vec3[] = [];
    const rr: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = Math.PI * (0.05 + (0.9 * i) / 8);
      pts.push([-Math.cos(t) * 0.55, 14.98 - Math.sin(t) * 0.2 + 0.06, 0.32 + Math.sin(t) * 0.05]);
      rr.push(0.025 + 0.05 * Math.sin(t));
    }
    pipe(m, "gilt", pts, rr, 6, [0, 0, 1]);
  });
  const y0 = 14.95, h = 2.3;
  m.scope("statue", () => {
    // the Immaculata: robe, head, arms lowered and opened in blessing
    figure(m, "gilt", 0, 0, y0, h, 0, "open");
  });
  m.scope("halo", () => {
    const hy = y0 + 0.9 * h + 0.1;
    const ring: Vec3[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ring.push([Math.cos(a) * 0.36, hy, -Math.sin(a) * 0.36 - 0.02]);
    }
    pipe(m, "gilt", ring, 0.018, 4, [0, 1, 0], true);
    for (const p of ring) blob(m, "gilt", add(p, [0, 0.03, 0]), 0.075, 0.075, 0.075, 4, 2);
  });
}

/** The plague column, about 17 m tall on its 10.6 m stepped base. */
export function plagueColumn(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("plague column", () => {
    m.scope("base", () => baseAndBalustrade(m));
    m.scope("pedestal", () => pedestal(m));
    m.scope("column", () => column(m));
    m.scope("virgin", () => virgin(m));
  });
  return m;
}

/** The low level of detail: the stepped base, a balustrade band, the saints, pedestal, column and the gilt Virgin as blocks. */
export function plagueColumnLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.prism("step", octagon(5.3), 0, 0.27);
  m.prism("step", octagon(4.85), 0.27, Y_PLAT);
  // the balustrade as a hollow octagonal band
  const outer = octagon(BAL_APO + 0.2), inner = octagon(BAL_APO - 0.2);
  m.prism("sandstoneLight", outer, Y_PLAT, 1.56, false);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    m.quad("sandstoneLight", [inner[j]![0], Y_PLAT, inner[j]![1]], [inner[i]![0], Y_PLAT, inner[i]![1]], [inner[i]![0], 1.56, inner[i]![1]], [inner[j]![0], 1.56, inner[j]![1]]);
    m.quad("sandstoneLight", [outer[i]![0], 1.56, outer[i]![1]], [outer[j]![0], 1.56, outer[j]![1]], [inner[j]![0], 1.56, inner[j]![1]], [inner[i]![0], 1.56, inner[i]![1]]);
  }
  for (let k = 0; k < 8; k += 2) {
    const a = Math.PI / 4 + (k * Math.PI) / 4;
    const d = BAL_APO + 0.08;
    const x = Math.cos(a) * d, z = -Math.sin(a) * d;
    m.prism("sandstone", rect(1.0, 1.0, x, z, a), 1.56, 1.98);
    m.loft("statue", circle(6, 0.36, x, z), 1.98, circle(6, 0.2, x, z), 3.95);
  }
  m.prism("sandstone", chamferedRect(3.8, 3.8, 0.56), Y_PLAT, 3.66);
  m.prism("sandstone", chamferedRect(2.6, 2.6, 0.4), 3.66, 5.74);
  m.prism("sandstone", rect(1.5, 1.5), 5.74, 6.3);
  m.loft("sandstone", circle(8, 0.62), 6.3, circle(8, 0.46), 6.6);
  m.loft("cloud", circle(8, 1.05), 6.6, circle(8, 0.6), 10.9);
  m.loft("sandstone", circle(8, 0.42), 10.9, circle(8, 0.39), 13.3);
  m.loft("sandstoneLight", circle(8, 0.42), 13.3, circle(8, 0.7), 14.4);
  m.loft("cloud", circle(8, 0.5), 14.4, circle(8, 0.35), 14.95);
  m.loft("gilt", circle(6, 0.36), 14.95, circle(6, 0.22), 17.15);
  return m;
}

export const PLAGUE_COLUMN: ProceduralDesign[] = [
  { id: "bld-plague-column", game: { plaza: { cities: ["village", "town"] } }, title: "Plague Column", build: plagueColumn, buildLod: plagueColumnLod, references: "plague-column", catalog: PLAZA_CATALOG },
];
