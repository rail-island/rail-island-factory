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
  truss: { maxSpan: 64 },
  cantilever: { maxSpan: 90 },
  arch: { maxSpan: 80 },
  stone_arch: { maxSpan: 28 },
  brick_arch: { maxSpan: 28 },
  tied_arch: { maxSpan: 100 },
  suspension: { maxSpan: 140 },
  cable_stayed: { maxSpan: 120 },
  cable_stayed_y: { maxSpan: 120 },
  plate_girder: { maxSpan: 60 },
  timber_trestle: { maxSpan: null },
  box_girder: { maxSpan: 65 },
  deck_truss: { maxSpan: 65 },
  network_arch: { maxSpan: 100 },
};

// The two cable types are one structure over the whole bridge: their towers stand
// at the ends of one or more MAIN spans (each at most the type's maxSpan), shared
// between neighbours, with a back span half a main span long at each end down to
// the abutments. Repeating a whole cable bridge per structural span put a pair of
// towers in every span, each with its own cables down to the deck in between.
const CABLE_TYPES = new Set(["suspension", "cable_stayed", "cable_stayed_y"]);
/** Where a cable bridge's towers stand along a bridge of `length` (distances). */
export function cableTowerDistances(type: string, length: number): number[] {
  const maxMain = TYPE_META[type]?.maxSpan ?? length;
  const mains = Math.max(1, Math.ceil(length / maxMain - 1));
  const main = length / (mains + 1);
  return Array.from({ length: mains + 1 }, (_, i) => main / 2 + i * main);
}

/**
 * Divide a bridge of `length` into its structural spans: equal spans of at most the
 * type's maxSpan, or -- for a cable type -- its back spans and main spans between
 * the towers.
 */
export function getStructuralSpanRanges(type: string, length: number): SpanRange[] {
  if (typeof length !== "number" || length <= 0) return [];
  if (CABLE_TYPES.has(type)) {
    const stops = [0, ...cableTowerDistances(type, length), length];
    return stops.slice(1).map((to, i) => ({ fromDistance: stops[i]!, toDistance: to }));
  }
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
//
// A Pratt through truss: inclined end posts from the bearings up to the first
// top node, verticals at the inner nodes, diagonals sloping down toward mid-span,
// and -- on a span long enough to want it -- a polygonal (Parker) top chord that
// rises toward the middle. The top chord, its crossbeams and the top bracing only
// exist between the first and last inner node.
const trussHeight = (clearanceY: number): number => Math.max(13, clearanceY + 0.4);
const TRUSS_CHORD = 0.4, TRUSS_TOP_CHORD = 0.55;
const TRUSS_PANEL = 8;
const trussPanelCount = (length: number): number => Math.max(4, Math.round(length / TRUSS_PANEL));
// how far the Parker top chord rises at mid-span over its height at the ends
const trussRise = (length: number): number => Math.min(4, Math.max(0, (length - 40) * 0.15));
/**
 * The top chord's centre over inner node `node` of `panels` (deck-local): the
 * truss height at the end nodes, rising on a parabola through the nodes by
 * trussRise at mid-span. Never below the wire envelope.
 */
const trussTopY = (clearanceY: number, length: number, node: number, panels: number): number => {
  const q = (x: number): number => 1 - (2 * x - 1) * (2 * x - 1);
  const qEnd = q(1 / panels);
  const lift = qEnd < 1 ? (q(node / panels) - qEnd) / (1 - qEnd) : 0;
  return DECK_THICKNESS / 2 + trussHeight(clearanceY) - TRUSS_TOP_CHORD / 2 + trussRise(length) * Math.max(0, lift);
};
// the top crossbeams an overhead line hangs from: every other inner node,
// always including both ends of the top chord (the portals)
const trussMemberNodes = (panels: number): number[] => {
  const nodes: number[] = [];
  for (let i = 1; i < panels; i += 2) nodes.push(i);
  if (nodes[nodes.length - 1] !== panels - 1) nodes.push(panels - 1);
  return nodes;
};

// the depths the plain superstructures hang below the slab's underside (their
// piers stop there)
const BEAM_GIRDER_DEPTH = 1.3, BEAM_GIRDER_WIDTH = 1.0, BEAM_GIRDER_X = 0.26;
// a box girder is haunched: its sloping-webbed box BOX_GIRDER_DEPTH deep, and under
// it a parabolic haunch down to BOX_GIRDER_END_DEPTH over the piers
const BOX_GIRDER_DEPTH = 1.8, BOX_GIRDER_END_DEPTH = 3.4, BOX_GIRDER_LIP = 0.08;
const deckTrussDepth = (spanLength: number): number => Math.max(2.5, Math.min(6, spanLength * 0.12));
// the masonry arches' springing, deck-local: where the opening's curve starts
const masonryArchDepth = (spanLength: number): number => Math.min(spanLength * 0.55, 14);
const masonryArchSpringY = (spanLength: number): number => -DECK_THICKNESS / 2 - masonryArchDepth(spanLength);

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
// crossing over the track are the towers (legs plus a crossbeam on top)
const CABLE_STAYED_TOWER_WIDTH = 2.0;
const cableStayedTowerHeight = (main: number, clearanceY: number): number => Math.max(clearanceY + 2, Math.min(main * 0.6, 28));
const cableStayedTowerHalfWidth = (deckWidth: number): number => deckWidth / 2 + 0.3;

// suspension: vertical hangers from the stiffening girders to the main cables
const SUSPENSION_TOWER_WIDTH = 1.8;
const suspensionCableHalfWidth = (deckWidth: number): number => deckWidth / 2 + 0.3;
// towers tall enough (and the cable's sag shallow enough) that the main cable's
// lowest point at mid-span still clears both overhead wires of an electric track
// plus their cross-span fixing
const suspensionTowerHeight = (main: number): number => Math.max(16, Math.min(main * 0.5, 26));
// the distance between a cable type's towers (its main span)
const cableMainSpan = (type: string, length: number): number => length / cableTowerDistances(type, length).length;

// One place a bridge's superstructure passes over the track, as a fraction
// along the bridge path. A "point" member crosses the centreline at `localY`
// (deck-local, deck centre = 0), so a wire can be taken straight up to it; a
// "span" member is a pair of VERTICALS `halfWidth` either side, between which a
// perpendicular wire can be strung at whatever height suits.
export type BridgeOverheadMember =
  | { t: number; kind: "point"; localY: number }
  | { t: number; kind: "span"; halfWidth: number };

// The members within ONE structural span, as fractions of that span.
function spanOverheadMembers(bridgeType: string, spanLength: number, clearanceY: number): BridgeOverheadMember[] {
  switch (bridgeType) {
    case "truss": {
      // the top crossbeams, every other inner node and both portals
      const panels = trussPanelCount(spanLength);
      return trussMemberNodes(panels).map((i) => ({ t: i / panels, kind: "point", localY: trussTopY(clearanceY, spanLength, i, panels) }));
    }
    case "cantilever":
      return CANTILEVER_TOWER_T.map((t) => ({ t, kind: "point", localY: cantileverTowerTopY() }));
    case "tied_arch":
    case "network_arch":
      return tiedArchStruts(spanLength, clearanceY).map((t) => ({ t, kind: "point", localY: tiedArchTopY(spanLength, t, clearanceY) }));
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
  if (CABLE_TYPES.has(type)) {
    // The two cable types are strung BETWEEN their towers rather than taken up
    // to them: the tower crossbeam stands as much as 28 studs over the deck, and
    // a wire reaching that far reads as a mast, not a fixing. The tower legs run
    // from below the deck up past it, so a perpendicular wire meets them.
    const halfWidth = type === "suspension" ? suspensionCableHalfWidth(deckWidth) : cableStayedTowerHalfWidth(deckWidth);
    return cableTowerDistances(type, length).map((d) => ({ t: d / length, kind: "span", halfWidth }));
  }
  const out: BridgeOverheadMember[] = [];
  for (const range of getStructuralSpanRanges(type, length)) {
    const spanLength = range.toDistance - range.fromDistance;
    if (spanLength <= 0) continue;
    const whole = (t: number) => (range.fromDistance + t * spanLength) / length;
    for (const m of spanOverheadMembers(type, spanLength, clearanceY)) {
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
// The lateral direction at a vertex: the mitre between its two segments, scaled
// so an offset along it lies on both segments' offset lines (as the renderer's
// mitred sweep places it).
function vertexRight(g: BridgePathGeom, i: number): Vec3 {
  const n = g.points.length;
  const seg = (k: number): Vec3 => { const a = g.points[k]!, b = g.points[k + 1]!; return pathRight(unit(b.x - a.x, b.y - a.y, b.z - a.z)); };
  if (i <= 0) return seg(0);
  if (i >= n - 1) return seg(n - 2);
  const r0 = seg(i - 1), r1 = seg(i);
  const m = unit(r0.x + r1.x, 0, r0.z + r1.z);
  if (m.x === 0 && m.z === 0) return r1;
  const s = 1 / Math.max(m.x * r1.x + m.z * r1.z, 0.3);
  return { x: m.x * s, y: 0, z: m.z * s };
}
// The lateral direction at a distance: blended between the mitres at the ends of
// its segment, so a constant offset traces a straight line along every segment
// that meets its neighbours exactly. Each segment's own perpendicular instead
// jumped at every vertex, which the curve sampler read as a kink and subdivided
// to its depth limit on every bend.
function pathRightAt(g: BridgePathGeom, distance: number): Vec3 {
  const d = Math.min(Math.max(distance, 0), g.length);
  const last = g.points.length - 2;
  let i = 0;
  while (i < last && d > g.distances[i + 1]!) i++;
  const span = Math.max(g.distances[i + 1]! - g.distances[i]!, 0.001);
  const t = Math.min(Math.max((d - g.distances[i]!) / span, 0), 1);
  const a = vertexRight(g, i), b = vertexRight(g, i + 1);
  return { x: a.x + (b.x - a.x) * t, y: 0, z: a.z + (b.z - a.z) * t };
}
function pathWorldPoint(g: BridgePathGeom, distance: number, localX: number, localY: number): Vec3 {
  const { point } = pathSample(g, distance);
  const right = pathRightAt(g, distance);
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
function pushWall(out: BridgeBox[], g: BridgePathGeom, distances: number[], lx: number, w: number, bottoms: number[], tops: number[], material: BridgeMaterial, part: BridgePart = "frame"): void {
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
  out.push({ shape: "wall", points, u0: u - w / 2, u1: u + w / 2, bottoms: bottomYs, tops: topYs, material, part });
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

function pushCurve(out: BridgeBox[], g: BridgePathGeom, lx: number, y: (t: number) => number, w: number, h: number, material: BridgeMaterial, anchors: number[] = [], part: BridgePart = "frame", from = 0, to = 1): void {
  const inside = (t: number): boolean => t > from && t < to;
  const points = adaptiveCurvePoints((t) => pathWorldPoint(g, t * g.length, lx, y(t)), [from, ...g.distances.map((d) => d / g.length).filter(inside), ...anchors.filter(inside), to]);
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
//
// Each edge carries a cornice -- an edge beam standing a little proud of the slab
// top, overhanging its side and hanging below it -- so the deck reads as a
// structure with a shadow line rather than a plank. Every section here is a
// separate convex ribbon (a renderer caps a convex section safely), and none of
// their faces shares a plane with the slab's.
export const CORNICE_DEPTH: number = 0.65; // below the slab's underside
const CORNICE_RISE = 0.12; // above the slab's top
const CORNICE_OUT = 0.15; // beyond the slab's edge
const CORNICE_IN = 0.55; // inside it
function buildPathDeck(out: BridgeBox[], g: BridgePathGeom, material: BridgeMaterial = "deck", cornice = true): void {
  pushRibbon(out, g, g.shiftAmount, 0, g.deckWidth, DECK_THICKNESS, material, "deck");
  if (!cornice) return;
  const top = DECK_THICKNESS / 2 + CORNICE_RISE, bottom = -DECK_THICKNESS / 2 - CORNICE_DEPTH;
  const w = CORNICE_IN + CORNICE_OUT, x = g.deckWidth / 2 - CORNICE_IN + w / 2;
  for (const side of [1, -1]) pushRibbon(out, g, g.shiftAmount + side * x, (top + bottom) / 2, w, top - bottom, material, "detail");
}
// The railing is built of the same material as the slab it stands on: concrete
// ("parapet", the concrete railing's own lighter shade) over a concrete deck, and
// the masonry itself over a stone or brick one -- a light concrete rail along a
// brick parapet reads as a repair, not as the bridge. A coping, wider than the
// wall on both sides, caps it.
const COPING_HEIGHT = 0.22, COPING_OVERHANG = 0.1;
export const PARAPET_TOP: number = DECK_THICKNESS / 2 + PARAPET_HEIGHT + COPING_HEIGHT / 2;
function buildPathParapets(out: BridgeBox[], g: BridgePathGeom, material: BridgeMaterial = "parapet"): void {
  const parapetY = DECK_THICKNESS / 2 + PARAPET_HEIGHT / 2;
  const parapetX = g.deckWidth / 2 - PARAPET_THICKNESS / 2;
  for (const side of [1, -1]) {
    pushRibbon(out, g, g.shiftAmount + side * parapetX, parapetY, PARAPET_THICKNESS, PARAPET_HEIGHT, material);
    pushRibbon(out, g, g.shiftAmount + side * parapetX, DECK_THICKNESS / 2 + PARAPET_HEIGHT, PARAPET_THICKNESS + 2 * COPING_OVERHANG, COPING_HEIGHT, material, "detail");
  }
}
function defaultPierDistances(g: BridgePathGeom): number[] {
  const numIntermediate = Math.max(0, Math.floor(g.length / PIER_SPACING) - 1);
  const totalPiers = numIntermediate + 2;
  const d: number[] = [];
  for (let i = 1; i <= totalPiers; i++) d.push((g.length * (i - 1)) / (totalPiers - 1));
  return d;
}

// A pier: what carries the superstructure down to the terrain at one station.
//
// - concrete ("pier", "tower"): a shaft that widens with its height (a tall pier
//   on the generic 1.6-stud post read as a stick), tapering to the cap; a footing
//   on the ground once it stands tall; on a wide deck -- two tracks, a road --
//   twin columns instead of one shaft; and a cap carrying the bearings, as wide as
//   whatever stands on it (`capWidth`).
// - masonry ("stone", "brick"): one block as wide as the arches, with pointed
//   cutwaters at both faces up to the springing and a pilaster above each, carried
//   up to the parapet (`cutwaterTop`, deck-local; intermediate piers only).
// - timber: a plain post (the trestle draws its own bents).
//
// `under` is how far the superstructure's underside hangs below the slab's: the
// pier stops there.
export interface PierSpec {
  w: number; d: number; material: BridgeMaterial;
  /** The cap's width, deck-local (the bearings sit under the outermost members). */
  capWidth?: number;
  /** The bearings' lateral offsets, deck-local. */
  bearings?: number[];
  /** The masonry pier's cutwater top, deck-local; none draws no cutwater. */
  cutwaterTop?: number;
  under?: number;
  /** Columns at these lateral offsets (each `w` wide), whatever the deck's width. */
  columns?: number[];
}
// A tall pier's footing is a plinth sunk into the ground, showing FOOTING_RISE: the
// column standing on the terrain is the box tagged `ground`, so what the game charts
// for ships stays the slim column and not the wider footing round it.
const FOOTING_HEIGHT = 0.8, FOOTING_RISE = 0.3, FOOTING_MARGIN = 0.6;
const TWIN_DECK_WIDTH = 14; // a deck this wide stands on two columns
// The terrain under a footprint `w` across and `d` along the path, centred `lx`
// across it at `distance`: its lowest and highest point over the four corners and
// the centre. A pier stands on the lowest (on a slope it reaches down the hill
// instead of hanging off it), and a footing is laid only where the two agree.
const FLAT_TOLERANCE = 0.4;
function footprintTerrain(g: BridgePathGeom, distance: number, lx: number, w: number, d: number, heightAt: TerrainHeightFn): { low: number; high: number } {
  const { tangent } = pathSample(g, distance);
  const along = unit(tangent.x, 0, tangent.z), right = pathRight(tangent);
  const c = pathWorldPoint(g, distance, lx, 0);
  let low = heightAt(c.x, c.z), high = low;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const y = heightAt(c.x + (right.x * sx * w + along.x * sz * d) / 2, c.z + (right.z * sx * w + along.z * sz * d) / 2);
    low = Math.min(low, y); high = Math.max(high, y);
  }
  return { low, high };
}
function pushPier(out: BridgeBox[], g: BridgePathGeom, distance: number, spec: PierSpec, heightAt: TerrainHeightFn): void {
  const under = spec.under ?? 0;
  const railPoint = pathWorldPoint(g, distance, 0, -DECK_THICKNESS / 2 - under);
  const terrainY = heightAt(railPoint.x, railPoint.z);
  const drop = railPoint.y - terrainY;
  if (drop <= MIN_PIER_DROP) return;
  const yaw = pathYaw(g, distance);
  const { material } = spec;
  const concrete = material === "pier" || material === "tower";
  if (!concrete) {
    // a masonry block reaches down to the lowest ground under it
    const foot = footprintTerrain(g, distance, 0, spec.w, spec.d, heightAt).low;
    out.push({ shape: "box", center: { x: railPoint.x, y: (foot + railPoint.y) / 2, z: railPoint.z }, size: { x: spec.w, y: railPoint.y - foot, z: spec.d }, yaw, material, part: "support", ground: true });
    if (spec.cutwaterTop !== undefined) pushCutwaters(out, g, distance, spec, heightAt);
    return;
  }
  const capWidth = spec.capWidth ?? Math.max(spec.w, g.deckWidth * 0.78);
  const capHeight = drop > 2 ? 0.65 : 0;
  const footing = drop > 4 ? FOOTING_HEIGHT : 0;
  const BEARING = capHeight ? 0.3 : 0;
  const shaftBottom = terrainY, shaftTop = railPoint.y - BEARING - capHeight;
  const shaftH = shaftTop - shaftBottom;
  if (shaftH <= 0.05) return;
  // the shaft widens downward with its height, its top kept near the given size
  const grow = 1 + Math.min(0.6, shaftH * 0.025);
  const twin = spec.columns !== undefined || (g.deckWidth >= TWIN_DECK_WIDTH && spec.w < g.deckWidth * 0.6);
  const colW = spec.columns ? spec.w : twin ? Math.max(1.6, spec.w * 0.85) : spec.w;
  // twin columns stand under the cap's ends, not merely under the deck
  const colX = Math.max(g.deckWidth * 0.28, capWidth / 2 - (colW * grow) / 2 - 0.3);
  const columns = spec.columns ?? (twin ? [-colX, colX] : [0]);
  const centreAt = (lx: number, y: number): Vec3 => { const p = pathWorldPoint(g, distance, lx, 0); return { x: p.x, y, z: p.z }; };
  // The footing plinth only on flat ground (or a flat river bed): on a slope a flat
  // slab sunk at the centre's height would jut out of the hillside downhill.
  if (footing) {
    const span = twin ? columns[1]! - columns[0]! + colW * grow : spec.w * grow;
    const size = { x: span + 2 * FOOTING_MARGIN, y: footing, z: spec.d * grow + 2 * FOOTING_MARGIN };
    const under = footprintTerrain(g, distance, 0, size.x, size.z, heightAt);
    if (under.high - under.low <= FLAT_TOLERANCE) {
      out.push({ shape: "box", center: centreAt(0, under.low + FOOTING_RISE - footing / 2), size, yaw, material, part: "support" });
    }
  }
  // each column from the lowest ground under its own footprint
  for (const lx of columns) {
    const foot = Math.min(shaftBottom, footprintTerrain(g, distance, lx, colW * grow, spec.d * grow, heightAt).low);
    out.push({ shape: "box", center: centreAt(lx, (foot + shaftTop) / 2), size: { x: colW * grow, y: shaftTop - foot, z: spec.d * grow }, yaw, material, part: "support", topScale: 1 / grow, ground: true });
  }
  if (capHeight) {
    pushBox(out, g, distance, 0, -DECK_THICKNESS / 2 - under - BEARING - capHeight / 2, { x: capWidth, y: capHeight, z: spec.d + 0.45 }, material, "support");
    for (const lx of spec.bearings ?? [-g.deckWidth * BEAM_GIRDER_X, g.deckWidth * BEAM_GIRDER_X]) {
      pushBox(out, g, distance, lx, -DECK_THICKNESS / 2 - under - BEARING / 2, { x: 0.9, y: BEARING, z: spec.d * 0.7 }, "steel");
    }
  }
}
// A masonry pier's cutwaters: a square column turned 45 degrees at each face, so
// half of it stands out as a point against the current, and a pilaster from its
// top up to the parapet's coping.
function pushCutwaters(out: BridgeBox[], g: BridgePathGeom, distance: number, spec: PierSpec, heightAt: TerrainHeightFn): void {
  const yaw = pathYaw(g, distance);
  const side = spec.d / Math.SQRT2;
  for (const s of [-1, 1]) {
    const foot = pathWorldPoint(g, distance, s * spec.w / 2, spec.cutwaterTop!);
    const ground = heightAt(foot.x, foot.z);
    if (foot.y - ground > MIN_PIER_DROP) {
      out.push({ shape: "box", center: { x: foot.x, y: (ground + foot.y) / 2, z: foot.z }, size: { x: side, y: foot.y - ground, z: side }, yaw: yaw + Math.PI / 4, material: spec.material, part: "support", ground: true });
    }
    const top = PARAPET_TOP + 0.12;
    pushBox(out, g, distance, s * (spec.w / 2 + 0.3), (spec.cutwaterTop! + top) / 2, { x: 0.6, y: top - spec.cutwaterTop!, z: Math.min(2.4, spec.d * 0.55) }, spec.material, "frame");
  }
}
function buildPathPiers(out: BridgeBox[], g: BridgePathGeom, heightAt: TerrainHeightFn, pierFractions?: number[], spec: PierSpec = { w: PIER_WIDTH, d: PIER_WIDTH, material: "pier" }): void {
  const distances = pierFractions ? pierFractions.map((f) => g.length * Math.min(Math.max(f, 0), 1)) : defaultPierDistances(g);
  for (const d of distances) pushPier(out, g, d, spec, heightAt);
}
// The pier at a structural-span boundary (and at both ends of a spanned type).
//
// The masonry blocks are 0.4 wider than the deck so their faces sit proud of the
// arch/masonry outer faces (which land on the deckWidth/2 plane): at a boundary the
// two spans' masonry overlaps on that plane and would z-fight with a flush pier.
function boundaryPierStyle(bridgeType: string, deckWidth: number, spanLength: number): PierSpec {
  const legs = (legX: number, legW: number): PierSpec => ({ w: 0, d: 0, material: "tower", capWidth: 2 * legX + legW + 0.4, bearings: [] });
  switch (bridgeType) {
    // the anchor piers at a cantilever span's ends, under both side trusses
    case "cantilever": return { w: 2.6, d: 3, material: "pier", under: CANTILEVER_END_UNDER + 0.25, capWidth: deckWidth + 1.4, bearings: [-(deckWidth / 2 + 0.3), deckWidth / 2 + 0.3] };
    case "box_girder": return { w: Math.max(2.8, deckWidth * 0.28), d: 3, material: "pier", under: BOX_GIRDER_END_DEPTH + BOX_GIRDER_LIP };
    case "plate_girder": return { w: Math.max(2.2, deckWidth * 0.24), d: 2.6, material: "pier", under: plateGirderUnder(spanLength), capWidth: deckWidth + 0.4, bearings: [-(deckWidth / 2 - PLATE_GIRDER_X), deckWidth / 2 - PLATE_GIRDER_X] };
    case "deck_truss": return { w: Math.max(2.2, deckWidth * 0.24), d: 2.6, material: "pier", under: deckTrussDepth(spanLength) - DECK_THICKNESS / 2, capWidth: deckWidth, bearings: [-(deckWidth / 2 - 0.55), deckWidth / 2 - 0.55] };
    case "truss": return { w: Math.max(2.4, deckWidth * 0.26), d: 2.8, material: "pier", capWidth: deckWidth + 0.2, bearings: [-(deckWidth / 2 - 0.3), deckWidth / 2 - 0.3] };
    // the concrete arch springs from a block under each rib, the two tied by a cap
    // beam under the deck (a deck-wide wall read as the arch balancing on a dam)
    case "arch": return { w: ARCH_RIB_W + 1.0, d: 3.4, material: "pier", columns: [-(deckWidth / 2 - ARCH_RIB_INSET), deckWidth / 2 - ARCH_RIB_INSET], capWidth: deckWidth - 0.2, bearings: [] };
    case "stone_arch": return { w: deckWidth + 0.4, d: 4.5, material: "stone", cutwaterTop: masonryArchSpringY(spanLength) };
    case "brick_arch": return { w: deckWidth + 0.4, d: 4.5, material: "brick", cutwaterTop: masonryArchSpringY(spanLength) };
    case "network_arch":
    case "tied_arch": return { w: 2.6, d: 2.6, material: "tower", capWidth: deckWidth + 0.2, bearings: [-(deckWidth / 2 - TIED_ARCH_THICKNESS / 2), deckWidth / 2 - TIED_ARCH_THICKNESS / 2] };
    case "suspension": return { ...legs(suspensionCableHalfWidth(deckWidth), SUSPENSION_TOWER_WIDTH), w: 4.0, d: 4.0 };
    case "cable_stayed": return { ...legs(cableStayedTowerHalfWidth(deckWidth), CABLE_STAYED_TOWER_WIDTH), w: 3.6, d: 3.6 };
    default: return { w: PIER_WIDTH, d: PIER_WIDTH, material: "pier" };
  }
}
function buildSpanBoundaryPiers(out: BridgeBox[], g: BridgePathGeom, ranges: SpanRange[], bridgeType: string, heightAt: TerrainHeightFn): void {
  const distances: number[] = [];
  for (const range of ranges) {
    for (const distance of [range.fromDistance, range.toDistance]) {
      if (!distances.some((d) => Math.abs(d - distance) < 0.05)) distances.push(distance);
    }
  }
  const style = boundaryPierStyle(bridgeType, g.deckWidth, ranges[0].toDistance - ranges[0].fromDistance);
  for (const d of distances) {
    // the bridge's two ends stand on abutments: no cutwater there
    const end = d < 0.05 || d > g.length - 0.05;
    pushPier(out, g, d, end ? { ...style, cutwaterTop: undefined } : style, heightAt);
  }
}

// --- per-type builders (Bridge.luau 1932-2260) ---
type BuildOpts = { suppressGroundPiers?: boolean };
type Builder = (out: BridgeBox[], g: BridgePathGeom, opts: BuildOpts, heightAt: TerrainHeightFn) => void;

// Two concrete girders under the slab, over the bearings of the hammerhead piers.
const buildBeam: Builder = (out, g, _opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  for (const side of [-1, 1]) pushRibbon(out, g, g.shiftAmount + side * g.deckWidth * BEAM_GIRDER_X, -DECK_THICKNESS / 2 - BEAM_GIRDER_DEPTH / 2, BEAM_GIRDER_WIDTH, BEAM_GIRDER_DEPTH, "pier", "frame");
  buildPathPiers(out, g, heightAt, undefined, { w: PIER_WIDTH, d: PIER_WIDTH, material: "pier", under: BEAM_GIRDER_DEPTH });
};

// A truss carries its own span: it stands on the boundary piers only.
const buildTruss: Builder = (out, g) => {
  buildPathDeck(out, g);
  const n = trussPanelCount(g.length), panel = g.length / n;
  const sideX = g.deckWidth / 2 - TRUSS_CHORD / 2;
  const botY = DECK_THICKNESS / 2 + TRUSS_CHORD / 2;
  const topY = (i: number): number => trussTopY(g.clearanceY, g.length, i, n);
  const bot = (i: number, sx: number): Vec3 => pathWorldPoint(g, i * panel, sx, botY);
  const top = (i: number, sx: number): Vec3 => pathWorldPoint(g, i * panel, sx, topY(i));
  const mid = n / 2;
  for (const sx of [sideX, -sideX]) {
    // bottom chord along the deck, top chord node to node (polygonal when it rises)
    pushCurve(out, g, sx, () => botY, TRUSS_CHORD * 1.35, TRUSS_CHORD, "steel");
    for (let i = 1; i < n - 1; i++) pushStrut(out, top(i, sx), top(i + 1, sx), TRUSS_TOP_CHORD, "steel", "frame");
    // inclined end posts, as heavy as the top chord
    pushStrut(out, bot(0, sx), top(1, sx), TRUSS_TOP_CHORD, "steel", "frame");
    pushStrut(out, bot(n, sx), top(n - 1, sx), TRUSS_TOP_CHORD, "steel", "frame");
    for (let i = 1; i < n; i++) {
      // verticals, and gusset plates at both chords
      pushStrut(out, bot(i, sx), top(i, sx), 0.32, "steel", i === 1 || i === n - 1 ? "frame" : "detail");
      pushBox(out, g, i * panel, sx, botY + 0.35, { x: 0.12, y: 0.75, z: 0.95 }, "steel");
      pushBox(out, g, i * panel, sx, topY(i) - 0.45, { x: 0.12, y: 0.75, z: 0.95 }, "steel");
    }
    // Pratt diagonals in the inner panels, sloping down toward mid-span (both
    // ways in a middle panel of an odd count)
    for (let i = 1; i < n - 1; i++) {
      if (i + 1 <= mid) pushStrut(out, top(i, sx), bot(i + 1, sx), 0.3, "steel");
      else if (i >= mid) pushStrut(out, top(i + 1, sx), bot(i, sx), 0.3, "steel");
      else { pushStrut(out, top(i, sx), bot(i + 1, sx), 0.3, "steel"); pushStrut(out, top(i + 1, sx), bot(i, sx), 0.3, "steel"); }
    }
  }
  // crossbeams at every top node, X bracing in the top plane between them
  for (let i = 1; i < n; i++) {
    const member = i === 1 || i === n - 1 || trussMemberNodes(n).includes(i);
    pushStrut(out, top(i, -sideX), top(i, sideX), TRUSS_CHORD, "steel", member ? "frame" : "detail");
    if (i < n - 1) {
      pushStrut(out, top(i, -sideX), top(i + 1, sideX), 0.18, "steel");
      pushStrut(out, top(i, sideX), top(i + 1, -sideX), 0.18, "steel");
    }
  }
  // the portals: a strut between the end posts just over the wire envelope, and
  // an X between it and the top crossbeam
  const portalY = g.clearanceY + 0.6;
  for (const [end, first] of [[0, 1], [n, n - 1]] as const) {
    const f = (portalY - botY) / (topY(first) - botY);
    if (f <= 0 || f >= 0.85) continue;
    const at = (sx: number): Vec3 => { const a = bot(end, sx), b = top(first, sx); return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f }; };
    pushStrut(out, at(-sideX), at(sideX), TRUSS_CHORD, "steel");
    pushStrut(out, at(-sideX), top(first, sideX), 0.22, "steel");
    pushStrut(out, at(sideX), top(first, -sideX), 0.22, "steel");
  }
};

// A cantilever span, Forth-fashion: a tower over a pier at each quarter, an anchor
// arm from each tower back to an anchor pier at the span's end, a cantilever arm
// from each tower out toward mid-span, and between the two arm tips a short
// suspended span (a deck truss under the slab). The arms are deepest at the towers:
// the top chord runs straight from the tower top down to each arm's end, the bottom
// chord curves from the tower's foot, steep at first and flattening toward the end.
const CANTILEVER_UNDER = 5.5, CANTILEVER_END_UNDER = 1.0, CANTILEVER_TIP_T = 0.4;
const buildCantilever: Builder = (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  const L = g.length, CHORD = 0.5, WEB = 0.3, LEG = 1.0;
  const sideX = g.deckWidth / 2 + 0.3;
  const deckTopY = DECK_THICKNESS / 2, deckBottomY = -DECK_THICKNESS / 2;
  const towerTopY = cantileverTowerTopY(), towerBottomY = deckBottomY - CANTILEVER_UNDER;
  const armTopY = deckTopY + 1.0, endBottomY = deckBottomY - CANTILEVER_END_UNDER;
  const towers = CANTILEVER_TOWER_T.map((t) => t * L);
  const tips = [CANTILEVER_TIP_T * L, (1 - CANTILEVER_TIP_T) * L];
  const susDepth = Math.max(2.2, Math.min(4, 0.12 * (tips[1]! - tips[0]!)));
  const tipBottomY = deckBottomY - susDepth;
  if (!opts.suppressGroundPiers) {
    buildPathPiers(out, g, heightAt, CANTILEVER_TOWER_T, { w: 3.0, d: 5.4, material: "tower", capWidth: 2 * sideX + 1.4, bearings: [], under: CANTILEVER_UNDER + 0.5 });
  }
  // the four arms: [from (a tower), to (an arm end), the end's bottom height]
  const arms: Array<[number, number, number]> = [[towers[0]!, 0, endBottomY], [towers[0]!, tips[0]!, tipBottomY], [towers[1]!, tips[1]!, tipBottomY], [towers[1]!, L, endBottomY]];
  for (const sx of [sideX, -sideX]) {
    for (const [from, to, endBottom] of arms) {
      const n = Math.max(3, Math.round(Math.abs(to - from) / 5));
      const node = (k: number): { d: number; top: number; bot: number } => {
        const s = k / n;
        return { d: from + (to - from) * s, top: towerTopY + (armTopY - towerTopY) * s, bot: endBottom + (towerBottomY - endBottom) * (1 - s) * (1 - s) };
      };
      for (let k = 0; k < n; k++) {
        const a = node(k), b = node(k + 1);
        pushStrut(out, pathWorldPoint(g, a.d, sx, a.top), pathWorldPoint(g, b.d, sx, b.top), CHORD, "steel", "frame");
        pushStrut(out, pathWorldPoint(g, a.d, sx, a.bot), pathWorldPoint(g, b.d, sx, b.bot), CHORD, "steel", "frame");
        // an N web: a vertical at each node, a diagonal falling away from the tower
        if (k > 0) pushStrut(out, pathWorldPoint(g, a.d, sx, a.bot), pathWorldPoint(g, a.d, sx, a.top), WEB, "steel");
        pushStrut(out, pathWorldPoint(g, a.d, sx, a.top), pathWorldPoint(g, b.d, sx, b.bot), WEB, "steel");
      }
      const e = node(n);
      pushStrut(out, pathWorldPoint(g, e.d, sx, e.bot), pathWorldPoint(g, e.d, sx, e.top), CHORD, "steel", "frame");
      // lateral struts between the two bottom chords, under the deck
      if (sx > 0) for (let k = 1; k < n; k++) {
        const a = node(k);
        if (a.bot < deckBottomY - 1) pushStrut(out, pathWorldPoint(g, a.d, -sideX, a.bot), pathWorldPoint(g, a.d, sideX, a.bot), 0.25, "steel");
      }
    }
    // the suspended span: a Warren deck truss under the slab between the tips
    const n = Math.max(2, Math.round((tips[1]! - tips[0]!) / 4.5));
    const at = (k: number): number => tips[0]! + ((tips[1]! - tips[0]!) * k) / n;
    const topY = deckBottomY - CHORD / 2;
    pushStrut(out, pathWorldPoint(g, tips[0]!, sx, topY), pathWorldPoint(g, tips[1]!, sx, topY), CHORD * 0.8, "steel", "frame");
    pushStrut(out, pathWorldPoint(g, tips[0]!, sx, tipBottomY), pathWorldPoint(g, tips[1]!, sx, tipBottomY), CHORD * 0.8, "steel", "frame");
    for (let k = 0; k < n; k++) {
      const [ya, yb] = k % 2 === 0 ? [tipBottomY, topY] : [topY, tipBottomY];
      pushStrut(out, pathWorldPoint(g, at(k), sx, ya), pathWorldPoint(g, at(k + 1), sx, yb), WEB, "steel");
    }
  }
  // the towers: per side two legs splayed along the path and braced with an X, a
  // crossbeam on top (the overhead member) with knee braces, and one at the foot
  for (const d of towers) {
    for (const sx of [sideX, -sideX]) {
      const foot = [pathWorldPoint(g, d - 2.4, sx, towerBottomY), pathWorldPoint(g, d + 2.4, sx, towerBottomY)];
      const head = [pathWorldPoint(g, d - 0.8, sx, towerTopY), pathWorldPoint(g, d + 0.8, sx, towerTopY)];
      for (const i of [0, 1]) pushStrut(out, foot[i]!, head[i]!, LEG, "steel", "frame");
      pushStrut(out, foot[0]!, head[1]!, 0.35, "steel");
      pushStrut(out, foot[1]!, head[0]!, 0.35, "steel");
    }
    pushStrut(out, pathWorldPoint(g, d, -sideX, towerTopY), pathWorldPoint(g, d, sideX, towerTopY), 1.4, "steel", "frame");
    pushStrut(out, pathWorldPoint(g, d, -sideX, towerBottomY), pathWorldPoint(g, d, sideX, towerBottomY), 1.4, "steel", "frame");
    for (const s of [-1, 1]) pushStrut(out, pathWorldPoint(g, d, s * sideX, towerTopY - 3), pathWorldPoint(g, d, s * (sideX - 2.5), towerTopY), 0.4, "steel");
  }
};

// The plain arch: a CONCRETE deck-arch. Its rib and spandrel columns carry the
// deck the way the piers do, so they share the structural-concrete material --
// only the two masonry arch types (makeArchMasonry) are built of stone or brick.
//
// Two ribs under the deck's outer thirds, each a wall thickening from the crown
// toward its springings; pairs of spandrel columns standing on them every ~5 studs
// with a cap beam under the slab; struts between the ribs at every other pair.
// The ribs' TOP meets the deck's underside at the crown (measured from their
// bottom, the old single rib stood a thickness proud and broke through the deck).
const ARCH_RIB_W = 1.4, ARCH_RIB_INSET = 1.2;
const buildArch: Builder = (out, g) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  const ARCH_DEPTH = Math.min(g.length * 0.3, 16), RIB_W = ARCH_RIB_W, COLUMN = 0.8;
  const ribX = g.deckWidth / 2 - ARCH_RIB_INSET;
  const deckBottom = -DECK_THICKNESS / 2;
  const archTopY = (t: number): number => deckBottom - ARCH_DEPTH * (2 * t - 1) * (2 * t - 1);
  const ribDepth = (t: number): number => 1.0 + 0.8 * (2 * t - 1) * (2 * t - 1);
  const stations = Math.max(10, Math.ceil(g.length / 2.5));
  const distances: number[] = [], tops: number[] = [], bottoms: number[] = [];
  for (let i = 0; i <= stations; i++) {
    const t = (1 - Math.cos((Math.PI * i) / stations)) / 2;
    distances.push(t * g.length); tops.push(archTopY(t)); bottoms.push(archTopY(t) - ribDepth(t));
  }
  for (const sx of [ribX, -ribX]) pushWall(out, g, distances, sx, RIB_W, bottoms, tops, "pier");
  const pairs = Math.max(4, Math.round(g.length / 5));
  for (let i = 1; i < pairs; i++) {
    const t = i / pairs, d = g.length * t, top = archTopY(t), height = deckBottom - top;
    if (height < 0.6) continue;
    const capH = Math.min(0.5, height * 0.4);
    for (const sx of [ribX, -ribX]) pushBox(out, g, d, sx, (top + deckBottom - capH) / 2, { x: COLUMN, y: height - capH, z: COLUMN }, "pier", "frame");
    pushBox(out, g, d, 0, deckBottom - capH / 2, { x: 2 * ribX + COLUMN, y: capH, z: COLUMN + 0.2 }, "pier");
    if (i % 2 === 0) pushStrut(out, pathWorldPoint(g, d, -ribX, top - ribDepth(t) / 2), pathWorldPoint(g, d, ribX, top - ribDepth(t) / 2), 0.5, "pier");
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
  const ARCH_DEPTH = masonryArchDepth(g.length), ARCH_BAND = 1.3, FACE = 1.0, STATION_SPACING = 1.8;
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
  // stations evenly spaced in angle round the opening: dense where it springs
  // steeply, sparse along its flat crown
  for (let i = 0; i <= stationCount; i++) {
    const d = (g.length * (1 - Math.cos((Math.PI * i) / stationCount))) / 2;
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
  pushWall(out, g, distances, 0, 2 * innerHalf, bandBottoms, openTops, masonry, "detail"); // unseen from afar
  // a keystone at the crown, standing proud of the band on both faces
  const crown = openingTopY(0.5);
  for (const sx of [sideX, -sideX]) pushBox(out, g, g.length / 2, sx, crown - ARCH_BAND / 2 + 0.25, { x: FACE + 0.4, y: ARCH_BAND + 0.5, z: 1.1 }, masonry);
};
const buildStoneArch = makeArchMasonry("stone");
const buildBrickArch = makeArchMasonry("brick");

// A tied arch: two box-section steel arches springing from knuckles on the tie
// girders along both deck edges (the deck is the tie), hangers about every 4 studs
// (crossing each other on a network arch), and between the arches, wherever they
// stand clear above the wires, transverse struts with X bracing between them.
const TIE_GIRDER_TOP = DECK_THICKNESS / 2 + 1.4;
const makeTiedArch = (network: boolean): Builder => (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  if (!opts.suppressGroundPiers) buildPathPiers(out, g, heightAt);
  const ARCH_THICKNESS = TIED_ARCH_THICKNESS;
  const sideX = g.deckWidth / 2 - ARCH_THICKNESS / 2;
  const archTopY = (t: number): number => tiedArchTopY(g.length, t, g.clearanceY);
  const struts = tiedArchStruts(g.length, g.clearanceY);
  const tieBottom = -DECK_THICKNESS / 2 - CORNICE_DEPTH - 0.2;
  for (const sx of [sideX, -sideX]) {
    pushRibbon(out, g, g.shiftAmount + sx, (TIE_GIRDER_TOP + tieBottom) / 2, 0.9, TIE_GIRDER_TOP - tieBottom, "steel", "frame");
    pushCurve(out, g, sx, archTopY, ARCH_THICKNESS * 1.5, ARCH_THICKNESS * 1.1, "steel", struts);
    // the knuckles where each arch lands on its tie
    for (const d of [0.9, g.length - 0.9]) pushBox(out, g, d, sx, TIE_GIRDER_TOP + 0.3, { x: 1.3, y: 1.6, z: 2.2 }, "steel", "frame");
  }
  const hangers = Math.max(10, Math.round(g.length / 4));
  for (let i = 1; i < hangers; i++) {
    const t = i / hangers, distance = g.length * t;
    for (const sx of [sideX, -sideX]) {
      const targets = network ? [Math.max(0.08, t - 0.22), Math.min(0.92, t + 0.22)] : [t];
      for (const anchor of targets) pushStrut(out, pathWorldPoint(g, distance, sx, TIE_GIRDER_TOP), pathWorldPoint(g, g.length * anchor, sx, archTopY(anchor)), 0.18, "cable", network && i % 3 === 0 ? "frame" : "detail");
    }
  }
  struts.forEach((t, i) => {
    const distance = g.length * t;
    pushStrut(out, pathWorldPoint(g, distance, -sideX, archTopY(t)), pathWorldPoint(g, distance, sideX, archTopY(t)), ARCH_THICKNESS, "steel", "frame");
    const next = struts[i + 1];
    if (next === undefined) return;
    // both ends stand above the wires, so the whole diagonal does
    pushStrut(out, pathWorldPoint(g, distance, -sideX, archTopY(t)), pathWorldPoint(g, g.length * next, sideX, archTopY(next)), 0.25, "steel");
    pushStrut(out, pathWorldPoint(g, distance, sideX, archTopY(t)), pathWorldPoint(g, g.length * next, -sideX, archTopY(next)), 0.25, "steel");
  });
};
const buildTiedArch = makeTiedArch(false);
const buildNetworkArch = makeTiedArch(true);

// A tower of a cable type: two tapering legs from the pier cap below the deck up
// past it, beside the deck edges, and a crossbeam on top.
function pushCableTower(out: BridgeBox[], g: BridgePathGeom, distance: number, legX: number, legW: number, height: number): void {
  const bottomY = -DECK_THICKNESS / 2 - 0.3, topY = DECK_THICKNESS / 2 + height;
  for (const sx of [legX, -legX]) {
    out.push({ shape: "box", center: pathWorldPoint(g, distance, sx, (bottomY + topY) / 2), size: { x: legW * 1.25, y: topY - bottomY, z: legW * 1.25 }, yaw: pathYaw(g, distance), material: "tower", part: "frame", topScale: 0.8 });
  }
  pushStrut(out, pathWorldPoint(g, distance, -legX, topY - legW / 2), pathWorldPoint(g, distance, legX, topY - legW / 2), legW, "tower", "frame");
}
// The girder along each deck edge a cable type hangs its deck from, standing a
// little above the slab (it is the edge barrier too).
const CABLE_GIRDER_TOP = DECK_THICKNESS / 2 + 1.0;
function pushCableGirders(out: BridgeBox[], g: BridgePathGeom, legX: number, material: BridgeMaterial): void {
  const bottom = -DECK_THICKNESS / 2 - CORNICE_DEPTH - 0.15;
  for (const side of [1, -1]) pushRibbon(out, g, g.shiftAmount + side * legX, (CABLE_GIRDER_TOP + bottom) / 2, 0.5, CABLE_GIRDER_TOP - bottom, material, "frame");
}
// The anchor block at each end the main cables are tied down to: from the ground
// (or, over a deep crossing, a few studs below the deck) to above the girders.
const ANCHOR_TOP = DECK_THICKNESS / 2 + 2.2, ANCHOR_IN = 1.6;
function pushAnchorages(out: BridgeBox[], g: BridgePathGeom, legX: number, heightAt: TerrainHeightFn): void {
  for (const d of [ANCHOR_IN, g.length - ANCHOR_IN]) {
    for (const sx of [legX, -legX]) {
      const at = pathWorldPoint(g, d, sx, 0);
      const terrain = heightAt(at.x, at.z);
      const top = at.y + ANCHOR_TOP;
      const bottom = Math.max(terrain, at.y - 4.5);
      if (top - bottom < 0.5) continue;
      const ground = bottom === terrain ? { ground: true as const } : {};
      out.push({ shape: "box", center: { x: at.x, y: (bottom + top) / 2, z: at.z }, size: { x: 2.2, y: top - bottom, z: 2 * ANCHOR_IN }, yaw: pathYaw(g, d), material: "tower", part: "support", ...ground });
    }
  }
}

const HANGER_SPACING = 4;
const buildSuspension: Builder = (out, g, _opts, heightAt) => {
  buildPathDeck(out, g);
  const towers = cableTowerDistances("suspension", g.length);
  const main = cableMainSpan("suspension", g.length);
  const sideX = suspensionCableHalfWidth(g.deckWidth);
  buildPathPiers(out, g, heightAt, towers.map((d) => d / g.length), { ...boundaryPierStyle("suspension", g.deckWidth, main), w: 3.2, d: 3.2 });
  pushCableGirders(out, g, sideX, "steel");
  pushAnchorages(out, g, sideX, heightAt);
  const TOWER_HEIGHT = suspensionTowerHeight(main);
  for (const d of towers) pushCableTower(out, g, d, sideX, SUSPENSION_TOWER_WIDTH, TOWER_HEIGHT);
  const towerTopY = DECK_THICKNESS / 2 + TOWER_HEIGHT;
  const SAG = Math.min(TOWER_HEIGHT * 0.45, TOWER_HEIGHT - 13);
  const first = towers[0]!, last = towers[towers.length - 1]!;
  // a parabola in every span: the main spans sag SAG between towers, each back
  // span from its tower top down to its anchorage, sagging a quarter as much
  const cableAt = (d: number): number => {
    if (d <= first || d >= last) {
      const [a, b] = d <= first ? [ANCHOR_IN, first] : [g.length - ANCHOR_IN, last];
      const s = Math.min(Math.max((d - a) / (b - a), 0), 1);
      return ANCHOR_TOP + (towerTopY - ANCHOR_TOP) * s - (SAG / 4) * 4 * s * (1 - s);
    }
    const i = Math.min(towers.length - 2, Math.floor((d - first) / main));
    const s = 2 * ((d - towers[i]!) / main) - 1;
    return towerTopY - SAG * (1 - s * s);
  };
  // hangers every HANGER_SPACING studs wherever the cable stands clear above the girder
  const hangers: number[] = [];
  for (let d = HANGER_SPACING / 2; d < g.length; d += HANGER_SPACING) {
    if (towers.some((t) => Math.abs(t - d) < 1.5)) continue;
    if (cableAt(d) - CABLE_GIRDER_TOP > 0.8 && d > ANCHOR_IN + 1 && d < g.length - ANCHOR_IN - 1) hangers.push(d);
  }
  const from = ANCHOR_IN / g.length, to = 1 - from;
  for (const sx of [sideX, -sideX]) pushCurve(out, g, sx, (t) => cableAt(t * g.length), 0.35, 0.35, "cable", [...towers, ...hangers].map((d) => d / g.length), "frame", from, to);
  for (const d of hangers) {
    for (const sx of [sideX, -sideX]) pushStrut(out, pathWorldPoint(g, d, sx, CABLE_GIRDER_TOP), pathWorldPoint(g, d, sx, cableAt(d)), 0.16, "cable");
  }
};

// Each tower fans its stays out over half of each neighbouring main span (to meet
// the next tower's) and over its back span to the abutment; the outermost stay
// leaves the top, the inner ones a little lower down each time.
//
// The pylon is an H (`cable_stayed`: two legs beside the deck, a crossbeam on top,
// the stays in two vertical planes from the legs) or an inverted Y
// (`cable_stayed_y`): the legs stand upright beside the deck to a knee above the
// wire envelope -- so a cross-span wire between them still finds two verticals --
// then lean in to one mast over the deck's centre, whose stays fan down to both
// deck edges in two inclined planes.
const STAY_SPACING = 4;
const makeCableStayed = (type: "cable_stayed" | "cable_stayed_y"): Builder => (out, g, _opts, heightAt) => {
  buildPathDeck(out, g);
  const towers = cableTowerDistances(type, g.length);
  const main = cableMainSpan(type, g.length);
  const sideX = cableStayedTowerHalfWidth(g.deckWidth);
  buildPathPiers(out, g, heightAt, towers.map((d) => d / g.length), { ...boundaryPierStyle("cable_stayed", g.deckWidth, main), w: 3, d: 3 });
  pushCableGirders(out, g, sideX, "deck");
  const TOWER_WIDTH = CABLE_STAYED_TOWER_WIDTH;
  const y = type === "cable_stayed_y";
  const kneeY = g.clearanceY + 2, mergeY = kneeY + sideX * 1.2;
  const TOWER_HEIGHT = y ? Math.max(cableStayedTowerHeight(main, g.clearanceY), mergeY + 7 - DECK_THICKNESS / 2) : cableStayedTowerHeight(main, g.clearanceY);
  const towerTopY = DECK_THICKNESS / 2 + TOWER_HEIGHT;
  for (const d of towers) {
    if (!y) { pushCableTower(out, g, d, sideX, TOWER_WIDTH, TOWER_HEIGHT); continue; }
    const bottomY = -DECK_THICKNESS / 2 - 0.3;
    for (const sx of [sideX, -sideX]) {
      out.push({ shape: "box", center: pathWorldPoint(g, d, sx, (bottomY + kneeY) / 2), size: { x: TOWER_WIDTH * 1.25, y: kneeY - bottomY, z: TOWER_WIDTH * 1.25 }, yaw: pathYaw(g, d), material: "tower", part: "frame", topScale: 0.85 });
      pushStrut(out, pathWorldPoint(g, d, sx, kneeY - 0.4), pathWorldPoint(g, d, Math.sign(sx) * 0.5, mergeY + 0.4), TOWER_WIDTH * 0.95, "tower", "frame");
    }
    // the strut at the knee, its underside clear above the wires
    pushStrut(out, pathWorldPoint(g, d, -sideX, kneeY), pathWorldPoint(g, d, sideX, kneeY), 1.2, "tower", "frame");
    out.push({ shape: "box", center: pathWorldPoint(g, d, 0, (mergeY + towerTopY) / 2), size: { x: TOWER_WIDTH * 1.2, y: towerTopY - mergeY, z: TOWER_WIDTH * 1.2 }, yaw: pathYaw(g, d), material: "tower", part: "frame", topScale: 0.75 });
  }
  towers.forEach((td, i) => {
    for (const dir of [-1, 1]) {
      const end = dir < 0 ? (i === 0 ? 1 : td - main / 2) : (i === towers.length - 1 ? g.length - 1 : td + main / 2);
      const reach = Math.abs(end - td);
      const n = Math.max(4, Math.round(reach / STAY_SPACING));
      const lowest = mergeY + 1.5;
      for (let k = 0; k < n; k++) {
        const f = 0.2 + (0.78 * k) / Math.max(1, n - 1);
        const deckD = td + dir * reach * f;
        const top = towerTopY - TOWER_WIDTH * 1.2;
        // H: each inner stay 0.7 lower down the leg (at most 30% of the tower in
        // all); Y: spread down the mast to just above where the legs join
        const anchorY = y
          ? top - ((n - 1 - k) / Math.max(1, n - 1)) * Math.min(top - lowest, n * 0.7)
          : top - (n - 1 - k) * Math.min(0.7, (TOWER_HEIGHT * 0.3) / n);
        for (const sx of [sideX, -sideX]) pushStrut(out, pathWorldPoint(g, td, y ? 0 : sx, anchorY), pathWorldPoint(g, deckD, sx, CABLE_GIRDER_TOP), 0.16, "cable", k === 0 || k === n - 1 ? "frame" : "detail");
      }
    }
  });
};
const buildCableStayed = makeCableStayed("cable_stayed");
const buildCableStayedY = makeCableStayed("cable_stayed_y");

// A through plate girder: a deep steel girder along each deck edge -- it is the
// railing too, so there is no concrete parapet -- a quarter of its depth below the
// slab, its top flange rounding down at both ends, stiffeners on both faces of the
// web, and cross girders under the slab between the two.
const plateGirderDepth = (spanLength: number): number => Math.min(5, Math.max(2.6, spanLength / 11));
const plateGirderUnder = (spanLength: number): number => plateGirderDepth(spanLength) * 0.25;
const PLATE_GIRDER_X = 0.05; // the web's centre inside the deck edge: its outer face covers the slab's
const buildPlateGirder: Builder = (out, g) => {
  buildPathDeck(out, g, "deck", false); // the girders are the deck's edges
  const D = plateGirderDepth(g.length), under = plateGirderUnder(g.length);
  const bottom = -DECK_THICKNESS / 2 - under, fullTop = bottom + D;
  const R = Math.min(3, D, g.length / 4);
  const rounded = (d: number): number => {
    // a station rounded a hair past either end must not go below zero under the root
    const x = Math.max(0, Math.min(d, g.length - d)) / R;
    return x >= 1 ? fullTop : bottom + (fullTop - bottom) * (0.35 + 0.65 * Math.sqrt(1 - (1 - x) * (1 - x)));
  };
  // stations: the rounded ends finely, and every path vertex so the web follows a bend
  const ends = [0, 1, 2, 3, 4, 5, 6].map((k) => (R * k) / 6);
  const stations = [...new Set([...ends, ...ends.map((d) => g.length - d), ...g.distances].map((d) => Math.round(Math.min(Math.max(d, 0), g.length) * 1e4) / 1e4))].sort((a, b) => a - b);
  const FLANGE = 0.25;
  for (const side of [-1, 1]) {
    const x = side * (g.deckWidth / 2 - PLATE_GIRDER_X);
    const tops = stations.map(rounded);
    pushWall(out, g, stations, x, 0.22, stations.map(() => bottom + FLANGE), tops.map((t) => t - FLANGE), "steel");
    pushWall(out, g, stations, x, 0.95, tops.map((t) => t - FLANGE), tops, "steel");
    pushRibbon(out, g, g.shiftAmount + x, bottom + FLANGE / 2, 0.95, FLANGE, "steel", "frame");
    const panels = Math.max(4, Math.round(g.length / 4));
    for (let i = 1; i < panels; i++) {
      const d = (g.length * i) / panels, top = rounded(d) - FLANGE;
      for (const face of [-1, 1]) pushBox(out, g, d, x + face * 0.26, (bottom + FLANGE + top) / 2, { x: 0.3, y: top - bottom - FLANGE, z: 0.28 }, "steel");
    }
  }
  const cross = Math.max(3, Math.round(g.length / 4));
  for (let i = 1; i < cross; i++) {
    pushBox(out, g, (g.length * i) / cross, 0, -DECK_THICKNESS / 2 - (under - 0.1) / 2, { x: g.deckWidth - 2 * PLATE_GIRDER_X - 0.3, y: under - 0.1, z: 0.4 }, "steel");
  }
};

const buildBoxGirder: Builder = (out, g) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  // A closed trapezoidal box with a broad top flange. The deck overhang gives
  // the fascia a shadow line without another material or a coplanar surface.
  const top = g.deckWidth * 0.42, bottom = g.deckWidth * 0.29;
  const u = -g.shiftAmount;
  const boxBottom = -DECK_THICKNESS / 2 - BOX_GIRDER_DEPTH;
  out.push({ shape: "ribbon", points: deckCenterline(g), profile: [
    { u: u + bottom, v: boxBottom }, { u: u + top, v: -DECK_THICKNESS / 2 },
    { u: u - top, v: -DECK_THICKNESS / 2 }, { u: u - bottom, v: boxBottom },
  ], material: "pier", part: "frame" });
  // the haunch: as wide as the box's bottom, its top hidden inside the box, its
  // soffit a parabola from the piers up to a lip under the box at mid-span
  const step = Math.max(8, Math.ceil(g.length / 2.5));
  const stations = [...new Set([...Array.from({ length: step + 1 }, (_, i) => (g.length * i) / step), ...g.distances].map((d) => Math.round(d * 1e4) / 1e4))].sort((a, b) => a - b);
  const soffit = (d: number): number => { const s = 2 * (d / g.length) - 1; return boxBottom - BOX_GIRDER_LIP - (BOX_GIRDER_END_DEPTH - BOX_GIRDER_DEPTH) * s * s; };
  pushWall(out, g, stations, 0, 2 * bottom, stations.map(soffit), stations.map(() => boxBottom + 0.3), "pier");
};

const buildDeckTruss: Builder = (out, g) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  const depth = deckTrussDepth(g.length);
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
  // between the two trusses: a cross frame (a bottom strut and an X) at every
  // other panel point, and X bracing in the bottom plane in every panel
  const x = g.deckWidth / 2 - 0.55, top = -0.9, bottom = -depth;
  for (let i = 0; i <= panels; i++) {
    const d = (g.length * i) / panels;
    if (i % 2 === 0 || i === panels) {
      pushStrut(out, pathWorldPoint(g, d, -x, bottom), pathWorldPoint(g, d, x, bottom), 0.3, "steel");
      pushStrut(out, pathWorldPoint(g, d, -x, top), pathWorldPoint(g, d, x, bottom), 0.22, "steel");
      pushStrut(out, pathWorldPoint(g, d, x, top), pathWorldPoint(g, d, -x, bottom), 0.22, "steel");
    }
    if (i < panels) {
      const next = (g.length * (i + 1)) / panels;
      pushStrut(out, pathWorldPoint(g, d, -x, bottom), pathWorldPoint(g, next, x, bottom), 0.18, "steel");
      pushStrut(out, pathWorldPoint(g, d, x, bottom), pathWorldPoint(g, next, -x, bottom), 0.18, "steel");
    }
  }
};

// A timber trestle: a bent about every 8 studs -- two plumb posts and two battered
// ones, each on its own footing, under a cap -- braced in stories: an X between the
// outer posts in each story and a girt at each story line every 10 studs of height,
// and girts along the bridge from bent to bent at the first story line. Two
// stringers carry the plank deck; a post-and-rail guard runs along both edges.
const TRESTLE_BENT = 8, TRESTLE_STORY = 10, TRESTLE_CAP_Y = -1.1;
const buildTimberTrestle: Builder = (out, g, _opts, heightAt) => {
  // every ribbon pays a joint at each path vertex on a bend: a plank deck without a
  // cornice, two stringers, one rail a side
  buildPathDeck(out, g, "timber", false);
  const W = g.deckWidth;
  for (const x of [-0.22 * W, 0.22 * W]) pushCurve(out, g, x, () => -0.85, 0.8, 0.7, "timber");
  // the guard: posts every 4.5 studs under a top rail
  const railX = W / 2 - 0.25;
  for (const side of [1, -1]) {
    pushRibbon(out, g, g.shiftAmount + side * railX, DECK_THICKNESS / 2 + 1.25, 0.2, 0.22, "timber", "detail");
    const posts = Math.max(2, Math.round(g.length / 4.5));
    for (let i = 0; i <= posts; i++) pushBox(out, g, (g.length * i) / posts, side * (railX + 0.08), DECK_THICKNESS / 2 + 0.7, { x: 0.28, y: 1.4, z: 0.28 }, "timber");
  }
  const count = Math.max(2, Math.ceil(g.length / TRESTLE_BENT));
  let previous: { d: number; level: Vec3[] } | null = null;
  for (let i = 0; i <= count; i++) {
    const d = (g.length * i) / count;
    // posts: [top lateral, foot lateral]; the outer two are battered
    const posts: Array<[number, number]> = [[-0.27 * W, -0.42 * W], [-0.12 * W, -0.12 * W], [0.12 * W, 0.12 * W], [0.27 * W, 0.42 * W]];
    const lines: Array<{ top: Vec3; foot: Vec3 }> = [];
    for (const [topX, footX] of posts) {
      const top = pathWorldPoint(g, d, topX, TRESTLE_CAP_Y);
      const foot = pathWorldPoint(g, d, footX, TRESTLE_CAP_Y);
      foot.y = heightAt(foot.x, foot.z);
      if (top.y - foot.y < MIN_PIER_DROP) continue;
      lines.push({ top, foot });
      out.push({ shape: "box", center: { ...foot, y: foot.y + 0.2 }, size: { x: 0.9, y: 0.4, z: 0.9 }, yaw: pathYaw(g, d), material: "timber", part: "support", ground: true });
      pushStrut(out, { ...foot, y: foot.y + 0.4 }, top, 0.5, "timber", "support");
    }
    pushBox(out, g, d, 0, TRESTLE_CAP_Y + 0.1, { x: W * 0.9, y: 0.55, z: 0.75 }, "timber", "support");
    if (lines.length < 4) { previous = null; continue; }
    const left = lines[0]!, right = lines[3]!;
    const at = (line: { top: Vec3; foot: Vec3 }, y: number): Vec3 => {
      const f = (line.top.y - y) / (line.top.y - line.foot.y);
      return { x: line.top.x + (line.foot.x - line.top.x) * f, y, z: line.top.z + (line.foot.z - line.top.z) * f };
    };
    // the story lines, from the cap down to just above the higher outer foot
    const bottom = Math.max(left.foot.y, right.foot.y) + 0.6;
    const levels = [left.top.y - 0.3];
    while (levels[levels.length - 1]! - TRESTLE_STORY > bottom + 1.5) levels.push(levels[levels.length - 1]! - TRESTLE_STORY);
    levels.push(bottom);
    for (let k = 0; k + 1 < levels.length; k++) {
      const [hi, lo] = [levels[k]!, levels[k + 1]!];
      pushStrut(out, at(left, hi), at(right, lo), 0.26, "timber");
      pushStrut(out, at(right, hi), at(left, lo), 0.26, "timber");
      if (k + 1 < levels.length - 1) pushStrut(out, at(left, lo), at(right, lo), 0.3, "timber");
    }
    const level = levels.length > 2 ? [at(left, levels[1]!), at(right, levels[1]!)] : [];
    if (previous && level.length && previous.level.length) for (const j of [0, 1]) pushStrut(out, previous.level[j]!, level[j]!, 0.26, "timber");
    previous = { d, level };
  }
};

const BUILDERS: Record<string, Builder> = {
  plate_girder: buildPlateGirder, timber_trestle: buildTimberTrestle, box_girder: buildBoxGirder, deck_truss: buildDeckTruss, network_arch: buildNetworkArch,
  beam: buildBeam, truss: buildTruss, cantilever: buildCantilever, arch: buildArch,
  stone_arch: buildStoneArch, brick_arch: buildBrickArch, tied_arch: buildTiedArch, suspension: buildSuspension, cable_stayed: buildCableStayed, cable_stayed_y: buildCableStayedY,
};

// --- the distant level -------------------------------------------------------
//
// What a bridge keeps far away: its deck, its supports and the frame that makes its
// silhouette (the part tags), every swept section thinned to the points that still
// bend it -- Ramer-Douglas-Peucker over the centreline, and for a wall its opening
// heights too, so a straight centreline cannot flatten a masonry arch. Details
// (cornices, copings, web members, hangers, inner stays) and untagged parapets go.

/** The indices of `points` (any dimension) that keep every other within `tolerance` of the chords. */
export function simplifyIndices(points: number[][], tolerance: number): number[] {
  if (points.length <= 2) return points.map((_, i) => i);
  const keep = new Set([0, points.length - 1]);
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const pa = points[a]!, pb = points[b]!;
    const delta = pb.map((v, k) => v - pa[k]!);
    const lenSq = delta.reduce((sum, v) => sum + v * v, 0);
    let best = tolerance * tolerance, index = -1;
    for (let i = a + 1; i < b; i++) {
      const pi = points[i]!;
      const t = lenSq ? Math.max(0, Math.min(1, delta.reduce((sum, v, k) => sum + v * (pi[k]! - pa[k]!), 0) / lenSq)) : 0;
      const d = pi.reduce((sum, v, k) => sum + (v - pa[k]! - t * delta[k]!) ** 2, 0);
      if (d > best) { best = d; index = i; }
    }
    if (index >= 0) { keep.add(index); stack.push([a, index], [index, b]); }
  }
  return [...keep].sort((x, y) => x - y);
}

/** A bridge's distant level: its deck, supports and frame, every sweep thinned (the game draws this far away). */
export function lowDetailBoxes(boxes: BridgeBox[]): BridgeBox[] {
  return boxes.filter((b) => b.part === "deck" || b.part === "support" || b.part === "frame").map((b): BridgeBox => {
    if (b.shape !== "ribbon" && b.shape !== "wall") return b;
    const samples = b.points.map((p, i) => (b.shape === "wall" ? [p.x, p.y, p.z, b.bottoms[i]!, b.tops[i]!] : [p.x, p.y, p.z]));
    const indices = simplifyIndices(samples, b.part === "deck" ? 0.12 : 0.45);
    const points = indices.map((i) => b.points[i]!);
    return b.shape === "wall" ? { ...b, points, bottoms: indices.map((i) => b.bottoms[i]!), tops: indices.map((i) => b.tops[i]!) } : { ...b, points };
  });
}

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
  if (!maxSpan || CABLE_TYPES.has(type)) {
    builder(out, g, {}, heightAt);
    buildAbutments(out, g, heightAt, type === "timber_trestle" ? "timber" : "pier");
    return out;
  }
  const ranges = getStructuralSpanRanges(type, g.length);
  for (const range of ranges) {
    const spanGeom = clipPathGeom(g, range.fromDistance, range.toDistance);
    if (spanGeom) builder(out, spanGeom, { suppressGroundPiers: type !== "cantilever" }, heightAt);
  }
  buildSpanBoundaryPiers(out, g, ranges, type, heightAt);
  buildAbutments(out, g, heightAt, type === "stone_arch" ? "stone" : type === "brick_arch" ? "brick" : "pier");
  return out;
}
