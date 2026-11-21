// The bridge types' site previews (docs/models/previews.md): one page per type, the
// type built by the bridge set's own module -- its kit and type function, the code the
// game runs -- over a straight crossing of flat ground, and drawn shape by shape:
// oriented boxes (a pier tapering to its cap), spans and struts between two points,
// and the deck, parapets, arches and cables swept along the path. The masonry,
// concrete and timber carry the photos the game binds (its bridge surfaces).
//
// On the deck it draws what the game lays there: one to three tracks or a narrow or
// wide road, and on request the overhead line -- a railway's or a tram's -- fixed
// where the game's planner fixes it: to the type's overhead members
// (bridge.overheadMembers) where it has any, otherwise to masts or poles on the deck.

import { resolveParams, type ParamSpec, type ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import type { SurfaceId } from "../surfaces.ts";
import * as bridge from "../sets/bridge.ts";
import * as catenaryStyle from "../sets/catenaryStyle.ts";
import * as roadType from "../sets/roadType.ts";
import { Sketch, type Rgb, type V } from "./sketch.ts";
import { BALLAST_HEIGHT, CONTACT, GAUGE, MAST_SPACING, MESSENGER, RAIL_W, STEEL, WIRE, track } from "./wayKit.ts";

// What the deck carries and its wires are the world's (the lanes a player lays over
// the bridge), so like the span they are preview parameters.
export const BRIDGE_PARAMS: ParamSpec[] = [
  {
    name: "deck", title: "Carries", default: "single", preview: true,
    values: [
      { value: "single", title: "One track" }, { value: "double", title: "Two tracks" }, { value: "triple", title: "Three tracks" },
      { value: "narrowroad", title: "Narrow road" }, { value: "road", title: "Wide road" },
    ],
  },
  { name: "wires", title: "Wires", default: "none", preview: true, values: [{ value: "none", title: "None" }, { value: "tram", title: "Tram" }, { value: "rail", title: "Railway" }] },
  { name: "length", title: "Span", default: "short", preview: true, values: [{ value: "short", title: "60 studs" }, { value: "long", title: "160 studs" }] },
];
const LENGTHS: Record<string, number> = { short: 60, long: 160 };

/**
 * A type's page parameters: what a player picks for a bridge of that type (the set
 * module's TYPE_PARAMS - paint, concrete, masonry, piers, hangers, towers - ordinary
 * parameters, as the game passes them), then the preview's fixture.
 */
export function bridgeParams(type: string): ParamSpec[] {
  return [...(bridge.TYPE_PARAMS[type] ?? []).map((p): ParamSpec => ({ name: p.name, title: p.title, default: p.default, values: p.values.map((v) => ({ ...v })) })), ...BRIDGE_PARAMS];
}
// the values the set module builds with: the type's own parameters, not the fixture's
function typeValues(type: string, p: Record<string, string>): bridge.BridgeParams {
  return Object.fromEntries((bridge.TYPE_PARAMS[type] ?? []).map((q) => [q.name, p[q.name]!]));
}
// The game's decks: n tracks 8 apart on a deck 8n + 1 wide, the path along the
// first track and the deck recentred over them; a road (8 or 16 wide) plus 2,
// centred on its path. `road` names the road type laid on it.
interface DeckSpec { width: number; shift: number; tracks?: number; road?: { plain: string; tram: string } }
const DECKS: Record<string, DeckSpec> = {
  single: { width: 9, shift: 0, tracks: 1 },
  double: { width: 17, shift: 4, tracks: 2 },
  triple: { width: 25, shift: 8, tracks: 3 },
  narrowroad: { width: 10, shift: 0, road: { plain: "narrow_asphalt", tram: "narrow_asphalt_tram" } },
  road: { width: 18, shift: 0, road: { plain: "wide_asphalt", tram: "wide_asphalt_tram" } },
};
// the game's deck support height (the ballast bed's underside) and its overhead-wire
// clearance, deck-local: the railhead (1.528 over the path, 0.67 of it below the deck
// top, the slab 0.4 above its centre) + the messenger wire (10.6) + 1.3 of margin
// (webapp core/rail/Bridge.ts OVERHEAD_CLEARANCE_Y)
const SUPPORT_Y = 0.67, CLEARANCE_Y = 1.528 - 0.67 + 0.4 + 10.6 + 1.3;

// the surface each material draws with (its colour is the box's own, bridge.COLORS)
const SURFACE: Partial<Record<bridge.BridgeMaterial, SurfaceId>> = {
  timber: "bridge-timber", deck: "bridge-deck", parapet: "bridge-parapet", pier: "bridge-pier",
  tower: "bridge-tower", stone: "bridge-stone", brick: "bridge-brick",
};
const KIND: Partial<Record<bridge.BridgeMaterial, string>> = { steel: "steel", cable: "cable" };

// The ground the preview stands the bridge over: a valley between two banks, as
// the game lays a bridge from bank to bank. Each bank is level with the track bed
// behind the bridge's end, drops steeply under its abutment and then slopes down
// to the valley floor (y = 0). Stations along x, the profile linear between them.
interface Ground { xs: number[]; ys: number[] }
const BANK_BELOW_DECK = 0.6, BANK_BACK = 6, BANK_SLOPE = 1.1, BANK_STEP = 6;
function valley(length: number, y: number): Ground {
  const top = y + SUPPORT_Y - BANK_BELOW_DECK, half = length / 2;
  // under the breast wall the bank falls BANK_STEP studs, then slopes to the floor
  const step = Math.min(BANK_STEP, top * 0.5), run = Math.min((top - step) * BANK_SLOPE, half - 4);
  const toe = top - step - run / BANK_SLOPE;
  const xs = [-half - BANK_BACK, -half - 1.6, -half + 0.4, -half + 0.4 + run, half - 0.4 - run, half - 0.4, half + 1.6, half + BANK_BACK];
  const ys = [top, top, top - step, toe, toe, top - step, top, top];
  return { xs, ys };
}
function groundAt(g: Ground, x: number): number {
  if (x <= g.xs[0]!) return g.ys[0]!;
  for (let i = 1; i < g.xs.length; i++) {
    if (x <= g.xs[i]!) { const t = (x - g.xs[i - 1]!) / Math.max(g.xs[i]! - g.xs[i - 1]!, 1e-9); return g.ys[i - 1]! + (g.ys[i]! - g.ys[i - 1]!) * t; }
  }
  return g.ys[g.ys.length - 1]!;
}
// what stands on the ground is sunk a little into it, so no face lies on the ground's
const SINK = 0.1;
const GROUND_COLOR: Rgb = [126, 146, 92];

interface Fixture { list: bridge.BridgeBox[]; path: bridge.BridgePathGeom; y: number; length: number; deck: DeckSpec; wires: string; ground: Ground }
/** The bridge the set module builds over its valley, the path raised until nothing dips below the valley floor. */
function fixture(values: ParamValues | undefined, type: string): Fixture {
  const p = resolveParams(bridgeParams(type), values) as Record<string, string>;
  const length = LENGTHS[p.length!]!, deck = DECKS[p.deck!]!;
  const pathAt = (y: number) => bridge.pathFromPoints([{ x: -length / 2, y, z: 0 }, { x: length / 2, y, z: 0 }], deck.width, deck.shift, SUPPORT_Y, CLEARANCE_Y)!;
  const at = (y: number): Fixture => {
    const ground = valley(length, y);
    return { list: bridge.buildBridge(type, pathAt(y), (x) => groundAt(ground, x) - SINK, undefined, {}, typeValues(type, p)), path: pathAt(y), y, length, deck, wires: p.wires!, ground };
  };
  const first = at(14);
  const s = new Sketch();
  draw(s, first.list);
  return s.low < -SINK - 1e-6 ? at(14 - s.low - SINK) : first;
}
/** The valley under the bridge: a block of ground as wide as the deck and its surroundings. */
function drawGround(s: Sketch, f: Fixture): void {
  const half = f.deck.width / 2 + 4, bottom = -1;
  s.wall(s.mat("ground", GROUND_COLOR), f.ground.xs.map((x): V => [x, 0, f.deck.shift]), -half, half, f.ground.xs.map(() => bottom), f.ground.ys);
}

const WIRE_COLOR: Rgb = [60, 60, 65], MAST_COLOR: Rgb = [90, 105, 45], FOOTING_COLOR: Rgb = [226, 224, 220], INSULATOR_COLOR: Rgb = [120, 95, 55];

/** The tracks or the road on the deck; returns each lane's lateral offset and running surface. */
function lanes(s: Sketch, f: Fixture): Array<{ z: number; top: number }> {
  const deckTop = f.y + SUPPORT_Y;
  if (f.deck.tracks) {
    const out: Array<{ z: number; top: number }> = [];
    for (let i = 0; i < f.deck.tracks; i++) {
      const z = 8 * i;
      out.push({ z, top: track(s, f.length, z, { color: [180, 180, 170], surface: "rail-tie-concrete" }, false, deckTop + BALLAST_HEIGHT, 5, deckTop) });
    }
    return out;
  }
  // the road: its carriageway and raised shoulders on the deck, a centre line, and
  // with wires the tram type's embedded tracks
  const t = roadType.TYPE_META[f.wires === "none" ? f.deck.road!.plain : f.deck.road!.tram]!;
  const carriage = t.width - 2 * t.shoulder.width, top = deckTop + 0.2;
  s.box(s.mat("pavement", t.surface.color, "road-asphalt"), { cx: 0, cy: deckTop + 0.1, cz: f.deck.shift, sx: f.length, sy: 0.2, sz: carriage });
  for (const side of [-1, 1]) {
    s.box(s.mat("kerb", t.shoulder.color, "road-pavement"), { cx: 0, cy: deckTop + 0.175, cz: f.deck.shift + side * (carriage + t.shoulder.width) / 2, sx: f.length, sy: 0.35, sz: t.shoulder.width });
  }
  if (t.centerLine) {
    const line = s.mat("paint", t.centerLine.color);
    for (let x = -f.length / 2; x + t.centerLine.dash <= f.length / 2; x += t.centerLine.dash + t.centerLine.gap) {
      s.box(line, { cx: x + t.centerLine.dash / 2, cy: top + 0.03, cz: f.deck.shift, sx: t.centerLine.dash, sy: 0.06, sz: t.centerLine.width });
    }
  }
  for (const z of t.tramTracks) for (const side of [-1, 1]) s.box(s.mat("steel", STEEL), { cx: 0, cy: top + 0.03, cz: f.deck.shift + z + side * GAUGE / 2, sx: f.length, sy: 0.06, sz: RAIL_W });
  return t.tramTracks.map((z) => ({ z: f.deck.shift + z, top }));
}

/** The overhead line over every lane, fixed as the game's planner fixes it. */
function wires(s: Sketch, f: Fixture, type: string, over: Array<{ z: number; top: number }>): void {
  if (f.wires === "none" || !over.length) return;
  const rail = f.wires === "rail";
  const wire = s.mat("wire", WIRE_COLOR), column = s.mat("steel", MAST_COLOR), insulator = s.mat("insulator", INSULATOR_COLOR);
  const footing = s.mat("concrete", FOOTING_COLOR, "rail-footing");
  const deckTop = f.y + SUPPORT_Y, localZero = f.y + SUPPORT_Y - bridge.DECK_THICKNESS / 2;
  const contactY = (l: { top: number }): number => l.top + CONTACT;
  const messengerY = (l: { top: number }): number => l.top + MESSENGER;
  // the wires themselves, the whole length over every lane
  for (const l of over) {
    s.box(wire, { cx: 0, cy: contactY(l), cz: l.z, sx: f.length, sy: WIRE, sz: WIRE });
    if (rail) s.box(wire, { cx: 0, cy: messengerY(l), cz: l.z, sx: f.length, sy: WIRE, sz: WIRE });
  }
  const highest = Math.max(...over.map((l) => (rail ? messengerY(l) : contactY(l))));
  const members = bridge.overheadMembers(type, f.length, f.deck.width, CLEARANCE_Y);
  if (members.length) {
    for (const m of members) {
      // a span member carries a cross-span wire between its verticals just above the line
      const [a, b] = bridge.overheadMemberEndpoints(f.path, m, highest + 0.6 - localZero);
      if (m.kind === "span") s.bar(wire, v3(a), v3(b), WIRE * 1.5);
      for (const l of over) {
        const from = a.y, to = rail && from > messengerY(l) + 0.2 ? messengerY(l) : contactY(l);
        s.bar(column, [a.x, from, l.z], [a.x, to, l.z], WIRE * 1.5);
        if (to !== contactY(l)) s.bar(column, [a.x, to, l.z], [a.x, contactY(l), l.z], WIRE * 1.5);
        s.box(insulator, { cx: a.x, cy: contactY(l), cz: l.z, sx: 0.25, sy: 0.25, sz: 0.25 });
      }
    }
    return;
  }
  // nothing overhead: masts (a railway) or poles (a tram) on the deck, inside the parapets
  const edge = f.deck.width / 2 - 0.9;
  const support = (): catenaryStyle.CatenaryPart[] => {
    if (!rail) {
      return catenaryStyle.pole("tram_pole", { offset: f.deck.shift + edge, offsets: over.map((l) => l.z), groundY: deckTop, trackYs: over.map((l) => l.top), wireLift: CONTACT, deck: true, deckRise: 0, wire: WIRE });
    }
    const uprights = over.length > 1 ? [f.deck.shift - edge, f.deck.shift + edge] : [f.deck.shift + edge];
    return catenaryStyle.mast("rail_mast", { uprights, drops: over.map((l) => l.z), deck: true, groundY: deckTop, railTop: over[0]!.top - deckTop, contact: CONTACT, messenger: MESSENGER, deckRise: 0, deckFootingWidth: 0.8, wire: WIRE });
  };
  const parts = support();
  for (let x = -f.length / 2 + 8; x <= f.length / 2 - 4; x += MAST_SPACING) {
    for (const p of parts) {
      const mat = p.material === "footing" ? footing : p.material === "insulator" ? insulator : p.material === "wire" ? wire : column;
      // the support's cross-section is lateral by height: lateral runs along the preview's z
      if (p.shape === "box") s.box(mat, { cx: x + p.along, cy: p.y, cz: p.x, sx: p.sz, sy: p.sy, sz: p.sx });
      else if (p.shape === "bar") s.bar(mat, [x, p.ay, p.ax], [x, p.by, p.bx], p.thick);
      else s.pole(mat, x, p.x, p.y0, p.y1, (p.radius + p.bottomRadius) / 2);
    }
  }
}

const v3 = (p: bridge.Vec3): V => [p.x, p.y, p.z];

function draw(s: Sketch, list: readonly bridge.BridgeBox[]): void {
  for (const b of list) {
    const mat = s.mat(KIND[b.material] ?? b.material, b.color ?? bridge.COLORS[b.material], SURFACE[b.material]);
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

/** Any list of bridge boxes drawn as the previews draw them (the budget test counts these). */
export function bridgeMesh(list: readonly bridge.BridgeBox[]): MeshBuilder {
  const s = new Sketch();
  draw(s, list);
  return s.build("bridge");
}
export function bridgePreview(values: ParamValues | undefined, type: string): MeshBuilder {
  const f = fixture(values, type);
  const s = new Sketch();
  drawGround(s, f);
  draw(s, f.list);
  wires(s, f, type, lanes(s, f));
  return s.build("bridge");
}
export function bridgePreviewLod(values: ParamValues | undefined, type: string): MeshBuilder {
  const s = new Sketch();
  draw(s, bridge.lowDetailBoxes(fixture(values, type).list));
  return s.build("bridge");
}
