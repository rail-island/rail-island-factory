// The procedural churches: three designs modelled on the photos in assets/ -- a
// small baroque hillside church with one front tower, the neo-Gothic church in
// Vrchlabi and a twin-tower baroque church. Each is a function that builds its
// model from boxes, sweeps, lathes and slabs (meshBuilder.ts); `pnpm build` runs
// them (generate.ts) and writes ordinary GLBs, thumbnails and a meta.json into
// the export folder. See docs/models/churches.md.
//
// Each design reproduces the hand-authored GLB of the same name in the webapp's
// model database (rail-island-webapp db/buildings/glb/): the same axes, the same
// bounding box (test/referenceModels.test.ts), the same look. Modelled in
// metres, base at y = 0. The baroque churches face +z, the Vrchlabi church -z
// (its tower and portal are on the -z end), as the references do.
//
// Deterministic: the same code gives the same bytes. The ids are what the game's
// saved maps store, so a design is never renamed once shipped.

import { MeshBuilder, chamferedRect, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";

type P2 = [number, number];

// --- wall faces ----------------------------------------------------------------------
//
// Windows, doors, clocks and pilasters are slabs laid on a vertical wall face. A
// Face is the wall's plane: a point on it (ox, oz), the unit tangent (tx, tz) that
// runs to the right as seen from outside, and the outward unit normal (nx, nz).
// A point on it is (u, y, out): u along the tangent from the origin, y up, `out`
// metres proud of the wall.

interface Face {
  ox: number;
  oz: number;
  tx: number;
  tz: number;
  nx: number;
  nz: number;
}

/** The face through (ox, oz) whose outward normal is (nx, nz) (normalised here). */
function face(ox: number, oz: number, nx: number, nz: number): Face {
  const l = Math.hypot(nx, nz);
  return { ox, oz, tx: nz / l, tz: -nx / l, nx: nx / l, nz: nz / l };
}

/** A face whose outward normal points along a world axis. */
const faceX = (x: number, sign: number, oz = 0): Face => face(x, oz, sign, 0);
const faceZ = (z: number, sign: number, ox = 0): Face => face(ox, z, 0, sign);

function onFace(f: Face, u: number, y: number, out: number): Vec3 {
  return [f.ox + f.tx * u + f.nx * out, y, f.oz + f.tz * u + f.nz * out];
}

/** The u coordinate of the world point (x, z) on the face. */
function uOf(f: Face, x: number, z: number): number {
  return (x - f.ox) * f.tx + (z - f.oz) * f.tz;
}

/** A convex outline (u, y) on the face, extruded from `out0` to `out1` proud of the wall. */
function panel(m: MeshBuilder, mat: string, f: Face, outline: P2[], out0: number, out1: number): void {
  const d = out1 - out0;
  m.slab(mat, outline.map(([u, y]) => onFace(f, u, y, out1)), [-f.nx * d, 0, -f.nz * d]);
}

function rectOutline(u0: number, u1: number, y0: number, y1: number): P2[] {
  return [[u0, y0], [u1, y0], [u1, y1], [u0, y1]];
}

/** A round-headed opening: w wide, from y0 to y0 + h, its semicircular head in `n` segments. */
function roundArch(cu: number, w: number, y0: number, h: number, n = 8): P2[] {
  const r = w / 2;
  const ys = y0 + h - r;
  const pts: P2[] = [[cu - r, y0], [cu + r, y0]];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI;
    pts.push([cu + r * Math.cos(a), ys + r * Math.sin(a)]);
  }
  return pts;
}

/**
 * A pointed (Gothic) opening: w wide, from y0 to its apex at y0 + h. Each half of
 * the head is an arc of radius k * w centred on the springing line.
 */
function pointedArch(cu: number, w: number, y0: number, h: number, k = 0.85, n = 4): P2[] {
  const r = k * w;
  const aTop = Math.acos(1 - w / (2 * r));
  const rise = r * Math.sin(aTop);
  const ys = y0 + h - rise;
  const pts: P2[] = [[cu - w / 2, y0], [cu + w / 2, y0]];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * aTop;
    pts.push([cu + w / 2 - r + r * Math.cos(a), ys + r * Math.sin(a)]);
  }
  for (let i = n - 1; i >= 0; i--) {
    const a = (i / n) * aTop;
    pts.push([cu - w / 2 + r - r * Math.cos(a), ys + r * Math.sin(a)]);
  }
  return pts;
}

/** A circle or ellipse (u, y) of `n` points. */
function oval(cu: number, cy: number, ru: number, ry: number, n: number): P2[] {
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cu + ru * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

type ArchKind = "round" | "pointed" | "flat";

interface WindowSpec {
  kind: ArchKind;
  /** Frame (surround) material and its width around the glass. */
  frame: string;
  border: number;
  glass: string;
  /** Sill material, or none. */
  sill?: string;
  /** Pointed arches: the arc radius as a fraction of the width. */
  k?: number;
}

function archOutline(kind: ArchKind, cu: number, w: number, y0: number, h: number, k?: number): P2[] {
  if (kind === "round") return roundArch(cu, w, y0, h);
  if (kind === "pointed") return pointedArch(cu, w, y0, h, k);
  return rectOutline(cu - w / 2, cu + w / 2, y0, y0 + h);
}

/**
 * A window on a face: the glass `w` wide from y0 to y0 + h, standing just proud
 * of a frame `border` wider all round, with a sill under it. The frame's back is
 * buried in the wall, so no face of it lies in the wall's plane.
 */
function windowOn(m: MeshBuilder, f: Face, cu: number, y0: number, w: number, h: number, s: WindowSpec): void {
  const b = s.border;
  m.scope("window", () => {
    panel(m, s.frame, f, archOutline(s.kind, cu, w + 2 * b, y0 - b, h + 2 * b, s.k ? (s.k * w) / (w + 2 * b) : undefined), -0.05, 0.1);
    panel(m, s.glass, f, archOutline(s.kind, cu, w, y0, h, s.k), 0.04, 0.14);
    if (s.sill) panel(m, s.sill, f, rectOutline(cu - w / 2 - b - 0.12, cu + w / 2 + b + 0.12, y0 - b - 0.22, y0 - b + 0.02), -0.08, 0.22);
  });
}

/** A clock: a pale dial in a rim, two dark hands. */
function clockOn(m: MeshBuilder, f: Face, cu: number, cy: number, r: number, rim: string, dial: string, hands: string, n = 20): void {
  m.scope("clock", () => {
    panel(m, rim, f, oval(cu, cy, r, r, n), -0.05, 0.12);
    panel(m, dial, f, oval(cu, cy, r * 0.84, r * 0.84, n), 0.05, 0.17);
    const t = r * 0.06;
    panel(m, hands, f, rectOutline(cu - t, cu + t, cy - t, cy + r * 0.72), 0.15, 0.22);
    panel(m, hands, f, rectOutline(cu - t, cu + r * 0.5, cy - t * 1.3, cy + t * 1.3), 0.15, 0.22);
  });
}

// --- solids ----------------------------------------------------------------------------

/** A solid of revolution about the vertical axis through (cx, cz): rings of (radius, y), bottom up. */
function lathe(m: MeshBuilder, mat: string, cx: number, cz: number, profile: P2[], n: number, rot = 0, top = false): void {
  for (let i = 0; i + 1 < profile.length; i++) {
    const [r0, y0] = profile[i]!;
    const [r1, y1] = profile[i + 1]!;
    const last = i + 2 === profile.length;
    m.loft(mat, ngon(n, r0, rot, cx, cz), y0, ngon(n, r1, rot, cx, cz), y1, last && top && r1 > 0);
  }
}

/** A ball of radius r centred at (cx, cy, cz). */
function ball(m: MeshBuilder, mat: string, cx: number, cy: number, cz: number, r: number, n = 8): void {
  const prof: P2[] = [];
  const k = 4;
  for (let i = 0; i <= k; i++) {
    const a = -Math.PI / 2 + (i / k) * Math.PI;
    prof.push([r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  lathe(m, mat, cx, cz, prof, n);
}

/** A standing statue on y0, `h` tall: a robed body, shoulders and a head. */
function statue(m: MeshBuilder, mat: string, cx: number, cz: number, y0: number, h: number): void {
  m.scope("statue", () => {
    const s = h / 2.6;
    lathe(m, mat, cx, cz, [[0.5 * s, y0], [0.46 * s, y0 + 0.9 * s], [0.36 * s, y0 + 1.8 * s], [0.4 * s, y0 + 1.95 * s], [0.14 * s, y0 + 2.08 * s]], 7);
    ball(m, mat, cx, y0 + 2.32 * s, cz, 0.24 * s, 7);
  });
}

/** A gilded cross on a ball: the finial of a spire. */
function crossFinial(m: MeshBuilder, mat: string, ballMat: string, cx: number, cz: number, y0: number, h: number, ballR: number): void {
  m.scope("cross", () => {
    ball(m, ballMat, cx, y0 + ballR, cz, ballR);
    const t = Math.max(0.08, h * 0.05);
    m.box(mat, cx, cz, t, t, y0 + ballR * 1.6, y0 + h);
    m.box(mat, cx, cz, h * 0.45, t, y0 + h * 0.68, y0 + h * 0.68 + t);
  });
}

/** A triangle (x, y) section swept along z: a pitched roof whose ridge runs along z. */
function ridgeRoofZ(m: MeshBuilder, mat: string, x0: number, x1: number, yE: number, yR: number, z0: number, z1: number): void {
  const s: Ring = [[x0, yE], [x1, yE], [(x0 + x1) / 2, yR]];
  m.sweep(mat, "z", s, z0, s, z1);
}

/**
 * A pitched roof as two thin plates (ridge along z, eaves at x0 and x1), so a
 * gable wall drawn under it shows at the ends instead of the roof's own section.
 */
function roofPlatesZ(m: MeshBuilder, mat: string, x0: number, x1: number, yE: number, yR: number, z0: number, z1: number, t = 0.3): void {
  const cx = (x0 + x1) / 2;
  for (const xe of [x0, x1]) {
    const s: Ring = [[xe, yE], [cx, yR], [cx, yR + t], [xe, yE + t]];
    m.sweep(mat, "z", s, z0, s, z1);
  }
}

/** A gable wall's section (x, y) under roofPlatesZ: the wall from y0, its top 5 cm under the plates. */
function gableSection(x0: number, x1: number, y0: number, roofX0: number, roofX1: number, yE: number, yR: number): Ring {
  const cx = (x0 + x1) / 2;
  const slope = (yR - yE) / ((roofX1 - roofX0) / 2);
  const yWall = yE + (x0 - roofX0) * slope - 0.05;
  return [[x0, y0], [x1, y0], [x1, yWall], [cx, yR - 0.05], [x0, yWall]];
}

/**
 * Points of half a circle about (cx, cz), radius r, `n` segments, toward -z
 * (`dir` -1) or +z (`dir` 1), in the counter-clockwise order every ring here uses.
 */
function halfCircle(cx: number, cz: number, r: number, n: number, dir: number): Ring {
  const pts: Ring = [];
  for (let i = 0; i <= n; i++) {
    const a = (dir < 0 ? 0 : Math.PI) + (i / n) * Math.PI;
    pts.push([cx + r * Math.cos(a), cz - r * Math.sin(a)]);
  }
  return pts;
}

/** A rounded apse's ring: the half circle and the chord closing it `back` metres into the nave. */
function apseRing(cx: number, cz: number, r: number, n: number, dir: number, back: number): Ring {
  const half = halfCircle(cx, cz, r, n, dir);
  const first = half[0]!;
  const last = half[half.length - 1]!;
  return [...half, [last[0], last[1] - dir * back], [first[0], first[1] - dir * back]];
}

/** A triangle wound to face away from the point `inside`: for hand-built roofs. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const g = [(a[0] + b[0] + c[0]) / 3 - inside[0], (a[1] + b[1] + c[1]) / 3 - inside[1], (a[2] + b[2] + c[2]) / 3 - inside[2]];
  if (n[0] * g[0] + n[1] * g[1] + n[2] * g[2] >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/**
 * A hipped roof over the w x d rectangle about (cx, cz): eaves at y0, a ridge at
 * y1 along the longer side (a pyramid when the rectangle is square).
 */
function hipRoof(m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number): void {
  const hx = w / 2;
  const hz = d / 2;
  const rx = Math.max(0, hx - hz);
  const rz = Math.max(0, hz - hx);
  // eaves corners counter-clockwise from (-x, -z); the ridge from r0 (low end) to r1
  const [e0, e1, e2, e3]: Vec3[] = [[cx - hx, y0, cz - hz], [cx + hx, y0, cz - hz], [cx + hx, y0, cz + hz], [cx - hx, y0, cz + hz]];
  const r0: Vec3 = [cx - rx, y1, cz - rz];
  const r1: Vec3 = [cx + rx, y1, cz + rz];
  const inside: Vec3 = [cx, y0 - 1, cz];
  const quad = (a: Vec3, b: Vec3, c: Vec3, d2: Vec3): void => {
    triOut(m, mat, a, b, c, inside);
    triOut(m, mat, a, c, d2, inside);
  };
  if (rz > 0) {
    triOut(m, mat, e0!, e1!, r0, inside);
    quad(e1!, e2!, r1, r0);
    triOut(m, mat, e2!, e3!, r1, inside);
    quad(e3!, e0!, r0, r1);
  } else {
    quad(e0!, e1!, r1, r0);
    triOut(m, mat, e1!, e2!, r1, inside);
    quad(e2!, e3!, r0, r1);
    triOut(m, mat, e3!, e0!, r0, inside);
  }
}

// --- palettes ---------------------------------------------------------------------------

const PALETTE: Record<string, MaterialSpec> = {
  // the baroque hillside church: cream plaster, white trim, dark slate cap
  stone: { color: "#9d968a" },
  plaster: { color: "#f2e2ae" },
  trim: { color: "#f6f3e9" },
  slate: { color: "#3c3f45", roughness: 0.6 },
  glass: { color: "#2a2c33", roughness: 0.3 },
  gold: { color: "#d8b25a", metallic: 0.6, roughness: 0.35 },
  // Vrchlabi: red sandstone and brick, paler dressings, dark slate spire
  brick: { color: "#b08466" },
  brickDark: { color: "#9a6b50" },
  sandstone: { color: "#c7a184" },
  iron: { color: "#24262a", metallic: 0.3, roughness: 0.5 },
  louver: { color: "#8d3f2b" },
  dial: { color: "#d8d1c1" },
  spireSlate: { color: "#3b424a", roughness: 0.6 },
  leadGlass: { color: "#2b3740", roughness: 0.3 },
  wood: { color: "#45301f" },
  paving: { color: "#a9a297" },
  // the twin-tower church: cream stucco, white dressings, green copper caps
  plinth: { color: "#d8d2c2" },
  stucco: { color: "#eedfb6" },
  dressing: { color: "#faf6ea" },
  greyRoof: { color: "#8b8f8c", roughness: 0.6 },
  darkGlass: { color: "#3d4b55", roughness: 0.3 },
  copper: { color: "#69a894", metallic: 0.2, roughness: 0.5 },
  copperBrown: { color: "#9a7350", metallic: 0.2, roughness: 0.55 },
  gilt: { color: "#d9ad3c", metallic: 0.6, roughness: 0.35 },
  oak: { color: "#6b3b28" },
  ironDark: { color: "#2e3330", metallic: 0.3, roughness: 0.5 },
  clockWhite: { color: "#f7f5ee" },
};

// --- the designs ------------------------------------------------------------------------

/**
 * A cream baroque village church on a hill: a stone terrace with a long stair,
 * a nave with a round apse, a front with volutes and a niche statue, and one
 * front tower under a dark bell-shaped cap and lantern. Faces +z.
 */
export function baroqueChurch(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const win: WindowSpec = { kind: "round", frame: "trim", border: 0.28, glass: "glass", sill: "trim" };
  const TZ = 5.9; // the tower's centre z
  const front = faceZ(9.1, 1); // the facade core's front

  m.scope("terrace", () => {
    m.scope("platform", () => {
      m.box("stone", 0, -3.8, 18.5, 31.0, 0, 2.65, 0, false);
      m.box("stone", 0, -3.8, 19.3, 31.8, 2.65, 3.0);
    });
    m.scope("stair", () => {
      // 20 risers of 15 cm from the street up to the 3 m terrace
      const tread = 7.65 / 19;
      for (let k = 0; k < 19; k++) m.box("stone", 0, 11.67 + tread * (k + 0.5), 6.4, tread, 0, 2.85 - 0.15 * k);
      const wall: Ring = [[11.1, 0], [19.7, 0], [19.7, 0.9], [12.0, 3.3], [11.1, 3.3]];
      for (const s of [-1, 1]) m.sweep("stone", "x", wall, s * 3.2, wall, s * 3.9);
    });
    m.scope("stair statues", () => {
      for (const s of [-1, 1]) {
        m.box("trim", s * 3.55, 11.65, 1.0, 1.0, 3.3, 4.9);
        m.box("trim", s * 3.55, 11.65, 1.2, 1.2, 4.9, 5.1);
        statue(m, "trim", s * 3.55, 11.65, 5.1, 1.9);
      }
    });
  });

  m.scope("nave", () => {
    m.scope("walls", () => m.box("plaster", 0, -4.3, 12, 16, 3, 14, 0, false));
    m.scope("cornice", () => m.box("trim", 0, -4.3, 12.9, 16.9, 13.85, 14.55));
    m.scope("roof", () => ridgeRoofZ(m, "slate", -6.6, 6.6, 14.5, 17.9, -12.3, 4.0));
    m.scope("pilasters", () => {
      for (const s of [-1, 1]) {
        for (const z of [1.7, -2.5, -6.7]) m.box("trim", s * 6.12, z, 0.4, 0.9, 3, 13.85, 0, false);
        m.box("trim", s * 6.15, -11.7, 0.4, 1.5, 3, 13.85, 0, false);
      }
    });
    m.scope("windows", () => {
      for (const s of [-1, 1]) {
        const f = faceX(s * 6, s);
        for (const z of [-0.8, -5.0, -9.2]) windowOn(m, f, uOf(f, s * 6, z), 8.36, 1.9, 4.2, win);
      }
    });
  });

  m.scope("apse", () => {
    m.scope("walls", () => m.prism("plaster", apseRing(0, -12.3, 6, 12, -1, 0.5), 3, 14, false));
    m.scope("cornice", () => m.prism("trim", apseRing(0, -12.3, 6.5, 12, -1, 0.6), 13.85, 14.55));
    m.scope("roof", () => m.loft("slate", apseRing(0, -12.3, 6.5, 12, -1, 0.7), 14.5, apseRing(0, -12.3, 0, 12, -1, 0.7), 17.9, false));
  });

  m.scope("facade", () => {
    m.scope("walls", () => {
      m.box("plaster", 0, 6.3, 9.4, 5.6, 3, 18.5, 0, false);
      for (const s of [-1, 1]) m.box("plaster", s * 6.2, 5.6, 3.6, 4.2, 3, 12.15, 0, false);
    });
    m.scope("cornices", () => {
      for (const s of [-1, 1]) m.box("trim", s * 6.2, 5.6, 4.2, 4.8, 12.15, 12.85);
      m.box("trim", 0, 9.25, 9.6, 0.7, 12.15, 12.85);
      m.box("trim", 0, 6.3, 10.6, 6.6, 18.5, 19.3);
      m.box("trim", 0, 6.3, 9.8, 5.9, 19.3, 19.75);
    });
    m.scope("pilasters", () => {
      for (const s of [-1, 1]) {
        for (const x of [3.2, 4.3]) m.box("trim", s * x, 9.25, 1.0, 0.5, 3, 18.5, 0, false);
        m.box("trim", s * 7.3, 7.85, 0.9, 0.5, 3, 12.15, 0, false);
      }
    });
    m.scope("volutes", () => {
      for (const s of [-1, 1]) {
        const n = 6;
        const yOf = (u: number) => 12.85 + 4.55 * (1 - Math.sqrt(1 - u * u));
        for (let i = 0; i < n; i++) {
          const u0 = i / n;
          const u1 = (i + 1) / n;
          const xa = s * (8.0 - 3.5 * u0);
          const xb = s * (8.0 - 3.5 * u1);
          const sec: Ring = [[xa, 12.8], [xb, 12.8], [xb, yOf(u1)], [xa, yOf(u0)]];
          m.sweep("trim", "z", sec, 4.8, sec, 7.7);
        }
        const curl = ngon(8, 0.5, 0, s * 7.55, 13.35).map(([x, y]): [number, number] => [x, y]);
        m.sweep("trim", "z", curl, 4.7, curl, 7.8);
      }
    });
    m.scope("obelisks", () => {
      for (const s of [-1, 1]) {
        m.box("trim", s * 7.55, 7.3, 0.9, 0.9, 12.85, 13.6);
        m.spire("slate", rect(0.6, 0.6, s * 7.55, 7.3), 13.6, 15.9);
      }
    });
    m.scope("portal", () => {
      // a 2.2 x 4.2 m door on a one-riser step, a hood above it, a window over the hood
      m.box("stone", 0, 9.95, 6.2, 1.7, 3, 3.18);
      panel(m, "trim", front, roundArch(0, 3.2, 3.18, 4.9, 10), -0.05, 0.25);
      panel(m, "slate", front, roundArch(0, 2.2, 3.2, 4.2, 10), 0.15, 0.33);
      m.box("trim", 0, 9.4, 4.2, 1.0, 8.2, 8.75);
      windowOn(m, front, 0, 9.4, 1.6, 2.0, win);
    });
    m.scope("niche", () => {
      panel(m, "glass", front, roundArch(0, 2.2, 13.0, 3.4, 8), -0.05, 0.12);
      m.box("trim", 0, 9.45, 1.6, 0.7, 12.85, 13.1);
      statue(m, "trim", 0, 9.5, 13.1, 2.5);
      m.box("trim", 0, 9.4, 3.2, 0.9, 16.6, 17.0);
    });
  });

  m.scope("tower", () => {
    const c = 2.26;
    m.scope("shaft", () => {
      m.prism("trim", chamferedRect(8.3, 8.3, c + 0.2, 0, TZ), 19.75, 20.4);
      m.prism("plaster", chamferedRect(7.66, 7.66, c, 0, TZ), 20.4, 26.8, false);
      m.prism("trim", chamferedRect(8.68, 8.68, c + 0.25, 0, TZ), 26.8, 27.55);
      m.prism("trim", chamferedRect(8.4, 8.4, c + 0.2, 0, TZ), 27.55, 27.95);
    });
    m.scope("corner pilasters", () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const d = 3.83 - c / 2 + 0.05;
        m.box("trim", sx * d, TZ + sz * d, 1.7, 0.5, 20.4, 26.8, sx * sz * Math.PI / 4, false);
      }
    });
    m.scope("windows", () => {
      const faces = [faceZ(TZ + 3.83, 1), faceZ(TZ - 3.83, -1), faceX(3.83, 1, TZ), faceX(-3.83, -1, TZ)];
      for (const f of faces) windowOn(m, f, 0, 21.86, 1.9, 4.0, win);
    });
  });

  m.scope("cap", () => {
    m.scope("dome", () => {
      // a flared skirt, then a quarter ellipse up to the lantern's neck
      const prof: P2[] = [[4.3, 27.95], [4.6, 28.5]];
      for (let i = 1; i <= 8; i++) {
        const a = (i / 8) * 1.33;
        prof.push([4.6 * Math.cos(a), 28.8 + 5.6 * Math.sin(a)]);
      }
      prof.push([1.05, 34.6]);
      lathe(m, "slate", 0, TZ, prof, 20);
    });
    m.scope("lantern", () => {
      m.prism("trim", ngon(8, 1.55, Math.PI / 8, 0, TZ), 34.48, 34.83);
      m.prism("plaster", ngon(8, 1.05, Math.PI / 8, 0, TZ), 34.83, 37.28, false);
      const ap = 1.05 * Math.cos(Math.PI / 8);
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        const nx = Math.cos(a);
        const nz = -Math.sin(a);
        panel(m, "glass", face(nx * ap, TZ + nz * ap, nx, nz), roundArch(0, 0.55, 35.1, 1.8, 6), -0.05, 0.06);
      }
      m.prism("trim", ngon(8, 1.5, Math.PI / 8, 0, TZ), 37.28, 37.63);
      lathe(m, "slate", 0, TZ, [[1.25, 37.63], [1.3, 38.0], [1.0, 38.55], [0.5, 39.1], [0.18, 39.5]], 12, 0, true);
    });
    m.scope("finial", () => {
      m.prism("gold", ngon(6, 0.09, 0, 0, TZ), 39.45, 40.35);
      crossFinial(m, "gold", "gold", 0, TZ, 40.3, 2.0, 0.3);
    });
  });
  return m;
}

/**
 * A gabled dormer (lucarne) on a spire face: a sandstone body with a window,
 * under a slate pitched roof, its ridge running out along the face's normal.
 * `axis` and `sign` give the normal, (cx, cz) the spire's axis, `a0..a1` how far
 * out from that axis the dormer runs.
 */
function dormer(m: MeshBuilder, axis: "x" | "z", sign: number, cx: number, cz: number, a0: number, a1: number, y0: number): void {
  m.scope("lucarne", () => {
    const c = axis === "z" ? cx : cz; // the across coordinate's centre
    const o = axis === "z" ? cz : cx; // the along coordinate's centre
    const w = 0.95;
    const body: Ring = [[c - w, y0], [c + w, y0], [c + w, y0 + 1.5], [c, y0 + 2.85], [c - w, y0 + 1.5]];
    m.sweep("sandstone", axis, body, o + sign * a0, body, o + sign * a1);
    for (const e of [-1, 1]) {
      const plate: Ring = [[c + e * (w + 0.15), y0 + 1.38], [c, y0 + 2.9], [c, y0 + 3.15], [c + e * (w + 0.15), y0 + 1.63]];
      m.sweep("spireSlate", axis, plate, o + sign * a0, plate, o + sign * (a1 + 0.2));
    }
    const f = axis === "z" ? faceZ(o + sign * a1, sign, c) : faceX(o + sign * a1, sign, c);
    panel(m, "leadGlass", f, pointedArch(0, 0.7, y0 + 0.35, 1.6, 0.8, 3), -0.05, 0.06);
  });
}

/**
 * The neo-Gothic church in Vrchlabi: a tall red-sandstone front tower with a
 * pointed portal, a big traceried window, a clock stage and a louvred belfry,
 * under an octagonal slate spire with four corner pinnacles and lucarnes; a nave
 * with lean-to aisles, buttresses and pointed windows, and a polygonal apse.
 * The tower front faces -z.
 */
export function churchVrchlabi(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const TZ = -15.83; // the tower's centre z
  const gothic: WindowSpec = { kind: "pointed", frame: "brickDark", border: 0.3, glass: "leadGlass", sill: "sandstone", k: 0.85 };

  /** A pointed window with `mullions` stone mullions and a transom. */
  const tracery = (f: Face, cu: number, y0: number, w: number, h: number, mullions: number): void => {
    windowOn(m, f, cu, y0, w, h, gothic);
    m.scope("tracery", () => {
      for (let i = 1; i <= mullions; i++) {
        const u = cu - w / 2 + (i * w) / (mullions + 1);
        panel(m, "brickDark", f, rectOutline(u - 0.1, u + 0.1, y0 + 0.02, y0 + h - w * 0.55), 0.1, 0.2);
      }
      panel(m, "brickDark", f, rectOutline(cu - w / 2 + 0.02, cu + w / 2 - 0.02, y0 + h * 0.5 - 0.09, y0 + h * 0.5 + 0.09), 0.1, 0.2);
    });
  };

  m.scope("tower", () => {
    m.scope("shaft", () => {
      m.box("brickDark", 0, TZ, 9.8, 9.8, 0, 2.2);
      m.box("brick", 0, TZ, 9.0, 9.0, 2.2, 20.2, 0, false);
      m.box("sandstone", 0, TZ, 9.5, 9.5, 20.2, 20.75);
      m.box("brick", 0, TZ, 8.7, 8.7, 20.75, 28.75, 0, false);
      m.box("sandstone", 0, TZ, 9.2, 9.2, 28.75, 29.3);
      m.box("brick", 0, TZ, 8.5, 8.5, 29.3, 36.7, 0, false);
      m.box("brickDark", 0, TZ, 9.6, 9.6, 36.7, 37.6);
    });
    m.scope("corner buttresses", () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = sx * 4.15;
        const z = TZ + sz * 4.15;
        m.box("brickDark", x, z, 1.9, 1.9, 0, 34.8);
        m.box("sandstone", x, z, 2.1, 2.1, 20.2, 20.75);
        m.box("sandstone", x, z, 2.1, 2.1, 28.75, 29.3);
      }
    });
    m.scope("belfry", () => {
      const faces = [faceZ(TZ - 4.25, -1), faceZ(TZ + 4.25, 1), faceX(-4.25, -1, TZ), faceX(4.25, 1, TZ)];
      for (const f of faces) {
        for (const cu of [-1.35, 1.35]) {
          m.scope("opening", () => {
            panel(m, "brickDark", f, pointedArch(cu, 2.2, 30.2, 6.1, 0.85, 4), -0.05, 0.12);
            panel(m, "iron", f, pointedArch(cu, 1.64, 30.22, 5.63, 0.85, 4), 0.04, 0.15);
            for (let k = 0; k < 6; k++) {
              const y = 30.9 + k * 0.62;
              panel(m, "louver", f, rectOutline(cu - 0.73, cu + 0.73, y, y + 0.4), 0.1, 0.2);
            }
          });
        }
      }
    });
    m.scope("clocks", () => {
      const faces = [faceZ(TZ - 4.35, -1), faceX(-4.35, -1, TZ), faceX(4.35, 1, TZ)];
      for (const f of faces) clockOn(m, f, 0, 24.6, 1.95, "sandstone", "dial", "iron", 20);
    });
    m.scope("west window", () => tracery(faceZ(TZ - 4.5, -1), 0, 10.75, 3.7, 7.25, 2));
    m.scope("portal", () => {
      const f = faceZ(TZ - 4.5, -1);
      panel(m, "brickDark", f, pointedArch(0, 4.6, 1.1, 7.4, 0.8, 5), -0.05, 1.6);
      panel(m, "sandstone", f, pointedArch(0, 3.4, 1.12, 6.48, 0.8, 5), 1.0, 1.65);
      panel(m, "wood", f, rectOutline(-1.38, 1.38, 1.14, 5.6), 1.55, 1.7);
      panel(m, "iron", f, rectOutline(-0.05, 0.05, 1.17, 5.5), 1.65, 1.74);
      m.scope("gable", () => {
        const g: P2[] = [[-3.2, 8.0], [3.2, 8.0], [0, 10.7]];
        panel(m, "sandstone", f, g, 1.2, 1.7);
        panel(m, "sandstone", f, rectOutline(-0.3, 0.3, 10.4, 11.9), 1.4, 1.95);
      });
    });
    m.scope("steps", () => {
      for (let k = 0; k < 4; k++) m.box("paving", 0, -24.78 + k * 0.95, 10.5 - 0.4 * k, 1.1, 0, 0.32 * (k + 1));
    });
  });

  m.scope("spire", () => {
    m.box("brickDark", 0, TZ, 7.6, 7.6, 37.6, 38.75, 0, false);
    m.spire("spireSlate", ngon(8, 4.62 / Math.cos(Math.PI / 8), Math.PI / 8, 0, TZ), 38.75, 59.25);
    m.scope("lucarnes", () => {
      dormer(m, "z", -1, 0, TZ, 2.6, 4.75, 40.1);
      dormer(m, "z", 1, 0, TZ, 2.6, 4.75, 40.1);
      dormer(m, "x", -1, 0, TZ, 2.6, 4.75, 40.1);
      dormer(m, "x", 1, 0, TZ, 2.6, 4.75, 40.1);
    });
    m.scope("pinnacles", () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = sx * 3.95;
        const z = TZ + sz * 3.95;
        m.box("brickDark", x, z, 1.9, 1.9, 37.6, 40.0);
        m.prism("sandstone", ngon(8, 1.1, Math.PI / 8, x, z), 40.0, 41.6);
        m.spire("spireSlate", ngon(8, 0.95, Math.PI / 8, x, z), 41.6, 46.9);
        ball(m, "sandstone", x, 47.0, z, 0.2, 6);
      }
    });
    m.scope("finial", () => crossFinial(m, "iron", "iron", 0, TZ, 58.98, 3.32, 0.32));
  });

  m.scope("nave", () => {
    const roofX = 8.2;
    m.scope("walls", () => {
      const g = gableSection(-7.5, 7.5, 0, -roofX, roofX, 15.5, 24.4);
      m.sweep("brick", "z", g, -11.83, g, 18.17);
      m.box("brickDark", 0, 2.35, 15.7, 28.5, 0, 2.0);
      m.box("sandstone", 0, 3.1, 15.6, 29.7, 14.7, 15.2);
    });
    m.scope("roof", () => roofPlatesZ(m, "spireSlate", -roofX, roofX, 15.5, 24.4, -12.28, 18.62, 0.3));
  });

  m.scope("aisles", () => {
    for (const s of [-1, 1]) {
      m.scope(s < 0 ? "west aisle" : "east aisle", () => {
        const wall: Ring = [[s * 7.25, 0], [s * 11.05, 0], [s * 11.05, 9.06], [s * 7.25, 12.95]];
        m.sweep("brick", "z", wall, -11.83, wall, 14.77);
        m.box("brickDark", s * 9.155, 1.465, 4.25, 26.45, 0, 1.8);
        const roof: Ring = [[s * 11.5, 8.65], [s * 6.95, 13.3], [s * 6.95, 13.6], [s * 11.5, 8.95]];
        m.sweep("spireSlate", "z", roof, -11.95, roof, 14.9);
        m.scope("buttresses", () => {
          for (const z of [-8.83, -3.68, 1.47, 6.62, 11.77]) {
            m.box("brickDark", s * 11.5, z, 1.0, 1.5, 0, 8.6);
            const cap: Ring = [[s * 10.83, 8.6], [s * 12.17, 8.6], [s * 10.83, 10.0]];
            m.sweep("sandstone", "z", cap, z - 0.67, cap, z + 0.67);
          }
        });
        m.scope("windows", () => {
          const f = faceX(s * 11.05, s);
          for (const z of [-6.26, -1.11, 4.04, 9.19]) tracery(f, uOf(f, s * 11.05, z), 2.6, 1.43, 4.1, 1);
        });
      });
    }
  });

  m.scope("front bays", () => {
    for (const s of [-1, 1]) {
      m.scope(s < 0 ? "west bay" : "east bay", () => {
        m.box("brick", s * 6.85, TZ, 5.1, 8.2, 0, 10.6, 0, false);
        m.box("brickDark", s * 6.85, TZ, 5.6, 8.6, 0, 1.9);
        m.spire("spireSlate", rect(9.18, 9.18, s * 6.85, TZ), 10.5, 15.1);
        const front = faceZ(TZ - 4.1, -1);
        tracery(front, uOf(front, s * 6.85, 0), 2.9, 1.62, 4.9, 1);
        const side = faceX(s * 9.4, s);
        tracery(side, uOf(side, s * 9.4, -15.23), 2.9, 1.33, 4.3, 1);
      });
    }
  });

  m.scope("apse", () => {
    const ring: Ring = [[-7.5, 11.67], [-7.5, 18.5], [-4.3, 24.66], [4.3, 24.66], [7.5, 18.5], [7.5, 11.67]];
    m.scope("walls", () => {
      m.prism("brick", ring, 0, 13.5, false);
      m.prism("brickDark", [[-7.85, 11.4], [-7.85, 18.4], [-4.5, 24.97], [4.5, 24.97], [7.85, 18.4], [7.85, 11.4]], 0, 1.9);
    });
    m.scope("roof", () => {
      const y = 13.4;
      const e: Vec3[] = [[-8.1, y, 11.15], [-8.1, y, 18.35], [-4.65, y, 25.18], [4.65, y, 25.18], [8.1, y, 18.35], [8.1, y, 11.15]];
      const r0: Vec3 = [0, 19.7, 11.15];
      const r1: Vec3 = [0, 19.7, 19.4];
      const inside: Vec3 = [0, 12, 17];
      triOut(m, "spireSlate", e[0]!, e[1]!, r1, inside);
      triOut(m, "spireSlate", e[0]!, r1, r0, inside);
      triOut(m, "spireSlate", e[1]!, e[2]!, r1, inside);
      triOut(m, "spireSlate", e[2]!, e[3]!, r1, inside);
      triOut(m, "spireSlate", e[3]!, e[4]!, r1, inside);
      triOut(m, "spireSlate", e[4]!, e[5]!, r1, inside);
      triOut(m, "spireSlate", e[5]!, r0, r1, inside);
    });
    m.scope("windows", () => {
      const diag = (x0: number, z0: number, x1: number, z1: number): Face => face((x0 + x1) / 2, (z0 + z1) / 2, -(z1 - z0), x1 - x0);
      tracery(diag(-7.5, 18.5, -4.3, 24.66), 0, 3.4, 1.4, 5.9, 1);
      tracery(faceZ(24.66, 1), 0, 3.4, 1.4, 5.9, 1);
      tracery(diag(4.3, 24.66, 7.5, 18.5), 0, 3.4, 1.4, 5.9, 1);
    });
  });
  return m;
}

/**
 * One tower of the twin-tower church about (cx, cz): pilastered stucco shaft in
 * three storeys, a door and a window, louvred arched belfry openings, clocks in
 * the attic storey, corner urns, and the copper cap -- drum, onion, open
 * lantern, a second small onion and a tall needle spire with a gilt ball and cross.
 */
function baroqueTower(m: MeshBuilder, cx: number, cz: number, outer: number): void {
  const h = 3.5; // the shaft's half width
  const faces = [faceZ(cz + h, 1, cx), faceZ(cz - h, -1, cx), faceX(cx + h, 1, cz), faceX(cx - h, -1, cz)];
  m.scope("shaft", () => {
    m.box("plinth", cx, cz, 8.0, 8.0, 0, 1.4);
    m.box("stucco", cx, cz, 7.0, 7.0, 1.4, 30.0, 0, false);
    m.box("dressing", cx, cz, 8.1, 8.1, 15.05, 15.75);
    m.box("dressing", cx, cz, 7.9, 7.9, 24.35, 24.85);
    m.box("dressing", cx, cz, 8.6, 8.6, 28.8, 29.8);
    m.box("dressing", cx, cz, 7.7, 7.7, 29.8, 30.65);
  });
  m.scope("pilasters", () => {
    for (const s of [-1, 1]) for (const t of [-1, 1]) {
      m.box("dressing", cx + t * 2.75, cz + s * 3.55, 1.6, 0.8, 1.4, 28.8, 0, false);
      m.box("dressing", cx + s * 3.55, cz + t * 2.75, 0.8, 1.6, 1.4, 28.8, 0, false);
    }
  });
  m.scope("door", () => {
    const f = faces[0]!;
    panel(m, "dressing", f, roundArch(0, 2.7, 0.78, 4.85, 8), -0.05, 0.2);
    panel(m, "oak", f, roundArch(0, 2.0, 1.0, 4.4, 8), 0.1, 0.3);
  });
  m.scope("windows", () => {
    const win: WindowSpec = { kind: "round", frame: "dressing", border: 0.28, glass: "darkGlass", sill: "dressing" };
    windowOn(m, faces[0]!, 0, 9.9, 1.5, 4.2, win);
    const side = faces[outer > 0 ? 2 : 3]!;
    windowOn(m, side, 0, 9.9, 1.5, 4.2, win);
  });
  m.scope("belfry", () => {
    for (const f of faces) {
      m.scope("opening", () => {
        panel(m, "dressing", f, roundArch(0, 3.5, 16.88, 7.15, 8), -0.05, 0.12);
        panel(m, "ironDark", f, roundArch(0, 2.6, 17.4, 6.3, 8), 0.04, 0.16);
        for (let k = 0; k < 4; k++) {
          const y = 18.0 + k * 1.05;
          panel(m, "dressing", f, rectOutline(-1.28, 1.28, y, y + 0.16), 0.1, 0.2);
        }
      });
    }
  });
  m.scope("clocks", () => {
    for (const f of faces) clockOn(m, f, 0, 26.9, 1.62, "dressing", "clockWhite", "ironDark", 20);
  });
  m.scope("urns", () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      lathe(m, "dressing", cx + sx * 3.4, cz + sz * 3.4, [[0.3, 30.65], [0.42, 30.85], [0.42, 31.1], [0.2, 31.3], [0.12, 31.52]], 8, 0, true);
    }
  });
  m.scope("cap", () => {
    const oct = (r: number) => ngon(8, r / Math.cos(Math.PI / 8), Math.PI / 8, cx, cz);
    m.scope("drum", () => {
      m.prism("copperBrown", oct(3.5), 30.65, 32.15, false);
      m.prism("copper", oct(3.62), 32.15, 32.45, false);
    });
    m.scope("onion", () => lathe(m, "copper", cx, cz, [
      [3.45, 32.42], [3.68, 33.0], [3.7, 33.6], [3.55, 34.4], [3.15, 35.2], [2.55, 36.0],
      [1.85, 36.8], [1.25, 37.5], [0.85, 38.15], [0.72, 38.5],
    ], 20, Math.PI / 20));
    m.scope("lantern", () => {
      m.prism("copperBrown", ngon(8, 0.75, Math.PI / 8, cx, cz), 38.35, 39.25, false);
      m.prism("copperBrown", oct(1.4), 39.15, 39.45);
      m.prism("ironDark", oct(1.0), 39.45, 41.45, false);
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        m.box("copper", cx + 1.15 * Math.cos(a), cz - 1.15 * Math.sin(a), 0.3, 0.3, 39.45, 41.45, a, false);
      }
      m.prism("copper", oct(1.6), 41.45, 41.75, false);
      lathe(m, "copper", cx, cz, [[1.3, 41.75], [1.5, 42.3], [1.4, 42.9], [0.95, 43.5], [0.5, 44.0], [0.38, 44.2]], 14);
    });
    m.scope("spire", () => {
      lathe(m, "copper", cx, cz, [[0.45, 44.05], [0.95, 44.5], [1.05, 45.2], [0.78, 46.1], [0.55, 47.2], [0.4, 50.3], [0.22, 53.4], [0.1, 55.4]], 12, 0, true);
      crossFinial(m, "ironDark", "gilt", cx, cz, 55.26, 2.75, 0.34);
    });
  });
}

/**
 * A white and cream twin-tower baroque church: a pilastered front with a
 * columned portal and a curved gable under a gilt cross between two towers with
 * green copper onion caps and needle spires; side porches, a nave with
 * clerestory windows over lean-to aisles, and a rounded apse. Faces +z.
 */
export function twinTowerBaroqueChurch(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const win: WindowSpec = { kind: "round", frame: "dressing", border: 0.28, glass: "darkGlass", sill: "dressing" };
  const front = faceZ(20.1, 1);

  m.scope("nave", () => {
    const g = gableSection(-7.5, 7.5, 0, -8.0, 8.0, 18.0, 22.3);
    m.scope("walls", () => {
      m.box("plinth", 0, 1.15, 16, 27.3, 0, 1.4);
      m.sweep("stucco", "z", g, -12.3, g, 14.5);
      m.box("dressing", 0, 1.1, 15.8, 27.0, 17.2, 18.0);
    });
    m.scope("roof", () => roofPlatesZ(m, "greyRoof", -8.0, 8.0, 18.0, 22.3, -12.6, 14.5, 0.3));
    m.scope("clerestory", () => {
      for (const s of [-1, 1]) {
        const f = faceX(s * 7.5, s);
        for (const z of [-9.6, -3.3, 3.0, 9.3]) windowOn(m, f, uOf(f, s * 7.5, z), 10.4, 1.7, 5.6, win);
      }
    });
  });

  m.scope("aisles", () => {
    for (const s of [-1, 1]) {
      m.scope(s < 0 ? "west aisle" : "east aisle", () => {
        m.box("plinth", s * 9.6, -1.2, 4.4, 20.5, 0, 1.2);
        m.box("stucco", s * 9.6, -1.2, 4.2, 20.0, 0, 9.5, 0, false);
        m.box("dressing", s * 9.6, -1.2, 4.8, 20.5, 9.48, 10.03);
        const roof: Ring = [[s * 12.05, 10.0], [s * 7.15, 11.9], [s * 7.15, 12.15], [s * 12.05, 10.25]];
        m.sweep("copper", "z", roof, -11.4, roof, 9.0);
        const f = faceX(s * 11.7, s);
        for (const z of [-7.2, -1.0, 5.2]) windowOn(m, f, uOf(f, s * 11.7, z), 3.2, 1.6, 4.4, win);
      });
    }
  });

  m.scope("apse", () => {
    const n = 15;
    m.scope("walls", () => {
      m.prism("plinth", apseRing(0, -16.2, 7.6, n, -1, 4.2), 0, 1.4);
      m.prism("stucco", apseRing(0, -16.2, 7.2, n, -1, 4.2), 1.4, 16.0, false);
      m.prism("dressing", apseRing(0, -16.2, 7.7, n, -1, 4.1), 15.35, 16.05);
    });
    m.scope("roof", () => {
      ridgeRoofZ(m, "greyRoof", -7.8, 7.8, 16.0, 22.2, -16.2, -12.0);
      m.loft("greyRoof", apseRing(0, -16.2, 7.8, n, -1, 0.3), 16.0, apseRing(0, -16.2, 0, n, -1, 0.3), 22.2, false);
    });
    m.scope("windows", () => {
      const ring = halfCircle(0, -16.2, 7.2, n, -1);
      for (const k of [4, 7, 10]) {
        const [x0, z0] = ring[k]!;
        const [x1, z1] = ring[k + 1]!;
        const f = face((x0 + x1) / 2, (z0 + z1) / 2, -(z1 - z0), x1 - x0);
        windowOn(m, f, 0, 8.0, 1.6, 5.4, win);
      }
    });
  });

  m.scope("facade", () => {
    m.scope("walls", () => {
      m.box("plinth", 0, 16.9, 12.7, 7.0, 0, 1.6);
      m.box("stucco", 0, 16.9, 11.5, 6.4, 1.6, 20.9, 0, false);
    });
    m.scope("cornices", () => {
      m.box("dressing", 0, 16.9, 12.4, 7.0, 9.1, 9.7);
      m.box("dressing", 0, 16.9, 12.8, 7.3, 15.15, 16.05);
      m.box("dressing", 0, 16.9, 13.0, 7.4, 20.9, 21.9);
    });
    m.scope("pilasters", () => {
      for (const s of [-1, 1]) {
        m.box("dressing", s * 4.9, 20.12, 1.2, 0.55, 1.6, 15.15, 0, false);
        m.box("dressing", s * 4.9, 20.12, 1.0, 0.5, 16.05, 20.9, 0, false);
        m.box("dressing", s * 3.6, 20.12, 0.8, 0.45, 9.7, 15.15, 0, false);
      }
    });
    m.scope("gable", () => {
      const arc = (y0: number, grow: number): Ring => {
        const pts: Ring = [[-6.0 - grow, y0], [6.0 + grow, y0]];
        const R = (6.0 * 6.0 + 2.6 * 2.6) / (2 * 2.6); // the circle through the gable's ends and crown
        const yc = 21.9 + 2.6 - R;
        const a0 = Math.asin(6.0 / R);
        for (let i = 0; i <= 8; i++) {
          const a = a0 - (i / 8) * 2 * a0;
          pts.push([(R + grow) * Math.sin(a), yc + (R + grow) * Math.cos(a)]);
        }
        return pts;
      };
      m.sweep("dressing", "z", arc(21.9, 0.3), 18.8, arc(21.9, 0.3), 20.25);
      m.sweep("stucco", "z", arc(21.95, 0), 19.0, arc(21.95, 0), 20.35);
      crossFinial(m, "gilt", "gilt", 0, 19.6, 24.75, 3.6, 0.33);
      for (const s of [-1, 1]) lathe(m, "gilt", s * 6.05, 19.6, [[0.3, 21.9], [0.5, 22.15], [0.5, 22.5], [0.25, 22.7], [0.12, 22.9]], 8, 0, true);
    });
    m.scope("portal", () => {
      panel(m, "dressing", front, rectOutline(-3.2, 3.2, 1.6, 8.6), -0.2, 0.7);
      panel(m, "oak", front, roundArch(0, 3.1, 1.62, 5.68, 10), 0.6, 0.8);
      for (const s of [-1, 1]) {
        m.prism("dressing", ngon(10, 0.46, 0, s * 2.55, 21.1), 1.6, 7.6, false);
        m.box("dressing", s * 2.55, 21.1, 1.2, 1.2, 7.6, 8.0);
      }
      m.box("dressing", 0, 20.85, 7.4, 1.9, 8.0, 8.7);
      const ped: Ring = [[-3.0, 8.7], [3.0, 8.7], [0, 10.0]];
      m.sweep("dressing", "z", ped, 19.95, ped, 21.45);
    });
    m.scope("windows", () => {
      windowOn(m, front, 0, 10.4, 1.6, 5.9, win);
      m.box("dressing", 0, 20.3, 4.4, 0.7, 16.83, 17.38);
      windowOn(m, front, 0, 17.65, 1.1, 3.3, win);
    });
    m.scope("steps", () => {
      for (let k = 0; k < 4; k++) m.box("plinth", 0, 20.3 + (0.9 * (k + 1)) / 2, 11.5 - 0.3 * k, 0.9 * (k + 1) + 0.1, 0, 1.6 - 0.34 * k);
    });
  });

  m.scope("west tower", () => baroqueTower(m, -8.85, 16.3, -1));
  m.scope("east tower", () => baroqueTower(m, 8.85, 16.3, 1));

  m.scope("side porches", () => {
    for (const s of [-1, 1]) {
      m.scope(s < 0 ? "west porch" : "east porch", () => {
        m.box("plinth", s * 13.95, 15.9, 3.8, 6.8, 0, 0.9);
        m.box("stucco", s * 13.95, 15.9, 3.6, 6.6, 0.9, 8.1, 0, false);
        m.box("dressing", s * 13.95, 15.9, 4.0, 7.0, 8.1, 8.6);
        hipRoof(m, "copper", s * 13.95, 15.9, 4.1, 7.0, 8.6, 10.1);
        const f = faceZ(19.2, 1, s * 13.95);
        panel(m, "dressing", f, roundArch(0, 2.3, 0.68, 4.25, 8), -0.05, 0.15);
        panel(m, "oak", f, roundArch(0, 1.6, 0.9, 3.8, 8), 0.08, 0.25);
        windowOn(m, f, 0, 5.7, 0.9, 1.5, win);
      });
    }
  });
  return m;
}

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const CHURCH_CATALOG: CatalogFields = {
  category: "Historical",
  group: "hist_center",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const CHURCHES: ProceduralDesign[] = [
  { id: "bld-baroque-church", title: "Baroque Church", build: baroqueChurch, references: "baroque-church", catalog: CHURCH_CATALOG },
  { id: "bld-church-vrchlabi", title: "Vrchlabi Church", build: churchVrchlabi, references: "church-vrchlabi", catalog: CHURCH_CATALOG },
  { id: "bld-twin-tower-baroque-church", title: "Twin-Tower Baroque Church", build: twinTowerBaroqueChurch, references: "twin-tower-baroque-church", catalog: CHURCH_CATALOG },
];
