// Preview design of the catenary style set (docs/models/sets.md): one support as the
// set's module draws it -- a railway mast beside a single track, a portal over two,
// or a tram pole over a double street line -- with a short run of the wires it holds.
// The site's only, like the other set previews (setPreviews.ts); a source file of its
// own, so the style module rides in this bundle only.

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import { MeshBuilder, type MaterialSpec } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import * as catenaryStyle from "../sets/catenaryStyle.ts";

const PARAMS: ParamSpec[] = [{
  name: "support", title: "Support", default: "trackside",
  values: [{ value: "trackside", title: "Trackside mast" }, { value: "portal", title: "Portal" }, { value: "tram", title: "Tram pole" }],
}];

// the game's heights (studs): the railhead above the ground, the contact and
// messenger wires above it, the tram wire above a track, the wire's thickness
const RAIL_TOP = 1.56, CONTACT = 8.86, MESSENGER = 10.6, TRAM_WIRE = RAIL_TOP + CONTACT, WIRE = 0.08;
/** The ground sits this high so a footing sunk below it still stands on the preview's floor. */
const GROUND = 0.4;
/** The wires run this far either side of the support. */
const RUN = 6;

const PALETTE: Record<string, MaterialSpec> = {
  column: { color: "#5a692d", roughness: 0.6, metallic: 0.5 },
  footing: { color: "#e2e0dc", roughness: 0.9, metallic: 0 },
  insulator: { color: "#785f37", roughness: 0.5, metallic: 0 },
  wire: { color: "#3c3c41", roughness: 0.5, metallic: 0.6 },
};

/** The support's parts, and the wires over each track it serves. */
function parts(values?: Record<string, string>): catenaryStyle.CatenaryPart[] {
  const support = resolveParams(PARAMS, values).support!;
  if (support === "tram") {
    const offsets = [-4, 4];
    const pole = catenaryStyle.pole("tram_pole", { offset: 7.6, offsets, groundY: GROUND, trackYs: offsets.map(() => GROUND), wireLift: TRAM_WIRE, deck: false, deckRise: 0, wire: WIRE });
    return [...pole, ...offsets.map((x) => wire(x, GROUND + TRAM_WIRE))];
  }
  const drops = support === "portal" ? [0, 8] : [0];
  const mast = catenaryStyle.mast("rail_mast", {
    uprights: support === "portal" ? [-4, 12] : [4], drops, deck: false, groundY: GROUND,
    railTop: RAIL_TOP, contact: CONTACT, messenger: MESSENGER, deckRise: 0, deckFootingWidth: 0, wire: WIRE,
  });
  return [...mast, ...drops.flatMap((x) => [wire(x, GROUND + RAIL_TOP + CONTACT), wire(x, GROUND + RAIL_TOP + MESSENGER)])];
}
/** A wire along the track at lateral `x`, height `y`. */
const wire = (x: number, y: number): catenaryStyle.CatenaryPart => ({ shape: "box", x, y, along: 0, sx: WIRE, sy: WIRE, sz: 2 * RUN, material: "wire" });

type V = Vec3;
const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** A quad wound to face away from `inside`. */
function face(m: MeshBuilder, mat: string, a: V, b: V, c: V, d: V, inside: V): void {
  const mid: V = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
  if (dot(cross(sub(b, a), sub(c, a)), sub(mid, inside)) >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, d, c, b, a);
}

/** A prism of `ring` (a closed outline round the axis, in the plane of `u` and `w`) from `a` to `b`. */
function prism(m: MeshBuilder, mat: string, a: V, b: V, u: V, w: V, ring: Array<[number, number]>, floor: boolean): void {
  const at = (p: V, [s, t]: [number, number]): V => add(add(p, u, s), w, t);
  const centre: V = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const lo = ring.map((q) => at(a, q)), hi = ring.map((q) => at(b, q));
  for (let k = 0; k < ring.length; k++) {
    const k1 = (k + 1) % ring.length;
    face(m, mat, lo[k]!, lo[k1]!, hi[k1]!, hi[k]!, centre);
  }
  // caps as fans of quads/tris
  for (const [cap, keep] of [[hi, true], [lo, floor]] as const) {
    if (!keep) continue;
    const c: V = cap.reduce((s, p) => add(s, p, 1 / cap.length), [0, 0, 0] as V);
    for (let k = 0; k < cap.length; k++) {
      const p = cap[k]!, q = cap[(k + 1) % cap.length]!;
      const n = cross(sub(p, c), sub(q, c));
      if (dot(n, sub(c, centre)) >= 0) m.tri(mat, c, p, q);
      else m.tri(mat, c, q, p);
    }
  }
}

const SQUARE: Array<[number, number]> = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

function draw(m: MeshBuilder, part: catenaryStyle.CatenaryPart): void {
  if (part.shape === "box") {
    const c: V = [part.x, part.y, part.along];
    const floor = part.y - part.sy / 2 > 1e-6;
    prism(m, part.material, add(c, [0, -part.sy / 2, 0]), add(c, [0, part.sy / 2, 0]), [part.sx / 2, 0, 0], [0, 0, part.sz / 2], SQUARE, floor);
  } else if (part.shape === "bar") {
    const a: V = [part.ax, part.ay, 0], b: V = [part.bx, part.by, 0];
    const d = sub(b, a), len = Math.hypot(...d);
    if (len < 1e-4) return;
    // the bar lies in the cross-section: its width runs along the track and across the bar
    const across: V = [-d[1] / len * part.thick / 2, d[0] / len * part.thick / 2, 0];
    prism(m, part.material, a, b, across, [0, 0, part.thick / 2], SQUARE, true);
  } else {
    const ring: Array<[number, number]> = Array.from({ length: 8 }, (_, k) => [Math.cos((k / 8) * 2 * Math.PI), Math.sin((k / 8) * 2 * Math.PI)]);
    const height = part.y1 - part.y0;
    // a taper drawn as a straight prism of the mean radius: the preview's pole
    const r = (part.radius + part.bottomRadius) / 2;
    prism(m, part.material, [part.x, part.y0, 0], [part.x, part.y0 + height, 0], [r, 0, 0], [0, 0, r], ring, part.y0 > 1e-6);
  }
}

function model(all: readonly catenaryStyle.CatenaryPart[]): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  all.forEach((p, i) => m.scope(`catenary-${i}`, () => draw(m, p)));
  return m;
}

export function catenaryPreview(values?: Record<string, string>): MeshBuilder { return model(parts(values)); }
/** The distant support: its uprights, footings, beam and pole, without the arms' detail or the wires. */
export function catenaryPreviewLod(values?: Record<string, string>): MeshBuilder {
  return model(parts(values).filter((p) => p.material !== "wire" && p.material !== "insulator" && !(p.shape === "box" && p.sy < 0.5)));
}

const PREVIEW_CATALOG = { category: "Structure types", group: "previews", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const CATENARY_PREVIEWS: ProceduralDesign[] = [
  { id: "proc-preview-catenary", title: "Overhead Line Support", build: catenaryPreview, buildLod: catenaryPreviewLod, lodTriangles: 500 as const, params: PARAMS },
].map((d) => ({ ...d, catalog: { ...PREVIEW_CATALOG } }));
