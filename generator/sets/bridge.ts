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
/** A colour, 0-255 per channel (sRGB). */
export type Rgb = [number, number, number];

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
/** The water surface's height over a point, or undefined where it is dry. */
export type WaterLevelFn = (x: number, z: number) => number | undefined;
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
const MIN_WATER_DEPTH = 0.2; // shallower than this a pier stands on the bed, not in water

export const TYPE_META: Record<string, BridgeTypeData> = {
  beam: { maxSpan: null },
  truss: { maxSpan: 64 },
  cantilever: { maxSpan: 90 },
  arch: { maxSpan: 80 },
  stone_arch: { maxSpan: 28 },
  tied_arch: { maxSpan: 100 },
  suspension: { maxSpan: 140 },
  cable_stayed: { maxSpan: 120 },
  timber_trestle: { maxSpan: null },
  deck_truss: { maxSpan: 65 },
};

/**
 * The colour of each material. Every box `buildBridge` returns carries its own
 * `color`: this one, a type's steel paint, or a tone of it -- a lighter cap, coping
 * or fascia band, a darker vault -- so deck, structure and supports read apart. The
 * material still picks the surface (photo) a box draws with.
 */
export const COLORS: Record<BridgeMaterial, Rgb> = {
  timber: [145, 108, 70], deck: [120, 110, 100], parapet: [150, 140, 125], pier: [95, 90, 85],
  steel: [80, 90, 110], stone: [170, 160, 145], brick: [150, 80, 64], cable: [40, 40, 50], tower: [95, 90, 85],
};
// The structures a type builds as, each with its own span policy: a type's own, and the
// beam bridge's box-girder and steel-plate-girder sections (its `girders` parameter),
// which were types of their own and keep their builders, piers and spans.
const STRUCTURE_META: Record<string, BridgeTypeData> = { ...TYPE_META, box_girder: { maxSpan: 65 }, plate_girder: { maxSpan: 60 } };
// A material's colour in the bridge being built (its parameters' palette), lifted
// toward white (k > 1, by k - 1 of the way) or darkened (k < 1).
function tone(material: BridgeMaterial, k: number): Rgb {
  return style.palette[material].map((c) => Math.round(k >= 1 ? c + (255 - c) * (k - 1) : c * k)) as Rgb;
}

// --- parameters -----------------------------------------------------------------
//
// A player picks a bridge's look as they pick a building's: each type lists its own
// parameters (`TYPE_PARAMS`), the game shows them with their titles (exported text,
// `set.bridge.<type>.param.<name>[.<value>]`) and passes the chosen values to
// `buildBridge` (and `planSupports` / `supportFootprint`, as the piers' footprint
// follows their material). A value missing or unknown builds as the parameter's
// default, and every default draws the type as it was drawn before it had any.
//
// Two kinds of parameter: a colour scheme (the steel's paint, the concrete's shade,
// the stone, brick, timber, the cables) and the material of the piers. Each type
// offers its own: a steel truss its paints and its piers of stone, brick or
// concrete; a masonry arch its stone or brick, its piers being the arch itself.

/** One value of a bridge parameter: its stable key and its English title. */
export interface BridgeParamValue { value: string; title: string }
/** A parameter a player sets on a bridge of one type: its stable name, English title, values and default. */
export interface BridgeParam { name: string; title: string; values: BridgeParamValue[]; default: string }
/** The values a player chose, by parameter name. */
export type BridgeParams = Readonly<Record<string, string>>;

/** What the piers are built of: concrete (the type's own shape), a masonry block, or a steel trestle tower. */
export type PierChoice = "concrete" | "stone" | "brick" | "steel";

type Scheme = Partial<Record<BridgeMaterial, Rgb>>;
// a colour choice: its title and the materials it recolours
// (a masonry swatch also picks the material and the surface - the photo - it draws with)
interface Swatch { title: string; colors: Scheme; masonry?: "stone" | "brick"; surface?: string }
const PAINTS: Record<string, Swatch> = {
  oxideRed: { title: "Oxide red", colors: { steel: [150, 62, 45] } },
  green: { title: "Bridge green", colors: { steel: [60, 92, 68] } },
  grey: { title: "Grey", colors: { steel: [72, 78, 84] } },
  blue: { title: "Blue", colors: { steel: [56, 98, 150] } },
  silver: { title: "Silver", colors: { steel: [210, 212, 206] } },
  orange: { title: "Orange", colors: { steel: [170, 78, 46] } },
  black: { title: "Black", colors: { steel: [48, 48, 52] } },
};
const CONCRETES: Record<string, Swatch> = {
  warm: { title: "Warm grey", colors: { deck: [120, 110, 100], parapet: [150, 140, 125], pier: [95, 90, 85], tower: [95, 90, 85] } },
  light: { title: "Light grey", colors: { deck: [150, 147, 140], parapet: [182, 179, 172], pier: [132, 129, 123], tower: [132, 129, 123] } },
  weathered: { title: "Weathered", colors: { deck: [98, 96, 94], parapet: [124, 122, 118], pier: [76, 75, 74], tower: [76, 75, 74] } },
};
// a masonry arch is built of stone or brick: the swatch picks the material too
const MASONRY: Record<string, Swatch> = {
  sandstone: { title: "Sandstone", colors: { stone: [196, 170, 128] }, masonry: "stone", surface: "bridge-sandstone" },
  granite: { title: "Granite", colors: { stone: [150, 150, 148] }, masonry: "stone", surface: "bridge-granite" },
  limestone: { title: "Limestone", colors: { stone: [212, 204, 184] }, masonry: "stone", surface: "bridge-limestone" },
  redBrick: { title: "Red brick", colors: { brick: [150, 80, 64] }, masonry: "brick", surface: "bridge-brick" },
  yellowBrick: { title: "Yellow brick", colors: { brick: [196, 166, 112] }, masonry: "brick", surface: "bridge-brick-yellow" },
  blueBrick: { title: "Blue brick", colors: { brick: [82, 84, 104] }, masonry: "brick", surface: "bridge-brick-blue" },
};
const TIMBERS: Record<string, Swatch> = {
  natural: { title: "Natural", colors: { timber: [145, 108, 70] } },
  weathered: { title: "Weathered", colors: { timber: [150, 145, 135] } },
  creosote: { title: "Creosoted", colors: { timber: [92, 72, 56] } },
};
const CABLE_COLOURS: Record<string, Swatch> = {
  black: { title: "Black", colors: { cable: [40, 40, 50] } },
  white: { title: "White", colors: { cable: [228, 228, 222] } },
  orange: { title: "Orange", colors: { cable: [205, 98, 42] } },
};
const PIER_TITLES: Record<PierChoice, string> = { concrete: "Concrete", stone: "Stone", brick: "Brick", steel: "Steel trestle" };
// The structural parameters: a tied arch's hangers, a cable-stayed bridge's towers.
const SHAPE_PARAMS: Record<string, { title: string; values: Record<string, string> }> = {
  hangers: { title: "Hangers", values: { vertical: "Vertical", network: "Network" } },
  towers: { title: "Towers", values: { h: "H-frame", y: "Inverted Y" } },
  girders: { title: "Girders", values: { concrete: "Concrete beams", box: "Concrete box", plate: "Steel plate girders" } },
  statues: { title: "Statues", values: { none: "None", piers: "On the piers" } },
  gates: { title: "Gate towers", values: { none: "None", one: "One end", both: "Both ends" } },
};

// The colour parameters by name: their title and their swatches.
const COLOUR_PARAMS: Record<string, { title: string; swatches: Record<string, Swatch> }> = {
  paint: { title: "Paint", swatches: PAINTS },
  concrete: { title: "Concrete", swatches: CONCRETES },
  masonry: { title: "Masonry", swatches: MASONRY },
  timber: { title: "Timber", swatches: TIMBERS },
  cables: { title: "Cables", swatches: CABLE_COLOURS },
};
// Each type's choices, the first of each its default.
// `shapesAfter`: the shape parameters follow the colours (a masonry arch's material first).
const TYPE_CHOICES: Record<string, { colours: Array<[string, string[]]>; shapes?: Array<[string, string[]]>; piers?: PierChoice[]; shapesAfter?: true }> = {
  beam: { shapes: [["girders", ["concrete", "box", "plate"]]], colours: [["concrete", ["warm", "light", "weathered"]], ["paint", ["grey", "green", "oxideRed", "black", "blue"]]], piers: ["concrete", "stone", "brick", "steel"] },
  truss: { colours: [["paint", ["oxideRed", "green", "black", "silver"]]], piers: ["stone", "brick", "concrete"] },
  deck_truss: { colours: [["paint", ["grey", "oxideRed", "green"]]], piers: ["concrete", "stone", "brick"] },
  cantilever: { colours: [["paint", ["oxideRed", "grey", "black"]]], piers: ["concrete", "stone"] },
  arch: { colours: [["concrete", ["warm", "light", "weathered"]]], piers: ["concrete", "stone", "brick"] },
  stone_arch: { colours: [["masonry", ["sandstone", "granite", "limestone", "redBrick", "yellowBrick", "blueBrick"]]], shapes: [["statues", ["none", "piers"]], ["gates", ["none", "one", "both"]]], shapesAfter: true },
  tied_arch: { shapes: [["hangers", ["vertical", "network"]]], colours: [["paint", ["blue", "silver", "oxideRed", "green"]]], piers: ["concrete", "stone", "brick"] },
  suspension: { colours: [["paint", ["orange", "green", "grey"]], ["cables", ["black", "white"]]], piers: ["concrete", "stone"] },
  cable_stayed: { shapes: [["towers", ["h", "y"]]], colours: [["concrete", ["warm", "light", "weathered"]], ["cables", ["black", "white", "orange"]]] },
  timber_trestle: { colours: [["timber", ["natural", "weathered", "creosote"]]] },
};

/** Each type's parameters, as the game lists them for a player to pick (and the site's preview page). */
export const TYPE_PARAMS: Readonly<Record<string, readonly BridgeParam[]>> = Object.fromEntries(
  Object.keys(TYPE_META).map((type) => {
    const c = TYPE_CHOICES[type]!;
    const shapes: BridgeParam[] = (c.shapes ?? []).map(([name, keys]) => ({
      name, title: SHAPE_PARAMS[name]!.title, default: keys[0]!,
      values: keys.map((value) => ({ value, title: SHAPE_PARAMS[name]!.values[value]! })),
    }));
    const colours: BridgeParam[] = c.colours.map(([name, keys]) => ({
      name, title: COLOUR_PARAMS[name]!.title, default: keys[0]!,
      values: keys.map((value) => ({ value, title: COLOUR_PARAMS[name]!.swatches[value]!.title })),
    }));
    const params = c.shapesAfter ? [...colours, ...shapes] : [...shapes, ...colours];
    if (c.piers) params.push({ name: "piers", title: "Piers", default: c.piers[0]!, values: c.piers.map((value) => ({ value, title: PIER_TITLES[value] })) });
    return [type, params];
  }),
);

// The style a build draws with: its palette and its piers' material, resolved from
// the type's parameters. Set for the length of one public call (`withStyle`), so the
// kit's helpers read it without every builder passing it on; the module is
// single-threaded and every call restores the previous style.
interface BuildStyle {
  palette: Record<BridgeMaterial, Rgb>; piers: PierChoice; masonry: "stone" | "brick"; masonrySurface?: string;
  network: boolean; yTowers: boolean; statues: boolean; gates: 0 | 1 | 2;
}
const plainStyle = (): BuildStyle => ({ palette: { ...COLORS }, piers: "concrete", masonry: "stone", network: false, yTowers: false, statues: false, gates: 0 });
let style: BuildStyle = plainStyle();
/** The style a `type` bridge with these parameters draws with. */
function resolveStyle(type: string, params: BridgeParams = {}): BuildStyle {
  const out = plainStyle();
  for (const p of TYPE_PARAMS[type] ?? []) {
    const chosen = p.values.some((v) => v.value === params[p.name]) ? params[p.name]! : p.default;
    if (p.name === "piers") out.piers = chosen as PierChoice;
    else if (p.name === "hangers") out.network = chosen === "network";
    else if (p.name === "towers") out.yTowers = chosen === "y";
    else if (p.name === "statues") out.statues = chosen === "piers";
    else if (p.name === "gates") out.gates = chosen === "both" ? 2 : chosen === "one" ? 1 : 0;
    else if (p.name === "girders") continue; // picks the structure (structureOf)
    else {
      const swatch = COLOUR_PARAMS[p.name]!.swatches[chosen]!;
      Object.assign(out.palette, swatch.colors);
      if (swatch.masonry) out.masonry = swatch.masonry;
      if (swatch.surface) out.masonrySurface = swatch.surface;
    }
  }
  return out;
}
// --- retired types ----------------------------------------------------------------
//
// Types that differed from another only in what is now a parameter were merged into
// it. Their ids are stored in saved maps, so each stays readable: the registry's
// retired alias draws it as the surviving type, and this map gives the parameter
// values it stands for. A stored bridge is read with its own parameters first, then
// these (`storedBridge`); every public function here accepts a retired id.

/** A retired type: the type it is now, and the parameters it stands for. */
export interface RetiredBridge { type: string; params: BridgeParams }
export const RETIRED_TYPES: Readonly<Record<string, RetiredBridge>> = {
  brick_arch: { type: "stone_arch", params: { masonry: "redBrick" } },
  network_arch: { type: "tied_arch", params: { hangers: "network", paint: "silver" } },
  cable_stayed_y: { type: "cable_stayed", params: { towers: "y" } },
  box_girder: { type: "beam", params: { girders: "box" } },
  plate_girder: { type: "beam", params: { girders: "plate", paint: "green" } },
};
/** A stored type and its own parameters, read as today's type and the values it builds with. */
export function storedBridge(storedType: string, own?: BridgeParams): { type: string; params: BridgeParams } {
  const retired = RETIRED_TYPES[storedType];
  return retired ? { type: retired.type, params: { ...retired.params, ...(own ?? {}) } } : { type: storedType, params: own ?? {} };
}
// The structure a stored type with these parameters builds as: its own, or for the beam
// bridge the one its `girders` chose (box_girder, plate_girder: the builders and span
// policies those types had). Internal; the public functions take a type.
function structureOf(type: string, params?: BridgeParams): string {
  const s = storedBridge(type, params);
  if (s.type !== "beam") return s.type;
  const girders = s.params.girders;
  return girders === "box" ? "box_girder" : girders === "plate" ? "plate_girder" : "beam";
}

function withStyle<T>(type: string, params: BridgeParams | undefined, run: () => T): T {
  const previous = style;
  style = resolveStyle(type, params);
  try {
    return run();
  } finally {
    style = previous;
  }
}
const LIGHT_BAND = 1.45; // a concrete cap, a coping: the band that catches the light
const MASONRY_BAND = 1.25; // a stone or brick band (arch ring, impost, coping)

// The two cable types are one structure over the whole bridge: their towers stand
// at the ends of one or more MAIN spans (each at most the type's maxSpan), shared
// between neighbours, with a back span half a main span long at each end down to
// the abutments. Repeating a whole cable bridge per structural span put a pair of
// towers in every span, each with its own cables down to the deck in between.
const CABLE_TYPES = new Set(["suspension", "cable_stayed"]);
/** Where a cable bridge's towers stand along a bridge of `length` (distances). */
export function cableTowerDistances(type: string, length: number): number[] {
  return towerDistances(structureOf(type), length);
}
function towerDistances(type: string, length: number): number[] {
  const maxMain = STRUCTURE_META[type]?.maxSpan ?? length;
  const mains = Math.max(1, Math.ceil(length / maxMain - 1));
  const main = length / (mains + 1);
  return Array.from({ length: mains + 1 }, (_, i) => main / 2 + i * main);
}

/**
 * Divide a bridge of `length` into its structural spans: equal spans of at most the
 * type's maxSpan, or -- for a cable type -- its back spans and main spans between
 * the towers.
 */
export function getStructuralSpanRanges(type: string, length: number, params?: BridgeParams): SpanRange[] {
  return spanRanges(structureOf(type, params), length);
}
function spanRanges(type: string, length: number): SpanRange[] {
  if (typeof length !== "number" || length <= 0) return [];
  if (CABLE_TYPES.has(type)) {
    const stops = [0, ...towerDistances(type, length), length];
    return stops.slice(1).map((to, i) => ({ fromDistance: stops[i]!, toDistance: to }));
  }
  const maxSpan = STRUCTURE_META[type]?.maxSpan;
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
export function overheadMembers(type: string, length: number, deckWidth: number, clearanceY: number, plan?: SupportPlan, params?: BridgeParams): BridgeOverheadMember[] {
  type = structureOf(type, params);
  if (length <= 0) return [];
  // a plan (planSupports) moves the spans and towers; the members follow them
  if (CABLE_TYPES.has(type)) {
    // The two cable types are strung BETWEEN their towers rather than taken up
    // to them: the tower crossbeam stands as much as 28 studs over the deck, and
    // a wire reaching that far reads as a mast, not a fixing. The tower legs run
    // from below the deck up past it, so a perpendicular wire meets them.
    const halfWidth = type === "suspension" ? suspensionCableHalfWidth(deckWidth) : cableStayedTowerHalfWidth(deckWidth);
    const towers = plan?.towers.length ? plan.towers : towerDistances(type, length);
    return towers.map((d) => ({ t: d / length, kind: "span", halfWidth }));
  }
  const out: BridgeOverheadMember[] = [];
  for (const range of plan?.spans ?? spanRanges(type, length)) {
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
// `surface`: the named surface (photo) a box draws with instead of its material's
// own - a masonry arch's sandstone, limestone, granite or brick (its `masonry`).
export type BridgeBox = { part?: BridgePart; ground?: true; color?: Rgb; surface?: string } & (
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
function pushStrut(out: BridgeBox[], a: Vec3, b: Vec3, thick: number, material: BridgeMaterial, part: BridgePart = "detail", color?: Rgb): void {
  if (dist3(a, b) < 0.05) return;
  out.push({ shape: "strut", a, b, thick, material, part, ...(color ? { color } : {}) });
}
function pushBox(out: BridgeBox[], g: BridgePathGeom, distance: number, lx: number, ly: number, size: Vec3, material: BridgeMaterial, part: BridgePart = "detail", color?: Rgb): void {
  out.push({ shape: "box", center: pathWorldPoint(g, distance, lx, ly), size, yaw: pathYaw(g, distance), material, part, ...(color ? { color } : {}) });
}
// One varying-height wall along the path: a station at every `distances[i]`,
// `w` wide about lateral offset `lx` (this module's frame, so the sign flips on
// the way into the descriptor -- see pushRibbon), spanning bottoms[i]..tops[i]
// in deck-local Y (relative to the slab centre, like every other localY here).
// The stations are the descriptor's points; the renderer mitres between them,
// so consecutive stations butt exactly instead of overlapping like box slices.
function pushWall(out: BridgeBox[], g: BridgePathGeom, distances: number[], lx: number, w: number, bottoms: number[], tops: number[], material: BridgeMaterial, part: BridgePart = "frame", color?: Rgb): void {
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
  out.push({ shape: "wall", points, u0: u - w / 2, u1: u + w / 2, bottoms: bottomYs, tops: topYs, material, part, ...(color ? { color } : {}) });
}
// A wall through world-space stations `points`, `w` thick about them, from
// bottoms[i] to tops[i] (absolute Y): a pier's hammerhead across the deck, an
// abutment's wing wall beyond the path's end.
function pushWallAt(out: BridgeBox[], points: Vec3[], w: number, bottoms: number[], tops: number[], material: BridgeMaterial, part: BridgePart, color?: Rgb): void {
  out.push({ shape: "wall", points, u0: -w / 2, u1: w / 2, bottoms, tops, material, part, ...(color ? { color } : {}) });
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
function pushRibbon(out: BridgeBox[], g: BridgePathGeom, lx: number, v: number, w: number, h: number, material: BridgeMaterial, part?: BridgePart, color?: Rgb): void {
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
    ...(color ? { color } : {}),
  });
}

function pushCurve(out: BridgeBox[], g: BridgePathGeom, lx: number, y: (t: number) => number, w: number, h: number, material: BridgeMaterial, anchors: number[] = [], part: BridgePart = "frame", from = 0, to = 1): void {
  const inside = (t: number): boolean => t > from && t < to;
  const points = adaptiveCurvePoints((t) => pathWorldPoint(g, t * g.length, lx, y(t)), [from, ...g.distances.map((d) => d / g.length).filter(inside), ...anchors.filter(inside), to]);
  out.push({ shape: "ribbon", points, sampled: true, profile: [{ u: w / 2, v: -h / 2 }, { u: w / 2, v: h / 2 }, { u: -w / 2, v: h / 2 }, { u: -w / 2, v: -h / 2 }], material, part });
}

// The abutments: what each end of the bridge stands on, where the deck meets the
// bank. Over a bank (the ground under the end within ABUTMENT_MAX_DROP of the deck)
// a concrete or steel bridge closes on a real abutment instead of an end pier:
//
// - the breast wall, as wide as the deck and a little more, from the bank down to
//   the ground in front, reaching ABUTMENT_FRONT under the deck (the bridge seat it
//   bears on, `under` below the slab: under its girders, box or truss) and
//   ABUTMENT_BACK into the bank; a lighter coping band along its front edge;
// - the backwall behind the deck's end, up to the deck top, closing the joint;
// - a wing wall each side running back along the bank, its top falling from just
//   under the parapet's coping to the ground, with a lighter coping.
//
// A masonry arch keeps its end block (it is the abutment) and takes the wing walls
// in its own stone or brick. Over a deep crossing -- an end high above the ground --
// the old short wing walls stand beside the end pier instead.
const ABUTMENT_FRONT = 0.6, ABUTMENT_BACK = 2.0, ABUTMENT_MAX_DROP = 8, ABUTMENT_OUT = 0.4;
const WING_RUN = 6, WING_W = 0.7, WING_TOP = DECK_THICKNESS / 2 + PARAPET_HEIGHT - 0.1, WING_COPING = 0.22;
// A point beyond (outward > 0) or just inside (outward < 0) one end of the path,
// straight on along the end's level tangent.
function endPoint(g: BridgePathGeom, end: 0 | 1, outward: number, lx: number, ly: number): Vec3 {
  const d = end ? g.length : 0;
  const p = pathWorldPoint(g, d, lx, ly);
  const { tangent } = pathSample(g, d);
  const t = unit(tangent.x, 0, tangent.z), s = end ? outward : -outward;
  return { x: p.x + t.x * s, y: p.y, z: p.z + t.z * s };
}
// The breast wall's footprint at one end: its lowest ground, and the seat's height.
function abutmentAt(g: BridgePathGeom, end: 0 | 1, under: number, heightAt: TerrainHeightFn): { seat: number; foot: number } {
  const seatY = -DECK_THICKNESS / 2 - under - 0.06;
  const half = g.deckWidth / 2 + ABUTMENT_OUT;
  let foot = Infinity;
  for (const o of [-ABUTMENT_FRONT, (ABUTMENT_BACK - ABUTMENT_FRONT) / 2, ABUTMENT_BACK]) for (const lx of [-half, 0, half]) {
    const p = endPoint(g, end, o, lx, 0);
    foot = Math.min(foot, heightAt(p.x, p.z));
  }
  return { seat: endPoint(g, end, 0, 0, seatY).y, foot };
}
/** Does the end at `distance` stand on an abutment (no end pier)? */
function endOnAbutment(g: BridgePathGeom, distance: number, under: number, heightAt: TerrainHeightFn): boolean {
  const end = distance < 0.05 ? 0 : distance > g.length - 0.05 ? 1 : -1;
  if (end < 0) return false;
  const { seat, foot } = abutmentAt(g, end as 0 | 1, under, heightAt);
  return seat - foot <= ABUTMENT_MAX_DROP;
}
function buildAbutments(out: BridgeBox[], g: BridgePathGeom, heightAt: TerrainHeightFn, material: BridgeMaterial, under: number, breast: boolean): void {
  const masonry = material === "stone" || material === "brick";
  for (const end of [0, 1] as const) {
    const { seat, foot } = abutmentAt(g, end, under, heightAt);
    if (material === "timber" || seat - foot > ABUTMENT_MAX_DROP) {
      pushWingStubs(out, g, end ? g.length : 0, heightAt, material === "timber" ? "timber" : masonry ? material : "pier");
      continue;
    }
    const yaw = pathYaw(g, end ? g.length : 0), width = g.deckWidth + 2 * ABUTMENT_OUT;
    const light = tone(material, masonry ? MASONRY_BAND : LIGHT_BAND);
    // where the deck lies on the ground there is nothing to stand on: no breast wall,
    // no backwall (a box on the ground is charted as a pier); under a deep end (a deck
    // truss) the seat may lie on the bank while the backwall still closes the joint
    const underside = endPoint(g, end, 0, 0, -DECK_THICKNESS / 2).y;
    const raised = breast && underside - foot > 0.3;
    if (breast && seat - foot > 0.3) {
      const c = endPoint(g, end, (ABUTMENT_BACK - ABUTMENT_FRONT) / 2, 0, 0);
      out.push({ shape: "box", center: { x: c.x, y: (seat + foot) / 2, z: c.z }, size: { x: width, y: seat - foot, z: ABUTMENT_BACK + ABUTMENT_FRONT }, yaw, material, part: "support", ground: true });
      // the coping along the seat's front edge, standing a little proud of the face
      if (seat - foot > 0.8) {
        const k = endPoint(g, end, -ABUTMENT_FRONT - 0.05, 0, 0);
        out.push({ shape: "box", center: { x: k.x, y: seat - 0.08 - 0.15, z: k.z }, size: { x: width + 0.2, y: 0.3, z: 0.3 }, yaw, material, part: "detail", color: light });
      }
    }
    if (raised) {
      // the backwall: from inside the breast wall up to (just under) the deck top
      const top = endPoint(g, end, 0, 0, DECK_THICKNESS / 2 - 0.03).y, bottom = seat - 0.3;
      if (top - Math.max(bottom, foot) > 0.1) {
        const c = endPoint(g, end, 0.35, 0, 0);
        const b = Math.max(bottom, foot);
        out.push({ shape: "box", center: { x: c.x, y: (b + top) / 2, z: c.z }, size: { x: width, y: top - b, z: 0.5 }, yaw, material, part: "support", ...(b === foot ? { ground: true as const } : {}) });
      }
    }
    // the wing walls: back along the bank from inside the parapet's end
    const stations = [-0.3, 1.6, WING_RUN];
    for (const side of [-1, 1]) {
      const lx = side * (g.deckWidth / 2 + ABUTMENT_OUT + 0.05 - WING_W / 2);
      const points = stations.map((o) => endPoint(g, end, o, lx, 0));
      const deckLocal = endPoint(g, end, 0, 0, 0).y;
      const grounds = points.map((p) => heightAt(p.x, p.z));
      const tops = stations.map((_, i) => i < 2 ? deckLocal + WING_TOP : Math.min(deckLocal + WING_TOP, Math.max(grounds[i]! + 0.5, deckLocal - DECK_THICKNESS / 2)));
      const bottoms = tops.map((t, i) => Math.min(grounds[i]! - 0.3, t - 0.3));
      pushWallAt(out, points, WING_W, bottoms, tops, material, "support");
      pushWallAt(out, points, WING_W + 0.2, tops, tops.map((t) => t + WING_COPING), material, "detail", light);
    }
  }
}
// Over a deep crossing: a short wing wall at each corner, reaching the local ground
// or cut short 3.5 studs down.
function pushWingStubs(out: BridgeBox[], g: BridgePathGeom, d: number, heightAt: TerrainHeightFn, material: BridgeMaterial): void {
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
  // the cornice is the deck's fascia: a lighter band than the slab, the one crisp
  // line that draws the bridge's alignment from afar
  const fascia = tone(material, material === "deck" ? 1.3 : 1.15);
  for (const side of [1, -1]) pushRibbon(out, g, g.shiftAmount + side * x, (top + bottom) / 2, w, top - bottom, material, "detail", fascia);
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
    pushRibbon(out, g, g.shiftAmount + side * parapetX, DECK_THICKNESS / 2 + PARAPET_HEIGHT, PARAPET_THICKNESS + 2 * COPING_OVERHANG, COPING_HEIGHT, material, "detail", tone(material, 1.2));
  }
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
  /** A masonry pier's impost: the lighter band of stone round it at this height, deck-local. */
  impost?: number;
}
// A tall pier's footing is a plinth sunk into the ground, showing FOOTING_RISE: the
// column standing on the terrain is the box tagged `ground`, so what the game charts
// for ships stays the slim column and not the wider footing round it.
const FOOTING_HEIGHT = 0.8, FOOTING_RISE = 0.3, FOOTING_MARGIN = 0.6;
const HAMMER_HAUNCH = 1.4; // how far a hammerhead's underside drops at the shaft, at most
const IMPOST_HEIGHT = 0.4, IMPOST_OUT = 0.15;
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
// The cantilever's tower pier: under both splayed tower legs.
function CANTILEVER_PIER(deckWidth: number): PierSpec {
  return { w: 3.0, d: 5.4, material: "tower", capWidth: 2 * (deckWidth / 2 + 0.3) + 1.4, bearings: [], under: CANTILEVER_UNDER + 0.5 };
}
// The piers' material, as the `piers` parameter chose: a concrete pier (the type's
// own spec) becomes a masonry block as wide as what it carries under a capstone band,
// or a steel trestle tower. Masonry arches and timber are not concrete and keep theirs.
function choosePier(spec: PierSpec, deckWidth: number): PierSpec {
  if ((spec.material !== "pier" && spec.material !== "tower") || style.piers === "concrete") return spec;
  if (style.piers === "steel") return { ...spec, material: "steel" };
  const under = (spec.under ?? 0) + 0.06;
  return {
    w: Math.max(deckWidth, spec.capWidth ?? 0) + 0.6, d: Math.max(spec.d, 2.6) + 0.4, material: style.piers, under,
    impost: -DECK_THICKNESS / 2 - under - IMPOST_HEIGHT / 2 - 0.1,
  };
}
// A steel trestle tower: four battered legs from concrete pedestals up to a cap girder
// under the bearings, braced across and along the bridge in stories, X braced across.
const STEEL_TOP_D = 1.6, STEEL_BATTER = 0.08, STEEL_BATTER_ALONG = 0.05, STEEL_SPREAD_MAX = 2.6, STEEL_SPREAD_ALONG_MAX = 1.6;
const STEEL_FOOT = 1.2, STEEL_LEG = 0.45, STEEL_STORY = 8;
function pushSteelTower(out: BridgeBox[], g: BridgePathGeom, distance: number, spec: PierSpec, heightAt: TerrainHeightFn, waterAt?: WaterLevelFn): void {
  const under = spec.under ?? 0;
  const capTop = -DECK_THICKNESS / 2 - under - 0.3, capH = 0.6;
  const top = pathWorldPoint(g, distance, 0, capTop - capH).y;
  const ground = heightAt(pathWorldPoint(g, distance, 0, 0).x, pathWorldPoint(g, distance, 0, 0).z);
  const drop = top - ground;
  if (drop <= MIN_PIER_DROP) return;
  const capW = spec.capWidth ?? g.deckWidth * 0.78;
  const halfTop = capW / 2 - 0.3, spread = Math.min(STEEL_SPREAD_MAX, drop * STEEL_BATTER), along = Math.min(STEEL_SPREAD_ALONG_MAX, drop * STEEL_BATTER_ALONG);
  // the cap girder the bearings sit on
  pushBox(out, g, distance, 0, capTop - capH / 2, { x: capW, y: capH, z: STEEL_TOP_D + 0.4 }, "steel", "support");
  for (const lx of spec.bearings ?? [-g.deckWidth * BEAM_GIRDER_X, g.deckWidth * BEAM_GIRDER_X]) pushBox(out, g, distance, lx, capTop + 0.15, { x: 0.9, y: 0.3, z: STEEL_TOP_D * 0.7 }, "steel");
  // each leg: its foot on a pedestal standing on the ground (or above the water)
  const legs: Array<{ sx: number; sz: number; top: Vec3; foot: Vec3 }> = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const t = pathWorldPoint(g, distance + sz * STEEL_TOP_D / 2, sx * halfTop, capTop - capH);
    const f = pathWorldPoint(g, distance + sz * (STEEL_TOP_D / 2 + along), sx * (halfTop + spread), 0);
    const bed = heightAt(f.x, f.z), water = waterAt?.(f.x, f.z);
    const base = water !== undefined && water > bed + MIN_WATER_DEPTH ? water : bed;
    const pedestalTop = base + 0.4;
    out.push({ shape: "box", center: { x: f.x, y: (bed + pedestalTop) / 2, z: f.z }, size: { x: STEEL_FOOT, y: pedestalTop - bed, z: STEEL_FOOT }, yaw: pathYaw(g, distance), material: "pier", part: "support", ground: true });
    legs.push({ sx, sz, top: t, foot: { x: f.x, y: pedestalTop, z: f.z } });
  }
  const lerp = (a: Vec3, b: Vec3, k: number): Vec3 => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });
  for (const l of legs) pushStrut(out, l.foot, l.top, STEEL_LEG, "steel", "support");
  // stories from the top down: X braces across the bridge between the lines, a strut
  // across at the top and the foot
  const lowest = Math.max(...legs.map((l) => l.foot.y));
  const stories = Math.max(1, Math.round((top - lowest) / STEEL_STORY));
  const at = (l: (typeof legs)[number], y: number): Vec3 => lerp(l.top, l.foot, Math.min(1, Math.max(0, (l.top.y - y) / Math.max(l.top.y - l.foot.y, 1e-6))));
  const leg = (sx: number, sz: number) => legs.find((l) => l.sx === sx && l.sz === sz)!;
  for (let i = 0; i <= stories; i++) {
    const y = top - ((top - lowest) * i) / stories;
    if (i === 0 || i === stories) for (const sz of [-1, 1]) pushStrut(out, at(leg(-1, sz), y), at(leg(1, sz), y), 0.25, "steel", "support");
    if (i === 0) continue;
    const yAbove = top - ((top - lowest) * (i - 1)) / stories;
    for (const sz of [-1, 1]) {
      pushStrut(out, at(leg(-1, sz), yAbove), at(leg(1, sz), y), 0.18, "steel", "detail");
      pushStrut(out, at(leg(1, sz), yAbove), at(leg(-1, sz), y), 0.18, "steel", "detail");
    }
  }
}
function pushPier(out: BridgeBox[], g: BridgePathGeom, distance: number, spec: PierSpec, heightAt: TerrainHeightFn, waterAt?: WaterLevelFn): void {
  spec = choosePier(spec, g.deckWidth);
  if (spec.material === "steel") { pushSteelTower(out, g, distance, spec, heightAt, waterAt); return; }
  const under = spec.under ?? 0;
  const railPoint = pathWorldPoint(g, distance, 0, -DECK_THICKNESS / 2 - under);
  const terrainY = heightAt(railPoint.x, railPoint.z);
  const drop = railPoint.y - terrainY;
  if (drop <= MIN_PIER_DROP) return;
  // The surface of the water the pier stands in, if any: the flat bottom its
  // footing or starling is laid on, whatever the bed below does.
  const surface = waterAt?.(railPoint.x, railPoint.z);
  const waterY = surface !== undefined && surface > terrainY + MIN_WATER_DEPTH ? surface : undefined;
  const yaw = pathYaw(g, distance);
  const { material } = spec;
  const concrete = material === "pier" || material === "tower";
  if (!concrete) {
    // a masonry block reaches down to the lowest ground under it
    const foot = footprintTerrain(g, distance, 0, spec.w, spec.d, heightAt).low;
    out.push({ shape: "box", center: { x: railPoint.x, y: (foot + railPoint.y) / 2, z: railPoint.z }, size: { x: spec.w, y: railPoint.y - foot, z: spec.d }, yaw, material, part: "support", ground: true });
    if (spec.cutwaterTop !== undefined) pushCutwaters(out, g, distance, spec, heightAt, waterY);
    // the impost: a band of lighter stone standing proud all round, where an arch
    // springs or a girder bears -- the line that makes a block read as a pier
    if (spec.impost !== undefined && pathWorldPoint(g, distance, 0, spec.impost).y - IMPOST_HEIGHT / 2 > foot + 0.5) {
      pushBox(out, g, distance, 0, spec.impost, { x: spec.w + 2 * IMPOST_OUT, y: IMPOST_HEIGHT, z: spec.d + 2 * IMPOST_OUT }, material, "detail", tone(material, MASONRY_BAND));
    }
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
  // slab sunk at the centre's height would jut out of the hillside downhill. In
  // water the surface is that flat ground: the footing becomes a caisson from the
  // bed up to just above the waterline, however the bed slopes under it.
  if (footing) {
    const span = twin ? columns[1]! - columns[0]! + colW * grow : spec.w * grow;
    const size = { x: span + 2 * FOOTING_MARGIN, y: footing, z: spec.d * grow + 2 * FOOTING_MARGIN };
    const under = footprintTerrain(g, distance, 0, size.x, size.z, heightAt);
    const plinth = tone(material, 0.85);
    if (waterY !== undefined) {
      const top = waterY + FOOTING_RISE, bottom = Math.min(under.low - 0.2, top - footing);
      if (shaftTop - top > FOOTING_HEIGHT) out.push({ shape: "box", center: centreAt(0, (top + bottom) / 2), size: { ...size, y: top - bottom }, yaw, material, part: "support", color: plinth });
    } else if (under.high - under.low <= FLAT_TOLERANCE) {
      out.push({ shape: "box", center: centreAt(0, under.low + FOOTING_RISE - footing / 2), size, yaw, material, part: "support", color: plinth });
    }
  }
  // each column from the lowest ground under its own footprint
  for (const lx of columns) {
    const foot = Math.min(shaftBottom, footprintTerrain(g, distance, lx, colW * grow, spec.d * grow, heightAt).low);
    out.push({ shape: "box", center: centreAt(lx, (foot + shaftTop) / 2), size: { x: colW * grow, y: shaftTop - foot, z: spec.d * grow }, yaw, material, part: "support", topScale: 1 / grow, ground: true });
  }
  if (capHeight) {
    // the cap is the pier's light band; a single shaft under a wider cap carries it
    // as a hammerhead, its underside rising from the shaft out to the tips
    const capTop = -DECK_THICKNESS / 2 - under - BEARING, capDepth = spec.d + 0.45, light = tone(material, LIGHT_BAND);
    const haunch = Math.min(HAMMER_HAUNCH, ((capWidth - colW) / 2) * 0.45, shaftH * 0.3);
    if (columns.length === 1 && capWidth - colW >= 1.2 && haunch > 0.2) {
      const xs = [-capWidth / 2, -colW / 2, colW / 2, capWidth / 2];
      const lift = pathWorldPoint(g, distance, 0, capTop).y;
      pushWallAt(out, xs.map((lx) => pathWorldPoint(g, distance, lx, capTop)), capDepth,
        xs.map((_, i) => lift - capHeight - (i === 1 || i === 2 ? haunch : 0)), xs.map(() => lift), material, "support", light);
    } else {
      pushBox(out, g, distance, 0, capTop - capHeight / 2, { x: capWidth, y: capHeight, z: capDepth }, material, "support", light);
    }
    for (const lx of spec.bearings ?? [-g.deckWidth * BEAM_GIRDER_X, g.deckWidth * BEAM_GIRDER_X]) {
      pushBox(out, g, distance, lx, -DECK_THICKNESS / 2 - under - BEARING / 2, { x: 0.9, y: BEARING, z: spec.d * 0.7 }, "steel");
    }
  }
}
// A masonry pier's cutwaters: a square column turned 45 degrees at each face, so
// half of it stands out as a point against the current, and a pilaster from its
// top up to the parapet's coping.
function pushCutwaters(out: BridgeBox[], g: BridgePathGeom, distance: number, spec: PierSpec, heightAt: TerrainHeightFn, waterY?: number): void {
  const yaw = pathYaw(g, distance);
  const side = spec.d / Math.SQRT2;
  if (waterY !== undefined) pushStarling(out, g, distance, spec, heightAt, waterY);
  for (const s of [-1, 1]) {
    const foot = pathWorldPoint(g, distance, s * spec.w / 2, spec.cutwaterTop!);
    const ground = heightAt(foot.x, foot.z);
    if (foot.y - ground > MIN_PIER_DROP) {
      out.push({ shape: "box", center: { x: foot.x, y: (ground + foot.y) / 2, z: foot.z }, size: { x: side, y: foot.y - ground, z: side }, yaw: yaw + Math.PI / 4, material: spec.material, part: "support", ground: true });
    }
    const top = PARAPET_TOP + 0.12;
    pushBox(out, g, distance, s * (spec.w / 2 + 0.3), (spec.cutwaterTop! + top) / 2, { x: 0.6, y: top - spec.cutwaterTop!, z: Math.min(2.4, spec.d * 0.55) }, spec.material, "frame");
    if (style.statues) pushStatue(out, g, distance, s * (spec.w / 2 + 0.3), top, s);
  }
}
// A statue over a masonry pier (the `statues` parameter: Charles Bridge in Prague):
// a pedestal on the pilaster's top, a robed figure of blackened sandstone with its
// head, holding a cross on the deck's side. `side` is the pier face (+1 / -1).
function pushStatue(out: BridgeBox[], g: BridgePathGeom, distance: number, lx: number, baseY: number, side: number): void {
  const dark = tone("stone", 0.5), yaw = pathYaw(g, distance);
  pushBox(out, g, distance, lx, baseY + 0.5, { x: 0.95, y: 1.0, z: 1.5 }, "stone", "detail", tone("stone", 0.8));
  const b = baseY + 1.0;
  out.push({ shape: "box", center: pathWorldPoint(g, distance, lx, b + 1.05), size: { x: 0.8, y: 2.1, z: 0.8 }, yaw, material: "stone", part: "detail", topScale: 0.62, color: dark });
  pushBox(out, g, distance, lx, b + 2.33, { x: 0.44, y: 0.46, z: 0.44 }, "stone", "detail", dark);
  const inner = lx - side * 0.52;
  pushStrut(out, pathWorldPoint(g, distance, inner, b + 0.9), pathWorldPoint(g, distance, inner, b + 3.1), 0.13, "stone", "detail", dark);
  pushStrut(out, pathWorldPoint(g, distance - 0.38, inner, b + 2.6), pathWorldPoint(g, distance + 0.38, inner, b + 2.6), 0.13, "stone", "detail", dark);
}

// A gate tower over one end of a masonry arch (the `gates` parameter; the Old Town
// Bridge Tower in Prague): two side walls standing on the ground beside the deck, the
// passage between them up to the overhead clearance and a pointed arch over it (a
// wall across the deck whose underside traces the arch), a cornice band, a steep
// pyramid roof, four corner turrets with spires and a row of dark windows on both
// faces. It stands just inside the bridge's end, over its abutment.
const GATE_DEPTH = 7, GATE_OUT = 1.2, GATE_BODY = 5.5, GATE_ROOF = 9, ROOF_COLOR: Rgb = [62, 66, 74];
function pushGateTower(out: BridgeBox[], g: BridgePathGeom, end: 0 | 1, heightAt: TerrainHeightFn): void {
  const m = style.masonry, wall = tone(m, 0.78), band = tone(m, MASONRY_BAND), dark: Rgb = [40, 38, 36];
  const half = g.deckWidth / 2, pass = half - PARAPET_THICKNESS - 0.1, outer = half + GATE_OUT;
  const dc = end ? g.length - (GATE_DEPTH / 2 - 0.3) : GATE_DEPTH / 2 - 0.3, yaw = pathYaw(g, dc);
  const spring = g.clearanceY + 0.3, r = pass * 1.3, xc = pass - r;
  const archAt = (x: number): number => (Math.abs(x) >= pass ? spring : spring + Math.sqrt(Math.max(0, r * r - (Math.abs(x) - xc) ** 2)));
  const crown = archAt(0), top = crown + GATE_BODY;
  // the side walls, on the ground
  for (const sd of [-1, 1]) {
    const w = outer - pass, lx = sd * (pass + outer) / 2;
    const foot = footprintTerrain(g, dc, lx, w, GATE_DEPTH, heightAt).low;
    const p = pathWorldPoint(g, dc, lx, top);
    out.push({ shape: "box", center: { x: p.x, y: (foot + p.y) / 2, z: p.z }, size: { x: w, y: p.y - foot, z: GATE_DEPTH }, yaw, material: m, part: "frame", ground: true, color: wall });
  }
  // the arch over the passage
  const xs = [-(pass + 0.25), ...Array.from({ length: 13 }, (_, i) => -pass + (2 * pass * i) / 12), pass + 0.25];
  pushWallAt(out, xs.map((x) => pathWorldPoint(g, dc, x, 0)), GATE_DEPTH, xs.map((x) => pathWorldPoint(g, dc, x, archAt(x)).y), xs.map((x) => pathWorldPoint(g, dc, x, top).y), m, "frame", wall);
  // cornice band, roof, turrets and spires
  pushBox(out, g, dc, 0, top - 0.2, { x: 2 * outer + 0.5, y: 0.6, z: GATE_DEPTH + 0.5 }, m, "detail", band);
  out.push({ shape: "box", center: pathWorldPoint(g, dc, 0, top + 0.1 + GATE_ROOF / 2), size: { x: 2 * outer - 0.6, y: GATE_ROOF, z: GATE_DEPTH - 0.6 }, yaw, material: "steel", part: "frame", topScale: 0.12, color: ROOF_COLOR });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const lx = sx * (outer - 0.25), along = sz * (GATE_DEPTH / 2 - 0.25);
    pushBox(out, g, dc + along, lx, top + 0.5, { x: 1.1, y: 3.0, z: 1.1 }, m, "detail", wall);
    out.push({ shape: "box", center: pathWorldPoint(g, dc + along, lx, top + 2.0 + 2.25), size: { x: 1.3, y: 4.5, z: 1.3 }, yaw, material: "steel", part: "detail", topScale: 0.03, color: ROOF_COLOR });
  }
  // a row of windows on both faces
  for (const sz of [-1, 1]) for (const lx of [-outer * 0.55, 0, outer * 0.55]) {
    pushBox(out, g, dc + sz * (GATE_DEPTH / 2 + 0.04), lx, crown + 2.8, { x: 0.9, y: 2.2, z: 0.16 }, m, "detail", dark);
  }
}

// A masonry pier standing in water sits on a starling: the pier and its cutwaters
// again, STARLING_OUT wider all round, from the bed up to STARLING_RISE above the
// waterline -- the ledge the current breaks on. Like a footing it is not charted.
const STARLING_OUT = 0.5, STARLING_RISE = 0.8;
function pushStarling(out: BridgeBox[], g: BridgePathGeom, distance: number, spec: PierSpec, heightAt: TerrainHeightFn, waterY: number): void {
  // a low arch springs near the water: the starling stops short of the springing
  const top = Math.min(waterY + STARLING_RISE, pathWorldPoint(g, distance, 0, spec.cutwaterTop!).y - 0.3);
  if (top < waterY + 0.2) return;
  const yaw = pathYaw(g, distance);
  const w = spec.w + 2 * STARLING_OUT, d = spec.d + 2 * STARLING_OUT;
  const block = footprintTerrain(g, distance, 0, w, d, heightAt).low;
  const c = pathWorldPoint(g, distance, 0, 0);
  out.push({ shape: "box", center: { x: c.x, y: (block + top) / 2, z: c.z }, size: { x: w, y: top - block, z: d }, yaw, material: spec.material, part: "support" });
  for (const s of [-1, 1]) {
    const p = pathWorldPoint(g, distance, s * w / 2, 0);
    const foot = Math.min(block, heightAt(p.x, p.z));
    out.push({ shape: "box", center: { x: p.x, y: (foot + top) / 2, z: p.z }, size: { x: d / Math.SQRT2, y: top - foot, z: d / Math.SQRT2 }, yaw: yaw + Math.PI / 4, material: spec.material, part: "support" });
  }
}
function buildPathPiers(out: BridgeBox[], g: BridgePathGeom, heightAt: TerrainHeightFn, pierFractions?: number[], spec: PierSpec = { w: PIER_WIDTH, d: PIER_WIDTH, material: "pier" }, waterAt?: WaterLevelFn, at?: number[]): void {
  const distances = at ?? (pierFractions ? pierFractions.map((f) => g.length * Math.min(Math.max(f, 0), 1)) : defaultPierDistances(g));
  for (const d of distances) pushPier(out, g, d, spec, heightAt, waterAt);
}
// The pier at a structural-span boundary (and at both ends of a spanned type).
//
// The masonry blocks are 0.4 wider than the deck so their faces sit proud of the
// arch/masonry outer faces (which land on the deckWidth/2 plane): at a boundary the
// two spans' masonry overlaps on that plane and would z-fight with a flush pier.
function boundaryPierStyle(bridgeType: string, deckWidth: number, spanLength: number): PierSpec {
  const legs = (legX: number, legW: number): PierSpec => ({ w: 0, d: 0, material: "tower", capWidth: 2 * legX + legW + 0.4, bearings: [] });
  switch (bridgeType) {
    case "box_girder": return { w: Math.max(2.8, deckWidth * 0.28), d: 3, material: "pier", under: BOX_GIRDER_END_DEPTH + BOX_GIRDER_LIP };
    case "plate_girder": return { w: Math.max(2.2, deckWidth * 0.24), d: 2.6, material: "pier", under: plateGirderUnder(spanLength), capWidth: deckWidth + 0.4, bearings: [-(deckWidth / 2 - PLATE_GIRDER_X), deckWidth / 2 - PLATE_GIRDER_X] };
    case "deck_truss": return { w: Math.max(2.2, deckWidth * 0.24), d: 2.6, material: "pier", under: deckTrussDepth(spanLength) - DECK_THICKNESS / 2, capWidth: deckWidth, bearings: [-(deckWidth / 2 - 0.55), deckWidth / 2 - 0.55] };
    // (its `piers` parameter stands it on dressed stone by default: choosePier)
    case "truss": return { w: Math.max(2.4, deckWidth * 0.26), d: 2.8, material: "pier", capWidth: deckWidth + 0.2, bearings: [-(deckWidth / 2 - 0.3), deckWidth / 2 - 0.3] };
    // the concrete arch springs from a block under each rib, the two tied by a cap
    // beam under the deck (a deck-wide wall read as the arch balancing on a dam)
    case "arch": return { w: ARCH_RIB_W + 1.0, d: 3.4, material: "pier", columns: [-(deckWidth / 2 - ARCH_RIB_INSET), deckWidth / 2 - ARCH_RIB_INSET], capWidth: deckWidth - 0.2, bearings: [] };
    case "stone_arch": return { w: deckWidth + 0.4, d: 4.5, material: style.masonry, cutwaterTop: masonryArchSpringY(spanLength), impost: masonryArchSpringY(spanLength) };
    case "tied_arch": return { w: 2.6, d: 2.6, material: "tower", capWidth: deckWidth + 0.2, bearings: [-(deckWidth / 2 - TIED_ARCH_THICKNESS / 2), deckWidth / 2 - TIED_ARCH_THICKNESS / 2] };
    case "suspension": return { ...legs(suspensionCableHalfWidth(deckWidth), SUSPENSION_TOWER_WIDTH), w: 4.0, d: 4.0 };
    case "cable_stayed": return { ...legs(cableStayedTowerHalfWidth(deckWidth), CABLE_STAYED_TOWER_WIDTH), w: 3.6, d: 3.6 };
    default: return { w: PIER_WIDTH, d: PIER_WIDTH, material: "pier" };
  }
}
function buildSpanBoundaryPiers(out: BridgeBox[], g: BridgePathGeom, ranges: SpanRange[], bridgeType: string, heightAt: TerrainHeightFn, waterAt?: WaterLevelFn, onAbutment?: (distance: number) => boolean): void {
  const distances: number[] = [];
  for (const range of ranges) {
    for (const distance of [range.fromDistance, range.toDistance]) {
      if (onAbutment?.(distance)) continue;
      if (!distances.some((d) => Math.abs(d - distance) < 0.05)) distances.push(distance);
    }
  }
  for (const d of distances) {
    // a pier is styled for the longer of the spans it carries (they differ only once
    // the plan moved a support off taken ground)
    const adjacent = ranges.filter((r) => Math.abs(r.fromDistance - d) < 0.05 || Math.abs(r.toDistance - d) < 0.05);
    const spanLength = Math.max(...adjacent.map((r) => r.toDistance - r.fromDistance));
    const style = boundaryPierStyle(bridgeType, g.deckWidth, spanLength);
    // the bridge's two ends stand on abutments: no cutwater there
    const end = d < 0.05 || d > g.length - 0.05;
    pushPier(out, g, d, end ? { ...style, cutwaterTop: undefined } : style, heightAt, waterAt);
  }
}

// --- support planning ---------------------------------------------------------
//
// Where a bridge's ground supports stand: the span-boundary piers of a spanned type,
// a beam bridge's piers, a trestle's bents, a cantilever's tower piers and a cable
// bridge's towers. With nothing to avoid they stand where they always have (equal
// spans, equal spacing); the game adds what it knows about the ground under the
// bridge and the player's own choices:
//
// - `groundBlocked`: is the footprint a support would stand on taken (a track, a
//   road, a building)? A support avoids taken ground.
// - `pylons`: distances along the path where the player put a support. Each is
//   kept as a fixed support, wherever it stands; the rest of the layout is planned
//   around them.
// - `blockedSpans`: stretches of the path where no support may stand at all.
//
// The layout is planned for the whole bridge at once, not pier by pier: between two
// fixed supports (the ends, the player's pylons) every candidate station is weighed
// and the cheapest chain of spans wins -- spans close to the type's even spacing,
// none longer than its span limit, no support on a blocked station. A support that
// has nowhere to go is dropped and its neighbours span over; only when even that
// would stretch a span past the hard cap does one stand on blocked ground. Cable
// towers are never dropped: each slides to the nearest free station within a quarter
// of its main span, or stays.
//
// Deterministic: the same path, options and ground give the same plan.

/** The rectangle a support stands on: centre, yaw (radians, like a box) and size across x along. */
export interface SupportFootprint { x: number; z: number; yaw: number; w: number; d: number }
/** Is the ground under this footprint taken? */
export type GroundBlockedFn = (footprint: SupportFootprint) => boolean;
/** A stretch of the path where no support may stand (distances along it). */
export interface BlockedSpan { from: number; to: number }
/** What the game tells the planner about the ground and the player's choices. */
export interface SupportOptions {
  groundBlocked?: GroundBlockedFn;
  /** The player's supports, as distances along the path. */
  pylons?: number[];
  blockedSpans?: BlockedSpan[];
}
/** Where a bridge's supports stand. */
export interface SupportPlan {
  /** The structural spans the superstructure repeats over (one whole span for an unspanned type). */
  spans: SpanRange[];
  /** Every ground support's distance along the path (ends included where the type stands on them). */
  supports: number[];
  /** A cable type's towers (empty for every other type). */
  towers: number[];
  /** Supports that had nowhere free to stand and stand on blocked ground anyway. */
  blocked: number[];
  /**
   * A trestle's stretches between two neighbouring bents over blocked ground (taken, or
   * in a blocked span): the opening a track or a road runs through, where the trestle
   * draws no longitudinal ties low across it. Absent for every other type, and when
   * there is none.
   */
  openings?: SpanRange[];
}

const PLAN_STEP = 0.5; // candidate stations every half stud
const PLAN_BLOCK_COST = 1000; // a support on taken ground
const PLAN_SPAN_COST = 1e12; // a support in one of the player's blocked spans: never, while any other way exists
const PLAN_HARD_COST = 1e6; // per stud a span runs past the hard cap
const PLAN_SOFT_COST = 4; // per (relative) stud a span runs past the type's limit
const PLAN_MIN_GAP = 1; // no candidate this close to a fixed support

type SupportKind = "spans" | "cantilever" | "piers" | "bents" | "towers";
function supportKind(type: string): SupportKind {
  if (CABLE_TYPES.has(type)) return "towers";
  if (type === "cantilever") return "cantilever";
  if (type === "timber_trestle") return "bents";
  if (STRUCTURE_META[type]?.maxSpan) return "spans";
  return "piers";
}

const trestleBentCount = (length: number): number => Math.max(2, Math.ceil(length / TRESTLE_BENT));
function defaultPierDistances(g: BridgePathGeom): number[] {
  const numIntermediate = Math.max(0, Math.floor(g.length / PIER_SPACING) - 1);
  const totalPiers = numIntermediate + 2;
  const d: number[] = [];
  for (let i = 1; i <= totalPiers; i++) d.push((g.length * (i - 1)) / (totalPiers - 1));
  return d;
}
function defaultBentDistances(length: number): number[] {
  const count = trestleBentCount(length);
  return Array.from({ length: count + 1 }, (_, i) => (length * i) / count);
}
function spansFromStops(stops: number[]): SpanRange[] {
  return stops.slice(1).map((to, i) => ({ fromDistance: stops[i]!, toDistance: to }));
}

// How wide and deep the ground under a support of `type` is, for the blocked test:
// the widest it can be drawn. A concrete shaft widens with its height (pushPier, up to
// PIER_MAX_FLARE) and stands on a footing FOOTING_MARGIN wider each side; the planner
// does not know the height, so it keeps the tallest pier's foot off taken ground.
const PIER_MAX_FLARE = 1.6;
function supportFootprintSize(type: string, kind: SupportKind, deckWidth: number, spanLength: number): { w: number; d: number } {
  const foot = (d: number): number => d * PIER_MAX_FLARE + 2 * FOOTING_MARGIN;
  // a pier of another material than concrete stands on its own footprint
  const chosen = (spec: PierSpec): { w: number; d: number } | null => {
    const c = choosePier(spec, deckWidth);
    if (c.material === "steel") return { w: (c.capWidth ?? deckWidth) + 2 * STEEL_SPREAD_MAX + STEEL_FOOT, d: STEEL_TOP_D + 2 * STEEL_SPREAD_ALONG_MAX + STEEL_FOOT };
    if (c.material === "stone" || c.material === "brick") return { w: c.w, d: c.d + 2 * FOOTING_MARGIN };
    return null;
  };
  switch (kind) {
    case "bents": return { w: 0.84 * deckWidth + 0.9, d: 0.9 };
    case "piers": return chosen({ w: PIER_WIDTH, d: PIER_WIDTH, material: "pier" }) ?? { w: Math.max(PIER_WIDTH, deckWidth * 0.6), d: foot(PIER_WIDTH) };
    case "cantilever": return chosen(CANTILEVER_PIER(deckWidth)) ?? { w: 2 * (deckWidth / 2 + 0.3) + 1.4, d: foot(5.4) };
    default: {
      const own = chosen(boundaryPierStyle(type, deckWidth, spanLength));
      if (own) return own;
      const spec = boundaryPierStyle(type, deckWidth, spanLength);
      const w = spec.columns ? deckWidth : Math.max(spec.w, spec.capWidth ?? 0, deckWidth * 0.5);
      const concrete = spec.material === "pier" || spec.material === "tower";
      return { w, d: concrete ? foot(spec.d) : spec.d + 2 * FOOTING_MARGIN };
    }
  }
}

/** The ground footprint a support of `type` at `distance` along `g` would stand on. */
export function supportFootprint(type: string, g: BridgePathGeom, distance: number, params?: BridgeParams): SupportFootprint {
  const stored = storedBridge(type, params);
  return withStyle(stored.type, stored.params, () => footprintStyled(structureOf(stored.type, stored.params), g, distance));
}
function footprintStyled(type: string, g: BridgePathGeom, distance: number): SupportFootprint {
  const kind = supportKind(type);
  const spans = spanRanges(type, g.length);
  const span = spans.length ? spans[0]!.toDistance - spans[0]!.fromDistance : g.length;
  const size = supportFootprintSize(type, kind, g.deckWidth, span);
  const c = pathWorldPoint(g, distance, 0, 0);
  return { x: c.x, z: c.z, yaw: pathYaw(g, distance), w: size.w, d: size.d };
}

// The default plan: today's layout, with nothing to avoid.
function defaultPlan(type: string, g: BridgePathGeom): SupportPlan {
  const kind = supportKind(type);
  const L = g.length;
  switch (kind) {
    case "towers": {
      const towers = towerDistances(type, L);
      return { spans: spansFromStops([0, ...towers, L]), supports: towers, towers, blocked: [] };
    }
    case "piers": return { spans: [{ fromDistance: 0, toDistance: L }], supports: defaultPierDistances(g), towers: [], blocked: [] };
    case "bents": return { spans: [{ fromDistance: 0, toDistance: L }], supports: defaultBentDistances(L), towers: [], blocked: [] };
    case "cantilever": {
      const spans = spanRanges(type, L);
      const supports = spans.flatMap((r) => CANTILEVER_TOWER_T.map((t) => r.fromDistance + t * (r.toDistance - r.fromDistance)));
      return { spans, supports, towers: [], blocked: [] };
    }
    default: {
      const spans = spanRanges(type, L);
      const supports = [0, ...spans.map((r) => r.toDistance)];
      return { spans, supports, towers: [], blocked: [] };
    }
  }
}

function cleanPylons(pylons: number[] | undefined, length: number): number[] {
  const out: number[] = [];
  for (const p of [...(pylons ?? [])].filter((p) => Number.isFinite(p)).sort((a, b) => a - b)) {
    if (p <= PLAN_MIN_GAP || p >= length - PLAN_MIN_GAP) continue;
    if (out.length && p - out[out.length - 1]! < PLAN_MIN_GAP) continue;
    out.push(p);
  }
  return out;
}

/**
 * Where the supports of a `type` bridge along `g` stand, given the ground and the
 * player's pylons and blocked spans (see the section comment). With no options, or
 * nothing in the way, it is the type's even default layout.
 */
export function planSupports(type: string, g: BridgePathGeom, options: SupportOptions = {}, params?: BridgeParams): SupportPlan {
  const stored = storedBridge(type, params);
  return withStyle(stored.type, stored.params, () => planStyled(structureOf(stored.type, stored.params), g, options));
}
function planStyled(type: string, g: BridgePathGeom, options: SupportOptions): SupportPlan {
  const kind = supportKind(type);
  const L = g.length;
  const base = defaultPlan(type, g);
  if (L <= 0) return base;
  const pylons = cleanPylons(options.pylons, L);
  const spans = (options.blockedSpans ?? []).filter((s) => Number.isFinite(s.from) && Number.isFinite(s.to) && s.to > s.from);
  const ground = options.groundBlocked;
  const baseSpan = base.spans.length ? base.spans[0]!.toDistance - base.spans[0]!.fromDistance : L;
  const size = supportFootprintSize(type, kind, g.deckWidth, baseSpan);
  const cache = new Map<number, number>();
  const inSpan = (d: number): boolean => spans.some((s) => d + size.d / 2 > s.from && d - size.d / 2 < s.to);
  // 0 free, PLAN_BLOCK_COST on taken ground, PLAN_SPAN_COST in a blocked span
  const blockCost = (d: number): number => {
    const key = Math.round(d * 1000);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    let cost = inSpan(d) ? PLAN_SPAN_COST : 0;
    if (!cost && ground) {
      const c = pathWorldPoint(g, d, 0, 0);
      if (ground({ x: c.x, z: c.z, yaw: pathYaw(g, d), w: size.w, d: size.d })) cost = PLAN_BLOCK_COST;
    }
    cache.set(key, cost);
    return cost;
  };
  const blockedAt = (d: number): boolean => blockCost(d) > 0;
  const isEnd = (d: number): boolean => d < 0.05 || d > L - 0.05;
  // A trestle's openings: neighbouring bents with blocked ground anywhere between them,
  // tested every stud (ground or span, whichever the stretch crosses).
  const withOpenings = (plan: SupportPlan): SupportPlan => {
    if (kind !== "bents" || (!ground && spans.length === 0)) return plan;
    const openings: SpanRange[] = [];
    for (let i = 1; i < plan.supports.length; i++) {
      const a = plan.supports[i - 1]!, b = plan.supports[i]!;
      for (let d = a + 1; d < b - 0.5; d += 1) {
        if (blockedAt(d)) { openings.push({ fromDistance: a, toDistance: b }); break; }
      }
    }
    return openings.length ? { ...plan, openings } : plan;
  };
  // nothing to plan: the default layout stands free
  if (pylons.length === 0 && base.supports.every((d) => isEnd(d) || !blockedAt(d))) return withOpenings(base);

  if (kind === "towers") {
    const main = baseSpan;
    const towers = pylons.length ? pylons : base.towers.map((t) => {
      if (!blockedAt(t)) return t;
      const reach = main / 4;
      for (let step = PLAN_STEP; step <= reach; step += PLAN_STEP) {
        for (const d of [t - step, t + step]) if (d > PLAN_MIN_GAP && d < L - PLAN_MIN_GAP && !blockedAt(d)) return d;
      }
      return t;
    });
    const sorted = [...towers].sort((a, b) => a - b);
    return { spans: spansFromStops([0, ...sorted, L]), supports: sorted, towers: sorted, blocked: sorted.filter((d) => !pylons.includes(d) && blockedAt(d)) };
  }

  // the spacing a span aims at, the type's limit and the hard cap
  let target: number, soft: number, hard: number;
  switch (kind) {
    case "piers": target = base.supports.length > 1 ? base.supports[1]! - base.supports[0]! : L; soft = Math.max(target, 2 * PIER_SPACING); hard = soft * 1.4; break;
    // a trestle opens up to three bents' spacing: enough to clear a track or a road
    // (their footprint is some 16 studs of ground) with one longer opening
    case "bents": target = L / trestleBentCount(L); soft = TRESTLE_BENT * 1.25; hard = TRESTLE_BENT * 3; break;
    default: { const max = STRUCTURE_META[type]?.maxSpan ?? L; target = baseSpan; soft = max; hard = max * 1.5; }
  }
  const spanCost = (s: number): number => {
    const dev = (s - target) / target;
    let c = dev * dev;
    if (s > soft) c += PLAN_SOFT_COST * (s - soft) / soft;
    if (s > hard) c += PLAN_HARD_COST * (s - hard);
    return c;
  };
  // the cantilever's piers stand inside its spans, at a quarter and three quarters
  const innerCost = (a: number, b: number): number =>
    kind === "cantilever" ? CANTILEVER_TOWER_T.reduce((sum, t) => sum + blockCost(a + t * (b - a)), 0) : 0;
  const nodeCost = (d: number): number => (kind === "cantilever" ? 0 : blockCost(d));
  // how far back a span may reach: past the hard cap, and past any blocked span
  const reach = Math.max(hard * 2, target * 3, ...spans.map((s) => s.to - s.from + size.d + hard));

  const fixed = [0, ...pylons, L];
  const stops: number[] = [0];
  for (let k = 1; k < fixed.length; k++) {
    const a = fixed[k - 1]!, b = fixed[k]!;
    const nodes = [a];
    for (let d = a + PLAN_MIN_GAP; d <= b - PLAN_MIN_GAP + 1e-9; d += PLAN_STEP) nodes.push(Math.round(d * 1000) / 1000);
    nodes.push(b);
    const cost = new Array<number>(nodes.length).fill(Infinity);
    const prev = new Array<number>(nodes.length).fill(-1);
    cost[0] = 0;
    for (let j = 1; j < nodes.length; j++) {
      const nj = j === nodes.length - 1 ? 0 : nodeCost(nodes[j]!);
      for (let i = j - 1; i >= 0; i--) {
        const s = nodes[j]! - nodes[i]!;
        if (s > reach && i !== 0) break;
        if (cost[i] === Infinity) continue;
        const c = cost[i]! + spanCost(s) + innerCost(nodes[i]!, nodes[j]!) + nj;
        if (c < cost[j]! - 1e-12) { cost[j] = c; prev[j] = i; }
        if (s > reach) break;
      }
    }
    const chain: number[] = [];
    for (let j = nodes.length - 1; j > 0; j = prev[j]!) chain.push(nodes[j]!);
    stops.push(...chain.reverse());
  }
  const planSpans = spansFromStops(stops);
  if (kind === "cantilever") {
    const supports = [...planSpans.flatMap((r) => CANTILEVER_TOWER_T.map((t) => r.fromDistance + t * (r.toDistance - r.fromDistance))), ...pylons].sort((a, b) => a - b);
    return { spans: planSpans, supports, towers: [], blocked: supports.filter((d) => !pylons.includes(d) && blockedAt(d)) };
  }
  const blocked = stops.filter((d) => !isEnd(d) && !pylons.includes(d) && blockedAt(d));
  if (kind === "bents") return withOpenings({ spans: [{ fromDistance: 0, toDistance: L }], supports: stops, towers: [], blocked });
  if (kind === "piers") return { spans: [{ fromDistance: 0, toDistance: L }], supports: stops, towers: [], blocked };
  return { spans: planSpans, supports: stops, towers: [], blocked };
}

// --- per-type builders (Bridge.luau 1932-2260) ---
// `supports` / `towers`: the planned stations (planSupports) of a type that lays its
// own piers, bents or towers over the whole path; absent, the type's default.
// `openings`: a trestle's stretches over blocked ground (SupportPlan.openings).
// `onAbutment`: does the support at this distance stand on an abutment instead (an end over a bank)?
type BuildOpts = { suppressGroundPiers?: boolean; waterAt?: WaterLevelFn; supports?: number[]; towers?: number[]; openings?: SpanRange[]; onAbutment?: (distance: number) => boolean };
type Builder = (out: BridgeBox[], g: BridgePathGeom, opts: BuildOpts, heightAt: TerrainHeightFn) => void;

// Two concrete girders under the slab, over the bearings of the hammerhead piers.
const buildBeam: Builder = (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  buildPathParapets(out, g);
  for (const side of [-1, 1]) pushRibbon(out, g, g.shiftAmount + side * g.deckWidth * BEAM_GIRDER_X, -DECK_THICKNESS / 2 - BEAM_GIRDER_DEPTH / 2, BEAM_GIRDER_WIDTH, BEAM_GIRDER_DEPTH, "pier", "frame");
  const at = (opts.supports ?? defaultPierDistances(g)).filter((d) => !opts.onAbutment?.(d));
  buildPathPiers(out, g, heightAt, undefined, { w: PIER_WIDTH, d: PIER_WIDTH, material: "pier", under: BEAM_GIRDER_DEPTH }, opts.waterAt, at);
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
// arm from each tower back to the span's end (no pier there: the arm rests on the
// abutment or meets the next span's arm), a cantilever arm
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
    buildPathPiers(out, g, heightAt, CANTILEVER_TOWER_T, CANTILEVER_PIER(g.deckWidth), opts.waterAt);
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
    pushWall(out, g, distances, sx, FACE + 0.18, bandBottoms, openTops, masonry, "frame", tone(masonry, 1.12));
  }
  // the barrel vault between the two faces, its underside flush with the band's:
  // without it the arch was two face walls, open to the deck from below
  const innerHalf = sideX - (FACE + 0.18) / 2;
  // in shadow under the arch: darker, so the opening reads as depth
  pushWall(out, g, distances, 0, 2 * innerHalf, bandBottoms, openTops, masonry, "detail", tone(masonry, 0.62)); // unseen from afar
  // a keystone at the crown, standing proud of the band on both faces
  const crown = openingTopY(0.5);
  for (const sx of [sideX, -sideX]) pushBox(out, g, g.length / 2, sx, crown - ARCH_BAND / 2 + 0.25, { x: FACE + 0.4, y: ARCH_BAND + 0.5, z: 1.1 }, masonry, "detail", tone(masonry, MASONRY_BAND));
};
// stone or brick, as the masonry parameter chose
const buildMasonryArch: Builder = (out, g, opts, heightAt) => makeArchMasonry(style.masonry)(out, g, opts, heightAt);

// A tied arch: two box-section steel arches springing from knuckles on the tie
// girders along both deck edges (the deck is the tie), hangers about every 4 studs
// (crossing each other on a network arch), and between the arches, wherever they
// stand clear above the wires, transverse struts with X bracing between them.
const TIE_GIRDER_TOP = DECK_THICKNESS / 2 + 1.4;
const ARCH_END_INSET = 0.05;
const makeTiedArch = (network: boolean): Builder => (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  if (!opts.suppressGroundPiers) buildPathPiers(out, g, heightAt, undefined, undefined, opts.waterAt);
  const ARCH_THICKNESS = TIED_ARCH_THICKNESS;
  const sideX = g.deckWidth / 2 - ARCH_THICKNESS / 2;
  const archTopY = (t: number): number => tiedArchTopY(g.length, t, g.clearanceY);
  const struts = tiedArchStruts(g.length, g.clearanceY);
  const tieBottom = -DECK_THICKNESS / 2 - CORNICE_DEPTH - 0.2;
  for (const sx of [sideX, -sideX]) {
    pushRibbon(out, g, g.shiftAmount + sx, (TIE_GIRDER_TOP + tieBottom) / 2, 0.9, TIE_GIRDER_TOP - tieBottom, "steel", "frame");
    // the arch ends just inside its knuckles (buried in them), not flush with the deck's end
    const inset = ARCH_END_INSET / g.length;
    pushCurve(out, g, sx, archTopY, ARCH_THICKNESS * 1.5, ARCH_THICKNESS * 1.1, "steel", struts, "frame", inset, 1 - inset);
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
// vertical or crossing (network) hangers, as the hangers parameter chose
const buildTiedArch: Builder = (out, g, opts, heightAt) => makeTiedArch(style.network)(out, g, opts, heightAt);

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
const buildSuspension: Builder = (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  const towers = opts.towers ?? cableTowerDistances("suspension", g.length);
  const main = g.length / towers.length;
  const sideX = suspensionCableHalfWidth(g.deckWidth);
  buildPathPiers(out, g, heightAt, towers.map((d) => d / g.length), { ...boundaryPierStyle("suspension", g.deckWidth, main), w: 3.2, d: 3.2 }, opts.waterAt, opts.towers);
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
    // the main span this distance falls in; a shorter one (towers moved off the
    // ground beneath) sags in proportion, so its cable stays clear of the deck
    let i = 0;
    while (i < towers.length - 2 && d > towers[i + 1]!) i++;
    const span = Math.max(towers[i + 1]! - towers[i]!, 0.001);
    const s = 2 * ((d - towers[i]!) / span) - 1;
    return towerTopY - SAG * Math.min(1, span / main) * (1 - s * s);
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
// The pylon is an H (the `towers` parameter `h`: two legs beside the deck, a crossbeam
// on top, the stays in two vertical planes from the legs) or an inverted Y (`y`): the legs stand upright beside the deck to a knee above the
// wire envelope -- so a cross-span wire between them still finds two verticals --
// then lean in to one mast over the deck's centre, whose stays fan down to both
// deck edges in two inclined planes.
const STAY_SPACING = 4;
const makeCableStayed = (pylon: "h" | "y"): Builder => (out, g, opts, heightAt) => {
  buildPathDeck(out, g);
  const towers = opts.towers ?? cableTowerDistances("cable_stayed", g.length);
  const main = g.length / towers.length;
  const sideX = cableStayedTowerHalfWidth(g.deckWidth);
  buildPathPiers(out, g, heightAt, towers.map((d) => d / g.length), { ...boundaryPierStyle("cable_stayed", g.deckWidth, main), w: 3, d: 3 }, opts.waterAt, opts.towers);
  pushCableGirders(out, g, sideX, "deck");
  const TOWER_WIDTH = CABLE_STAYED_TOWER_WIDTH;
  const y = pylon === "y";
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
      // half way to the neighbouring tower (where its own stays meet these), or the abutment
      const end = dir < 0 ? (i === 0 ? 1 : (td + towers[i - 1]!) / 2) : (i === towers.length - 1 ? g.length - 1 : (td + towers[i + 1]!) / 2);
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
// H-frame or inverted-Y towers, as the towers parameter chose
const buildCableStayed: Builder = (out, g, opts, heightAt) => makeCableStayed(style.yTowers ? "y" : "h")(out, g, opts, heightAt);

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
const buildTimberTrestle: Builder = (out, g, opts, heightAt) => {
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
  const bents = opts.supports ?? defaultBentDistances(g.length);
  let previous: { d: number; level: Vec3[] } | null = null;
  for (const d of bents) {
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
    // the longitudinal ties to the previous bent -- except across an opening, where they
    // would run low over the track or road the bents were moved off
    const open = previous !== null && (opts.openings ?? []).some((o) => Math.abs(o.fromDistance - previous!.d) < 0.01 && Math.abs(o.toDistance - d) < 0.01);
    if (previous && !open && level.length && previous.level.length) for (const j of [0, 1]) pushStrut(out, previous.level[j]!, level[j]!, 0.26, "timber");
    previous = { d, level };
  }
};

const BUILDERS: Record<string, Builder> = {
  plate_girder: buildPlateGirder, timber_trestle: buildTimberTrestle, box_girder: buildBoxGirder, deck_truss: buildDeckTruss,
  beam: buildBeam, truss: buildTruss, cantilever: buildCantilever, arch: buildArch,
  stone_arch: buildMasonryArch, tied_arch: buildTiedArch, suspension: buildSuspension, cable_stayed: buildCableStayed,
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
 * does not know builds as a beam bridge. `options` (or a plan from planSupports)
 * moves the supports off taken ground and keeps the player's pylons.
 */
export function buildBridge(type: string, g: BridgePathGeom, heightAt: TerrainHeightFn, waterAt?: WaterLevelFn, options: SupportOptions | SupportPlan = {}, params?: BridgeParams): BridgeBox[] {
  const stored = storedBridge(type, params);
  const known = BUILDERS[stored.type] ? stored.type : "beam";
  return withStyle(known, stored.params, () => buildStyled(structureOf(known, stored.params), g, heightAt, waterAt, options));
}
function buildStyled(type: string, g: BridgePathGeom, heightAt: TerrainHeightFn, waterAt: WaterLevelFn | undefined, options: SupportOptions | SupportPlan): BridgeBox[] {
  const out: BridgeBox[] = [];
  const builder = BUILDERS[type] ?? BUILDERS.beam!;
  const known = BUILDERS[type] ? type : "beam";
  const plan = "supports" in options && Array.isArray(options.supports) && "spans" in options ? options as SupportPlan : planStyled(known, g, options as SupportOptions);
  const maxSpan = STRUCTURE_META[known]?.maxSpan;
  // the ends: an abutment's breast wall under the types that bear on a seat there
  const under = abutmentUnder(known, g, plan.spans);
  const breast = SEATED_TYPES.has(known) || CABLE_TYPES.has(known);
  const onAbutment = SEATED_TYPES.has(known) ? (d: number): boolean => endOnAbutment(g, d, under, heightAt) : undefined;
  const material: BridgeMaterial = known === "timber_trestle" ? "timber" : known === "stone_arch" ? style.masonry : "pier";
  if (!maxSpan || CABLE_TYPES.has(known)) {
    builder(out, g, { waterAt, supports: plan.supports, towers: plan.towers.length ? plan.towers : undefined, openings: plan.openings, onAbutment }, heightAt);
  } else {
    const ranges = plan.spans;
    for (const range of ranges) {
      const spanGeom = clipPathGeom(g, range.fromDistance, range.toDistance);
      if (spanGeom) builder(out, spanGeom, { suppressGroundPiers: known !== "cantilever", waterAt }, heightAt);
    }
    // a cantilever stands on its two tower piers alone: its anchor arms reach the
    // abutments (or the next span's arms), with no pier of their own under them --
    // except where the player put a pylon, which stands as a plain boundary pier
    if (known !== "cantilever") buildSpanBoundaryPiers(out, g, ranges, known, heightAt, waterAt, onAbutment);
    else {
      const inner = new Set(ranges.flatMap((r) => CANTILEVER_TOWER_T.map((t) => Math.round((r.fromDistance + t * (r.toDistance - r.fromDistance)) * 1000))));
      for (const d of plan.supports) if (!inner.has(Math.round(d * 1000)) && !onAbutment?.(d)) pushPier(out, g, d, boundaryPierStyle("truss", g.deckWidth, STRUCTURE_META.cantilever!.maxSpan!), heightAt, waterAt);
    }
  }
  if (known === "stone_arch" && style.gates) for (const end of style.gates === 2 ? [0, 1] as const : [0] as const) pushGateTower(out, g, end, heightAt);
  buildAbutments(out, g, heightAt, material, under, breast);
  // every box carries its colour: its own tone, else its material's in the chosen palette;
  // the masonry draws with the photo its swatch chose
  const surface = style.masonrySurface;
  return out.map((b) => {
    const coloured = b.color ? b : { ...b, color: style.palette[b.material] };
    return surface && b.material === style.masonry && !b.surface ? { ...coloured, surface } : coloured;
  });
}
// The types whose ends bear on an abutment's seat (their end piers give way to it);
// the cable types close on a breast wall too, under their anchorages. The arches
// spring from their own end blocks and keep them.
const SEATED_TYPES = new Set(["beam", "box_girder", "plate_girder", "deck_truss", "truss", "tied_arch", "cantilever"]);
// How far below the slab the seat lies: under the girders, box or truss at the ends.
function abutmentUnder(type: string, g: BridgePathGeom, spans: SpanRange[]): number {
  if (type === "beam") return BEAM_GIRDER_DEPTH;
  if (CABLE_TYPES.has(type)) return CORNICE_DEPTH + 0.15;
  if (!SEATED_TYPES.has(type) || type === "cantilever" || !spans.length) return 0;
  const length = (r: SpanRange): number => r.toDistance - r.fromDistance;
  return boundaryPierStyle(type, g.deckWidth, Math.max(length(spans[0]!), length(spans[spans.length - 1]!))).under ?? 0;
}
