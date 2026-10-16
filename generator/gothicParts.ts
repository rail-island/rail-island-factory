// Low-poly Gothic architecture. Local +Z is the west front; +Y is up.
// All details are geometry, including the glass, tracery and open belfries.
import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";

export const GOTHIC_PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#cbbfa7", roughness: 0.95 },
  trim: { color: "#e0d5bf", roughness: 0.9 },
  recess: { color: "#514e49", roughness: 1 },
  glass: { color: "#334b60", roughness: 0.35 },
  glassBlue: { color: "#547996", roughness: 0.4 },
  glassRed: { color: "#8c5052", roughness: 0.4 },
  roof: { color: "#626e72", roughness: 0.75, metallic: 0.15 },
  lead: { color: "#819092", roughness: 0.7, metallic: 0.2 },
  copper: { color: "#528b7c", roughness: 0.6, metallic: 0.25 },
  gold: { color: "#c3a14e", roughness: 0.4, metallic: 0.65 },
  door: { color: "#59473c", roughness: 0.9 },
};

type Pt = [number, number];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(...a) || 1));

/** A two-centred pointed arch, from left springer to crown to right springer. */
function arch(w: number, spring: number, rise: number, steps = 4): Pt[] {
  // Circular arcs meeting at the crown, with centres on the spring line.
  const h = w / 2;
  const c = (rise * rise - h * h) / (2 * h);
  const r = h + c;
  const angle = Math.atan2(rise, c);
  const left: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI - angle * i / steps;
    left.push([c + r * Math.cos(t), spring + r * Math.sin(t)]);
  }
  return [...left, ...left.slice(0, -1).reverse().map(([x, y]): Pt => [-x, y])];
}

/** A local coordinate facade: normal (sin(face), 0, cos(face)). */
export class Gothic {
  constructor(readonly m: MeshBuilder, private readonly turn = 0, private readonly offsetX = 0) {}
  p([x, y, z]: Vec3): Vec3 {
    return [x * Math.cos(this.turn) + z * Math.sin(this.turn) + this.offsetX, y, -x * Math.sin(this.turn) + z * Math.cos(this.turn)];
  }
  ring(r: Ring): Ring { return r.map(([x, z]) => { const p = this.p([x, 0, z]); return [p[0], p[2]]; }); }
  box(mat: string, x: number, z: number, w: number, d: number, y0: number, y1: number, face = 0, top = true): void {
    const p = this.p([x, 0, z]);
    this.m.box(mat, p[0], p[2], w, d, y0, y1, face + this.turn, top);
  }
  loft(mat: string, a: Ring, y0: number, b: Ring, y1: number, top = true): void {
    this.m.loft(mat, this.ring(a), y0, this.ring(b), y1, top);
  }
  spire(mat: string, r: Ring, y0: number, y1: number): void { this.m.spire(mat, this.ring(r), y0, y1); }
  slab(mat: string, pts: Vec3[], depth: Vec3): void {
    const zero = this.p([0, 0, 0]);
    this.m.slab(mat, pts.map(p => this.p(p)), sub(this.p(depth), zero));
  }
  beam(mat: string, a: Vec3, b: Vec3, w: number, d = w): void {
    const dir = unit(sub(b, a));
    const u = unit(cross(dir, Math.abs(dir[1]) < 0.95 ? [0, 1, 0] : [0, 0, 1]));
    const v = cross(dir, u);
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, t]) => add(a, add(mul(u, s! * w / 2), mul(v, t! * d / 2))));
    this.slab(mat, pts, sub(b, a));
  }
  at(x: number, z: number, face: number, u: number, y: number, out = 0): Vec3 {
    return [x + u * Math.cos(face) + out * Math.sin(face), y, z - u * Math.sin(face) + out * Math.cos(face)];
  }
  panel(mat: string, x: number, z: number, face: number, pts: Pt[], out: number): void {
    // Convex front and reveal only: the back is buried inside its host wall.
    const front = pts.map(([u, y]) => this.p(this.at(x, z, face, u, y, out)));
    const normal: Vec3 = [Math.sin(face + this.turn), 0, Math.cos(face + this.turn)];
    const triangles: Vec3[] = [];
    for (let i = 1; i + 1 < front.length; i++) triangles.push(front[0]!, front[i]!, front[i + 1]!);
    this.m.facets(mat, triangles, normal);
    const center: Pt = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const a = front[i]!, b = front[j]!;
      const c = sub(b, mul(normal, 2 * out + 0.23)), d = sub(a, mul(normal, 2 * out + 0.23));
      const du = (pts[i]![0] + pts[j]![0]) / 2 - center[0];
      const dy = (pts[i]![1] + pts[j]![1]) / 2 - center[1];
      this.m.facets(mat, [a, b, c, a, c, d], [du * Math.cos(face + this.turn), dy, -du * Math.sin(face + this.turn)]);
    }
  }
  line(mat: string, x: number, z: number, face: number, pts: Pt[], out: number, w: number): void {
    // Facade tracery is a raised ribbon, not a many-sided structural beam.
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i]!, b = pts[i + 1]!;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const du = -(b[1] - a[1]) / len * w / 2, dy = (b[0] - a[0]) / len * w / 2;
      const p = (v: Pt, s: number): Vec3 => this.p(this.at(x, z, face, v[0] + s * du, v[1] + s * dy, out));
      this.m.facets(mat, [p(a, -1), p(b, -1), p(b, 1), p(a, -1), p(b, 1), p(a, 1)], [Math.sin(face + this.turn), 0, Math.cos(face + this.turn)]);
    }
  }
  /** Framed lancet with paired lights and a small circular tracery eye. */
  window(x: number, z: number, face: number, w: number, y0: number, y1: number, ornate = true): void {
    this.m.scope("lancet window", () => {
      const spring = y1 - w * 0.7;
      this.panel("trim", x, z, face, [[-w / 2, y0], ...arch(w, spring, w * 0.7), [w / 2, y0]], 0.16);
      const inner = w - 0.55;
      this.panel("glass", x, z, face, [[-inner / 2, y0 + 0.3], ...arch(inner, spring - 0.12, inner * 0.7), [inner / 2, y0 + 0.3]], 0.20);
      this.line("trim", x, z, face, [[0, y0 + 0.31], [0, spring - w * 0.22]], 0.29, 0.13);
      this.line("trim", x, z, face, [[-inner / 2, y0 + (spring - y0) * 0.45], [inner / 2, y0 + (spring - y0) * 0.45]], 0.30, 0.12);
      if (ornate) {
        for (const side of [-1, 1]) {
          const pts = arch(inner / 2 - 0.14, spring - w * 0.4, w * 0.31, 3).map(([u, y]): Pt => [u + side * inner / 4, y]);
          this.line("trim", x, z, face, pts, 0.30, 0.12);
        }
        this.circle(x, z, face, 0, spring + w * 0.11, w * 0.15, 0.09, 0.30, "trim", 10);
      }
      this.box("trim", x, z, w + 0.28, 0.65, y0 - 0.18, y0 - 0.02, face);
    });
  }
  circle(x: number, z: number, face: number, u: number, y: number, r: number, width: number, out: number, mat = "trim", n = 32): void {
    // Annular front ribbon; the wall/frame underneath supplies its depth.
    const pt = (a: number, rr: number, o: number): Vec3 => this.at(x, z, face, u + Math.cos(a) * rr, y + Math.sin(a) * rr, o);
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n, b = (i + 1) * 2 * Math.PI / n;
      const p = [pt(a, r, out), pt(b, r, out), pt(b, r - width, out), pt(a, r - width, out)].map(v => this.p(v));
      this.m.facets(mat, [p[0]!, p[1]!, p[2]!, p[0]!, p[2]!, p[3]!], [Math.sin(face + this.turn), 0, Math.cos(face + this.turn)]);
    }
  }
  rose(x: number, z: number, face: number, y: number, r: number): void {
    this.m.scope("rose window", () => {
      const disc = (radius: number): Pt[] => Array.from({ length: 40 }, (_, i) => [radius * Math.cos(i * Math.PI / 20), y + radius * Math.sin(i * Math.PI / 20)]);
      this.panel("trim", x, z, face, disc(r + 0.45), 0.25);
      this.panel("glass", x, z, face, disc(r), 0.30);
      this.circle(x, z, face, 0, y, r, 0.18, 0.47);
      this.circle(x, z, face, 0, y, r * 0.38, 0.13, 0.48, "trim", 24);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        const pt = (rr: number, b = a): Pt => [rr * Math.cos(b), y + rr * Math.sin(b)];
        this.line("trim", x, z, face, [pt(r * 0.38), pt(r * 0.94)], 0.47, 0.12);
        const center = pt(r * 0.7, a + Math.PI / 12);
        this.circle(x, z, face, center[0], center[1], r * 0.16, 0.10, 0.48, "trim", 8);
        this.panel(i % 2 ? "glassBlue" : "glassRed", x, z, face, [pt(r * 0.43, a + 0.05), pt(r * 0.81, a + 0.08), pt(r * 0.81, a + Math.PI / 6 - 0.08), pt(r * 0.43, a + Math.PI / 6 - 0.05)], 0.34);
      }
      this.circle(x, z, face, 0, y, r * 0.16, 0.10, 0.47, "trim", 12);
    });
  }
  portal(x: number, z: number, face: number, w: number, h: number): void {
    this.m.scope("sculpted portal", () => {
      for (let i = 0; i < 3; i++) {
        const width = w - i * 0.8, y0 = 0.35 + i * 0.1;
        this.panel(i === 1 ? "recess" : "trim", x, z, face, [[-width / 2, y0], ...arch(width, h - w * 0.7, width * 0.7), [width / 2, y0]], 0.25 + i * 0.18);
      }
      const width = w - 2.3;
      this.panel("door", x, z, face, [[-width / 2, 0.7], ...arch(width, h - w * 0.7 - 0.3, width * 0.7), [width / 2, 0.7]], 0.84);
      this.line("trim", x, z, face, [[0, 0.7], [0, h * 0.54]], 1.0, 0.28);
      this.line("trim", x, z, face, [[-width / 2, h * 0.54], [width / 2, h * 0.54]], 1.0, 0.3);
      for (let i = 0; i < 5; i++) {
        const p = this.at(x, z, face, (i - 2) * width / 5, h * 0.64, 1.0);
        this.statue(p[0], p[2], p[1], 0.9);
      }
    });
  }
  statue(x: number, z: number, y: number, h: number): void {
    this.loft("trim", ngon(5, h * 0.18, 0, x, z), y, ngon(5, h * 0.10, 0, x, z), y + h * 0.75);
    this.loft("trim", ngon(6, h * 0.10, 0, x, z), y + h * 0.78, ngon(6, h * 0.11, 0, x, z), y + h * 0.96);
    this.spire("trim", ngon(6, h * 0.11, 0, x, z), y + h * 0.96, y + h * 1.07);
  }
  pinnacle(x: number, z: number, y: number, h = 7, r = 0.6): void {
    this.m.scope("pinnacle", () => {
      this.box("stone", x, z, r * 1.7, r * 1.7, y, y + h * 0.4);
      this.box("trim", x, z, r * 2.1, r * 2.1, y + h * 0.4, y + h * 0.46);
      this.spire("stone", rect(r * 2, r * 2, x, z), y + h * 0.46, y + h);
      for (const t of [0.58, 0.73, 0.86]) {
        const rr = r * (1 - t) * 2.3;
        this.box("trim", x, z, rr * 2, rr * 2, y + h * t, y + h * t + 0.16);
      }
    });
  }
  cross(x: number, z: number, y: number, h: number): void {
    this.box("gold", x, z, 0.13, 0.13, y, y + h);
    this.box("gold", x, z, h * 0.55, 0.15, y + h * 0.64, y + h * 0.64 + 0.14);
  }
  roof(x: number, z: number, w: number, d: number, eave: number, ridge: number, across = false): void {
    const pts: Vec3[] = [[x - w / 2, eave, z + d / 2], [x + w / 2, eave, z + d / 2], [x, ridge, z + d / 2]];
    if (!across) this.slab("roof", pts, [0, 0, -d]);
    else this.slab("roof", [[x + w / 2, eave, z - d / 2], [x + w / 2, eave, z + d / 2], [x + w / 2, ridge, z]], [-w, 0, 0]);
  }
  /** Curved flying arch with an open underside, from outer pier to clerestory. */
  flying(x: number, z: number, nx: number, nz: number, length: number, y0: number, y1: number): void {
    this.m.scope("flying buttress", () => {
      for (let i = 0; i < 8; i++) {
        const a = i / 8, b = (i + 1) / 8;
        const p = (t: number, dy: number): Vec3 => [x - nx * length * t, y0 + (y1 - y0) * Math.sqrt(t) + dy, z - nz * length * t];
        const pts = [p(a, 0), p(b, 0), p(b, 0.8), p(a, 0.8)].map(v => add(v, [-nz * 0.48, 0, nx * 0.48]));
        this.slab("stone", pts, [nz * 0.96, 0, -nx * 0.96]);
      }
    });
  }
  buttress(x: number, z: number, face: number, top: number): void {
    this.m.scope("stepped buttress", () => {
      this.box("stone", x, z, 1.65, 3.0, 0.1, top * 0.55, face);
      this.box("stone", x, z, 1.35, 2.5, top * 0.55, top * 0.83, face);
      this.box("stone", x, z, 1.08, 1.9, top * 0.83, top, face);
      for (const y of [top * 0.55, top * 0.83, top]) this.box("trim", x, z, 1.7, 2.6, y - 0.1, y + 0.16, face);
      this.pinnacle(x, z, top + 0.16, 5.6, 0.58);
    });
  }
}
