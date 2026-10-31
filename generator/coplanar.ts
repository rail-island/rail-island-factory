// Finds z-fighting in a GLB: pairs of front faces of DIFFERENT materials that
// lie in the same plane, face the same way and overlap. The depth buffer cannot
// order them, so the GPU shows one or the other pixel by pixel and the surface
// flickers as the camera moves. (Overlaps of one material are invisible --
// both sides of the fight are the same colour -- and are not reported.)
//
// Run on every design twice over: by the tests (test/catalogSweep.ts), and by
// the build itself (generate.ts), which refuses to write an export with a
// flickering model -- the deploy does not wait for the tests. Works on any GLB the
// triangle reader understands.
import { collectTriangles, parseGlb } from "./glbTriangles.ts";

type V3 = [number, number, number];
type V2 = [number, number];

interface Face {
  p: [V3, V3, V3];
  n: V3; // unit normal from the winding
  mat: string; // what decides a fight: the base colour
  name: string; // what the report calls it: the material name
}

export interface CoplanarOverlap {
  /** The two material names. */
  materials: [string, string];
  /** The shared plane, as its unit normal and offset (n . p = d). */
  normal: V3;
  offset: number;
  /** Overlapping area in the model's units squared. */
  area: number;
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function area2(poly: V2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

/** Sutherland-Hodgman: `subject` clipped by the convex, counter-clockwise `clip`. */
function clipPolygon(subject: V2[], clip: V2[]): V2[] {
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const inside = (p: V2): number => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j];
      const q = input[(j + 1) % input.length];
      const ip = inside(p);
      const iq = inside(q);
      if (ip >= 0) out.push(p);
      if ((ip >= 0) !== (iq >= 0)) {
        const t = ip / (ip - iq);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return out;
}

/**
 * Every z-fighting pair of materials in `glb`, merged per (material pair, plane),
 * largest first. `minArea` drops slivers that only touch along an edge;
 * `interiors` checks a vehicle's interior too, which is hidden at rest (a pose
 * with its doors open).
 */
export function findCoplanarOverlaps(glb: Uint8Array, minArea = 1e-3, opts: { interiors?: boolean } = {}): CoplanarOverlap[] {
  const { json, bin } = parseGlb(glb);
  // the primitive's base colour stands in for the material: two materials of the
  // same colour cannot flicker visibly either
  return findCoplanarTriangles(collectTriangles(json, bin, opts).map((t) => ({ p: t.p, mat: t.color.map((c) => c.toFixed(4)).join(","), name: t.material })), minArea);
}

/**
 * The same search over plain triangles: each with what decides a fight (`mat`: two
 * triangles of one `mat` never fight) and what the report calls it (`name`). The
 * station set's check runs it on the game's own geometry (test/stationSet.test.ts).
 */
export function findCoplanarTriangles(tris: ReadonlyArray<{ p: [V3, V3, V3]; mat: string; name: string }>, minArea = 1e-3): CoplanarOverlap[] {
  const faces: Face[] = tris.map((t) => {
    const n = cross(sub(t.p[1], t.p[0]), sub(t.p[2], t.p[0]));
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    return { p: t.p, n: [n[0] / l, n[1] / l, n[2] / l], mat: t.mat, name: t.name };
  });

  // Bucket by plane: rounded normal and offset. Neighbouring buckets are not
  // searched -- the designs place coplanar faces at exactly equal coordinates,
  // which is precisely the case that fights.
  const buckets = new Map<string, Face[]>();
  for (const f of faces) {
    const d = f.n[0] * f.p[0][0] + f.n[1] * f.p[0][1] + f.n[2] * f.p[0][2];
    const key = `${f.n.map((c) => c.toFixed(3)).join(",")}|${d.toFixed(3)}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = []));
    b.push(f);
  }

  const merged = new Map<string, CoplanarOverlap>();
  for (const group of buckets.values()) {
    if (group.length < 2 || new Set(group.map((f) => f.mat)).size < 2) continue;
    // project onto the plane's two least-aligned axes, each triangle wound
    // counter-clockwise in 2D (the clipper wants a CCW clip polygon)
    const n = group[0].n;
    const ax = [Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])];
    const drop = ax.indexOf(Math.max(...ax));
    const [u, v] = [0, 1, 2].filter((k) => k !== drop);
    const to2 = (f: Face): V2[] => {
      const poly = f.p.map((p): V2 => [p[u], p[v]]);
      return area2(poly) < 0 ? poly.reverse() : poly;
    };
    // Sweep and prune: sorted by their left edge, a triangle is clipped only
    // against those whose boxes overlap its own -- the others share no area. A
    // big plane (a fuselage's flank, a cathedral's floor) has thousands.
    const flat = group.map((f) => {
      const poly = to2(f);
      return {
        f, poly,
        minU: Math.min(poly[0][0], poly[1][0], poly[2][0]), maxU: Math.max(poly[0][0], poly[1][0], poly[2][0]),
        minV: Math.min(poly[0][1], poly[1][1], poly[2][1]), maxV: Math.max(poly[0][1], poly[1][1], poly[2][1]),
      };
    }).sort((a, b) => a.minU - b.minU);
    for (let i = 0; i < flat.length; i++) {
      const a = flat[i];
      for (let j = i + 1; j < flat.length && flat[j].minU <= a.maxU; j++) {
        const b = flat[j];
        if (a.f.mat === b.f.mat || b.minV > a.maxV || b.maxV < a.minV) continue;
        const area = Math.abs(area2(clipPolygon(a.poly, b.poly)));
        if (area < minArea) continue;
        const d = n[0] * a.f.p[0][0] + n[1] * a.f.p[0][1] + n[2] * a.f.p[0][2];
        const mats = [a.f.name, b.f.name].sort() as [string, string];
        const key = `${mats.join("/")}|${n.map((c) => c.toFixed(3))}|${d.toFixed(3)}`;
        const prev = merged.get(key);
        if (prev) prev.area += area;
        else merged.set(key, { materials: mats, normal: n, offset: d, area });
      }
    }
  }
  return [...merged.values()].sort((a, b) => b.area - a.area);
}
