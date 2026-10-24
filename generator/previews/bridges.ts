// The bridge types' site previews (docs/models/previews.md): one page per type, the
// type built by the bridge set's own module -- its kit and type function, the code the
// game runs -- over a straight crossing of flat ground, and drawn shape by shape:
// oriented boxes (a pier tapering to its cap), spans and struts between two points,
// and the deck, parapets, arches and cables swept along the path. The masonry,
// concrete and timber carry the photos the game binds (its bridge surfaces).

import { resolveParams, type ParamSpec, type ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import type { SurfaceId } from "../surfaces.ts";
import * as bridge from "../sets/bridge.ts";
import { Sketch, type Rgb, type V } from "./sketch.ts";

export const BRIDGE_PARAMS: ParamSpec[] = [
  // what the bridge carries: the game widens the deck for it
  { name: "deck", title: "Carries", default: "single", values: [{ value: "single", title: "One track" }, { value: "double", title: "Two tracks" }, { value: "road", title: "Wide road" }] },
  { name: "length", title: "Span", default: "short", preview: true, values: [{ value: "short", title: "60 studs" }, { value: "long", title: "160 studs" }] },
];
const LENGTHS: Record<string, number> = { short: 60, long: 160 };
// the game's deck widths: one track, two (8 apart), a wide road (16 plus 2)
const DECKS: Record<string, { width: number; shift: number }> = { single: { width: 9, shift: 0 }, double: { width: 17, shift: 4 }, road: { width: 18, shift: 0 } };
// the game's deck support height (the ballast bed's underside) and the overhead-wire clearance
const SUPPORT_Y = 0.67, CLEARANCE_Y = 9.9;

// the game's bridge colours and the surface each material draws with
const COLORS: Record<bridge.BridgeMaterial, Rgb> = {
  timber: [145, 108, 70], deck: [120, 110, 100], parapet: [150, 140, 125], pier: [95, 90, 85],
  steel: [80, 90, 110], stone: [170, 160, 145], brick: [235, 205, 195], cable: [40, 40, 50], tower: [95, 90, 85],
};
const SURFACE: Partial<Record<bridge.BridgeMaterial, SurfaceId>> = {
  timber: "bridge-timber", deck: "bridge-deck", parapet: "bridge-parapet", pier: "bridge-pier",
  tower: "bridge-tower", stone: "bridge-stone", brick: "bridge-brick",
};
const KIND: Partial<Record<bridge.BridgeMaterial, string>> = { steel: "steel", cable: "cable" };

/** The bridge the set module builds, its path raised until nothing dips below the ground. */
function boxes(values: ParamValues | undefined, type: string): bridge.BridgeBox[] {
  const p = resolveParams(BRIDGE_PARAMS, values);
  const length = LENGTHS[p.length!]!, deck = DECKS[p.deck!]!;
  const build = (y: number): bridge.BridgeBox[] =>
    bridge.buildBridge(type, bridge.pathFromPoints([{ x: -length / 2, y, z: 0 }, { x: length / 2, y, z: 0 }], deck.width, deck.shift, SUPPORT_Y, CLEARANCE_Y)!, () => 0);
  const first = build(14);
  const s = new Sketch();
  draw(s, first);
  return s.low < 0 ? build(14 - s.low) : first;
}

const v3 = (p: bridge.Vec3): V => [p.x, p.y, p.z];

function draw(s: Sketch, list: readonly bridge.BridgeBox[]): void {
  for (const b of list) {
    const mat = s.mat(KIND[b.material] ?? b.material, COLORS[b.material], SURFACE[b.material]);
    if (b.shape === "box") s.box(mat, { cx: b.center.x, cy: b.center.y, cz: b.center.z, sx: b.size.x, sy: b.size.y, sz: b.size.z, yaw: b.yaw, topScale: b.topScale });
    else if (b.shape === "span") s.span(mat, v3(b.a), v3(b.b), b.w, b.h);
    else if (b.shape === "strut") s.bar(mat, v3(b.a), v3(b.b), b.thick);
    // The module's sections run along the game's sweep perpendicular, (tz, -tx);
    // the sketch sweeps along (-tz, tx), so every lateral offset flips on the way
    // in (and a profile's order with it, to stay counter-clockwise). Unflipped, a
    // recentred deck -- two tracks -- was drawn on the wrong side of its piers.
    else if (b.shape === "wall") s.wall(mat, b.points.map(v3), -b.u1, -b.u0, b.bottoms, b.tops);
    else s.sweep(mat, b.points.map(v3), b.profile.map((q) => [-q.u, q.v] as const).reverse());
  }
}

/** The distant bridge: its deck, and at most sixteen of the piers it stands on. */
function lod(list: readonly bridge.BridgeBox[]): bridge.BridgeBox[] {
  const deck = list.filter((b) => b.part === "deck").map((b) => (b.shape === "ribbon" ? { ...b, points: [b.points[0]!, b.points[b.points.length - 1]!] } : b));
  const piers = list.filter((b) => b.ground);
  const step = Math.max(1, Math.ceil(piers.length / 16));
  return [...deck, ...piers.filter((_, i) => i % step === 0)];
}

export function bridgePreview(values: ParamValues | undefined, type: string): MeshBuilder {
  const s = new Sketch();
  draw(s, boxes(values, type));
  return s.build("bridge");
}
export function bridgePreviewLod(values: ParamValues | undefined, type: string): MeshBuilder {
  const s = new Sketch();
  draw(s, lod(boxes(values, type)));
  return s.build("bridge");
}
