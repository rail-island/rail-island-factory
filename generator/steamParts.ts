// The static parts of the steam locomotives and tenders (steamLocos.ts): a
// builder that places boilers, smokeboxes, chimneys, domes, cabs, tanks, coal,
// running boards, smoke deflectors, buffer beams, lamps and number plates in
// vlakosimdb source coordinates -- x from the front buffer growing rearward, y
// up from the rail, z across (+z the right side) -- while drawing in the
// Factory's frame, where X = xc - x points forward.
//
// The moving parts (wheelsets, rods, valve gear) are steamGear.ts.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

export type Pt = [number, number];

/** Materials every steam vehicle shares; a design adds or replaces `paint`, `frame`, `wheel` and `lining`. */
export const STEAM_PALETTE: Record<string, MaterialSpec> = {
  paint: { color: "#1c1c1e", roughness: 0.6 },
  black: { color: "#18181a", roughness: 0.75 },
  smokebox: { color: "#262628", roughness: 0.95 },
  frame: { color: "#8f1f1d", roughness: 0.65 },
  wheel: { color: "#8f1f1d", roughness: 0.65 },
  lining: { color: "#b3201f", roughness: 0.55 },
  tyre: { color: "#9ca1a6", metallic: 0.35, roughness: 0.4 },
  rod: { color: "#b9bec3", metallic: 0.4, roughness: 0.35 },
  steel: { color: "#7d8288", metallic: 0.3, roughness: 0.5 },
  brass: { color: "#b8913a", metallic: 0.45, roughness: 0.35 },
  beam: { color: "#a3201f", roughness: 0.6 },
  roof: { color: "#2b2b2d", roughness: 0.8 },
  coal: { color: "#121212", roughness: 1 },
  glass: { color: "#26323f", metallic: 0.2, roughness: 0.15, glass: true },
  lampHead: { color: "#f3f5f6", roughness: 0.2, lamp: { role: "head", lit: "#ffe6a8" } },
  plate: { color: "#7a1517", roughness: 0.5 },
  plateText: { color: "#e3dcc0", metallic: 0.3, roughness: 0.4 },
  white: { color: "#e8e6df", roughness: 0.6 },
};

/** Standard draw gear: buffer centres 1.75 m apart at 1.06 m, heads 0.4 m across. */
export const BUFFER_Y = 1.06;
export const BUFFER_Z = 0.875;

/** The convex polygon `poly` (z, y) cut to y0 <= y <= y1. */
export function clipY(poly: Pt[], y0: number, y1: number): Pt[] {
  const cut = (ring: Pt[], h: number, above: boolean): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      const inA = above ? a[1] >= h - 1e-9 : a[1] <= h + 1e-9;
      const inB = above ? b[1] >= h - 1e-9 : b[1] <= h + 1e-9;
      if (inA) out.push(a);
      if (inA !== inB) {
        const t = (h - a[1]) / (b[1] - a[1]);
        out.push([a[0] + t * (b[0] - a[0]), h]);
      }
    }
    return out;
  };
  return cut(cut(poly, y0, true), y1, false);
}

/** Half the width of a convex (z, y) section at height y. */
export function halfAt(section: Pt[], y: number): number {
  let best = 0;
  for (let i = 0; i < section.length; i++) {
    const a = section[i]!;
    const b = section[(i + 1) % section.length]!;
    if (Math.abs(a[1] - b[1]) < 1e-12) {
      if (Math.abs(a[1] - y) < 1e-9) best = Math.max(best, Math.abs(a[0]), Math.abs(b[0]));
      continue;
    }
    if ((a[1] - y) * (b[1] - y) > 1e-12) continue;
    const t = (y - a[1]) / (b[1] - a[1]);
    best = Math.max(best, Math.abs(a[0] + t * (b[0] - a[0])));
  }
  return best;
}

/** A symmetric (z, y) section from its right half, listed bottom to top. */
export function mirrored(right: Pt[]): Pt[] {
  return [...right, ...[...right].reverse().map(([z, y]): Pt => [-z, y])].filter((p, i, all) => i === 0 || p[0] !== all[i - 1]![0] || p[1] !== all[i - 1]![1]);
}

export class Steam {
  readonly m: MeshBuilder;
  constructor(palette: Record<string, MaterialSpec>, readonly xc: number) {
    this.m = new MeshBuilder({ ...STEAM_PALETTE, ...palette });
  }

  /** Source x to Factory X. */
  X(x: number): number {
    return this.xc - x;
  }

  /** A closed box over source x0..x1, y0..y1, z0..z1. */
  box(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    block(this.m, mat, Math.min(this.X(x0), this.X(x1)), Math.max(this.X(x0), this.X(x1)), y0, y1, Math.min(z0, z1), Math.max(z0, z1));
  }

  /** The box on side s: z from a to b (both >= 0), mirrored for s < 0. */
  sideBox(mat: string, s: number, x0: number, x1: number, y0: number, y1: number, a: number, b: number): void {
    this.box(mat, x0, x1, y0, y1, ...side(s, a, b));
  }

  /** A horizontal cylinder along x from source x0 to x1 about (z, y). */
  cylX(mat: string, x0: number, x1: number, z: number, y: number, r: number, n = 16, caps = true): void {
    const ring = ngon(n, r, Math.PI / n, z, y);
    this.m.sweep(mat, "x", ring, this.X(x0), ring, this.X(x1), caps);
  }

  /** A vertical cylinder at source x, z from y0 to y1. */
  cylY(mat: string, x: number, z: number, y0: number, y1: number, r: number, n = 12, top = true): void {
    this.m.prism(mat, ngon(n, r, 0, this.X(x), z), y0, y1, top);
  }

  /** A cylinder across the vehicle (along z) at source x, height y. */
  cylZ(mat: string, x: number, y: number, z0: number, z1: number, r: number, n = 10): void {
    const ring = ngon(n, r, 0, this.X(x), y);
    this.m.sweep(mat, "z", ring, z0, ring, z1);
  }

  /** A (z, y) section swept from source x0 to x1. */
  section(mat: string, x0: number, x1: number, sec: Pt[], caps = true): void {
    this.m.sweep(mat, "x", sec, this.X(Math.max(x0, x1)), sec, this.X(Math.min(x0, x1)), caps);
  }

  /**
   * A flat panel on side s of a body of constant section `sec` (swept along x):
   * source x0..x1, y0..y1, `proud` off the skin and `depth` deep into it. Split
   * at the section's corners so each piece lies on one facet.
   */
  sidePanel(sec: Pt[], mat: string, s: number, x0: number, x1: number, y0: number, y1: number, proud = 0.006, depth = 0.02): void {
    const ys = [y0, ...[...new Set(sec.map((p) => p[1]))].filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6).sort((a, b) => a - b), y1];
    const [xa, xb] = [this.X(x0), this.X(x1)];
    for (let i = 0; i + 1 < ys.length; i++) {
      const [ya, yb] = [ys[i]!, ys[i + 1]!];
      const [ha, hb] = [halfAt(sec, ya + 1e-7) + proud, halfAt(sec, yb - 1e-7) + proud];
      const dz = hb - ha;
      const dy = yb - ya;
      const L = Math.hypot(dz, dy);
      const n: Pt = [dy / L, -dz / L]; // outward in (|z|, y)
      const outline: Vec3[] = [[xa, ya, s * ha], [xb, ya, s * ha], [xb, yb, s * hb], [xa, yb, s * hb]];
      this.m.slab(mat, outline, [0, -n[1] * depth, -s * n[0] * depth]);
    }
  }

  /** A flat panel on an end face at source x looking forward (e = +1, toward -x) or rearward (e = -1). */
  endPanel(mat: string, e: number, x: number, z0: number, z1: number, y0: number, y1: number, depth = 0.02): void {
    const X = this.X(x) + e * 0.006;
    const outline: Vec3[] = [[X, y0, z0], [X, y0, z1], [X, y1, z1], [X, y1, z0]];
    this.m.slab(mat, outline, [-e * depth, 0, 0]);
  }

  /**
   * A boiler from source x0 (the smokebox front) to x1 about height y, radius r:
   * the smokebox `smokebox` long and 4 cm larger, the barrel with boiler bands at
   * the `bands` stations.
   */
  boiler(o: { x0: number; x1: number; y: number; r: number; smokebox: number; bands?: number[]; band?: string; paint?: string; n?: number }): void {
    const m = this.m;
    const n = o.n ?? 20;
    const paint = o.paint ?? "paint";
    m.scope("smokebox", () => {
      this.cylX("smokebox", o.x0, o.x0 + o.smokebox, 0, o.y, o.r + 0.04, n);
      // the saddle under it
      this.box("smokebox", o.x0 + 0.15, o.x0 + o.smokebox - 0.1, o.y - o.r - 0.35, o.y - o.r * 0.6, -o.r * 0.75, o.r * 0.75);
    });
    m.scope("barrel", () => this.cylX(paint, o.x0 + o.smokebox, o.x1, 0, o.y, o.r, n, false));
    if (o.bands?.length) {
      m.scope("boiler bands", () => {
        for (const x of o.bands!) this.cylX(o.band ?? "steel", x - 0.03, x + 0.03, 0, o.y, o.r + 0.012, n, false);
      });
    }
    m.scope("smokebox door", () => {
      const X = this.X(o.x0);
      const door = ngon(n, o.r * 0.82, Math.PI / n, 0, o.y);
      m.sweep("smokebox", "x", door, X, door, X + 0.07);
      // the dart handle and the hinge straps
      block(m, "steel", X + 0.06, X + 0.1, o.y - 0.03, o.y + 0.03, -0.18, 0.18);
      for (const dy of [-0.35, 0.35]) block(m, "steel", X + 0.06, X + 0.085, o.y + dy * o.r - 0.03, o.y + dy * o.r + 0.03, -o.r * 0.78, 0.05);
    });
  }

  /** A chimney at source x from the boiler (base y0) to `top`, radius r, with a lip and a base flare. */
  chimney(x: number, y0: number, top: number, r: number): void {
    // the exhaust leaves the chimney's mouth
    this.m.emit("smoke", [this.X(x), top, 0], r);
    this.m.scope("chimney", () => {
      this.cylY("smokebox", x, 0, y0, top - 0.08, r, 14, false);
      this.cylY("smokebox", x, 0, top - 0.08, top, r + 0.05, 14);
      this.cylY("smokebox", x, 0, y0 - 0.05, y0 + 0.12, r + 0.1, 14, false);
    });
  }

  /** A dome at source x from y0 (inside the boiler) to `top`: radius r, `len` long (a casing when longer than 2r). */
  dome(x: number, y0: number, top: number, r: number, len = 2 * r, mat = "paint"): void {
    const m = this.m;
    const ring = (k: number): Ring => {
      const w = len * k;
      const d = 2 * r * k;
      if (len <= 2 * r + 1e-6) return ngon(14, d / 2, 0, this.X(x), 0);
      const c = d * 0.45;
      const hx = w / 2;
      const hz = d / 2;
      return [[-hx + c, hz], [hx - c, hz], [hx, hz - c], [hx, -hz + c], [hx - c, -hz], [-hx + c, -hz], [-hx, -hz + c], [-hx, hz - c]].map(([px, pz]) => [this.X(x) + px!, pz!] as [number, number]);
    };
    const shoulder = top - Math.min(0.18, r * 0.6);
    m.loft(mat, ring(1), y0, ring(1), shoulder, false);
    m.loft(mat, ring(1), shoulder, ring(0.72), top, true);
  }

  /**
   * The buffer beam and draw gear at end e (+1 the front, low source x) with
   * buffer heads at source x `head`, `length` ahead of the beam (0.62 m standard;
   * shorter between a locomotive and its tender).
   */
  bufferBeam(e: number, head: number, o: { y0?: number; y1?: number; half?: number; depth?: number; length?: number } = {}): void {
    const m = this.m;
    const len = o.length ?? 0.62;
    const face = head + e * len; // the beam's outer face, inboard of the heads
    const [y0, y1, half, depth] = [o.y0 ?? 0.78, o.y1 ?? 1.32, o.half ?? 1.45, o.depth ?? 0.16];
    // 4 mm proud of the face, so it never shares a plane with the body end behind it
    m.scope("buffer beam", () => this.box("beam", face - e * 0.004, face + e * depth, y0, y1, -half, half));
    m.scope("buffers", () => {
      for (const z of [-BUFFER_Z, BUFFER_Z]) {
        const k = len / 0.62;
        this.cylX("black", face, face - e * 0.38 * k, z, BUFFER_Y, 0.14, 10);
        this.cylX("steel", face - e * 0.38 * k, face - e * 0.56 * k, z, BUFFER_Y, 0.09, 10);
        this.cylX("steel", face - e * 0.56 * k, head, z, BUFFER_Y, 0.2, 16);
      }
    });
    m.scope("coupling", () => {
      const k = len / 0.62;
      this.box("steel", face, face - e * 0.32 * k, BUFFER_Y - 0.06, BUFFER_Y + 0.06, -0.06, 0.06);
      this.box("steel", face - e * 0.32 * k, face - e * 0.4 * k, BUFFER_Y - 0.25, BUFFER_Y + 0.06, -0.035, 0.035);
    });
  }

  /**
   * A streamlined volume: the convex (z, y) section `sec` scaled across by the
   * plan (x, half width) and clamped by the elevation's top and bottom (x, y)
   * polylines, swept between the stations of all three, in horizontal paint
   * bands [y0, y1, material]. Closed at both ends.
   */
  volume(o: { sec: Pt[]; plan: Pt[]; top?: Pt[]; bottom?: Pt[]; bands: Array<[number, number, string]> }): void {
    const m = this.m;
    const lerp = (pts: Pt[], x: number): number => {
      if (x <= pts[0]![0]) return pts[0]![1];
      for (let i = 1; i < pts.length; i++) {
        const [xa, ya] = pts[i - 1]!;
        const [xb, yb] = pts[i]!;
        if (x <= xb + 1e-9) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
      }
      return pts[pts.length - 1]![1];
    };
    const hw0 = Math.max(...o.sec.map((p) => Math.abs(p[0])));
    const x0 = o.plan[0]![0];
    const x1 = o.plan[o.plan.length - 1]![0];
    const xs = [...new Set([...o.plan, ...(o.top ?? []), ...(o.bottom ?? [])].map((p) => p[0]))].filter((x) => x >= x0 - 1e-9 && x <= x1 + 1e-9).sort((a, b) => a - b);
    const hi = (x: number) => (o.top ? lerp(o.top, x) : Infinity);
    const lo = (x: number) => (o.bottom ? lerp(o.bottom, x) : -Infinity);
    const ring = (poly: Pt[], x: number, y0: number, y1: number): Pt[] => {
      const k = Math.max(0.01, lerp(o.plan, x)) / hw0;
      const h = Math.max(hi(x), y0 + 0.002);
      const l = Math.min(lo(x), y1 - 0.002);
      return poly.map(([z, y]): Pt => [z * k, Math.min(h, Math.max(l, y))]);
    };
    o.bands.forEach(([y0, y1, mat], i) => {
      const a0 = i > 0 ? y0 + 0.0025 : y0;
      const a1 = i < o.bands.length - 1 ? y1 + 0.0025 : y1;
      const poly = clipY(o.sec, a0, a1);
      if (poly.length < 3) return;
      m.scope(`${mat} band`, () => {
        for (let j = 0; j + 1 < xs.length; j++) {
          const [xa, xb] = [xs[j]!, xs[j + 1]!];
          const gone = (x: number) => hi(x) <= a0 + 1e-6 || lo(x) >= a1 - 1e-6;
          if (xb - xa < 1e-6 || (gone(xa) && gone(xb))) continue;
          // a band the profile reaches within the segment starts (or ends) where it does
          let [ua, ub] = [xa, xb];
          if (gone(xa) !== gone(xb)) {
            let [p, q] = gone(xa) ? [xa, xb] : [xb, xa];
            for (let k = 0; k < 40; k++) {
              const mid = (p + q) / 2;
              if (gone(mid)) p = mid;
              else q = mid;
            }
            if (gone(xa)) ua = q;
            else ub = q;
          }
          if (ub - ua < 1e-4) continue;
          m.sweep(mat, "x", ring(poly, ua, a0, a1), this.X(ua), ring(poly, ub, a0, a1), this.X(ub), false);
        }
        for (const [x, e] of [[xs[0]!, 1], [xs[xs.length - 1]!, -1]] as const) {
          if (hi(x) <= a0 + 1e-6 || lo(x) >= a1 - 1e-6) continue;
          m.slab(mat, ring(poly, x, a0, a1).map(([z, y]): Vec3 => [this.X(x), y, z]), [-e * 0.002, 0, 0]);
        }
      });
    });
  }

  /** A lamp at source x, height y (its foot), z, its lens facing end e. */
  lamp(e: number, x: number, y: number, z: number): void {
    this.m.scope("lamp", () => {
      this.box("black", x, x + e * 0.22, y, y + 0.3, z - 0.12, z + 0.12);
      const X = this.X(x) + e * 0.004;
      const lens = ngon(10, 0.08, 0, z, y + 0.15);
      this.m.sweep("lampHead", "x", lens, X - 0.02, lens, X + 0.006);
    });
  }

  /**
   * A running board along source x through the (x, y) stations of `profile`,
   * `half` wide each side of the centre line, 4 cm thick, with a valance strip
   * `valance` deep under its outer edges.
   */
  runningBoard(profile: Pt[], half: number, mat = "black", valance = 0.12, valanceMat = mat): void {
    const m = this.m;
    for (let i = 0; i + 1 < profile.length; i++) {
      const [xa, ya] = profile[i]!;
      const [xb, yb] = profile[i + 1]!;
      if (Math.abs(xb - xa) < 1e-6) continue;
      const q: Ring = [[this.X(xa), ya - 0.04], [this.X(xb), yb - 0.04], [this.X(xb), yb], [this.X(xa), ya]];
      m.sweep(mat, "z", q, -half, q, half);
      if (valance > 0) {
        for (const s of [-1, 1]) {
          const v: Ring = [[this.X(xa), ya - 0.04 - valance], [this.X(xb), yb - 0.04 - valance], [this.X(xb), yb - 0.04], [this.X(xa), ya - 0.04]];
          const [a, b] = side(s, half - 0.03, half - 0.005);
          m.sweep(valanceMat, "z", v, a, v, b);
        }
      }
    }
  }

  /** A smoke deflector on side s: a plate through the (x, y) outline at |z| = z, 2.5 cm thick. */
  deflector(s: number, outline: Pt[], z: number, mat = "paint"): void {
    const pts = outline.map(([x, y]): Vec3 => [this.X(x), y, s * (z + 0.025)]);
    this.m.slab(mat, pts, [0, 0, -s * 0.025]);
  }

  /** A handrail along source x0..x1 at height y, |z| = z on both sides, on short stanchions toward |z| = zIn. */
  handrail(x0: number, x1: number, y: number, z: number, zIn: number, posts = 4): void {
    for (const s of [-1, 1]) {
      this.cylX("steel", x0, x1, s * z, y, 0.018, 6, true);
      for (let i = 0; i < posts; i++) {
        const x = x0 + ((x1 - x0) * (i + 0.5)) / posts;
        this.sideBox("steel", s, x - 0.012, x + 0.012, y - 0.012, y + 0.012, zIn, z - 0.012);
      }
    }
  }

  /** A coal heap in a bunker over source x0..x1: a mound `rise` high above y, `half` wide. */
  coal(x0: number, x1: number, y: number, half: number, rise: number): void {
    const sec: Pt[] = [[-half, y], [half, y], [half * 0.75, y + rise * 0.6], [half * 0.3, y + rise], [-half * 0.3, y + rise], [-half * 0.75, y + rise * 0.6]];
    this.m.scope("coal", () => this.section("coal", x0, x1, sec));
  }

  /**
   * A number plate on side s centred at source x, its foot at y, on a vertical
   * face at |z| = face: a red plate with raised digits reading from outside.
   */
  sidePlate(s: number, x: number, y: number, text: string, face: number, h = 0.13): void {
    const m = this.m;
    const w = h * 0.58;
    const gap = h * 0.18;
    const width = strokeWidth(text, w, gap);
    m.scope("number plate", () => {
      this.sideBox("plate", s, x - width / 2 - 0.05, x + width / 2 + 0.05, y - 0.05, y + h + 0.05, face - 0.004, face + 0.012);
      const u0 = this.X(x) + (s > 0 ? -width / 2 : width / 2);
      m.facets("plateText", strokeText(text, u0, y, h, w, gap, s < 0).map(([u, v]): Vec3 => [u, v, s * (face + 0.016)]), [0, 0, s]);
    });
  }

  /** A number plate on an end face at source x looking forward (e = +1), centred on z = 0 at height y. */
  endPlate(e: number, x: number, y: number, text: string, h = 0.12, z = 0): void {
    const m = this.m;
    const w = h * 0.58;
    const gap = h * 0.18;
    const width = strokeWidth(text, w, gap);
    m.scope("number plate", () => {
      const X = this.X(x);
      block(m, "plate", Math.min(X, X + e * 0.016), Math.max(X, X + e * 0.016), y - 0.05, y + h + 0.05, z - width / 2 - 0.05, z + width / 2 + 0.05);
      // seen from ahead (+X) the text runs toward -z
      const u0 = e > 0 ? z + width / 2 : z - width / 2;
      m.facets("plateText", strokeText(text, u0, y, h, w, gap, e > 0).map(([u, v]): Vec3 => [X + e * 0.02, v, u]), [e, 0, 0]);
    });
  }
}
