// The bridge types (docs/models/sets.md): what a bridge is built as. The game plans
// where a bridge stands -- the path it spans, its grade profile, the lanes its deck
// carries -- and hands this module the path as plain points; a type is a function
// over that path and the terrain under it, run once per structural span, with its
// span policy (how long a span may be before the superstructure repeats), the style
// of the piers between spans, and the members that cross over the deck (what an
// overhead line may be fixed to) alongside it. The kit the types share -- sampling
// the path, its deck frame, the box, strut, wall and ribbon shapes, piers and
// abutments -- lives here too, so the site's preview and the game run one copy.
//
// Every box standing on the terrain is tagged `ground` (the game charts those piers
// for ships and keeps them clear); the `part` tags decide what the game's distant
// level of detail keeps.
//
// Frame: world space. A path point is the rail (or road) at its stored height; the
// deck top sits `supportY` above it, and `clearanceY` is the deck-local height every
// member crossing over the deck must clear -- both the game's, carried on the path.
//
// Pure data and functions, no imports: bundled into export/sets/bridge.js.

export interface Vec3 { x: number; y: number; z: number }

/** The bridge's path as the game hands it: its points, their distances, the deck and the game's heights. */
export interface BridgePathGeom {
  points: Vec3[];
  distances: number[];
  length: number;
  deckWidth: number;
  /** The lane recentering: how far the deck's centre sits right of the path. */
  shiftAmount: number;
  /** The deck top above a path point (the track bed's underside). */
  supportY: number;
  /** The deck-local height every member over the deck must clear (the overhead wires). */
  clearanceY: number;
}

export type TerrainHeightFn = (x: number, z: number) => number;
export interface SpanRange { fromDistance: number; toDistance: number }

/** One type's span policy: the longest structural span before its superstructure repeats, or none. */
export interface BridgeTypeData { maxSpan: number | null }

// --- dimensions (studs) ---
export const DECK_THICKNESS = 0.8;
export const PARAPET_HEIGHT = 1.6;
export const PARAPET_THICKNESS = 0.4;
const PIER_SPACING = 25; // approx spacing between piers (a pier is also placed at each end)
const PIER_WIDTH = 1.6;
const MIN_PIER_DROP = 1; // min drop from deck bottom to terrain before a pier renders

export const TYPE_META: Record<string, BridgeTypeData> = {
  beam: { maxSpan: null },
  truss: { maxSpan: null },
  cantilever: { maxSpan: 90 },
  arch: { maxSpan: 80 },
  stone_arch: { maxSpan: 28 },
  brick_arch: { maxSpan: 28 },
  tied_arch: { maxSpan: 100 },
  suspension: { maxSpan: 140 },
  cable_stayed: { maxSpan: 120 },
  plate_girder: { maxSpan: 60 },
  timber_trestle: { maxSpan: null },
  box_girder: { maxSpan: 65 },
  deck_truss: { maxSpan: 65 },
  network_arch: { maxSpan: 100 },
};

/** Divide a bridge of `length` into equal structural spans of at most the type's maxSpan. */
export function getStructuralSpanRanges(type: string, length: number): SpanRange[] {
  if (typeof length !== "number" || length <= 0) return [];
  const maxSpan = TYPE_META[type]?.maxSpan;
  if (!maxSpan) return [{ fromDistance: 0, toDistance: length }];
  const spanCount = Math.max(1, Math.ceil(length / maxSpan));
  const spanLength = length / spanCount;
  const ranges: SpanRange[] = [];
  for (let i = 0; i < spanCount; i++) {
    ranges.push({ fromDistance: spanLength * i, toDistance: i === spanCount - 1 ? length : spanLength * (i + 1) });
  }
  return ranges;
}

// A curve along the path sampled where it bends: subdivide until the midpoint lies
// within `tolerance` of the chord, from the given anchor fractions.
export function adaptiveCurvePoints(at: (t: number) => Vec3, anchors: number[], tolerance = 0.06): Vec3[] {
  const stations = [...new Set(anchors.map((t) => Math.max(0, Math.min(1, t))))].sort((a, b) => a - b);
  const out: Vec3[] = [at(stations[0]!)];
  let subdivisions = 0;
  const visit = (a: number, b: number, p: Vec3, q: Vec3, depth: number): void => {
    const mid = (a + b) / 2, m = at(mid);
    const error = Math.hypot(m.x - (p.x + q.x) / 2, m.y - (p.y + q.y) / 2, m.z - (p.z + q.z) / 2);
    if (error > tolerance && depth < 8 && subdivisions < 256) {
      subdivisions++;
      visit(a, mid, p, m, depth + 1); visit(mid, b, m, q, depth + 1);
    } else if (Math.hypot(q.x - out[out.length - 1]!.x, q.y - out[out.length - 1]!.y, q.z - out[out.length - 1]!.z) > 1e-5) out.push(q);
  };
  for (let i = 1; i < stations.length; i++) visit(stations[i - 1]!, stations[i]!, at(stations[i - 1]!), at(stations[i]!), 0);
  return out;
}

function appendPathPoint(points: Vec3[], p: Vec3): void {
  const prev = points[points.length - 1];
  if (prev && Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z) < 0.05) return;
  points.push(p);
}

/** A path from its points, or null when it is too short to carry a deck. */
export function pathFromPoints(points: Vec3[], deckWidth: number, shiftAmount: number, supportY: number, clearanceY: number): BridgePathGeom | null {
  if (points.length < 2) return null;
  const distances = [0];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1]!.x - points[i]!.x, points[i + 1]!.y - points[i]!.y, points[i + 1]!.z - points[i]!.z);
    if (len > 0.001) total += len;
    distances[i + 1] = total;
  }
  if (total < 0.1) return null;
  return { points, distances, length: total, deckWidth, shiftAmount, supportY, clearanceY };
}

// --- superstructure members that cross the deck ---------------------------
//
// The geometry below is shared with the builders further down, because it is
// also what an overhead line has to hang from: a fixing may only be tied where
// the structure actually crosses over the track, at the height it crosses. The
// catenary planner reads it through `overheadMembers` and puts a wire fixing at
// each member, instead of on a rhythm of its own that lands on thin air.

// truss: side walls the full span, with top lateral bracing every other panel.
// The bracing is what an overhead line hangs from, so the walls have to stand
// clear above both wires rather than merely enclosing them.
// All overhead types share the highest railway/tram wire envelope, `clearanceY`
// (the game's, carried on the path). Dimensions are deck-local; the underside of a
// crossbeam must clear this plane.
const trussHeight = (clearanceY: number): number => Math.max(13, clearanceY + 0.4);
const TRUSS_CHORD = 0.4;
const TRUSS_PANEL = 8;
const trussTopY = (clearanceY: number): number => DECK_THICKNESS / 2 + trussHeight(clearanceY) - TRUSS_CHORD / 2;
const trussPanelCount = (length: number): number => Math.max(2, Math.floor(length / TRUSS_PANEL));

// cantilever: the only members crossing over the deck are the two tower portals
const CANTILEVER_TOWER_T = [1 / 4, 3 / 4];
const CANTILEVER_TOWER_HEIGHT = 14;
const cantileverTowerTopY = (): number => DECK_THICKNESS / 2 + CANTILEVER_TOWER_HEIGHT;

// tied arch: transverse struts between the two arches at fifths of the span
const TIED_ARCH_THICKNESS = 0.8;
const TIED_ARCH_STRUT_T = [1, 2, 3, 4, 5].map((i) => i / 6);
const tiedArchHeight = (length: number, clearanceY: number): number => Math.max(clearanceY + 1.2, Math.min(length * 0.35, 18));
const tiedArchTopY = (length: number, t: number, clearanceY: number): number =>
  DECK_THICKNESS / 2 + tiedArchHeight(length, clearanceY) * (1 - (2 * t - 1) * (2 * t - 1));

// Keep the crown fixing even on the shortest span; never put a transverse
// member below the wire envelope just because the side arch is low there.
const tiedArchStruts = (length: number, clearanceY: number): number[] => TIED_ARCH_STRUT_T.filter((t) => tiedArchTopY(length, t, clearanceY) - TIED_ARCH_THICKNESS / 2 >= clearanceY);

// cable-stayed: the stays are diagonal and stay at the deck edges; the members
// crossing over the track are the two towers (legs plus a crossbeam on top)
const CABLE_STAYED_TOWER_T = [1 / 3, 2 / 3];
const CABLE_STAYED_TOWER_WIDTH = 2.0;
const cableStayedTowerHeight = (length: number, clearanceY: number): number => Math.max(clearanceY + 2, Math.min(length * 0.3, 22));
const cableStayedTowerHalfWidth = (deckWidth: number): number => deckWidth / 2 + 0.3;

// suspension: vertical hangers from deck to main cable, between the towers
const SUSPENSION_TOWER_T = [0.25, 0.75];
const suspensionCableHalfWidth = (deckWidth: number): number => deckWidth / 2 + 0.3;
const suspensionHangerT = (): number[] =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => SUSPENSION_TOWER_T[0] + ((SUSPENSION_TOWER_T[1] - SUSPENSION_TOWER_T[0]) * i) / 10);

// One place a bridge's superstructure passes over the track, as a fraction
// along the bridge path. A "point" member crosses the centreline at `localY`
// (deck-local, deck centre = 0), so a wire can be taken straight up to it; a
// "span" member is a pair of VERTICALS `halfWidth` either side, between which a
// perpendicular wire can be strung at whatever height suits.
export type BridgeOverheadMember =
  | { t: number; kind: "point"; localY: number }
  | { t: number; kind: "span"; halfWidth: number };

// The members within ONE structural span, as fractions of that span.
function spanOverheadMembers(bridgeType: string, spanLength: number, deckWidth: number, clearanceY: number): BridgeOverheadMember[] {
  switch (bridgeType) {
    case "truss": {
      // the top lateral bracing, every other panel node
      const panels = trussPanelCount(spanLength);
      const out: BridgeOverheadMember[] = [];
      for (let i = 0; i <= panels; i += 2) out.push({ t: i / panels, kind: "point", localY: trussTopY(clearanceY) });
      return out;
    }
    case "cantilever":
      return CANTILEVER_TOWER_T.map((t) => ({ t, kind: "point", localY: cantileverTowerTopY() }));
    case "tied_arch":
    case "network_arch":
      return tiedArchStruts(spanLength, clearanceY).map((t) => ({ t, kind: "point", localY: tiedArchTopY(spanLength, t, clearanceY) }));
    // The two cable types are strung BETWEEN their towers rather than taken up
    // to them: the tower crossbeam stands as much as 22 studs over the deck, and
    // a wire reaching that far reads as a mast, not a fixing. The tower legs run
    // from the deck up past it, so a perpendicular wire meets them on the way.
    case "cable_stayed":
      return CABLE_STAYED_TOWER_T.map((t) => ({ t, kind: "span", halfWidth: cableStayedTowerHalfWidth(deckWidth) }));
    case "suspension":
      return SUSPENSION_TOWER_T.map((t) => ({ t, kind: "span", halfWidth: suspensionCableHalfWidth(deckWidth) }));
    default:
      return [];
  }
}

// Every member of a bridge, as fractions of the WHOLE bridge path.
//
// The superstructure repeats per STRUCTURAL SPAN: every type with a
// `maxSpanLength` has its builder run once per span over a clipped path
// (buildBridgeBoxes), so its towers, struts and bracing recur in each one and
// its span-proportional heights are measured against the SPAN, not the bridge.
// Reading the members off the whole length instead put every fixing on a bridge
// long enough to need two spans somewhere the structure is not -- including the
// pier between two arches, where there is nothing overhead at all.
//
// Empty for the types with nothing over the deck (the flat ones, and the arches
// whose arch passes BELOW it), which is what tells the planner to use
// deck-mounted masts instead.
export function overheadMembers(type: string, length: number, deckWidth: number, clearanceY: number): BridgeOverheadMember[] {
  if (length <= 0) return [];
  const out: BridgeOverheadMember[] = [];
  for (const range of getStructuralSpanRanges(type, length)) {
    const spanLength = range.toDistance - range.fromDistance;
    if (spanLength <= 0) continue;
    const whole = (t: number) => (range.fromDistance + t * spanLength) / length;
    for (const m of spanOverheadMembers(type, spanLength, deckWidth, clearanceY)) {
      out.push(m.kind === "point"
        ? { t: whole(m.t), kind: "point", localY: m.localY }
        : { t: whole(m.t), kind: "span", halfWidth: m.halfWidth });
    }
  }
  return out;
}

function pathSample(g: BridgePathGeom, distance: number): { point: Vec3; tangent: Vec3 } {
  const d = Math.min(Math.max(distance, 0), g.length);
  for (let i = 0; i < g.points.length - 1; i++) {
    const d1 = g.distances[i + 1];
    if (d <= d1 || i === g.points.length - 2) {
      const a = g.points[i];
      const b = g.points[i + 1];
      const span = Math.max(d1 - g.distances[i], 0.001);
      const t = Math.min(Math.max((d - g.distances[i]) / span, 0), 1);
      return {
        point: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t },
        tangent: unit(b.x - a.x, b.y - a.y, b.z - a.z),
      };
    }
  }
  const a = g.points[g.points.length - 2];
  const b = g.points[g.points.length - 1];
  return { point: b, tangent: unit(b.x - a.x, b.y - a.y, b.z - a.z) };
}
function unit(x: number, y: number, z: number): Vec3 {
  const len = Math.hypot(x, y, z);
  return len < 1e-6 ? { x: 0, y: 0, z: 0 } : { x: x / len, y: y / len, z: z / len };
}
function pathRight(tangent: Vec3): Vec3 {
  const len = Math.hypot(tangent.x, tangent.z);
  if (len < 0.001) return { x: 1, y: 0, z: 0 };
  return { x: -tangent.z / len, y: 0, z: tangent.x / len };
}
function pathWorldPoint(g: BridgePathGeom, distance: number, localX: number, localY: number): Vec3 {
  const { point, tangent } = pathSample(g, distance);
  const right = pathRight(tangent);
  const lateral = g.shiftAmount + localX;
  return {
    x: point.x + right.x * lateral,
    y: point.y + g.supportY - DECK_THICKNESS / 2 + localY,
    z: point.z + right.z * lateral,
  };
}

// The same transverse frame the mesh builders use, including lane recentering.
// Catenary intersects this line with each track instead of inventing a new
// member rhythm (and a new bridge centre) for every parallel lane.
export function overheadMemberEndpoints(g: BridgePathGeom, member: BridgeOverheadMember, spanLocalY: number): [Vec3, Vec3] {
  const halfWidth = member.kind === "span" ? member.halfWidth : g.deckWidth / 2;
  const y = member.kind === "point" ? member.localY : spanLocalY;
  return [pathWorldPoint(g, member.t * g.length, -halfWidth, y), pathWorldPoint(g, member.t * g.length, halfWidth, y)];
}
function pathYaw(g: BridgePathGeom, distance: number): number {
  const { tangent } = pathSample(g, distance);
  return Math.atan2(tangent.x, tangent.z);
}
function clipPathGeom(g: BridgePathGeom, fromDistance: number, toDistance: number): BridgePathGeom | null {
  const startD = Math.min(Math.max(fromDistance, 0), g.length);
  const endD = Math.min(Math.max(toDistance, 0), g.length);
  if (endD - startD < 0.1) return null;
  const points: Vec3[] = [];
  appendPathPoint(points, pathSample(g, startD).point);
  for (let i = 1; i < g.points.length - 1; i++) {
    const distance = g.distances[i];
    if (distance > startD + 0.001 && distance < endD - 0.001) appendPathPoint(points, g.points[i]);
  }
  appendPathPoint(points, pathSample(g, endD).point);
  return pathFromPoints(points, g.deckWidth, g.shiftAmount, g.supportY, g.clearanceY);
}
// --- box descriptor (the StationBox analog; world-space, tagged by shape) ---
export type BridgeMaterial = "timber" | "deck" | "parapet" | "pier" | "steel" | "stone" | "brick" | "cable" | "tower";
// "span": box from a->b, length on local Z, up = world Y (yaw+pitch). "strut":
// square cross-section, length on local Y from a->b. "box": yaw-aligned size box.
// "ribbon": a cross-section swept along a centerline -- see below.
export type BridgePart = "deck" | "support" | "frame" | "detail";
export type BridgeBox = { part?: BridgePart; ground?: true } & (
  | { shape: "span"; a: Vec3; b: Vec3; w: number; h: number; material: BridgeMaterial }
  | { shape: "strut"; a: Vec3; b: Vec3; thick: number; material: BridgeMaterial }
  | { shape: "box"; center: Vec3; size: Vec3; yaw: number; material: BridgeMaterial; topScale?: number }
  | { shape: "ribbon"; points: Vec3[]; profile: RibbonProfilePoint[]; material: BridgeMaterial; sampled?: boolean }
  // "wall": a vertical slab of VARYING height swept along `points` (world-space
  // stations): laterally it spans [u0, u1] along the renderer's perpendicular
  // (the same frame ribbon profiles use), vertically bottoms[i]..tops[i]
  // (absolute world Y) at station i. All three arrays run in lockstep. Like the
  // ribbon it exists because a chain of boxes cannot follow a curve without the
  // joints overlapping or notching open -- but unlike the ribbon its
  // cross-section changes along the path (a masonry spandrel wall / arch band).
  | { shape: "wall"; points: Vec3[]; u0: number; u1: number; bottoms: number[]; tops: number[]; material: BridgeMaterial });

// One point of a ribbon cross-section: lateral offset from the centerline (u,
// along the RENDERER's perpendicular -- (tz,-tx), not this module's pathRight;
// pushRibbon converts) and height above it (v), counter-clockwise in the (u, v)
// plane. The deck and its parapets are RIBBONS, not chains of span boxes: a slab
// cut into chords is rotated against its neighbours on a curve, so the chords
// overlap on the inside of the bend and notch open on the outside (visible as
// gaps in the parapet). The renderer sweeps the profile with a mitred joint at
// every centerline point, which turns those rectangles into trapeziums that butt
// together -- render/sweep.ts.
export type RibbonProfilePoint = { u: number; v: number };

function dist3(a: Vec3, b: Vec3): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}
function pushStrut(out: BridgeBox[], a: Vec3, b: Vec3, thick: number, material: BridgeMaterial, part: BridgePart = "detail"): void {
  if (dist3(a, b) < 0.05) return;
  out.push({ shape: "strut", a, b, thick, material, part });
}
function pushBox(out: BridgeBox[], g: BridgePathGeom, distance: number, lx: number, ly: number, size: Vec3, material: BridgeMaterial, part: BridgePart = "detail"): void {
  out.push({ shape: "box", center: pathWorldPoint(g, distance, lx, ly), size, yaw: pathYaw(g, distance), material, part });
}
// One varying-height wall along the path: a station at every `distances[i]`,
// `w` wide about lateral offset `lx` (this module's frame, so the sign flips on
// the way into the descriptor -- see pushRibbon), spanning bottoms[i]..tops[i]
// in deck-local Y (relative to the slab centre, like every other localY here).
// The stations are the descriptor's points; the renderer mitres between them,
// so consecutive stations butt exactly instead of overlapping like box slices.
function pushWall(out: BridgeBox[], g: BridgePathGeom, distances: number[], lx: number, w: number, bottoms: number[], tops: number[], material: BridgeMaterial): void {
  if (distances.length < 2) return;
  const points: Vec3[] = [];
  const bottomYs: number[] = [];
  const topYs: number[] = [];
  for (let i = 0; i < distances.length; i++) {
    const p = pathWorldPoint(g, distances[i], 0, 0); // slab centre; shiftAmount baked into the station
    points.push(p);
    bottomYs.push(p.y + bottoms[i]);
    topYs.push(p.y + tops[i]);
  }
  const u = -lx; // renderer's perpendicular is the opposite of pathRight
  out.push({ shape: "wall", points, u0: u - w / 2, u1: u + w / 2, bottoms: bottomYs, tops: topYs, material, part: "frame" });
}

// The deck centerline: every path point lifted to the middle of the slab. The
// lane recentering (shiftAmount) is NOT baked in here -- it goes into the profile
// with the rest of the cross-section, so the miter carries it around a bend
// instead of it being a fixed offset off a chord.
function deckCenterline(g: BridgePathGeom): Vec3[] {
  return g.points.map((p) => ({ x: p.x, y: p.y + g.supportY - DECK_THICKNESS / 2, z: p.z }));
}
// `lx` is a lateral offset in THIS module's frame (pathWorldPoint / pathRight,
// which points -tz,tx). The renderer sweeps along the opposite perpendicular
// (tz,-tx -- Railroad's convention, shared with Road/RoadMesh), so the offset
// flips sign on the way into a profile. Only the offset does: the cross-section
// itself is symmetric about it, and its corners must stay counter-clockwise or
// every swept face winds inward and is culled. Getting this wrong is invisible on
// a single-lane deck, which is centred (lx = 0) -- it throws a MULTI-LANE deck to
// the wrong side of the track by twice the lane recentering.
function pushRibbon(out: BridgeBox[], g: BridgePathGeom, lx: number, v: number, w: number, h: number, material: BridgeMaterial, part?: BridgePart): void {
  const points = deckCenterline(g);
  if (points.length < 2) return;
  const u = -lx;
  const hw = w / 2;
  const hh = h / 2;
  out.push({
    shape: "ribbon",
    points,
    // counter-clockwise, so the swept faces wind outward
    profile: [
      { u: u + hw, v: v - hh },
      { u: u + hw, v: v + hh },
      { u: u - hw, v: v + hh },
      { u: u - hw, v: v - hh },
    ],
    material,
    part,
  });
}

function pushCurve(out: BridgeBox[], g: BridgePathGeom, lx: number, y: (t: number) => number, w: number, h: number, material: BridgeMaterial, anchors: number[] = [], part: BridgePart = "frame"): void {
  const points = adaptiveCurvePoints((t) => pathWorldPoint(g, t * g.length, lx, y(t)), [0, ...g.distances.map((d) => d / g.length), ...anchors, 1]);
  out.push({ shape: "ribbon", points, sampled: true, profile: [{ u: w / 2, v: -h / 2 }, { u: w / 2, v: h / 2 }, { u: -w / 2, v: h / 2 }, { u: -w / 2, v: -h / 2 }], material, part });
}

function buildAbutments(out: BridgeBox[], g: BridgePathGeom, heightAt: TerrainHeightFn, material: BridgeMaterial): void {
  for (const d of [0, g.length]) {
    // Wing walls reach the local ground independently, so an approach bank does
    // not leave them floating. Keep them short on steep valley crossings.
    const inward = d === 0 ? 1 : -1;
    for (const side of [-1, 1]) {
      const at = pathWorldPoint(g, d + inward * 1.2, side * (g.deckWidth / 2 - 0.3), 0);
      const bottom = Math.max(heightAt(at.x, at.z), at.y - 3.5);
      const top = at.y + DECK_THICKNESS / 2;
      if (top - heightAt(at.x, at.z) <= MIN_PIER_DROP) continue;
      // a wing wall reaching the ground stands on it (one cut short on a steep crossing does not)
      const ground = bottom === heightAt(at.x, at.z) ? { ground: true as const } : {};
      out.push({ shape: "box", center: { x: at.x, y: (bottom + top) / 2, z: at.z }, size: { x: 0.65, y: top - bottom, z: Math.min(2.4, g.length / 4) }, yaw: pathYaw(g, d), material, part: "detail", ...ground });
    }
  }
}

// --- shared sub-builders ---
// The slab is poured concrete ("deck") on every type but the masonry arches,
// which carry their own stonework across: those pass their masonry material so
// the deck reads as the same stone / brick the arch is built of.
function buildPathDeck(out: BridgeBox[], g: BridgePathGeom, material: BridgeMaterial = "deck"): void {
  pushRibbon(out, g, g.shiftAmount, 0, g.deckWidth, DECK_THICKNESS, material, "deck");
}
// The railing is built of the same material as the slab it stands on: concrete
// ("parapet", the concrete railing's own lighter shade) over a concrete deck, and
// the masonry itself over a stone or brick one -- a light concrete rail along a
// brick parapet reads as a repair, not as the bridge.
function buildPathParapets(out: BridgeBox[], g: BridgePathGeom, material: BridgeMaterial = "parapet"): void {
  const parapetY = DECK_THICKNESS / 2 + PARAPET_HEIGHT / 2;
  const parapetX = g.deckWidth / 2 - PARAPET_THICKNESS / 2;
  for (const side of [1, -1]) {
    pushRibbon(out, g, g.shiftAmount + side * parapetX, parapetY, PARAPET_THICKNESS, PARAPET_HEIGHT, material);
  }
}
function defaultPierDistances(g: BridgePathGeom): number[] {
  const numIntermediate = Math.max(0, Math.floor(g.length / PIER_SPACING) - 1);
  const totalPiers = numIntermediate + 2;
  const d: number[] = [];
  for (let i = 1; i <= totalPiers; i++) d.push((g.length * (i - 1)) / (totalPiers - 1));
  return d;
}
function pushPier(out: BridgeBox[], g: BridgePathGeom, distance: number, width: number, depth: number, material: BridgeMaterial, heightAt: TerrainHeightFn): void {
  const railPoint = pathWorldPoint(g, distance, 0, -DECK_THICKNESS / 2);
  const terrainY = heightAt(railPoint.x, railPoint.z);
  const drop = railPoint.y - terrainY;
  if (drop > MIN_PIER_DROP) {
    out.push({ shape: "box", center: { x: railPoint.x, y: terrainY + drop / 2, z: railPoint.z }, size: { x: width, y: drop, z: depth }, yaw: pathYaw(g, distance), material, part: "support", topScale: material === "pier" && width < g.deckWidth * 0.6 ? 0.72 : undefined, ground: true });
    if (material === "pier" && width < g.deckWidth * 0.6 && drop > 2) {
      pushBox(out, g, distance, 0, -DECK_THICKNESS / 2 - 0.6, { x: Math.max(width, g.deckWidth * 0.78), y: 0.65, z: depth + 0.45 }, material, "support");
      for (const side of [-1, 1]) pushBox(out, g, distance, side * g.deckWidth * 0.26, -DECK_THICKNESS / 2 - 0.15, { x: 0.9, y: 0.3, z: depth * 0.7 }, "steel");
    }
  }
}
function buildPathPiers(out: BridgeBox[], g: BridgePathGeom, heightAt: TerrainHeightFn, pierFractions?: number[], pierWidth = PIER_WIDTH, pierDepth = PIER_WIDTH, material: BridgeMaterial = "pier"): void {
  const distances = pierFractions ? pierFractions.map((f) => g.length * Math.min(Math.max(f, 0), 1)) : defaultPierDistances(g);
  for (const d of distances) pushPier(out, g, d, pierWidth, pierDepth, material, heightAt);
}
function boundaryPierStyle(bridgeType: string, deckWidth: number): { w: number; d: number; material: BridgeMaterial } {
  switch (bridgeType) {
    case "cantilever": return { w: 3.0, d: 3.0, material: "tower" };
    // +0.4 so the pier side faces sit proud of the arch/masonry outer faces
    // (which land on the deckWidth/2 plane). At a structural-span boundary the two
    // spans' masonry overlaps on that plane and would z-fight with a flush pier --
    // visible as flicker once the brick texture makes the coincident faces differ.
    // The wider pier occludes that overlap instead of sharing its plane.
    //
    // All three arch types share this abutment: an arch has to land its thrust on
    // something as wide as it is, and the plain concrete arch used to get the
    // generic square post instead, which read as the arch balancing on a stick.
    case "box_girder": return { w: Math.max(2.8, deckWidth * 0.28), d: 3, material: "pier" };
    case "plate_girder":
    case "deck_truss": return { w: Math.max(2.2, deckWidth * 0.24), d: 2.6, material: "pier" };
    case "arch": return { w: deckWidth + 0.4, d: 4.5, material: "pier" };
    case "stone_arch": return { w: deckWidth + 0.4, d: 4.5, material: "stone" };
    case "brick_arch": return { w: deckWidth + 0.4, d: 4.5, material: "brick" };
    case "network_arch":
    case "tied_arch": return { w: 2.6, d: 2.6, material: "tower" };
    case "suspension": return { w: 4.0, d: 4.0, material: "tower" };
    case "cable_stayed": return { w: 3.6, d: 3.6, material: "tower" };
    default: return { w: PIER_WIDTH, d: PIER_WIDTH, material: "pier" };
  }
}
function buildSpanBoundaryPiers(out: BridgeBox[], g: BridgePathGeom, ranges: SpanRange[], bridgeType: string, heightAt: TerrainHeightFn): void {
  const style = boundaryPierStyle(bridgeType, g.deckWidth);
  const distances: number[] = [];
  for (const range of ranges) {
    for (const distance of [range.fromDistance, range.toDistance]) {
      if (!distances.some((d) => Math.abs(d - distance) < 0.05)) distances.push(distance);
    }
  }
  const spanLength = ranges[0].toDistance - ranges[0].fromDistance;
  const under = bridgeType === "box_girder" ? 2.2 : bridgeType === "deck_truss" ? Math.max(2.5, Math.min(6, spanLength * 0.12)) - DECK_THICKNESS / 2 : 0;
  const supportGeom = under ? { ...g, points: g.points.map((p) => ({ ...p, y: p.y - under })) } : g;
  for (const d of distances) pushPier(out, supportGeom, d, style.w, style.d, style.material, heightAt);
}

// --- per-type builders (Bridge.luau 1932-2260) ---
type BuildOpts = { suppressGroundPiers?: boolean };
type Builder = (out: BridgeBox[], g: BridgePathGeom, opts: BuildOpts, heightAt: TerrainHeightFn) => void;

const buildBeam: Builder = (out, g, _opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  buildPathPiers(out, g, heightAt);
};

const buildTruss: Builder = (out, g, _opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathPiers(out, g, heightAt);
  const CHORD = TRUSS_CHORD;
  const sideX = g.deckWidth / 2 - CHORD / 2;
  const botY = DECK_THICKNESS / 2 + CHORD / 2;
  const topY = trussTopY(g.clearanceY);
  const numPanels = trussPanelCount(g.length);
  const panelLen = g.length / numPanels;
  for (const sx of [sideX, -sideX]) {
    pushCurve(out, g, sx, () => botY, CHORD * 1.35, CHORD, "steel");
    pushCurve(out, g, sx, () => topY, CHORD * 1.35, CHORD, "steel");
    for (let i = 0; i < numPanels; i++) {
      const a = i * panelLen, b = (i + 1) * panelLen;
      pushStrut(out, pathWorldPoint(g, a, sx, botY), pathWorldPoint(g, a, sx, topY), CHORD, "steel", i % 4 === 0 ? "frame" : "detail");
      pushBox(out, g, a, sx, botY + 0.35, { x: 0.12, y: 0.75, z: 0.85 }, "steel");
      pushBox(out, g, a, sx, topY - 0.35, { x: 0.12, y: 0.75, z: 0.85 }, "steel");
      if (i % 2 === 0) pushStrut(out, pathWorldPoint(g, a, sx, botY), pathWorldPoint(g, b, sx, topY), CHORD, "steel");
      else pushStrut(out, pathWorldPoint(g, a, sx, topY), pathWorldPoint(g, b, sx, botY), CHORD, "steel");
    }
    pushStrut(out, pathWorldPoint(g, g.length, sx, botY), pathWorldPoint(g, g.length, sx, topY), CHORD, "steel", "frame");
  }
  for (let i = 0; i <= numPanels; i++) {
    if (i % 2 === 0) {
      const d = i * panelLen;
      pushStrut(out, pathWorldPoint(g, d, -sideX, topY), pathWorldPoint(g, d, sideX, topY), CHORD, "steel", "frame");
    }
  }
};

const buildCantilever: Builder = (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  const towerFractions = CANTILEVER_TOWER_T;
  if (!opts.suppressGroundPiers) buildPathPiers(out, g, heightAt, towerFractions, 3.0, 3.0, "tower");
  const TOWER_HEIGHT = CANTILEVER_TOWER_HEIGHT, TOWER_WIDTH = 1.8, CHORD = 0.5, WEB = 0.32, UNDER_DECK = 5.5;
  const sideX = g.deckWidth / 2 + 0.3;
  const deckTopY = DECK_THICKNESS / 2, deckBottomY = -DECK_THICKNESS / 2;
  const towerTopY = deckTopY + TOWER_HEIGHT, towerBottomY = deckBottomY - UNDER_DECK;
  const endTopY = deckTopY + 1.2, centerTopY = deckTopY + 4.2;
  const endBottomY = deckBottomY - 0.8, centerBottomY = deckBottomY - 0.8;
  const leftTower = g.length * towerFractions[0], center = g.length * 0.5, rightTower = g.length * towerFractions[1];
  const lerp = (a: number, b: number, al: number) => a + (b - a) * Math.min(Math.max(al, 0), 1);
  const topChordY = (d: number): number => {
    if (d <= leftTower) return lerp(endTopY, towerTopY, d / Math.max(leftTower, 0.001));
    if (d <= center) return lerp(towerTopY, centerTopY, (d - leftTower) / Math.max(center - leftTower, 0.001));
    if (d <= rightTower) return lerp(centerTopY, towerTopY, (d - center) / Math.max(rightTower - center, 0.001));
    return lerp(towerTopY, endTopY, (d - rightTower) / Math.max(g.length - rightTower, 0.001));
  };
  const bottomChordY = (d: number): number => {
    if (d <= leftTower) return lerp(endBottomY, towerBottomY, d / Math.max(leftTower, 0.001));
    if (d <= center) return lerp(towerBottomY, centerBottomY, (d - leftTower) / Math.max(center - leftTower, 0.001));
    if (d <= rightTower) return lerp(centerBottomY, towerBottomY, (d - center) / Math.max(rightTower - center, 0.001));
    return lerp(towerBottomY, endBottomY, (d - rightTower) / Math.max(g.length - rightTower, 0.001));
  };
  for (const fraction of towerFractions) {
    const d = g.length * fraction;
    for (const sx of [sideX, -sideX]) pushStrut(out, pathWorldPoint(g, d, sx, towerBottomY), pathWorldPoint(g, d, sx, towerTopY), TOWER_WIDTH, "steel", "frame");
    pushStrut(out, pathWorldPoint(g, d, -sideX, towerTopY), pathWorldPoint(g, d, sideX, towerTopY), TOWER_WIDTH, "steel", "frame");
    pushStrut(out, pathWorldPoint(g, d, -sideX, towerBottomY), pathWorldPoint(g, d, sideX, towerBottomY), TOWER_WIDTH, "steel", "frame");
  }
  const panelCount = Math.max(8, Math.ceil(g.length / 7));
  const panelLength = g.length / panelCount;
  for (const sx of [sideX, -sideX]) {
    pushCurve(out, g, sx, (t) => topChordY(t * g.length), CHORD * 1.3, CHORD, "steel", [0.25, 0.5, 0.75]);
    pushCurve(out, g, sx, (t) => bottomChordY(t * g.length), CHORD * 1.3, CHORD, "steel", [0.25, 0.5, 0.75]);
    for (let i = 0; i < panelCount; i++) {
      const a = i * panelLength, b = (i + 1) * panelLength;
      pushStrut(out, pathWorldPoint(g, a, sx, bottomChordY(a)), pathWorldPoint(g, a, sx, topChordY(a)), WEB, "steel");
      if (i % 2 === 0) pushStrut(out, pathWorldPoint(g, a, sx, bottomChordY(a)), pathWorldPoint(g, b, sx, topChordY(b)), WEB, "steel");
      else pushStrut(out, pathWorldPoint(g, a, sx, topChordY(a)), pathWorldPoint(g, b, sx, bottomChordY(b)), WEB, "steel");
    }
    pushStrut(out, pathWorldPoint(g, g.length, sx, bottomChordY(g.length)), pathWorldPoint(g, g.length, sx, topChordY(g.length)), WEB, "steel");
  }
};

// The plain arch: a CONCRETE deck-arch. Its rib and spandrel columns carry the
// deck the way the piers do, so they share the structural-concrete material --
// only the two masonry arch types (makeArchMasonry) are built of stone or brick.
const buildArch: Builder = (out, g) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  const ARCH_DEPTH = Math.min(g.length * 0.3, 16), ARCH_THICKNESS = 1.2, ARCH_WIDTH = g.deckWidth * 0.9, PILLAR_WIDTH = 0.8;
  const deckBottom = -DECK_THICKNESS / 2;
  // the rib's TOP meets the deck's underside at the crown: measured from its
  // bottom, the rib stood a thickness proud there and broke through the deck
  const archTopY = (t: number) => deckBottom - ARCH_DEPTH * (2 * t - 1) * (2 * t - 1);
  pushCurve(out, g, 0, (t) => archTopY(t) - ARCH_THICKNESS / 2, ARCH_WIDTH, ARCH_THICKNESS, "pier");
  for (let i = 1; i <= 17; i++) {
    const t = i / 18, distance = g.length * t;
    const archTop = archTopY(t);
    const fillH = deckBottom - archTop;
    if (fillH > 0.2) {
      const fillY = (archTop + deckBottom) / 2;
      for (const sx of [g.deckWidth / 2 - PILLAR_WIDTH, -(g.deckWidth / 2 - PILLAR_WIDTH)]) {
        pushBox(out, g, distance, sx, fillY, { x: PILLAR_WIDTH, y: fillH, z: PILLAR_WIDTH }, "pier");
      }
    }
  }
};

// Shared masonry-arch builder. The stone and brick arch bridges are geometrically
// identical and differ only by the masonry material tag, so both come from this
// factory -- which their deck and parapets take too, so the whole bridge is built
// of the one material.
// Each side's spandrel wall and arch band is ONE swept "wall" whose stations
// butt exactly. They used to be chains of boxes -- spandrel slices deliberately
// overlapped by 0.12 studs to hide curve gaps, and neighbouring arch-band boxes
// pitched against each other overlapped at every joint -- and the coplanar
// overlapping faces z-fought as camera-dependent flicker across the whole face.
const makeArchMasonry = (masonry: BridgeMaterial): Builder => (out, g) => {
  buildPathDeck(out, g, masonry);
  buildPathParapets(out, g, masonry);
  const ARCH_DEPTH = Math.min(g.length * 0.55, 14), ARCH_BAND = 1.3, FACE = 1.0, STATION_SPACING = 1.2;
  const sideX = g.deckWidth / 2 - FACE / 2;
  const deckBottom = -DECK_THICKNESS / 2;
  const archSpringY = deckBottom - ARCH_DEPTH, archRise = ARCH_DEPTH * 0.72;
  const openingTopY = (t: number) => {
    const s = 2 * t - 1;
    return archSpringY + archRise * Math.sqrt(Math.max(0, 1 - s * s));
  };
  const stationCount = Math.max(8, Math.ceil(g.length / STATION_SPACING));
  const distances: number[] = [];
  const openTops: number[] = [];
  for (let i = 0; i <= stationCount; i++) {
    const d = (g.length * i) / stationCount;
    distances.push(d);
    openTops.push(openingTopY(d / g.length));
  }
  const spandrelTops = openTops.map(() => deckBottom);
  const bandBottoms = openTops.map((y) => y - ARCH_BAND);
  for (const sx of [sideX, -sideX]) {
    // spandrel wall: from the arch opening's top up to the deck underside
    pushWall(out, g, distances, sx, FACE, openTops, spandrelTops, masonry);
    // arch band tracing the opening, slightly proud of the wall face
    pushWall(out, g, distances, sx, FACE + 0.18, bandBottoms, openTops, masonry);
  }
  // the barrel vault between the two faces, its underside flush with the band's:
  // without it the arch was two face walls, open to the deck from below
  const innerHalf = sideX - (FACE + 0.18) / 2;
  pushWall(out, g, distances, 0, 2 * innerHalf, bandBottoms, openTops, masonry);
};
const buildStoneArch = makeArchMasonry("stone");
const buildBrickArch = makeArchMasonry("brick");

const makeTiedArch = (network: boolean): Builder => (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  if (!opts.suppressGroundPiers) buildPathPiers(out, g, heightAt);
  const ARCH_THICKNESS = TIED_ARCH_THICKNESS;
  const sideX = g.deckWidth / 2 - ARCH_THICKNESS / 2;
  const archTopY = (t: number): number => tiedArchTopY(g.length, t, g.clearanceY);
  for (const sx of [sideX, -sideX]) pushCurve(out, g, sx, archTopY, ARCH_THICKNESS, ARCH_THICKNESS, "steel", tiedArchStruts(g.length, g.clearanceY));
  for (let i = 1; i <= 9; i++) {
    const t = i / 10, distance = g.length * t;
    for (const sx of [sideX, -sideX]) {
      const targets = network ? [Math.max(0.08, t - 0.22), Math.min(0.92, t + 0.22)] : [t];
      for (const anchor of targets) pushStrut(out, pathWorldPoint(g, distance, sx, DECK_THICKNESS / 2), pathWorldPoint(g, g.length * anchor, sx, archTopY(anchor)), 0.2, "cable", network && i % 3 === 0 ? "frame" : "detail");
    }
  }
  for (const t of tiedArchStruts(g.length, g.clearanceY)) {
    const distance = g.length * t;
    pushStrut(out, pathWorldPoint(g, distance, -sideX, archTopY(t)), pathWorldPoint(g, distance, sideX, archTopY(t)), ARCH_THICKNESS, "steel", "frame");
  }
};
const buildTiedArch = makeTiedArch(false);
const buildNetworkArch = makeTiedArch(true);

const buildSuspension: Builder = (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathPiers(out, g, heightAt, opts.suppressGroundPiers ? SUSPENSION_TOWER_T : [0, ...SUSPENSION_TOWER_T, 1], 3.2, 3.2, "tower");
  const TOWER_T = SUSPENSION_TOWER_T;
  // towers tall enough (and the cable's sag shallow enough) that the main
  // cable's lowest point at mid-span still clears both overhead wires of an
  // electric track plus their cross-span fixing
  const TOWER_HEIGHT = Math.max(16, Math.min(g.length * 0.25, 20)), TOWER_WIDTH = 1.8;
  const sideX = suspensionCableHalfWidth(g.deckWidth);
  const towerTopY = DECK_THICKNESS / 2 + TOWER_HEIGHT, deckTopY = DECK_THICKNESS / 2;
  for (const t of TOWER_T) {
    const distance = g.length * t;
    for (const sx of [sideX, -sideX]) pushBox(out, g, distance, sx, DECK_THICKNESS / 2 + TOWER_HEIGHT / 2, { x: TOWER_WIDTH, y: TOWER_HEIGHT, z: TOWER_WIDTH }, "tower", "frame");
    pushStrut(out, pathWorldPoint(g, distance, -sideX, DECK_THICKNESS / 2 + TOWER_HEIGHT - TOWER_WIDTH / 2), pathWorldPoint(g, distance, sideX, DECK_THICKNESS / 2 + TOWER_HEIGHT - TOWER_WIDTH / 2), TOWER_WIDTH, "tower", "frame");
  }
  const SAG = Math.min(TOWER_HEIGHT * 0.45, TOWER_HEIGHT - 13);
  const cableY = (t: number): number => {
    const t1 = TOWER_T[0], t2 = TOWER_T[1];
    if (t <= t1) return deckTopY + (towerTopY - deckTopY) * (t / t1);
    if (t >= t2) return deckTopY + (towerTopY - deckTopY) * ((1 - t) / (1 - t2));
    const s = 2 * ((t - t1) / (t2 - t1)) - 1;
    return towerTopY - SAG * (1 - s * s);
  };
  for (const sx of [sideX, -sideX]) pushCurve(out, g, sx, cableY, 0.3, 0.3, "cable", [...TOWER_T, ...suspensionHangerT()]);
  for (const t of suspensionHangerT()) {
    const distance = g.length * t, topY = cableY(t);
    for (const sx of [sideX, -sideX]) pushStrut(out, pathWorldPoint(g, distance, sx, deckTopY), pathWorldPoint(g, distance, sx, topY), 0.18, "cable");
  }
};

const buildCableStayed: Builder = (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathPiers(out, g, heightAt, opts.suppressGroundPiers ? CABLE_STAYED_TOWER_T : [0, ...CABLE_STAYED_TOWER_T, 1], 3, 3, "tower");
  const TOWER_T = CABLE_STAYED_TOWER_T;
  const TOWER_HEIGHT = cableStayedTowerHeight(g.length, g.clearanceY), TOWER_WIDTH = CABLE_STAYED_TOWER_WIDTH;
  const sideX = cableStayedTowerHalfWidth(g.deckWidth);
  const towerTopY = DECK_THICKNESS / 2 + TOWER_HEIGHT, deckTopY = DECK_THICKNESS / 2;
  for (const t of TOWER_T) {
    const distance = g.length * t;
    for (const sx of [sideX, -sideX]) pushBox(out, g, distance, sx, DECK_THICKNESS / 2 + TOWER_HEIGHT / 2, { x: TOWER_WIDTH, y: TOWER_HEIGHT, z: TOWER_WIDTH }, "tower", "frame");
    pushStrut(out, pathWorldPoint(g, distance, -sideX, DECK_THICKNESS / 2 + TOWER_HEIGHT - TOWER_WIDTH / 2), pathWorldPoint(g, distance, sideX, DECK_THICKNESS / 2 + TOWER_HEIGHT - TOWER_WIDTH / 2), TOWER_WIDTH, "tower", "frame");
  }
  for (let towerIdx = 0; towerIdx < TOWER_T.length; towerIdx++) {
    const towerDistance = g.length * TOWER_T[towerIdx];
    const backEndDistance = towerIdx === 0 ? 0 : g.length;
    const otherTowerDistance = g.length * TOWER_T[1 - towerIdx];
    for (const anchorDistance of [backEndDistance, otherTowerDistance]) {
      for (let i = 1; i <= 4; i++) {
        const distance = towerDistance + ((anchorDistance - towerDistance) * i) / 5;
        for (const sx of [sideX, -sideX]) pushStrut(out, pathWorldPoint(g, towerDistance, sx, towerTopY - TOWER_WIDTH / 2), pathWorldPoint(g, distance, sx, deckTopY), 0.18, "cable", i === 1 || i === 4 ? "frame" : "detail");
      }
    }
  }
};

const buildPlateGirder: Builder = (out, g) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  for (const side of [-1, 1]) {
    const x = side * (g.deckWidth / 2 - 0.45);
    pushCurve(out, g, x, () => 0.15, 0.2, 2.3, "steel");
    for (const y of [-1, 1.3]) pushCurve(out, g, x, () => y, 0.85, 0.22, "steel");
    const panels = Math.max(2, Math.ceil(g.length / 5));
    for (let i = 0; i <= panels; i++) {
      pushBox(out, g, g.length * i / panels, x, 0.15, { x: 0.45, y: 2.1, z: 0.15 }, "steel");
    }
  }
};

const buildBoxGirder: Builder = (out, g) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  // A closed trapezoidal box with a broad top flange. The deck overhang gives
  // the fascia a shadow line without another material or a coplanar surface.
  const top = g.deckWidth * 0.42, bottom = g.deckWidth * 0.29;
  const u = -g.shiftAmount;
  out.push({ shape: "ribbon", points: deckCenterline(g), profile: [
    { u: u + bottom, v: -2.6 }, { u: u + top, v: -0.4 },
    { u: u - top, v: -0.4 }, { u: u - bottom, v: -2.6 },
  ], material: "pier", part: "frame" });
};

const buildDeckTruss: Builder = (out, g) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  const depth = Math.max(2.5, Math.min(6, g.length * 0.12));
  const panels = Math.max(2, Math.ceil(g.length / 7));
  for (const side of [-1, 1]) {
    const x = side * (g.deckWidth / 2 - 0.55);
    for (const y of [-0.65, -depth]) pushCurve(out, g, x, () => y, 0.65, 0.5, "steel");
    for (let i = 0; i <= panels; i++) {
      const d = g.length * i / panels;
      pushStrut(out, pathWorldPoint(g, d, x, -depth), pathWorldPoint(g, d, x, -0.65), 0.38, "steel", i % 3 === 0 || i === panels ? "frame" : "detail");
      if (i < panels) {
        const next = g.length * (i + 1) / panels;
        pushStrut(out, pathWorldPoint(g, d, x, i % 2 ? -0.65 : -depth), pathWorldPoint(g, next, x, i % 2 ? -depth : -0.65), 0.3, "steel");
        pushBox(out, g, d, x, -depth + 0.3, { x: 0.12, y: 0.65, z: 0.8 }, "steel");
      }
    }
  }
};

const buildTimberTrestle: Builder = (out, g, _opts, heightAt) => {
  buildPathDeck(out, g, "timber");
  buildPathParapets(out, g, "timber");
  const count = Math.max(1, Math.ceil(g.length / 12));
  for (const x of [-g.deckWidth * 0.3, g.deckWidth * 0.3]) pushCurve(out, g, x, () => -0.85, 0.6, 0.7, "timber");
  for (let i = 0; i <= count; i++) {
    const d = g.length * i / count;
    const tops: Vec3[] = [], feet: Vec3[] = [];
    for (const side of [-1, 1]) {
      const top = pathWorldPoint(g, d, side * g.deckWidth * 0.29, -1.1);
      const foot = pathWorldPoint(g, d, side * g.deckWidth * 0.4, -1.1);
      foot.y = heightAt(foot.x, foot.z);
      if (top.y - foot.y < MIN_PIER_DROP) continue;
      tops.push(top); feet.push(foot);
      out.push({ shape: "box", center: { ...foot, y: foot.y + 0.2 }, size: { x: 1, y: 0.4, z: 1 }, yaw: pathYaw(g, d), material: "timber", part: "support", ground: true });
      pushStrut(out, { ...foot, y: foot.y + 0.2 }, top, 0.6, "timber", "support");
    }
    pushBox(out, g, d, 0, -1, { x: g.deckWidth * 0.83, y: 0.55, z: 0.75 }, "timber", "support");
    if (tops.length === 2) {
      for (const side of [0, 1]) pushStrut(out, { ...feet[side], y: feet[side].y + 0.5 }, tops[1 - side], 0.26, "timber");
      // Horizontal tie halfway down each bent, omitted by the far mesh.
      const middle = tops.map((p, j) => ({ x: (p.x + feet[j].x) / 2, y: (p.y + feet[j].y) / 2, z: (p.z + feet[j].z) / 2 }));
      pushStrut(out, middle[0], middle[1], 0.35, "timber");
    }
  }
};

const BUILDERS: Record<string, Builder> = {
  plate_girder: buildPlateGirder, timber_trestle: buildTimberTrestle, box_girder: buildBoxGirder, deck_truss: buildDeckTruss, network_arch: buildNetworkArch,
  beam: buildBeam, truss: buildTruss, cantilever: buildCantilever, arch: buildArch,
  stone_arch: buildStoneArch, brick_arch: buildBrickArch, tied_arch: buildTiedArch, suspension: buildSuspension, cable_stayed: buildCableStayed,
};

/**
 * Every box of a `type` bridge along `g` over the terrain `heightAt`. A type with a
 * maxSpan repeats its superstructure per structural span over a clipped path, with
 * shared boundary piers; every bridge closes with its abutments. A type this module
 * does not know builds as a beam bridge.
 */
export function buildBridge(type: string, g: BridgePathGeom, heightAt: TerrainHeightFn): BridgeBox[] {
  const out: BridgeBox[] = [];
  const builder = BUILDERS[type] ?? BUILDERS.beam!;
  const maxSpan = TYPE_META[type]?.maxSpan;
  if (!maxSpan) {
    builder(out, g, {}, heightAt);
    buildAbutments(out, g, heightAt, type === "timber_trestle" ? "timber" : "pier");
    return out;
  }
  const ranges = getStructuralSpanRanges(type, g.length);
  for (const range of ranges) {
    const spanGeom = clipPathGeom(g, range.fromDistance, range.toDistance);
    if (spanGeom) builder(out, spanGeom, { suppressGroundPiers: type !== "cantilever" }, heightAt);
  }
  if (type !== "cantilever") buildSpanBoundaryPiers(out, g, ranges, type, heightAt);
  buildAbutments(out, g, heightAt, type === "stone_arch" ? "stone" : type === "brick_arch" ? "brick" : "pier");
  return out;
}
