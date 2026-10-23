// Preview design of the bridge set (docs/models/sets.md): a short or a long straight
// crossing over flat ground, built by the set's own module -- the kit and the type
// functions the game runs -- and drawn here shape by shape: oriented boxes (a pier
// tapering to its cap), spans and struts between two points, and the deck, parapets,
// arches and cables swept as ribbons and walls along the path. The site's only, like
// the other set previews (setPreviews.ts); a source file of its own, so the bridge
// module rides in this bundle only.

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import { MeshBuilder, type MaterialSpec } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import * as bridge from "../sets/bridge.ts";

const TITLES: Record<string, string> = {
  beam: "Beam", truss: "Truss", cantilever: "Cantilever", arch: "Arch", stone_arch: "Stone arch",
  brick_arch: "Brick arch", tied_arch: "Tied arch", suspension: "Suspension", cable_stayed: "Cable-stayed",
  plate_girder: "Plate girder", timber_trestle: "Timber trestle", box_girder: "Box girder",
  deck_truss: "Deck truss", network_arch: "Network arch",
};
const LENGTHS: Record<string, number> = { short: 60, long: 160 };
const PARAMS: ParamSpec[] = [
  { name: "type", title: "Type", default: "beam", values: Object.entries(TITLES).map(([id, title]) => ({ value: id.replace(/_/g, ""), title })) },
  { name: "length", title: "Length", default: "short", values: [{ value: "short", title: "60 studs" }, { value: "long", title: "160 studs" }] },
];

// the game's bridge colours, per material
const COLORS: Record<bridge.BridgeMaterial, readonly [number, number, number]> = {
  timber: [145, 108, 70], deck: [120, 110, 100], parapet: [150, 140, 125], pier: [95, 90, 85],
  steel: [80, 90, 110], stone: [170, 160, 145], brick: [176, 92, 72], cable: [40, 40, 50], tower: [95, 90, 85],
};
const METAL = new Set<bridge.BridgeMaterial>(["steel", "cable"]);
const MATERIALS = Object.keys(COLORS) as bridge.BridgeMaterial[];
const hex = (c: readonly number[]): string => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const PALETTE: Record<string, MaterialSpec> = Object.fromEntries(MATERIALS.map((m) => [m, { color: hex(COLORS[m]), roughness: METAL.has(m) ? 0.4 : 0.85, metallic: METAL.has(m) ? 0.6 : 0 }]));
/** Each material drawn a hair inside the one before it, so flush faces of two materials never share a plane. */
const inset = (m: bridge.BridgeMaterial): number => 0.0137 * MATERIALS.indexOf(m);

/** The bridge as the set module builds it, its path raised until nothing dips below the ground. */
function bridgeBoxes(values?: Record<string, string>): bridge.BridgeBox[] {
  const p = resolveParams(PARAMS, values);
  const type = Object.keys(TITLES).find((id) => id.replace(/_/g, "") === p.type)!;
  const length = LENGTHS[p.length!]!;
  const ground = (): number => 0;
  const build = (y: number): bridge.BridgeBox[] => {
    const path = bridge.pathFromPoints([{ x: -length / 2, y, z: 0 }, { x: length / 2, y, z: 0 }], 9, 0, 0.67, 9.9)!;
    return bridge.buildBridge(type, path, ground);
  };
  const first = build(14);
  const low = Math.min(...first.flatMap(points).map((v) => v[1]));
  return low < 0 ? build(14 - low) : first;
}

type V = Vec3;
const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V): V => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const v3 = (p: bridge.Vec3): V => [p.x, p.y, p.z];

/** A quad wound to face away from `inside`. */
function face(m: MeshBuilder, mat: string, a: V, b: V, c: V, d: V, inside: V): void {
  const n = cross(sub(b, a), sub(c, a));
  const mid: V = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
  if (dot(n, sub(mid, inside)) >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, d, c, b, a);
}

/** An oriented box: centre, three half-axes; the top face scaled by `top`. */
function orientedBox(m: MeshBuilder, mat: string, c: V, ax: V, ay: V, az: V, top = 1, floor = true): void {
  const corner = (sx: number, sy: number, sz: number): V => {
    const k = sy > 0 ? top : 1;
    return add(add(add(c, ax, sx * k), ay, sy), az, sz * k);
  };
  const p = [corner(-1, -1, -1), corner(1, -1, -1), corner(1, 1, -1), corner(-1, 1, -1), corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)] as const;
  face(m, mat, p[0], p[3], p[2], p[1], c);
  face(m, mat, p[4], p[5], p[6], p[7], c);
  face(m, mat, p[0], p[4], p[7], p[3], c);
  face(m, mat, p[1], p[2], p[6], p[5], c);
  face(m, mat, p[3], p[7], p[6], p[2], c);
  if (floor) face(m, mat, p[0], p[1], p[5], p[4], c);
}

/** The miter frame along a horizontal path: the right-of-travel unit, widened at a bend. */
function laterals(pts: readonly V[]): V[] {
  const rights = pts.slice(0, -1).map((p, i) => norm([pts[i + 1]![2] - p[2], 0, -(pts[i + 1]![0] - p[0])]));
  return pts.map((_, i) => {
    if (i === 0) return rights[0]!;
    if (i === pts.length - 1) return rights[rights.length - 1]!;
    const miter = norm(add(rights[i - 1]!, rights[i]!));
    return add([0, 0, 0], miter, 1 / Math.max(dot(miter, rights[i - 1]!), 0.3));
  });
}

/** One closed ring per station swept into a tube, capped at both ends. */
function sweep(m: MeshBuilder, mat: string, rings: V[][]): void {
  const centre = (ring: V[]): V => ring.reduce((s, p) => add(s, p, 1 / ring.length), [0, 0, 0] as V);
  for (let i = 0; i + 1 < rings.length; i++) {
    const a = rings[i]!, b = rings[i + 1]!;
    const inside = centre([...a, ...b]);
    for (let k = 0; k < a.length; k++) {
      const k1 = (k + 1) % a.length;
      face(m, mat, a[k]!, a[k1]!, b[k1]!, b[k]!, inside);
    }
  }
  for (const [ring, next] of [[rings[0]!, rings[1]!], [rings[rings.length - 1]!, rings[rings.length - 2]!]] as const) {
    if (ring.length === 4) face(m, mat, ring[0]!, ring[1]!, ring[2]!, ring[3]!, centre(next));
  }
}

/**
 * A swept path with both ends drawn in, so two sweeps ending on one plane do not share it.
 * The step is not the boxes' inset (a sloped end pulled in along its slope could land
 * exactly on a box face pulled in by the inset), and never a sum of it.
 */
function trimEnds(pts: V[], inset: number): V[] {
  const e = inset * 0.77 + (inset > 0 ? 0.003 : 0);
  if (pts.length < 2 || e <= 0) return pts;
  const out = pts.slice();
  const pull = (i: number, toward: number): void => {
    const d = sub(pts[toward]!, pts[i]!), l = Math.hypot(...d);
    if (l > 2 * e) out[i] = add(pts[i]!, d, e / l);
  };
  pull(0, 1);
  pull(pts.length - 1, pts.length - 2);
  return out;
}

/** Every point a box reaches: what the preview measures its lowest point by. */
function points(b: bridge.BridgeBox): V[] {
  if (b.shape === "box") return [[b.center.x, b.center.y - b.size.y / 2, b.center.z]];
  if (b.shape === "span" || b.shape === "strut") return [v3(b.a), v3(b.b)];
  if (b.shape === "wall") return b.points.map((p, i) => [p.x, b.bottoms[i]!, p.z]);
  return b.points.map((p) => [p.x, p.y + Math.min(...b.profile.map((q) => q.v)), p.z]);
}

function drawBox(m: MeshBuilder, b: bridge.BridgeBox): void {
  const e = inset(b.material);
  const mat = b.material;
  if (b.shape === "box") {
    const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
    // a box standing on the ground keeps its foot there: only its top comes in
    const onGround = b.center.y - b.size.y / 2 <= 1e-6;
    const sx = b.size.x / 2 - e, sy = b.size.y / 2 - (onGround ? e / 2 : e), sz = b.size.z / 2 - e;
    const centre = onGround ? add(v3(b.center), [0, -e / 2, 0]) : v3(b.center);
    orientedBox(m, mat, centre, [c * sx, 0, -s * sx], [0, sy, 0], [s * sz, 0, c * sz], b.topScale ?? 1, !onGround);
  } else if (b.shape === "span" || b.shape === "strut") {
    const a = v3(b.a), d = sub(v3(b.b), a);
    const len = Math.hypot(...d);
    if (len < 0.05) return;
    const along = norm(d);
    const ref: V = Math.abs(along[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const side = norm(cross(ref, along));
    const up = norm(cross(along, side));
    const w = (b.shape === "span" ? b.w : b.thick) / 2 - e, h = (b.shape === "span" ? b.h : b.thick) / 2 - e;
    const half = Math.max(len / 2 - e, len / 4);
    orientedBox(m, mat, add(a, d, 0.5), [side[0] * w, side[1] * w, side[2] * w], [up[0] * h, up[1] * h, up[2] * h], [along[0] * half, along[1] * half, along[2] * half]);
  } else if (b.shape === "wall") {
    const pts = trimEnds(b.points.map(v3), e), lat = laterals(pts);
    // the renderer's lateral runs (tz, -tx): the opposite of the frame laterals() returns
    const rings = pts.map((p, i) => [[b.u0 + e, b.bottoms[i]! + e], [b.u1 - e, b.bottoms[i]! + e], [b.u1 - e, b.tops[i]! - e], [b.u0 + e, b.tops[i]! - e]]
      .map(([u, y]) => { const q = add(p, lat[i]!, -u!); return [q[0], y!, q[2]] as V; }));
    sweep(m, mat, rings);
  } else {
    const pts = trimEnds(b.points.map(v3), e), lat = laterals(pts);
    const cu = b.profile.reduce((s, q) => s + q.u, 0) / b.profile.length, cv = b.profile.reduce((s, q) => s + q.v, 0) / b.profile.length;
    const rings = pts.map((p, i) => b.profile.map((q) => {
      const u = q.u - Math.sign(q.u - cu) * e, v = q.v - Math.sign(q.v - cv) * e;
      return add(add(p, lat[i]!, -u), [0, 1, 0], v);
    }));
    sweep(m, mat, rings);
  }
}

function model(boxes: readonly bridge.BridgeBox[]): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  boxes.forEach((b, i) => m.scope(`bridge-${i}`, () => drawBox(m, b)));
  return m;
}

/** The distant bridge: its deck, and at most sixteen of the piers it stands on. */
function lodBoxes(boxes: readonly bridge.BridgeBox[]): bridge.BridgeBox[] {
  const deck = boxes.filter((b) => b.part === "deck").map((b) => (b.shape === "ribbon" ? { ...b, points: [b.points[0]!, b.points[b.points.length - 1]!] } : b));
  const piers = boxes.filter((b) => b.ground);
  const step = Math.max(1, Math.ceil(piers.length / 16));
  return [...deck, ...piers.filter((_, i) => i % step === 0)];
}

export function bridgePreview(values?: Record<string, string>): MeshBuilder { return model(bridgeBoxes(values)); }
export function bridgePreviewLod(values?: Record<string, string>): MeshBuilder { return model(lodBoxes(bridgeBoxes(values))); }

const PREVIEW_CATALOG = { category: "Structure types", group: "previews", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const BRIDGE_PREVIEWS: ProceduralDesign[] = [
  { id: "proc-preview-bridge", title: "Bridge", build: bridgePreview, buildLod: bridgePreviewLod, lodTriangles: 500 as const, params: PARAMS },
].map((d) => ({ ...d, catalog: { ...PREVIEW_CATALOG } }));
