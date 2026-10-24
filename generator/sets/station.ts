// The rail station types (docs/models/sets.md): what a station is built as. A type is
// a LAYOUT RECIPE -- the lateral rows a station of N tracks gets: flanking platforms,
// rails, islands between track pairs, a house strip -- plus a FURNISH function that
// builds the platforms, roofs, sheds, signs and furniture over a layout of any length.
// The game generates the tracks, persists each station's layout (so a later change
// to a recipe never moves the ground under a placed station), paints the name boards
// (the boxes marked `label`) and gives the materials their meaning (glass, light).
//
// Frame: station-local, x across the tracks (rows run from -width/2 to +width/2),
// z along them, y up from the terrain level the station stands on.
//
// Pure data and functions, no imports: bundled into export/sets/station.js.

export type StationRowType = "platform" | "island" | "rail" | "building" | "gap";
export interface StationLayoutRow { type: StationRowType; width: number }
/** A station's cross-section: its rows, in order across the tracks. */
export interface StationLayout { version: number; rows: StationLayoutRow[] }

export type StationBoxMaterial =
  | "platform" | "edge" | "roof" | "column" | "sign" | "safety"
  | "steel" | "glass" | "brick" | "tile" | "wood" | "light";

/** One box of a station, in the station's frame (the game's station box vocabulary). */
export interface StationBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  /** Tilt about Z (radians): sloped slabs, arch segments, roof pitches, stairs. */
  rotZ?: number;
  /** A triangular prism, for clean roof-end infill. */
  profile?: "gable";
  /** The silhouette the game's structure LOD keeps at distance. */
  lod?: "shell" | "support";
  rotX?: number;
  color: [number, number, number];
  material: StationBoxMaterial;
  depthLayer?: number;
  /** A name board: the game paints the station's name across its two large faces. */
  label?: boolean;
}

/** One type's layout recipe: the rows a fresh station of N tracks is laid out with. */
export interface StationRecipe {
  /** The flanking platform's width. */
  platform: number;
  /** Tracks group in pairs with an island between groups (else side by side). */
  paired: boolean;
  /** The island's width between two groups (paired types). */
  island: number;
  /** What closes the far side: a platform, or the village depot's house strip. */
  end: "platform" | "building";
  /** The house strip's width (an `end: "building"` recipe). */
  building: number;
}

export interface StationTypeData { layout: StationRecipe }

// --- dimensions (studs) ---
/** Platform height above terrain level (above the rails). */
export const PLATFORM_HEIGHT = 1.75;
/** Roof column spacing. */
export const ROOF_COLUMN_SPACING = 15;
/**
 * Roof height above the platform (= flat-roof column length). Also the clearance
 * every structure spanning a track must leave: nothing may hang below
 * PLATFORM_HEIGHT + ROOF_HEIGHT over a ballast bed.
 */
export const ROOF_HEIGHT = 10.75;
/** Roof lateral overhang past the outer platform edge. */
export const ROOF_OVERHANG = 1.5;
/** How many studs the roof extends past the first and last column on each end. */
export const ROOF_COLUMN_END_INSET = 2;
/** Island roof tuning: outer-edge height above the platform top and its V slope. */
export const SHARED_ROOF_HEIGHT = 6.25;
export const SHARED_ROOF_SLOPE_DEG = 20;
/**
 * The ballast bed under each station track and the pitch of a rail row: the game's
 * rail cross-section (the railType set), which its tests hold these to.
 */
export const BALLAST_WIDTH = 5;
export const RAIL_ROW_WIDTH = 8;
/** Deck left over on each side of a rail row's ballast bed. */
const RAIL_SHOULDER = (RAIL_ROW_WIDTH - BALLAST_WIDTH) / 2;
/** Bumped when the row vocabulary changes in a way older layouts cannot be read with. */
export const LAYOUT_VERSION = 1;

// row widths: the narrow platform of the plain deck, the generous one a canopy or
// building needs, the island between pairs (the grand terminus' doubles as its
// concourse), the village depot's house strip
const DEFAULT_PLATFORM = 3;
const PLATFORM = 6;
const ISLAND = 10;
const GRAND_ISLAND = 14;
const BUILDING = 10;

const paired = (island: number): StationTypeData => ({ layout: { platform: PLATFORM, paired: true, island, end: "platform", building: 0 } });

export const TYPE_META: Record<string, StationTypeData> = {
  platforms_only: { layout: { platform: DEFAULT_PLATFORM, paired: false, island: 0, end: "platform", building: 0 } },
  platforms_shared: paired(ISLAND),
  arch_shed: paired(ISLAND),
  cantilever_wings: paired(ISLAND),
  concourse: paired(ISLAND),
  village_depot: { layout: { platform: PLATFORM, paired: false, island: 0, end: "building", building: BUILDING } },
  heritage_canopy: paired(ISLAND),
  grand_terminus: paired(GRAND_ISLAND),
};

/**
 * The layout a fresh `type` station of `numTracks` tracks gets from its recipe:
 *
 *   plain          P R R R P            (one continuous deck, tracks adjacent)
 *   paired         P R R I R R P        (pairs, island between groups, none inside)
 *   village depot  P R R B              (house strip on one side)
 *
 * An odd track count on a paired type leaves a single track as the last group. A
 * type this module does not know is laid out as the plain deck.
 */
export function buildLayout(type: string, numTracks: number): StationLayout {
  const recipe = (TYPE_META[type] ?? TYPE_META.platforms_only!).layout;
  const tracks = Math.max(1, Math.floor(numTracks));
  const row = (t: StationRowType, width: number): StationLayoutRow => ({ type: t, width });
  const rows: StationLayoutRow[] = [row("platform", recipe.platform)];
  if (recipe.paired) {
    for (let i = 0; i < tracks; i += 2) {
      if (i > 0) rows.push(row("island", recipe.island));
      rows.push(row("rail", RAIL_ROW_WIDTH));
      if (i + 1 < tracks) rows.push(row("rail", RAIL_ROW_WIDTH));
    }
  } else {
    for (let i = 0; i < tracks; i++) rows.push(row("rail", RAIL_ROW_WIDTH));
  }
  rows.push(recipe.end === "building" ? row("building", recipe.building) : row("platform", recipe.platform));
  return { version: LAYOUT_VERSION, rows };
}

// --- layout geometry ---

function layoutWidth(layout: StationLayout): number {
  let total = 0;
  for (const r of layout.rows) total += r.width;
  return total;
}

interface StationRowSpan { type: StationRowType; width: number; index: number; minX: number; maxX: number; centerX: number }

/** Every row with its station-local X span, centred on the station. */
function rowSpans(layout: StationLayout): StationRowSpan[] {
  const half = layoutWidth(layout) / 2;
  const spans: StationRowSpan[] = [];
  let x = -half;
  for (let i = 0; i < layout.rows.length; i++) {
    const r = layout.rows[i]!;
    spans.push({ type: r.type, width: r.width, index: i, minX: x, maxX: x + r.width, centerX: x + r.width / 2 });
    x += r.width;
  }
  return spans;
}

/** The track centres, in row order. */
function railRowOffsets(layout: StationLayout): number[] {
  return rowSpans(layout).filter((s) => s.type === "rail").map((s) => s.centerX);
}

// --- colours (RGB 0-255) ---
const PLATFORM_COLOR: [number, number, number] = [180, 170, 155];
const EDGE_COLOR: [number, number, number] = [205, 198, 180];
const ROOF_COLOR: [number, number, number] = [120, 60, 40];
const COLUMN_COLOR: [number, number, number] = [160, 155, 150];
const SIGN_COLOR: [number, number, number] = [30, 50, 80];
const SAFETY_COLOR: [number, number, number] = [214, 184, 73];
const STEEL_WHITE: [number, number, number] = [228, 231, 235];
const STEEL_DARK: [number, number, number] = [56, 62, 70];
const GLASS_COLOR: [number, number, number] = [168, 205, 226];
const BRICK_COLOR: [number, number, number] = [152, 84, 68];
const TILE_COLOR: [number, number, number] = [128, 58, 46];
const WOOD_COLOR: [number, number, number] = [128, 88, 56];
const WOOD_CREAM: [number, number, number] = [226, 214, 190];
const IRON_GREEN: [number, number, number] = [74, 112, 86];
const CANOPY_GREEN: [number, number, number] = [46, 82, 62];
const LIGHT_COLOR: [number, number, number] = [255, 240, 200];
const CONCRETE_LIGHT: [number, number, number] = [200, 198, 192];
// the grand terminus' masonry: pale limestone ashlar and the darker plinths/statues
const STONE_LIGHT: [number, number, number] = [222, 212, 190];
const STONE_DARK: [number, number, number] = [190, 178, 156];

// --- shared layout-driven helpers ----------------------------------------

// A walkable band: a deck row plus the ballast shoulder it borrows from each
// neighbouring rail row (that shoulder is where the platform edge sits).
type DeckBand = { minX: number; maxX: number; centerX: number; row: StationRowSpan; edgeLeft: boolean; edgeRight: boolean };

// `fillBetweenRails` paves the strip between two adjacent tracks (the default deck
// keeps its continuous slab); paired types leave it bare, which is what makes a
// pair read as a pair.
function deckBands(layout: StationLayout, fillBetweenRails: boolean): DeckBand[] {
  const spans = rowSpans(layout);
  const bands: DeckBand[] = [];
  for (const span of spans) {
    if (span.type === "rail") continue;
    const left = spans[span.index - 1];
    const right = spans[span.index + 1];
    const minX = span.minX - (left && left.type === "rail" ? RAIL_SHOULDER : 0);
    const maxX = span.maxX + (right && right.type === "rail" ? RAIL_SHOULDER : 0);
    bands.push({
      minX,
      maxX,
      centerX: (minX + maxX) / 2,
      row: span,
      edgeLeft: !!left && left.type === "rail",
      edgeRight: !!right && right.type === "rail",
    });
  }
  if (fillBetweenRails) {
    // pave the gap between two adjacent tracks (two borrowed shoulders)
    for (const span of spans) {
      if (span.type !== "rail") continue;
      const right = spans[span.index + 1];
      if (!right || right.type !== "rail") continue;
      const minX = span.maxX - RAIL_SHOULDER;
      const maxX = right.minX + RAIL_SHOULDER;
      bands.push({ minX, maxX, centerX: (minX + maxX) / 2, row: span, edgeLeft: true, edgeRight: true });
    }
  }
  return bands;
}

// Groups of adjacent rail rows (a "pair" is a group of two; an odd station ends in
// a group of one), each with the deck band centre on either side. The pair-based
// types hang their superstructure off these.
type TrackGroup = { rails: StationRowSpan[]; minX: number; maxX: number; centerX: number; outerLeftX: number; outerRightX: number };

function trackGroups(layout: StationLayout): TrackGroup[] {
  const spans = rowSpans(layout);
  // the walkable band centre per deck row, so a mast or pier stands on the deck
  // rather than on the row's nominal middle
  const bandCenterByRow = new Map<number, number>();
  for (const band of deckBands(layout, false)) bandCenterByRow.set(band.row.index, band.centerX);
  const groups: TrackGroup[] = [];
  let current: StationRowSpan[] = [];
  const flush = () => {
    if (current.length === 0) return;
    const first = current[0];
    const last = current[current.length - 1];
    const left = spans[first.index - 1];
    const right = spans[last.index + 1];
    groups.push({
      rails: current,
      minX: first.minX,
      maxX: last.maxX,
      centerX: (first.minX + last.maxX) / 2,
      outerLeftX: left ? bandCenterByRow.get(left.index) ?? left.centerX : first.minX,
      outerRightX: right ? bandCenterByRow.get(right.index) ?? right.centerX : last.maxX,
    });
    current = [];
  };
  for (const span of spans) {
    if (span.type === "rail") current.push(span);
    else flush();
  }
  flush();
  return groups;
}

// Evenly spaced bay positions (columns, ribs, posts) along the platform, inset from
// both ends so nothing pokes out of the roof.
function bayPositions(length: number, spacing: number): number[] {
  const half = Math.max(1, (length - 4) / 2 - 2);
  const count = Math.max(2, Math.round((half * 2) / spacing) + 1);
  const step = (half * 2) / (count - 1);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(-half + i * step);
  return out;
}

// Platform end ramps: an open-ended platform runs down to the terrain over its last
// RAMP_LENGTH studs. Types whose platforms end inside a shed or under an end screen
// keep their full-height ends.
const RAMP_LENGTH = 3.5;
const RAMPED = new Set(["platforms_only", "platforms_shared", "cantilever_wings", "concourse", "village_depot", "heritage_canopy"]);
/** How far in from each end a type's furniture must stay: past its ramps. */
function endInset(type: string): number {
  return RAMPED.has(type) ? RAMP_LENGTH : 0;
}

/** A stairwell cut into a deck band: the underpass a passenger takes to an island. */
interface DeckWell { x0: number; x1: number; z0: number; z1: number }

/** Deck options: ramps at both ends, and stairwells (by band index). */
interface DeckOptions { ramp?: boolean; wells?: ReadonlyMap<number, readonly DeckWell[]> }

// Deck slabs + edge trim + yellow safety lines, from the layout's rows. Every type
// starts from this.
function pushDeck(boxes: StationBox[], length: number, layout: StationLayout, fillBetweenRails: boolean, opts: DeckOptions = {}): void {
  const half = layoutWidth(layout) / 2;
  const ramp = opts.ramp ? RAMP_LENGTH : 0;
  const deckLen = length - 2 * ramp;
  const slab = (x0: number, x1: number, z0: number, z1: number) => {
    if (x1 - x0 > 0.05 && z1 - z0 > 0.05) {
      boxes.push({ cx: (x0 + x1) / 2, cy: PLATFORM_HEIGHT / 2, cz: (z0 + z1) / 2, sx: x1 - x0, sy: PLATFORM_HEIGHT, sz: z1 - z0, color: PLATFORM_COLOR, material: "platform" });
    }
  };
  deckBands(layout, fillBetweenRails).forEach((band, bandIndex) => {
    const w = band.maxX - band.minX;
    if (w <= 0.1) return;
    const wells = opts.wells?.get(bandIndex) ?? [];
    if (wells.length === 0) slab(band.minX, band.maxX, -deckLen / 2, deckLen / 2);
    else {
      // the band round its wells: full-length strips beside them, pieces between
      const x0 = Math.min(...wells.map((wl) => wl.x0));
      const x1 = Math.max(...wells.map((wl) => wl.x1));
      slab(band.minX, x0, -deckLen / 2, deckLen / 2);
      slab(x1, band.maxX, -deckLen / 2, deckLen / 2);
      let z = -deckLen / 2;
      for (const wl of [...wells].sort((a, b) => a.z0 - b.z0)) {
        slab(x0, x1, z, wl.z0);
        z = wl.z1;
      }
      slab(x0, x1, z, deckLen / 2);
    }
    if (ramp > 0) {
      // a sloped slab whose top runs from the deck edge down to the terrain, over a
      // stepped fill that closes the wedge beneath it: the fill steps down a third of
      // the ramp at a time, never higher than the slab's underside above it
      const angle = Math.atan2(PLATFORM_HEIGHT, ramp);
      const thick = 0.6;
      const vertical = thick / Math.cos(angle);
      for (const sgn of [-1, 1]) {
        const zTop = sgn * (length / 2 - ramp);
        const midZ = sgn * (length / 2 - ramp / 2);
        const ny = Math.cos(angle), nz = sgn * Math.sin(angle);
        boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT / 2 - (ny * thick) / 2, cz: midZ - (nz * thick) / 2, sx: w, sy: thick, sz: Math.hypot(ramp, PLATFORM_HEIGHT), rotX: sgn * angle, color: PLATFORM_COLOR, material: "platform" });
        for (const k of [1, 2]) {
          const h = PLATFORM_HEIGHT * (1 - (k - 1) / 3) - vertical;
          if (h <= 0.1) continue;
          const zEnd = zTop + (sgn * ramp * k) / 3;
          boxes.push({ cx: band.centerX, cy: h / 2, cz: (zTop + zEnd) / 2, sx: w - 0.02 * k, sy: h, sz: Math.abs(zEnd - zTop), color: PLATFORM_COLOR, material: "platform" });
        }
      }
    }
    for (const side of [-1, 1]) {
      if (!(side < 0 ? band.edgeLeft : band.edgeRight)) continue;
      boxes.push({ cx: side < 0 ? band.minX + 0.18 : band.maxX - 0.18, cy: PLATFORM_HEIGHT - 0.12, cz: 0, sx: 0.36, sy: 0.3, sz: deckLen, color: EDGE_COLOR, material: "edge" });
    }
    // safety line 0.5 studs back from every edge that faces a track
    if (band.edgeLeft && w > 1.4) {
      boxes.push({ cx: band.minX + 0.5, cy: PLATFORM_HEIGHT + 0.1, cz: 0, sx: 0.3, sy: 0.05, sz: deckLen - 2, color: SAFETY_COLOR, material: "safety" });
    }
    if (band.edgeRight && w > 1.4) {
      boxes.push({ cx: band.maxX - 0.5, cy: PLATFORM_HEIGHT + 0.1, cz: 0, sx: 0.3, sy: 0.05, sz: deckLen - 2, color: SAFETY_COLOR, material: "safety" });
    }
  });
  // cobblestone trim down the two outer edges
  const edgeWidth = 0.5;
  const edgeHeight = PLATFORM_HEIGHT + 0.2;
  for (const sgn of [-1, 1]) {
    boxes.push({ cx: sgn * (half - edgeWidth / 2), cy: edgeHeight / 2, cz: 0, sx: edgeWidth, sy: edgeHeight, sz: deckLen, color: EDGE_COLOR, material: "edge" });
  }
}

// --- island underpasses -----------------------------------------------------
// An island between two track pairs is reached from below: a stairwell cut into the
// deck beside the island's centreline (where the piers, masts and posts stand), a
// flight running down to the passage at terrain level, a glass balustrade round the
// well and a small canopy over its head.
const WELL_WIDTH = 3;
const WELL_LENGTH = 9;
const WELL_OFFSET = 1.8; // from the island's centreline to the well's near side
const UNDERPASS_DARK: [number, number, number] = [74, 72, 70];

/** The z centres of an island's underpasses: one on a short station, two on a long one. */
function underpassZs(length: number): number[] {
  return length < 100 ? [0] : [-length / 4, length / 4];
}

/** The wells of every island band (by deck band index), each at one of `zs`. */
function islandWells(layout: StationLayout, zs: readonly number[]): Map<number, DeckWell[]> {
  const wells = new Map<number, DeckWell[]>();
  deckBands(layout, false).forEach((band, i) => {
    if (band.row.type !== "island" || band.maxX - band.centerX < WELL_OFFSET + WELL_WIDTH + 1.2) return;
    const x0 = band.centerX + WELL_OFFSET;
    wells.set(i, zs.map((z) => ({ x0, x1: x0 + WELL_WIDTH, z0: z - WELL_LENGTH / 2, z1: z + WELL_LENGTH / 2 })));
  });
  return wells;
}

function pushUnderpasses(boxes: StationBox[], wells: ReadonlyMap<number, readonly DeckWell[]>): void {
  for (const list of wells.values()) {
    for (const wl of list) {
      const cx = (wl.x0 + wl.x1) / 2;
      const w = wl.x1 - wl.x0;
      // the passage floor at terrain level, and the flight down to it from the +Z end
      boxes.push({ cx, cy: 0.06, cz: (wl.z0 + wl.z1) / 2, sx: w, sy: 0.12, sz: wl.z1 - wl.z0, color: UNDERPASS_DARK, material: "platform" });
      const steps = 6;
      const run = 5.4;
      for (let i = 0; i < steps; i++) {
        const h = PLATFORM_HEIGHT * (1 - (i + 1) / (steps + 1));
        const zFar = wl.z1 - (run * (i + 1)) / steps;
        boxes.push({ cx, cy: (0.12 + h) / 2, cz: (wl.z1 + zFar) / 2 - 0.01, sx: w - 0.04, sy: h - 0.12, sz: wl.z1 - zFar - 0.02, color: CONCRETE_LIGHT, material: "platform" });
      }
      // glass balustrade on the two long sides and the closed (-Z) end
      const railY = PLATFORM_HEIGHT + 0.55;
      for (const x of [wl.x0 - 0.1, wl.x1 + 0.1]) {
        boxes.push({ cx: x, cy: railY, cz: (wl.z0 + wl.z1) / 2, sx: 0.12, sy: 1.1, sz: wl.z1 - wl.z0, color: GLASS_COLOR, material: "glass" });
        boxes.push({ cx: x, cy: railY + 0.62, cz: (wl.z0 + wl.z1) / 2, sx: 0.2, sy: 0.14, sz: wl.z1 - wl.z0 + 0.2, color: STEEL_DARK, material: "steel" });
      }
      boxes.push({ cx, cy: railY, cz: wl.z0 - 0.1, sx: w, sy: 1.1, sz: 0.12, color: GLASS_COLOR, material: "glass" });
      boxes.push({ cx, cy: railY + 0.62, cz: wl.z0 - 0.1, sx: w + 0.2, sy: 0.14, sz: 0.2, color: STEEL_DARK, material: "steel" });
      // canopy over the head of the stairs, on four posts, with its sign
      const roofY = PLATFORM_HEIGHT + 3.3;
      const headZ = wl.z1 - 2.6;
      for (const x of [wl.x0 - 0.2, wl.x1 + 0.2]) {
        for (const z of [headZ - 2.3, wl.z1 + 0.15]) {
          boxes.push({ cx: x, cy: (PLATFORM_HEIGHT + roofY) / 2, cz: z, sx: 0.2, sy: roofY - PLATFORM_HEIGHT, sz: 0.2, color: STEEL_DARK, material: "steel" });
        }
      }
      boxes.push({ cx, cy: roofY + 0.12, cz: headZ - 0.95, sx: w + 1.0, sy: 0.24, sz: 3.9, color: GLASS_COLOR, material: "glass" });
      boxes.push({ cx, cy: roofY - 0.06, cz: headZ - 0.95, sx: w + 1.1, sy: 0.14, sz: 4.0, color: STEEL_DARK, material: "steel" });
      boxes.push({ cx, cy: roofY - 0.5, cz: wl.z1 + 0.3, sx: w * 0.7, sy: 0.6, sz: 0.12, color: SIGN_COLOR, material: "sign" });
    }
  }
}

// A free-standing name board on a single post directly beneath it. The post stops
// at the board's underside, so nothing crosses the readable face -- the fix for the
// old center post that speared the sign. `facing` picks which way the board looks:
// "x" = thin in X, reading across the tracks (extends along the platform, Z);
// "z" = thin in Z, reading along the tracks (extends across the platform, X).
const NAME_BOARD_HEIGHT = 1.6;
const NAME_BOARD_THICKNESS = 0.3;
function pushNameBoard(
  boxes: StationBox[],
  opts: { cx: number; cz: number; facing: "x" | "z"; width: number; postTopY?: number },
): void {
  const postTopY = opts.postTopY ?? PLATFORM_HEIGHT + 2.6;
  const boardCy = postTopY + NAME_BOARD_HEIGHT / 2;
  // post from the deck up to the board's underside
  boxes.push({
    cx: opts.cx,
    cy: (PLATFORM_HEIGHT + postTopY) / 2,
    cz: opts.cz,
    sx: 0.35,
    sy: postTopY - PLATFORM_HEIGHT,
    sz: 0.35,
    color: COLUMN_COLOR,
    material: "column",
  });
  boxes.push({
    cx: opts.cx,
    cy: boardCy,
    cz: opts.cz,
    sx: opts.facing === "x" ? NAME_BOARD_THICKNESS : opts.width,
    sy: NAME_BOARD_HEIGHT,
    sz: opts.facing === "x" ? opts.width : NAME_BOARD_THICKNESS,
    color: SIGN_COLOR,
    material: "sign",
    label: true,
  });
}

const FURNISH: Record<string, (length: number, layout: StationLayout) => StationBox[]> = {
  platforms_only: buildDefaultDeck,
  platforms_shared: buildIslandPlatforms,
  arch_shed: buildArchShed,
  cantilever_wings: buildCantileverWings,
  concourse: buildConcourse,
  village_depot: buildVillageDepot,
  heritage_canopy: buildHeritageCanopy,
  grand_terminus: buildGrandTerminus,
};

/**
 * Every local-space box of a `type` station `length` studs long over `layout`. The
 * layout supplies every lateral measurement; the type only decides what is built on
 * top of it. A type this module does not know furnishes the plain deck, which copes
 * with any layout, including row types it does not know.
 */
export function furnish(type: string, length: number, layout: StationLayout): StationBox[] {
  const boxes = (FURNISH[type] ?? buildDefaultDeck)(length, layout);
  // Every station must show its name: some builders skip their board on a station
  // too small to fit it (a short single-track shed). Fall back to a plain posted
  // board so the name is never simply absent.
  if (!boxes.some((b) => b.label)) pushFallbackNameBoards(boxes, length, layout, endInset(type));
  return boxes;
}

// Seats run along Z and face the nearest rail, with their backs away from it.
function pushBench(boxes: StationBox[], layout: StationLayout, x: number, z: number, width = 1.3, length = 4.5, color = WOOD_COLOR, material: StationBoxMaterial = "wood"): void {
  const tracks = railRowOffsets(layout);
  const nearestTrack = tracks.reduce((nearest, track) => Math.abs(track - x) < Math.abs(nearest - x) ? track : nearest, tracks[0] ?? x - 1);
  const facing = nearestTrack > x ? 1 : -1;
  boxes.push({ cx: x, cy: PLATFORM_HEIGHT + 0.8, cz: z, sx: width, sy: 0.22, sz: length, color, material });
  boxes.push({ cx: x - facing * (width / 2 - 0.12), cy: PLATFORM_HEIGHT + 1.35, cz: z, sx: 0.2, sy: 0.9, sz: length, color, material });
  for (const end of [-1, 1]) {
    boxes.push({ cx: x, cy: PLATFORM_HEIGHT + 0.35, cz: z + end * (length / 2 - 0.6), sx: width * 0.75, sy: 0.7, sz: 0.25, color, material });
  }
}

function pushClock(boxes: StationBox[], x: number, y: number, z: number, size: number, facing: number): void {
  boxes.push({ cx: x, cy: y, cz: z, sx: size, sy: size, sz: 0.4, color: STEEL_DARK, material: "steel" });
  boxes.push({ cx: x, cy: y, cz: z + facing * 0.23, sx: size * 0.84, sy: size * 0.84, sz: 0.08, color: WOOD_CREAM, material: "steel" });
  const faceZ = z + facing * 0.29;
  boxes.push({ cx: x, cy: y + size * 0.13, cz: faceZ, sx: size * 0.065, sy: size * 0.32, sz: 0.04, color: STEEL_DARK, material: "steel" });
  boxes.push({ cx: x + facing * size * 0.12, cy: y, cz: faceZ, sx: size * 0.3, sy: size * 0.065, sz: 0.04, color: STEEL_DARK, material: "steel" });
}

// Posted name boards toward the outer edge of the outermost platform at both ends,
// clear of any centreline structure. Used only when a type produced no board.
function pushFallbackNameBoards(boxes: StationBox[], length: number, layout: StationLayout, inset: number): void {
  const bands = deckBands(layout, false);
  if (bands.length === 0) return;
  const band = bands[0].maxX - bands[0].minX >= bands[bands.length - 1].maxX - bands[bands.length - 1].minX ? bands[0] : bands[bands.length - 1];
  // sit it toward the edge that does not face a track, clear of a centred pier/post
  const edgeX = band.edgeLeft ? band.maxX - 1 : band.minX + 1;
  const width = Math.min(8, length * 0.12);
  for (const sgn of [-1, 1]) {
    pushNameBoard(boxes, { cx: edgeX, cz: sgn * (length / 2 - inset - 1.5), facing: "x", width });
  }
}

// --- default deck ---------------------------------------------------------
// The fallback renderer: it must cope with ANY layout, including row types this
// build does not know (they are paved as deck) and structures no current type would
// produce. Nothing is built above the deck, so there is nothing to clash.
function buildDefaultDeck(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, true, { ramp: true });
  // name signs on posts at both ends of the outermost deck bands. The post stops at
  // the board's underside (a lollipop) so it never crosses the readable face.
  const bands = deckBands(layout, false);
  if (bands.length > 0) {
    const signZ = length / 2 - RAMP_LENGTH - 1.2;
    for (const band of [bands[0], bands[bands.length - 1]]) {
      if (band.maxX - band.minX < 2.5) continue;
      for (const sgn of [-1, 1]) {
        pushNameBoard(boxes, { cx: band.centerX, cz: sgn * signZ, facing: "x", width: Math.min(8, length * 0.12) });
      }
    }
  }
  for (const band of [bands[0], bands[bands.length - 1]]) {
    if (!band || band.maxX - band.minX < 3.5) continue;
    for (const z of [-length * 0.22, length * 0.22]) pushBench(boxes, layout, band.centerX, z, 1.1, 3.6);
    boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT + 3, cz: 0, sx: 0.22, sy: 6, sz: 0.22, color: COLUMN_COLOR, material: "column" });
    boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT + 6, cz: 0, sx: 0.9, sy: 0.22, sz: 1.8, color: LIGHT_COLOR, material: "light" });
  }
  return boxes;
}

// --- platform furniture ----------------------------------------------------
// The fittings the roofed types share: hung boards and clocks, the island waiting
// shelter, a bench with its bin.

/** Two rods hanging `drop` down from `topY` at cx +- spread: what a board or clock hangs on. */
function pushHangers(boxes: StationBox[], cx: number, z: number, topY: number, drop: number, spread: number): void {
  for (const side of [-1, 1]) boxes.push({ cx: cx + side * spread, cy: topY - drop / 2, cz: z, sx: 0.08, sy: drop, sz: 0.08, color: STEEL_DARK, material: "steel" });
}

/** A departure board reading along the platform, lit on both faces. */
function pushDepartureBoard(boxes: StationBox[], cx: number, cy: number, z: number, width = 2.6): void {
  boxes.push({ cx, cy, cz: z, sx: width, sy: 0.9, sz: 0.24, color: STEEL_DARK, material: "steel" });
  for (const f of [-1, 1]) boxes.push({ cx, cy, cz: z + f * 0.13, sx: width - 0.3, sy: 0.65, sz: 0.04, color: LIGHT_COLOR, material: "light" });
}

/** A clock with a dial on both faces, reading along the platform. */
function pushTwoFacedClock(boxes: StationBox[], cx: number, cy: number, z: number, size: number): void {
  pushClock(boxes, cx, cy, z, size, 1);
  boxes.push({ cx, cy, cz: z - 0.23, sx: size * 0.84, sy: size * 0.84, sz: 0.08, color: WOOD_CREAM, material: "steel" });
}

/**
 * A glass waiting shelter on an island, 5.5 studs long, standing on the -X side of
 * the centreline (the underpass takes the +X side) and open to that side's track.
 */
function pushShelter(boxes: StationBox[], layout: StationLayout, cx: number, z: number): void {
  const back = cx - 1.5;
  const front = cx - 4.3;
  const len = 5.5;
  const roofY = PLATFORM_HEIGHT + 2.7;
  boxes.push({ cx: back, cy: (PLATFORM_HEIGHT + roofY) / 2, cz: z, sx: 0.12, sy: roofY - PLATFORM_HEIGHT - 0.1, sz: len, color: GLASS_COLOR, material: "glass" });
  for (const e of [-1, 1]) {
    boxes.push({ cx: (back + front) / 2, cy: (PLATFORM_HEIGHT + roofY) / 2, cz: z + e * (len / 2), sx: back - front, sy: roofY - PLATFORM_HEIGHT - 0.1, sz: 0.12, color: GLASS_COLOR, material: "glass" });
    for (const x of [back, front]) boxes.push({ cx: x, cy: (PLATFORM_HEIGHT + roofY) / 2, cz: z + e * (len / 2), sx: 0.16, sy: roofY - PLATFORM_HEIGHT, sz: 0.16, color: STEEL_DARK, material: "steel" });
  }
  boxes.push({ cx: (back + front) / 2 - 0.15, cy: roofY + 0.08, cz: z, sx: back - front + 0.6, sy: 0.16, sz: len + 0.4, color: STEEL_DARK, material: "steel" });
  pushBench(boxes, layout, cx - 2.6, z, 1.1, len - 1.4, STEEL_DARK, "steel");
}

/** A bench at the band's centre with a litter bin beyond its +Z end. */
function pushBenchWithBin(boxes: StationBox[], layout: StationLayout, cx: number, z: number, width = 1.6): void {
  pushBench(boxes, layout, cx, z, width);
  boxes.push({ cx, cy: PLATFORM_HEIGHT + 0.45, cz: z + 2.9, sx: 0.5, sy: 0.9, sz: 0.5, color: STEEL_DARK, material: "steel" });
}

/** `zs` snapped to the nearest of `slots`, without repeats. */
function snapZs(zs: readonly number[], slots: readonly number[]): number[] {
  if (slots.length === 0) return [];
  return [...new Set(zs.map((t) => slots.reduce((best, z) => (Math.abs(z - t) < Math.abs(best - t) ? z : best))))];
}

// --- island platforms (free, redesigned) ----------------------------------
// Tracks in pairs; every deck band carries a V-roof draining to its middle, on a
// double row of columns with knee braces. Each slope has a glazed skylight band;
// fascias close the eaves and the roof ends. The name board hangs at each roof end
// on two rods from the roof's underside; departure boards and a clock hang from the
// cross beams. The islands get glass waiting shelters across from their underpasses.
const SHARED_FASCIA: [number, number, number] = [214, 206, 190];

function buildIslandPlatforms(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  const wells = islandWells(layout, underpassZs(length));
  pushDeck(boxes, length, layout, false, { ramp: true, wells });
  pushUnderpasses(boxes, wells);
  const slopeRad = (SHARED_ROOF_SLOPE_DEG * Math.PI) / 180;
  const roofZ = length - 4;
  const bays = bayPositions(length, ROOF_COLUMN_SPACING);
  const bayMids = bays.slice(1).map((z, i) => (z + bays[i]!) / 2);
  const nearest = (zs: readonly number[], target: number) => zs.reduce((best, z) => (Math.abs(z - target) < Math.abs(best - target) ? z : best));
  // the furniture stays on the level deck, clear of the ramps
  const benchZs = bayPositions(length - 2 * RAMP_LENGTH - 6, 24);

  for (const band of deckBands(layout, false)) {
    const halfW = (band.maxX - band.minX) / 2;
    if (halfW < 1.6) continue;
    const cx = band.centerX;
    const edgeY = PLATFORM_HEIGHT + SHARED_ROOF_HEIGHT;
    const drop = halfW * Math.tan(slopeRad);
    const vertexY = edgeY - drop;
    const slabLen = halfW / Math.cos(slopeRad);
    // the underside of the roof at x
    const under = (x: number) => vertexY + Math.abs(x - cx) * Math.tan(slopeRad) - 0.25 / Math.cos(slopeRad);
    // one piece of a slope from u0 to u1 (0 at the valley, 1 at the eave)
    const slopePiece = (sgn: number, u0: number, u1: number, thick: number, drop0: number, cz: number, sz: number, color: [number, number, number], material: StationBoxMaterial, lod?: "shell") => {
      const u = (u0 + u1) / 2;
      boxes.push({ cx: cx + sgn * u * halfW, cy: vertexY + u * drop - drop0, cz, sx: (u1 - u0) * slabLen, sy: thick, sz, rotZ: sgn * slopeRad, color, material, lod });
    };
    for (const sgn of [-1, 1]) {
      // the slope: solid, a glazed band (overlapping the solid at both edges), solid
      slopePiece(sgn, 0, 0.36, 0.5, 0, 0, roofZ, ROOF_COLOR, "roof", "shell");
      slopePiece(sgn, 0.34, 0.62, 0.3, 0, 0, roofZ, GLASS_COLOR, "glass", "shell");
      slopePiece(sgn, 0.6, 1, 0.5, 0, 0, roofZ, ROOF_COLOR, "roof", "shell");
      // the eave fascia, and the fascia across both roof ends under the slope
      boxes.push({ cx: cx + sgn * (halfW - 0.12), cy: edgeY - 0.45, cz: 0, sx: 0.14, sy: 0.7, sz: roofZ, color: SHARED_FASCIA, material: "column" });
      for (const end of [-1, 1]) slopePiece(sgn, 0, 0.98, 0.7, 0.4, end * (roofZ / 2 - 0.08), 0.14, SHARED_FASCIA, "column");
      // a light strip under each slope
      const lightX = cx + sgn * (halfW - 1.7);
      if (halfW > 2.6) boxes.push({ cx: lightX, cy: under(lightX) - 0.1, cz: 0, sx: 0.35, sy: 0.1, sz: Math.max(4, roofZ - 6), color: LIGHT_COLOR, material: "light" });
      const colX = cx + sgn * (halfW - 0.5);
      for (const z of bays) {
        boxes.push({ lod: "support", cx: colX, cy: PLATFORM_HEIGHT + SHARED_ROOF_HEIGHT / 2, cz: z, sx: 0.5, sy: SHARED_ROOF_HEIGHT, sz: 0.5, color: COLUMN_COLOR, material: "column" });
        boxes.push({ cx: colX, cy: PLATFORM_HEIGHT + 0.3, cz: z, sx: 0.8, sy: 0.6, sz: 0.8, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx: colX, cy: edgeY - 1.05, cz: z, sx: 0.7, sy: 0.3, sz: 0.7, color: STEEL_DARK, material: "steel" });
        // the knee brace from the column in to the roof
        if (halfW > 2.6) {
          const a = { x: colX - sgn * 0.25, y: edgeY - 1.9 };
          const bx = colX - sgn * 1.7;
          const b = { x: bx, y: under(bx) - 0.08 };
          boxes.push({ cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, cz: z, sx: Math.hypot(b.x - a.x, b.y - a.y), sy: 0.2, sz: 0.2, rotZ: Math.atan2(b.y - a.y, b.x - a.x), color: COLUMN_COLOR, material: "column" });
        }
      }
    }
    // the valley gutter and the cross beams
    boxes.push({ cx, cy: vertexY + 0.16, cz: 0, sx: 0.45, sy: 0.25, sz: roofZ, color: COLUMN_COLOR, material: "column" });
    const beamY = vertexY - 0.3;
    for (const z of bays) {
      boxes.push({ cx, cy: beamY, cz: z, sx: halfW * 2 - 0.7, sy: 0.25, sz: 0.3, color: COLUMN_COLOR, material: "column" });
    }

    // the name board at both roof ends, under the valley, on two rods from the roof
    const boardW = Math.min(halfW * 2 - 2.6, 9);
    const boardTop = vertexY - 0.45;
    const boardH = 1.3;
    if (boardW > 2) {
      for (const end of [-1, 1]) {
        const z = end * (roofZ / 2 - 0.45);
        boxes.push({ cx, cy: boardTop - boardH / 2, cz: z, sx: boardW, sy: boardH, sz: 0.3, color: SIGN_COLOR, material: "sign", label: true });
        boxes.push({ cx, cy: boardTop - boardH - 0.06, cz: z, sx: boardW + 0.2, sy: 0.12, sz: 0.38, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx, cy: boardTop + 0.06, cz: z, sx: boardW + 0.2, sy: 0.12, sz: 0.38, color: STEEL_DARK, material: "steel" });
        for (const side of [-1, 1]) {
          const rx = cx + side * (boardW / 2 - 0.5);
          const topY = under(rx);
          boxes.push({ cx: rx, cy: (boardTop + 0.12 + topY) / 2, cz: z, sx: 0.1, sy: topY - boardTop - 0.12, sz: 0.1, color: STEEL_DARK, material: "steel" });
        }
      }
    }
    // a departure board and a clock hung from the cross beams
    if (halfW >= 3.5 && bays.length >= 3) {
      const beamBottom = beamY - 0.125;
      const boardZ = nearest(bays, length / 6);
      pushHangers(boxes, cx, boardZ, beamBottom, 0.4, 0.9);
      pushDepartureBoard(boxes, cx, beamBottom - 0.4 - 0.45, boardZ);
      const clockZ = nearest(bays, -length / 6);
      if (clockZ !== boardZ) {
        pushHangers(boxes, cx, clockZ, beamBottom, 0.4, 0.9);
        pushTwoFacedClock(boxes, cx, beamBottom - 0.4 - 0.55, clockZ, 1.1);
      }
    }

    // a glass waiting shelter across from the underpass on an island, open to the
    // track on its side; benches down the middle elsewhere, each with a bin
    const island = band.row.type === "island" && halfW >= 5.5;
    const shelterZs = island ? snapZs(length < 100 ? [0] : [-length / 4, length / 4], bayMids) : [];
    for (const z of shelterZs) pushShelter(boxes, layout, cx, z);
    if (halfW > 3) {
      for (const z of benchZs) {
        if (shelterZs.some((sz) => Math.abs(sz - z) < 5)) continue;
        pushBenchWithBin(boxes, layout, cx, z);
      }
    }
  }
  return boxes;
}

// --- vaults -----------------------------------------------------------------
// Both train sheds are built from the same vault: an elliptical arch of straight
// slabs between two pier lines. The slab count follows the arc's length, so a wide
// vault keeps short chords instead of showing its facets.
const VAULT_CHORD = 2.5;
const VAULT_MIN_SEGMENTS = 18;
const VAULT_MAX_SEGMENTS = 48;
const LOUVRE_COLOR: [number, number, number] = [96, 104, 112];

interface Vault { midX: number; span: number; rise: number; springY: number; segments: number }

/**
 * A vault between the pier lines at `left` and `right`, springing at `springY`, risen
 * to `riseRatio` of its half span -- or higher, so that nothing hanging `margin`
 * below the arc dips into the gauge of a track under it.
 */
function makeVault(left: number, right: number, springY: number, riseRatio: number, rails: readonly StationRowSpan[], margin: number): Vault {
  const span = Math.max(2, (right - left) / 2);
  const midX = (left + right) / 2;
  const guess = span * riseRatio;
  const arcLength = Math.PI * Math.sqrt((span * span + guess * guess) / 2);
  const segments = Math.max(VAULT_MIN_SEGMENTS, Math.min(VAULT_MAX_SEGMENTS, Math.ceil(arcLength / VAULT_CHORD)));
  // Check the constraint one chord OUTSIDE the ballast edge: the slab whose span
  // reaches the edge has its centre further out, and it is that slab's low corner
  // that would clip a train.
  const edgeDx = rails.length
    ? Math.max(...rails.map((r) => Math.max(Math.abs(r.centerX - BALLAST_WIDTH / 2 - midX), Math.abs(r.centerX + BALLAST_WIDTH / 2 - midX))))
    : 0;
  const chord = (Math.PI * span) / (2 * segments);
  const k = Math.sqrt(Math.max(0.05, 1 - Math.min(0.99, (edgeDx + chord) / span) ** 2));
  const rise = Math.max(span * riseRatio, (PLATFORM_HEIGHT + ROOF_HEIGHT + margin - springY) / k);
  return { midX, span, rise, springY, segments };
}

/** The arc's parameter at joint `i` (-pi/2 at the left springing, +pi/2 at the right). */
function vaultT(v: Vault, i: number): number {
  return -Math.PI / 2 + (Math.PI * i) / v.segments;
}

/** A point on the arc at `t`, moved `offset` along its outward normal, in the station frame. */
function vaultPoint(v: Vault, t: number, offset = 0): { x: number; y: number } {
  const x = v.span * Math.sin(t);
  const y = v.rise * Math.cos(t);
  const n = Math.atan2(y / (v.rise * v.rise), x / (v.span * v.span));
  return { x: v.midX + x + Math.cos(n) * offset, y: v.springY + y + Math.sin(n) * offset };
}

/** The arc's height above the station's terrain level at `dx` from its middle. */
function vaultHeightAt(v: Vault, dx: number): number {
  const ratio = Math.min(1, Math.abs(dx) / v.span);
  return v.springY + v.rise * Math.sqrt(Math.max(0, 1 - ratio * ratio));
}

/** One slab per segment along the arc: the glazing, a rib's chord, an archivolt. */
function pushVaultArc(boxes: StationBox[], v: Vault, cz: number, thickZ: number, thickY: number, radialOffset: number, color: [number, number, number], material: StationBoxMaterial, lod?: "shell"): void {
  for (let i = 0; i < v.segments; i++) {
    const t0 = vaultT(v, i);
    const t1 = vaultT(v, i + 1);
    const ax = v.span * Math.sin(t0), ay = v.rise * Math.cos(t0);
    const bx = v.span * Math.sin(t1), by = v.rise * Math.cos(t1);
    const segLen = Math.hypot(bx - ax, by - ay);
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const normal = Math.atan2(my / (v.rise * v.rise), mx / (v.span * v.span));
    boxes.push({
      cx: v.midX + mx + Math.cos(normal) * radialOffset,
      cy: v.springY + my + Math.sin(normal) * radialOffset,
      cz,
      sx: material === "glass" ? segLen : segLen * 1.015,
      sy: thickY,
      sz: thickZ,
      rotZ: Math.atan2(by - ay, bx - ax),
      color,
      material,
      lod,
    });
  }
}

/** A lattice rib: an outer and an inner chord tied by a zigzag of diagonals. */
function pushLatticeRib(boxes: StationBox[], v: Vault, z: number): void {
  pushVaultArc(boxes, v, z, 0.5, 0.45, 0.22, STEEL_DARK, "steel");
  pushVaultArc(boxes, v, z, 0.35, 0.25, -0.55, STEEL_DARK, "steel");
  for (let i = 0; i < v.segments; i++) {
    const a = vaultPoint(v, vaultT(v, i), i % 2 === 0 ? 0.05 : -0.5);
    const b = vaultPoint(v, vaultT(v, i + 1), i % 2 === 0 ? -0.5 : 0.05);
    boxes.push({ cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, cz: z, sx: Math.hypot(b.x - a.x, b.y - a.y), sy: 0.16, sz: 0.24, rotZ: Math.atan2(b.y - a.y, b.x - a.x), color: STEEL_DARK, material: "steel" });
  }
}

/** Glazing bars along the vault: one at every other joint, the full shed length. */
function pushVaultPurlins(boxes: StationBox[], v: Vault, zLen: number, size: number): void {
  for (let i = 2; i < v.segments - 1; i += 2) {
    const p = vaultPoint(v, vaultT(v, i), 0.12 + size / 2);
    boxes.push({ cx: p.x, cy: p.y, cz: 0, sx: size, sy: size, sz: zLen, color: STEEL_DARK, material: "steel" });
  }
}

/** The smoke and ventilation lantern along the crown: louvred sides under a gabled cap. */
function pushCrownLantern(boxes: StationBox[], v: Vault, zLen: number): void {
  const half = Math.min(1.6, v.span * 0.12);
  const lanternLen = zLen - 12;
  if (half < 0.8 || lanternLen < 6) return;
  const baseY = vaultHeightAt(v, half);
  const sideTop = baseY + 1.1;
  const pitch = (20 * Math.PI) / 180;
  const capHalf = half + 0.45;
  for (const side of [-1, 1]) {
    boxes.push({ cx: v.midX + side * half, cy: (baseY - 0.3 + sideTop) / 2, cz: 0, sx: 0.14, sy: sideTop - baseY + 0.3, sz: lanternLen, color: LOUVRE_COLOR, material: "steel" });
    boxes.push({
      cx: v.midX + (side * capHalf) / 2,
      cy: sideTop + (capHalf / 2) * Math.tan(pitch) + 0.08,
      cz: 0,
      sx: capHalf / Math.cos(pitch),
      sy: 0.16,
      sz: lanternLen + 0.6,
      rotZ: -side * pitch,
      color: STEEL_DARK,
      material: "steel",
      lod: "shell",
    });
  }
  for (const end of [-1, 1]) {
    boxes.push({ cx: v.midX, cy: (baseY - 0.3 + sideTop) / 2, cz: end * (lanternLen / 2 - 0.07), sx: half * 2, sy: sideTop - baseY + 0.3, sz: 0.14, color: LOUVRE_COLOR, material: "steel" });
    boxes.push({ profile: "gable", cx: v.midX, cy: sideTop + (capHalf * Math.tan(pitch)) / 2, cz: end * (lanternLen / 2 - 0.07), sx: half * 2, sy: half * Math.tan(pitch), sz: 0.14, color: LOUVRE_COLOR, material: "steel" });
  }
}

/** The rails whose centres lie between two x positions. */
function railsBetween(layout: StationLayout, left: number, right: number): StationRowSpan[] {
  return rowSpans(layout).filter((s) => s.type === "rail" && s.centerX > left && s.centerX < right);
}

/** Whether an x span overlaps the ballast bed of any track. */
function overTrackIn(layout: StationLayout): (cx: number, halfW: number) => boolean {
  const railBands = rowSpans(layout).filter((s) => s.type === "rail");
  return (cx, halfW) =>
    railBands.some((r) => Math.min(cx + halfW, r.centerX + BALLAST_WIDTH / 2) - Math.max(cx - halfW, r.centerX - BALLAST_WIDTH / 2) > 0.01);
}

// --- arched train shed ----------------------------------------------------
// One glass vault per track group on lattice ribs, springing from brick piers on the
// platforms either side of the group, with a ventilation lantern along its crown.
// Neighbouring vaults share their pier line and drain into a valley gutter there; a
// lattice girder above the gauge ties all of their mouths together at both ends and
// carries the station's name.
const ARCH_SPRING_HEIGHT = 4.8; // pier top above the deck
const ARCH_RISE_RATIO = 0.92; // crown height as a fraction of the half span
const ARCH_RIB_SPACING = 15;

function buildArchShed(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  const wells = islandWells(layout, underpassZs(length));
  pushDeck(boxes, length, layout, false, { wells });
  pushUnderpasses(boxes, wells);
  const zLen = length - 3;
  const springY = PLATFORM_HEIGHT + ARCH_SPRING_HEIGHT;
  const clearY = PLATFORM_HEIGHT + ROOF_HEIGHT;
  const overTrack = overTrackIn(layout);
  // 1.7: the lattice's inner chord hangs about 0.7 below the arc
  const vaults = trackGroups(layout).map((g) => makeVault(g.outerLeftX, g.outerRightX, springY, ARCH_RISE_RATIO, g.rails, 1.7));
  const multi = vaults.length > 1;
  const girderBottom = clearY + 0.1;
  const girderTop = clearY + 1.6;
  const ribs = bayPositions(zLen + 7, ARCH_RIB_SPACING);
  const midRibs = ribs.slice(1).map((z, i) => (z + ribs[i]!) / 2);

  for (const v of vaults) {
    const { midX, span, rise } = v;
    pushVaultArc(boxes, v, 0, zLen, 0.28, 0, GLASS_COLOR, "glass", "shell");
    for (const z of ribs) pushLatticeRib(boxes, v, z);
    for (const z of midRibs) pushVaultArc(boxes, v, z, 0.3, 0.28, 0.16, STEEL_DARK, "steel");
    pushVaultPurlins(boxes, v, zLen, 0.2);
    pushCrownLantern(boxes, v, zLen);

    // The end screens: a deep transom beam across the mouth just above the gauge
    // (with several vaults, the station-wide girder), and over it a glazed fanlight
    // filling the arch -- one sheet of glass behind a sunburst of glazing bars that
    // radiate from the clock, crossed by one concentric ring. Below the transom the
    // mouth stays open.
    const transomTop = girderTop;
    const halfAt = (y: number) => {
      const r = (y - v.springY) / rise;
      return r >= 1 ? 0 : span * Math.sqrt(Math.max(0, 1 - r * r));
    };
    const crown = vaultHeightAt(v, 0);
    const halfTop = halfAt(transomTop);
    const panelW = (span * 2) / v.segments;
    for (const sgn of [-1, 1]) {
      const zEnd = sgn * (zLen / 2 - 0.1);
      // the end arch, framing the screen
      pushVaultArc(boxes, v, zEnd + sgn * 0.12, 0.5, 0.6, 0.05, STEEL_DARK, "steel");
      if (halfTop < 1.2 || crown - transomTop < 0.8) continue;
      if (!multi) {
        boxes.push({ lod: "shell", cx: midX, cy: (girderBottom + transomTop) / 2, cz: zEnd + sgn * 0.15, sx: halfTop * 2, sy: transomTop - girderBottom, sz: 0.4, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx: midX, cy: transomTop - 0.12, cz: zEnd + sgn * 0.15, sx: halfTop * 2 + 0.2, sy: 0.24, sz: 0.6, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx: midX, cy: (girderBottom + transomTop) / 2, cz: zEnd + sgn * 0.48, sx: Math.min(halfTop * 2 - 1, 13), sy: transomTop - girderBottom - 0.45, sz: 0.25, color: SIGN_COLOR, material: "sign", label: true });
      }
      // the glass: edge-to-edge panes from the transom up to the arch, three to a
      // segment so their stepped tops stay hidden behind the end arch
      const paneW = panelW / 3;
      for (let i = 0; i < v.segments * 3; i++) {
        const dx = -span + (i + 0.5) * paneW;
        const top = Math.min(vaultHeightAt(v, dx - paneW / 2), vaultHeightAt(v, dx + paneW / 2)) - 0.05;
        if (top - transomTop < 0.3) continue;
        boxes.push({ cx: midX + dx, cy: (transomTop + top) / 2, cz: zEnd, sx: paneW, sy: top - transomTop, sz: 0.1, color: GLASS_COLOR, material: "glass" });
      }
      // the sunburst: glazing bars radiating from the middle of the transom to every
      // other joint of the arch, round a clock sitting on the transom when the
      // fanlight is tall enough, crossed by one concentric ring
      const fan = crown - transomTop;
      const clockH = Math.min(2.2, fan * 0.36);
      const hasClock = clockH >= 0.9;
      if (hasClock) pushClock(boxes, midX, transomTop + 0.15 + clockH / 2, zEnd + sgn * 0.35, clockH, sgn);
      const hubR = hasClock ? clockH + 0.35 : 0.4;
      const barZ = zEnd + sgn * 0.11;
      const ends: Array<{ x: number; y: number }> = [];
      for (let i = 2; i < v.segments - 1; i += 2) {
        const p = vaultPoint(v, vaultT(v, i));
        if (p.y > transomTop + 0.5 && Math.hypot(p.x - midX, p.y - transomTop) > hubR + 0.8) ends.push(p);
      }
      const along = (p: { x: number; y: number }, f: number) => {
        const len = Math.hypot(p.x - midX, p.y - transomTop);
        const r = hubR + (len - 0.25 - hubR) * f;
        return { x: midX + ((p.x - midX) / len) * r, y: transomTop + ((p.y - transomTop) / len) * r };
      };
      const bar = (a: { x: number; y: number }, b: { x: number; y: number }, w: number) => {
        boxes.push({ cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, cz: barZ, sx: Math.hypot(b.x - a.x, b.y - a.y), sy: w, sz: 0.14, rotZ: Math.atan2(b.y - a.y, b.x - a.x), color: STEEL_DARK, material: "steel" });
      };
      for (const p of ends) bar(along(p, 0), along(p, 1), 0.16);
      for (let i = 0; i + 1 < ends.length; i++) bar(along(ends[i]!, 0.5), along(ends[i + 1]!, 0.5), 0.18);
      // the hub's half ring round the clock
      if (ends.length > 1) for (let i = 0; i + 1 < ends.length; i++) bar(along(ends[i]!, 0), along(ends[i + 1]!, 0), 0.18);
    }

    // pendant lamps down the crown
    const lampH = 0.35;
    const lampBottom = Math.max(overTrack(midX, 0.9) ? clearY : springY + rise - 2.6, springY + rise - 2.6);
    const crownY = vaultHeightAt(v, 0) - 0.4;
    if (lampBottom + lampH + 0.3 <= crownY) {
      for (const z of bayPositions(length, 9)) {
        boxes.push({ cx: midX, cy: (lampBottom + lampH + crownY) / 2, cz: z, sx: 0.15, sy: crownY - lampBottom - lampH, sz: 0.15, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx: midX, cy: lampBottom + lampH / 2, cz: z, sx: 1.8, sy: lampH, sz: 1.8, color: LIGHT_COLOR, material: "light" });
      }
    }
  }

  // pier lines: springing beam + brick piers, once per line; a line two vaults share
  // carries their valley gutter and the downpipes from it
  const lines = new Map<string, { x: number; shared: boolean }>();
  for (const v of vaults) {
    for (const x of [v.midX - v.span, v.midX + v.span]) {
      const key = x.toFixed(3);
      const line = lines.get(key);
      if (line) line.shared = true;
      else lines.set(key, { x, shared: false });
    }
  }
  for (const { x, shared } of lines.values()) {
    boxes.push({ lod: "shell", cx: x, cy: springY + 0.4, cz: 0, sx: shared ? 2.0 : 1.6, sy: 1.0, sz: zLen, color: STEEL_DARK, material: "steel" });
    boxes.push({ lod: "shell", cx: x, cy: PLATFORM_HEIGHT + 0.6, cz: 0, sx: 1.1, sy: 1.2, sz: zLen, color: BRICK_COLOR, material: "brick" });
    for (const z of ribs) {
      boxes.push({ lod: "support", cx: x, cy: (PLATFORM_HEIGHT + springY) / 2, cz: z, sx: 1.5, sy: springY - PLATFORM_HEIGHT, sz: 1.8, color: BRICK_COLOR, material: "brick" });
    }
    if (shared) {
      boxes.push({ cx: x, cy: springY + 1.1, cz: 0, sx: 1.1, sy: 0.4, sz: zLen + 0.4, color: STEEL_DARK, material: "steel" });
      for (let i = 0; i < ribs.length; i += 2) {
        boxes.push({ cx: x, cy: (PLATFORM_HEIGHT + springY + 1.1) / 2, cz: ribs[i]! + 1.02, sx: 0.24, sy: springY + 1.1 - PLATFORM_HEIGHT, sz: 0.24, color: STEEL_DARK, material: "steel" });
      }
    }
  }

  // the end girders: a lattice beam above the gauge across every vault's mouth
  if (multi) {
    const xs = [...lines.values()].map((l) => l.x);
    const x0 = Math.min(...xs) - 0.6;
    const x1 = Math.max(...xs) + 0.6;
    const panels = Math.max(2, Math.round((x1 - x0) / 3));
    const step = (x1 - x0) / panels;
    for (const sgn of [-1, 1]) {
      const z = sgn * (zLen / 2 + 0.3);
      for (const y of [girderBottom + 0.18, girderTop - 0.18]) {
        boxes.push({ lod: "shell", cx: (x0 + x1) / 2, cy: y, cz: z, sx: x1 - x0, sy: 0.36, sz: 0.45, color: STEEL_DARK, material: "steel" });
      }
      for (let i = 0; i <= panels; i++) {
        boxes.push({ cx: x0 + i * step, cy: (girderBottom + girderTop) / 2, cz: z, sx: 0.24, sy: girderTop - girderBottom - 0.4, sz: 0.3, color: STEEL_DARK, material: "steel" });
        if (i < panels) {
          const h = girderTop - girderBottom - 0.72;
          boxes.push({ cx: x0 + (i + 0.5) * step, cy: (girderBottom + girderTop) / 2, cz: z, sx: Math.hypot(step, h), sy: 0.14, sz: 0.2, rotZ: (i % 2 === 0 ? 1 : -1) * Math.atan2(h, step), color: STEEL_DARK, material: "steel" });
        }
      }
      // a post from every pier line's springing beam up to the girder
      for (const x of xs) {
        boxes.push({ cx: x, cy: (springY + 0.9 + girderBottom) / 2, cz: z - sgn * 0.2, sx: 0.4, sy: girderBottom - springY - 0.9, sz: 0.4, color: STEEL_DARK, material: "steel" });
      }
      boxes.push({ cx: (x0 + x1) / 2, cy: (girderBottom + girderTop) / 2, cz: z + sgn * 0.4, sx: Math.min(24, (x1 - x0) * 0.35), sy: 1.25, sz: 0.3, color: SIGN_COLOR, material: "sign", label: true });
    }
  }
  return boxes;
}

// --- cantilever wings -----------------------------------------------------
// Masts stand on every deck band; wings sweep out over the pairs either side and
// stop short of the group centre, leaving a daylight slot over each pair.
const WING_MAST_HEIGHT = 13.2; // wing plane above the deck at the mast
const WING_MAX_TILT_DEG = 6;
const WING_SLOT_HALF = 2.6; // half width of the daylight slot over a pair

function buildCantileverWings(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  const wells = islandWells(layout, underpassZs(length));
  pushDeck(boxes, length, layout, false, { ramp: true, wells });
  pushUnderpasses(boxes, wells);
  const zLen = length - 4;
  const headY = PLATFORM_HEIGHT + WING_MAST_HEIGHT;
  const clearY = PLATFORM_HEIGHT + ROOF_HEIGHT;
  // the masts stand on the level deck, their footings clear of the end ramps
  const bays = bayPositions(length - 2, 12);
  const bands = deckBands(layout, false);

  const nearest = (zs: readonly number[], target: number) => zs.reduce((best, z) => (Math.abs(z - target) < Math.abs(best - target) ? z : best));
  const bayMids = bays.slice(1).map((z, i) => (z + bays[i]!) / 2);
  const benchZs = bayMids.filter((z) => Math.abs(z) <= length / 2 - RAMP_LENGTH - 3);
  const mastSplit = PLATFORM_HEIGHT + (headY - PLATFORM_HEIGHT) * 0.55;

  for (const band of bands) {
    const mastX = band.centerX;
    const halfW = (band.maxX - band.minX) / 2;
    // tapering masts: a footing, a stout lower shaft, a collar, a slimmer upper one
    for (const z of bays) {
      boxes.push({ cx: mastX, cy: PLATFORM_HEIGHT + 0.25, cz: z, sx: 1.4, sy: 0.5, sz: 1.4, color: CONCRETE_LIGHT, material: "platform" });
      boxes.push({ lod: "support", cx: mastX, cy: (PLATFORM_HEIGHT + mastSplit) / 2, cz: z, sx: 0.95, sy: mastSplit - PLATFORM_HEIGHT, sz: 0.95, color: STEEL_DARK, material: "steel" });
      boxes.push({ lod: "support", cx: mastX, cy: (mastSplit + headY) / 2, cz: z, sx: 0.72, sy: headY - mastSplit, sz: 0.72, color: STEEL_DARK, material: "steel" });
      boxes.push({ cx: mastX, cy: mastSplit, cz: z, sx: 1.1, sy: 0.3, sz: 1.1, color: STEEL_WHITE, material: "steel" });
    }
    boxes.push({ lod: "shell", cx: mastX, cy: headY - 0.5, cz: 0, sx: 1.2, sy: 0.9, sz: zLen, color: STEEL_DARK, material: "steel" });
    // a departure board and a clock on brackets on two masts, at eye level, read
    // along the platform
    if (halfW >= 3 && bays.length >= 3) {
      const boardZ = nearest(bays, length / 6);
      const clockZ = nearest(bays, -length / 6);
      for (const f of [-1, 1]) {
        boxes.push({ cx: mastX, cy: PLATFORM_HEIGHT + 4.35, cz: boardZ + f * 0.55, sx: 0.4, sy: 0.3, sz: 0.2, color: STEEL_WHITE, material: "steel" });
        boxes.push({ cx: mastX, cy: PLATFORM_HEIGHT + 3.75, cz: boardZ + f * 0.75, sx: 2.0, sy: 0.9, sz: 0.2, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx: mastX, cy: PLATFORM_HEIGHT + 3.75, cz: boardZ + f * 0.87, sx: 1.75, sy: 0.65, sz: 0.04, color: LIGHT_COLOR, material: "light" });
      }
      if (clockZ !== boardZ) {
        for (const f of [-1, 1]) {
          boxes.push({ cx: mastX, cy: PLATFORM_HEIGHT + 4.35, cz: clockZ + f * 0.55, sx: 0.4, sy: 0.3, sz: 0.2, color: STEEL_WHITE, material: "steel" });
          pushClock(boxes, mastX, PLATFORM_HEIGHT + 3.75, clockZ + f * 0.85, 1.0, f);
        }
      }
    }
    // islands: a glass waiting shelter across from the underpass, benches with bins
    // between the masts
    const island = band.row.type === "island" && halfW >= 5.5;
    const shelterZs = island ? snapZs(length < 100 ? [0] : [-length / 4, length / 4], bayMids) : [];
    for (const z of shelterZs) pushShelter(boxes, layout, mastX, z);
    if (island) {
      for (const z of benchZs) if (!shelterZs.some((sz) => Math.abs(sz - z) < 5)) pushBenchWithBin(boxes, layout, mastX, z, 1.3);
    }
  }

  // one wing per (mast, group) pairing, sloping down towards the slot
  for (const group of trackGroups(layout)) {
    for (const sgn of [-1, 1]) {
      // sgn -1: the wing reaches in from the deck band on the group's left
      const mastX = sgn < 0 ? group.outerLeftX : group.outerRightX;
      const wingInner = group.centerX + sgn * WING_SLOT_HALF;
      const run = Math.abs(wingInner - mastX);
      if (run < 1.5) continue;
      // dir: +1 when the wing extends towards +X, so the deck falls along +X
      const dir = wingInner > mastX ? 1 : -1;
      // 0.8 = the fascia hanging under the wing tip, the lowest thing over a track
      const dropBudget = Math.max(0, WING_MAST_HEIGHT - (ROOF_HEIGHT + 0.15 + 0.8));
      const tilt = Math.min((WING_MAX_TILT_DEG * Math.PI) / 180, Math.atan(dropBudget / run));
      const wingY = (x: number) => headY + 0.5 - Math.abs(x - mastX) * Math.tan(tilt);
      const glassW = Math.min(3.4, run * 0.45);
      const solidInner = wingInner - dir * glassW;
      const solidMid = (mastX + solidInner) / 2;
      const glassMid = (solidInner + wingInner) / 2;
      boxes.push({
        cx: solidMid,
        cy: wingY(solidMid),
        cz: 0,
        sx: Math.abs(solidInner - mastX) / Math.cos(tilt),
        sy: 0.35,
        sz: zLen,
        rotZ: -dir * tilt,
        color: STEEL_WHITE,
        material: "steel",
        lod: "shell",
      });
      boxes.push({
        cx: glassMid,
        cy: wingY(glassMid),
        cz: 0,
        sx: glassW / Math.cos(tilt),
        sy: 0.2,
        sz: zLen,
        rotZ: -dir * tilt,
        color: GLASS_COLOR,
        material: "glass",
        lod: "shell",
      });
      // fascia at the wing tip, never below the clearance line
      const fasciaY = Math.max(wingY(wingInner) - 0.4, clearY + 0.45);
      boxes.push({ lod: "shell", cx: wingInner, cy: fasciaY, cz: 0, sx: 0.35, sy: 0.8, sz: zLen, color: STEEL_DARK, material: "steel" });
      // the underside of the solid wing at x
      const under = (x: number) => wingY(x) - 0.175 / Math.cos(tilt);
      // name board hung under the wing over the platform, at both ends: framed top
      // and bottom, on two rods from the wing
      const boardX = mastX + dir * 1.4;
      const boardLen = Math.min(10, length * 0.15);
      for (const zs of [-1, 1]) {
        const bz = zs * Math.max(2, zLen / 2 - 8);
        const top = under(boardX) - 1.5;
        boxes.push({ cx: boardX, cy: top - 0.9, cz: bz, sx: 0.35, sy: 1.8, sz: boardLen, color: SIGN_COLOR, material: "sign", label: true });
        for (const y of [top + 0.06, top - 1.86]) boxes.push({ cx: boardX, cy: y, cz: bz, sx: 0.42, sy: 0.12, sz: boardLen + 0.2, color: STEEL_DARK, material: "steel" });
        for (const e of [-1, 1]) {
          const rz = bz + e * (boardLen / 2 - 0.8);
          boxes.push({ cx: boardX, cy: (top + 0.12 + under(boardX)) / 2, cz: rz, sx: 0.1, sy: under(boardX) - top - 0.12, sz: 0.1, color: STEEL_DARK, material: "steel" });
        }
      }
      // Diagonal tie from the mast out under the wing. It hangs well below the wing
      // plane, so it stops short of the first ballast bed rather than reaching over
      // a track.
      const ballastEdges = group.rails
        .flatMap((r) => [r.centerX - BALLAST_WIDTH / 2, r.centerX + BALLAST_WIDTH / 2])
        .filter((x) => (dir > 0 ? x > mastX : x < mastX));
      const toBallast = ballastEdges.length > 0 ? Math.min(...ballastEdges.map((x) => Math.abs(x - mastX))) - 0.4 : run;
      const tieRun = Math.max(1.0, Math.min(6.4, run * 0.6, toBallast));
      // the light strip along the platform edge, fixed to the wing's underside
      const lightX = mastX + dir * Math.max(1.0, Math.min(run - 0.5, toBallast - 0.2));
      boxes.push({ cx: lightX, cy: under(lightX) - 0.08, cz: 0, sx: 0.5, sy: 0.14, sz: Math.max(4, zLen - 6), color: LIGHT_COLOR, material: "light" });
      for (const z of bays) {
        boxes.push({
          cx: mastX + dir * (tieRun / 2),
          cy: headY - 2.1,
          cz: z,
          sx: tieRun / Math.cos(0.5),
          sy: 0.35,
          sz: 0.35,
          rotZ: -dir * 0.5,
          color: STEEL_DARK,
          material: "steel",
        });
      }
    }
  }

  // glass windbreaks + benches on the two outer platforms
  for (const band of [bands[0], bands[bands.length - 1]]) {
    if (!band || band.maxX - band.minX < 3) continue;
    // sit them against the outer edge (the one that does not face a track)
    const outerX = band.edgeLeft ? band.maxX - 0.9 : band.minX + 0.9;
    // inset by the ramps, so a shelter stands on the level deck
    for (const z of bayPositions(length - 2 * RAMP_LENGTH - 1, 24)) {
      boxes.push({ cx: outerX, cy: PLATFORM_HEIGHT + 1.7, cz: z, sx: 0.2, sy: 3.4, sz: 7, color: GLASS_COLOR, material: "glass" });
      pushBench(boxes, layout, band.centerX, z, 1.1, 4.5, STEEL_DARK, "steel");
      boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT + 0.45, cz: z + 3.0, sx: 0.5, sy: 0.9, sz: 0.5, color: STEEL_DARK, material: "steel" });
      boxes.push({ cx: outerX, cy: PLATFORM_HEIGHT + 3.4, cz: z, sx: 0.25, sy: 0.16, sz: 7.2, color: STEEL_DARK, material: "steel" });
      for (const end of [-1, 1]) {
        boxes.push({ cx: outerX, cy: PLATFORM_HEIGHT + 1.7, cz: z + end * 3.4, sx: 0.25, sy: 3.4, sz: 0.2, color: STEEL_DARK, material: "steel" });
      }
    }
  }
  return boxes;
}

// --- overhead concourse ---------------------------------------------------
// Low canopies over every deck band plus a glazed footbridge across the whole
// station, landing in a stair tower on every platform it crosses.
const CONCOURSE_CANOPY_HEIGHT = 7.4;
// Deck centre above the platform. Its underside has to clear ROOF_HEIGHT and,
// on an electric station, the top of the mast standing between each track pair
// (Catenary): at the old 11.25 the mast tip pierced the footbridge by a tenth
// of a stud, since the bridge crosses over the tracks and the mast is the only
// thing a paired station puts up there.
const CONCOURSE_DECK_HEIGHT = 11.6;

function buildConcourse(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, false, { ramp: true });
  const zLen = length - 4;
  const half = layoutWidth(layout) / 2;
  const canopyY = PLATFORM_HEIGHT + CONCOURSE_CANOPY_HEIGHT;
  const bands = deckBands(layout, false);

  const columnZs = bayPositions(length, 12).filter((z) => Math.abs(z) >= 4.5);
  const nearest = (zs: readonly number[], target: number) => zs.reduce((best, z) => (Math.abs(z - target) < Math.abs(best - target) ? z : best));
  // the canopy's underside, the spine beam under it and the cross beams under that
  const soffit = canopyY - 0.2;
  const spineBottom = soffit - 0.45;
  for (const band of bands) {
    const w = band.maxX - band.minX;
    if (w < 1.6) continue;
    const cx = band.centerX;
    for (const end of [-1, 1]) {
      const canopyZ = end * (zLen + 8.4) / 4;
      const canopyLength = (zLen - 8.4) / 2;
      // the canopy: two solid strips either side of a glazed rooflight
      const glassW = w > 5 ? Math.min(2.4, w * 0.3) : 0;
      if (glassW > 0) {
        for (const sgn of [-1, 1]) {
          const x0 = cx + sgn * (glassW / 2 - 0.05);
          const x1 = cx + sgn * (w / 2);
          boxes.push({ lod: "shell", cx: (x0 + x1) / 2, cy: canopyY, cz: canopyZ, sx: Math.abs(x1 - x0), sy: 0.4, sz: canopyLength, color: STEEL_WHITE, material: "steel" });
        }
        boxes.push({ lod: "shell", cx, cy: canopyY + 0.05, cz: canopyZ, sx: glassW, sy: 0.24, sz: canopyLength - 0.1, color: GLASS_COLOR, material: "glass" });
      } else {
        boxes.push({ lod: "shell", cx, cy: canopyY, cz: canopyZ, sx: w, sy: 0.4, sz: canopyLength, color: STEEL_WHITE, material: "steel" });
      }
      // the spine beam down the middle
      boxes.push({ cx, cy: (soffit + spineBottom) / 2, cz: canopyZ, sx: 0.5, sy: soffit - spineBottom + 0.02, sz: canopyLength - 0.4, color: STEEL_DARK, material: "steel" });
      for (const sgn of [-1, 1]) {
        const edgeX = sgn < 0 ? band.minX : band.maxX;
        boxes.push({ lod: "shell", cx: edgeX - sgn * 0.2, cy: canopyY - 0.55, cz: canopyZ, sx: 0.3, sy: 0.8, sz: canopyLength, color: STEEL_DARK, material: "steel" });
        // the light strip, fixed to the underside
        boxes.push({ cx: edgeX - sgn * 1.2, cy: soffit - 0.07, cz: canopyZ, sx: 0.45, sy: 0.14, sz: Math.max(2, canopyLength - 2), color: LIGHT_COLOR, material: "light" });
      }
      // the name board at the canopy's far end, framed, on two rods from the spine
      const boardW = Math.min(w - 2.4, 8);
      if (boardW > 2) {
        const bz = end * (zLen / 2 - 0.6);
        const top = spineBottom - 0.35;
        boxes.push({ cx, cy: top - 0.65, cz: bz, sx: boardW, sy: 1.3, sz: 0.3, color: SIGN_COLOR, material: "sign", label: true });
        for (const y of [top + 0.06, top - 1.36]) boxes.push({ cx, cy: y, cz: bz, sx: boardW + 0.2, sy: 0.12, sz: 0.38, color: STEEL_DARK, material: "steel" });
        pushHangers(boxes, cx, bz, soffit + 0.02, soffit + 0.02 - (top + 0.1), boardW / 2 - 0.5);
      }
    }
    for (const z of columnZs) {
      boxes.push({ cx, cy: PLATFORM_HEIGHT + 0.25, cz: z, sx: 1.0, sy: 0.5, sz: 1.0, color: CONCRETE_LIGHT, material: "platform" });
      boxes.push({ lod: "support", cx, cy: (PLATFORM_HEIGHT + spineBottom) / 2, cz: z, sx: 0.6, sy: spineBottom - PLATFORM_HEIGHT, sz: 0.6, color: STEEL_DARK, material: "steel" });
      // the cross beam on the column's head, and a brace either side
      boxes.push({ cx, cy: spineBottom - 0.14, cz: z, sx: w - 0.7, sy: 0.3, sz: 0.3, color: STEEL_DARK, material: "steel" });
      if (w > 4) {
        for (const sgn of [-1, 1]) {
          const a = { x: cx + sgn * 0.3, y: spineBottom - 1.7 };
          const b = { x: cx + sgn * 1.6, y: spineBottom - 0.3 };
          boxes.push({ cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, cz: z, sx: Math.hypot(b.x - a.x, b.y - a.y), sy: 0.18, sz: 0.18, rotZ: Math.atan2(b.y - a.y, b.x - a.x), color: STEEL_DARK, material: "steel" });
        }
      }
    }
    // a departure board and a clock hung from cross beams, toward the stairs
    if (w >= 6 && columnZs.length >= 2) {
      const beamBottom = spineBottom - 0.27;
      const boardZ = nearest(columnZs, length / 5);
      const clockZ = nearest(columnZs, -length / 5);
      pushHangers(boxes, cx, boardZ, beamBottom, 0.4, 0.9);
      pushDepartureBoard(boxes, cx, beamBottom - 0.4 - 0.45, boardZ);
      if (clockZ !== boardZ) {
        pushHangers(boxes, cx, clockZ, beamBottom, 0.4, 0.9);
        pushTwoFacedClock(boxes, cx, beamBottom - 0.4 - 0.55, clockZ, 1.1);
      }
    }
    // islands: a waiting shelter under each canopy; benches with bins between the
    // columns, on the level deck and clear of the stair tower
    const mids = columnZs.slice(1).map((z, i) => (z + columnZs[i]!) / 2).filter((z) => Math.abs(z) > 7 && Math.abs(z) <= length / 2 - RAMP_LENGTH - 3.5);
    const island = band.row.type === "island" && w >= 11;
    const shelterZs = island ? snapZs([-length / 4, length / 4], mids) : [];
    for (const z of shelterZs) pushShelter(boxes, layout, cx, z);
    if (w > 6) {
      for (const z of mids) if (!shelterZs.some((sz) => Math.abs(sz - z) < 5)) pushBenchWithBin(boxes, layout, cx, z, 1.3);
    }
  }

  // the bridge
  const deckY = PLATFORM_HEIGHT + CONCOURSE_DECK_HEIGHT;
  const outerBand = bands[bands.length - 1];
  const towerX = outerBand ? outerBand.centerX : half - 3.4;
  const bridgeHalf = Math.max(towerX + 3.4, half);
  const bridgeZ = 6;
  boxes.push({ lod: "shell", cx: 0, cy: deckY, cz: 0, sx: bridgeHalf * 2, sy: 0.7, sz: bridgeZ, color: CONCRETE_LIGHT, material: "platform" });
  for (const sgn of [-1, 1]) {
    const railZ = sgn * (bridgeZ / 2 - 0.15);
    boxes.push({ lod: "shell", cx: 0, cy: deckY + 2.1, cz: railZ, sx: bridgeHalf * 2, sy: 3.4, sz: 0.25, color: GLASS_COLOR, material: "glass" });
    boxes.push({ lod: "shell", cx: 0, cy: deckY + 0.5, cz: railZ, sx: bridgeHalf * 2, sy: 0.5, sz: 0.5, color: STEEL_DARK, material: "steel" });
    boxes.push({ lod: "shell", cx: 0, cy: deckY + 3.85, cz: railZ, sx: bridgeHalf * 2, sy: 0.45, sz: 0.6, color: STEEL_DARK, material: "steel" });
    const mullions = Math.max(3, Math.round(bridgeHalf / 3.6));
    for (let i = -mullions; i <= mullions; i++) {
      boxes.push({ cx: (i * bridgeHalf) / (mullions + 0.5), cy: deckY + 2.1, cz: railZ, sx: 0.3, sy: 3.4, sz: 0.4, color: STEEL_DARK, material: "steel" });
    }
  }
  boxes.push({ lod: "shell", cx: 0, cy: deckY + 4.3, cz: 0, sx: bridgeHalf * 2 + 1.2, sy: 0.35, sz: bridgeZ + 1.6, color: STEEL_WHITE, material: "steel" });
  // a name board on BOTH bridge flanks, so it reads whichever way you walk the platform
  for (const sgn of [-1, 1]) {
    const boardW = Math.min(15, half);
    boxes.push({ cx: 0, cy: deckY + 2.4, cz: sgn * (bridgeZ / 2 + 0.35), sx: boardW, sy: 2, sz: 0.3, color: SIGN_COLOR, material: "sign", label: true });
    // a clock either side of the board, on the mullions' line
    for (const side of [-1, 1]) {
      const x = side * (boardW / 2 + 1.8);
      if (Math.abs(x) + 1.2 < bridgeHalf) pushClock(boxes, x, deckY + 2.4, sgn * (bridgeZ / 2 + 0.3), 2.0, sgn);
    }
  }

  // A stair tower on EVERY deck band, not just the outer two: an island between two
  // pairs is only reachable from the bridge, so without its own stairs a 4+ track
  // station would have platforms nobody can get to.
  for (const band of bands) {
    if (band.maxX - band.minX < 3) continue;
    const tx = band.centerX;
    const tw = Math.min(6.2, Math.max(3, band.maxX - band.minX - 0.6));
    const towerH = deckY + 0.6 - PLATFORM_HEIGHT;
    const towerMid = PLATFORM_HEIGHT + towerH / 2;
    boxes.push({ lod: "shell", cx: tx, cy: towerMid, cz: 0, sx: tw, sy: towerH, sz: 7.2, color: GLASS_COLOR, material: "glass" });
    for (const dx of [-1, 1]) {
      for (const dz of [-1, 1]) {
        boxes.push({ cx: tx + (dx * tw) / 2, cy: towerMid, cz: dz * 3.5, sx: 0.55, sy: towerH, sz: 0.55, color: STEEL_DARK, material: "steel" });
      }
    }
    for (const f of [0.34, 0.67]) {
      boxes.push({ cx: tx, cy: PLATFORM_HEIGHT + towerH * f, cz: 0, sx: tw + 0.2, sy: 0.35, sz: 7.4, color: STEEL_DARK, material: "steel" });
    }
    boxes.push({ lod: "shell", cx: tx, cy: PLATFORM_HEIGHT + towerH + 0.35, cz: 0, sx: tw + 0.8, sy: 0.5, sz: 8.0, color: STEEL_WHITE, material: "steel" });
    const run = tw - 1.2;
    const flightRise = (deckY + 0.35 - PLATFORM_HEIGHT) / 4;
    for (let flight = 0; flight < 4; flight++) {
      const dir = flight % 2 === 0 ? 1 : -1;
      const flightZ = dir * 1.6;
      const bottom = PLATFORM_HEIGHT + flight * flightRise;
      const slope = Math.atan2(flightRise, run);
      boxes.push({ cx: tx, cy: bottom + flightRise / 2, cz: flightZ, sx: Math.hypot(run, flightRise), sy: 0.22, sz: 2.7, rotZ: dir * slope, color: CONCRETE_LIGHT, material: "platform" });
      for (let step = 0; step < 6; step++) {
        boxes.push({ cx: tx + dir * (run * ((step + 0.5) / 6 - 0.5)), cy: bottom + flightRise * ((step + 1) / 6), cz: flightZ, sx: run / 6, sy: 0.12, sz: 2.7, color: CONCRETE_LIGHT, material: "platform" });
      }
      if (flight < 3) boxes.push({ cx: tx + dir * (run / 2 + 0.2), cy: bottom + flightRise, cz: 0, sx: 0.6, sy: 0.22, sz: 6.1, color: CONCRETE_LIGHT, material: "platform" });
    }
  }
  return boxes;
}

// --- village depot --------------------------------------------------------
// A country station on the layout's "building" row, laid out along the platform as
// far as the station's length allows, in this order of need: the stationmaster's
// two-storey house, its single-storey waiting room wing under a tiled awning, a
// timber goods shed with its loading door to the track, and a small brick privy.
const DEPOT_GROUND = 4.2; // ground storey, plinth to string course
const DEPOT_UPPER = 3.4;
const DEPOT_PITCH_DEG = 32;
const DEPOT_GAP = 1.5;
const STUCCO: [number, number, number] = [224, 202, 158];
const SHED_ROOF: [number, number, number] = [84, 82, 80];

interface DepotPiece { kind: "shed" | "house" | "wing" | "privy"; length: number; z: number }

/** The depot's buildings along Z, by priority, centred within `usable` studs. */
function depotPieces(usable: number): DepotPiece[] {
  const want: Array<{ kind: DepotPiece["kind"]; length: number }> = [
    { kind: "house", length: Math.max(10, Math.min(20, usable * 0.3)) },
    { kind: "wing", length: Math.max(6, Math.min(14, usable * 0.2)) },
    { kind: "shed", length: Math.max(7, Math.min(20, usable * 0.24)) },
    { kind: "privy", length: 3.2 },
  ];
  const chosen: Array<{ kind: DepotPiece["kind"]; length: number }> = [];
  let used = 0;
  for (const w of want) {
    const need = w.length + (chosen.length ? DEPOT_GAP : 0);
    if (used + need <= usable) {
      chosen.push(w);
      used += need;
    } else if (w.kind === "house") {
      chosen.push({ kind: "house", length: Math.max(6, usable) });
      used += Math.max(6, usable);
    }
  }
  // along the platform: shed, house, wing, privy
  const order: DepotPiece["kind"][] = ["shed", "house", "wing", "privy"];
  const pieces = order.flatMap((k) => chosen.filter((c) => c.kind === k));
  // the wing and the house touch: the gap goes elsewhere
  let total = 0;
  pieces.forEach((p, i) => { total += p.length + (i > 0 && !(p.kind === "wing" && pieces[i - 1]!.kind === "house") ? DEPOT_GAP : 0); });
  let z = -total / 2;
  return pieces.map((p, i) => {
    if (i > 0 && !(p.kind === "wing" && pieces[i - 1]!.kind === "house")) z += DEPOT_GAP;
    const piece = { kind: p.kind, length: p.length, z: z + p.length / 2 };
    z += p.length;
    return piece;
  });
}

/** A framed window or door on a long wall at x = `face`, `dir` pointing out of it. */
function pushWallOpening(boxes: StationBox[], face: number, dir: number, y0: number, h: number, z: number, w: number, door: boolean): void {
  boxes.push({ cx: face + dir * 0.06, cy: y0 + h / 2, cz: z, sx: 0.16, sy: h + 0.24, sz: w + 0.24, color: WOOD_CREAM, material: "wood" });
  boxes.push({ cx: face + dir * 0.12, cy: y0 + h / 2, cz: z, sx: 0.08, sy: h - 0.12, sz: w - 0.16, color: door ? WOOD_COLOR : STEEL_DARK, material: door ? "wood" : "glass" });
  if (!door) {
    boxes.push({ cx: face + dir * 0.17, cy: y0 + h / 2, cz: z, sx: 0.05, sy: h - 0.12, sz: 0.1, color: WOOD_CREAM, material: "wood" });
    boxes.push({ cx: face + dir * 0.2, cy: y0 - 0.1, cz: z, sx: 0.34, sy: 0.14, sz: w + 0.4, color: WOOD_CREAM, material: "wood" });
  }
}

/** A gabled roof along Z over a block `w` wide: two tiled slabs and the two gable ends. */
function pushGableRoof(boxes: StationBox[], cx: number, cz: number, w: number, len: number, eaveY: number, pitchDeg: number, color: [number, number, number], material: StationBoxMaterial, gableColor: [number, number, number]): number {
  const pitch = (pitchDeg * Math.PI) / 180;
  const overhang = 0.7;
  const slope = (w / 2 + overhang) / Math.cos(pitch);
  for (const sgn of [-1, 1]) {
    boxes.push({
      cx: cx + sgn * ((w / 2 + overhang) / 2 - overhang),
      cy: eaveY + 0.15 + (w / 4 - overhang / 2) * Math.tan(pitch),
      cz,
      sx: slope,
      sy: 0.4,
      sz: len + 1.0,
      rotZ: -sgn * pitch,
      color,
      material,
      lod: "shell",
    });
  }
  const rise = (w / 2) * Math.tan(pitch);
  for (const end of [-1, 1]) {
    boxes.push({ lod: "shell", profile: "gable", cx, cy: eaveY + rise / 2, cz: cz + end * (len / 2 - 0.1), sx: w, sy: rise, sz: 0.2, color: gableColor, material: "brick" });
  }
  boxes.push({ cx, cy: eaveY + rise + 0.32, cz, sx: 0.5, sy: 0.3, sz: len + 1.1, color, material });
  return rise;
}

function buildVillageDepot(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, true, { ramp: true });
  const spans = rowSpans(layout);
  const half = layoutWidth(layout) / 2;
  const buildingRow = spans.find((s) => s.type === "building") ?? spans[spans.length - 1]!;
  const bands = deckBands(layout, false);
  const houseBand = bands.find((b) => b.row.index === buildingRow.index) ?? bands[bands.length - 1]!;

  // the buildings take the outer part of the band, the waiting area under the
  // awning keeps the part next to the track
  const houseOuter = houseBand.maxX - 0.3;
  const bandW = houseBand.maxX - houseBand.minX;
  const buildingW = Math.max(3.5, Math.min(7, bandW * 0.6));
  const houseInner = houseOuter - buildingW;
  const bcx = (houseInner + houseOuter) / 2;
  const base = PLATFORM_HEIGHT;
  const pieces = depotPieces(length - 2 * RAMP_LENGTH - 4);
  const windows = (len: number) => {
    const n = Math.max(1, Math.floor(len / 3.4));
    return Array.from({ length: n }, (_, i) => -len / 2 + ((i + 0.5) * len) / n);
  };

  for (const p of pieces) {
    if (p.kind === "house") {
      const eaveY = base + DEPOT_GROUND + DEPOT_UPPER;
      boxes.push({ cx: bcx, cy: base + 0.4, cz: p.z, sx: buildingW + 0.3, sy: 0.8, sz: p.length + 0.3, color: BRICK_COLOR, material: "brick" });
      boxes.push({ lod: "shell", cx: bcx, cy: (base + eaveY) / 2, cz: p.z, sx: buildingW, sy: eaveY - base, sz: p.length, color: STUCCO, material: "brick" });
      boxes.push({ cx: bcx, cy: base + DEPOT_GROUND, cz: p.z, sx: buildingW + 0.24, sy: 0.3, sz: p.length + 0.24, color: WOOD_CREAM, material: "brick" });
      boxes.push({ cx: bcx, cy: eaveY - 0.2, cz: p.z, sx: buildingW + 0.4, sy: 0.4, sz: p.length + 0.4, color: WOOD_CREAM, material: "brick" });
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          boxes.push({ cx: bcx + sx * (buildingW / 2 - 0.2), cy: (base + 0.8 + eaveY - 0.4) / 2, cz: p.z + sz * (p.length / 2 - 0.2), sx: 0.52, sy: eaveY - base - 1.2, sz: 0.52, color: BRICK_COLOR, material: "brick" });
        }
      }
      const rise = pushGableRoof(boxes, bcx, p.z, buildingW, p.length, eaveY, DEPOT_PITCH_DEG, TILE_COLOR, "tile", STUCCO);
      for (const zc of [-p.length / 4, p.length / 4]) {
        boxes.push({ lod: "shell", cx: bcx + buildingW * 0.2, cy: eaveY + rise * 0.5 + 1.6, cz: p.z + zc, sx: 0.9, sy: rise + 1.4, sz: 1.3, color: BRICK_COLOR, material: "brick" });
        boxes.push({ cx: bcx + buildingW * 0.2, cy: eaveY + rise + 1.45, cz: p.z + zc, sx: 1.2, sy: 0.25, sz: 1.6, color: WOOD_CREAM, material: "brick" });
      }
      // windows on both long walls, the door in the middle of the platform side
      const zs = windows(p.length - 1);
      const doorZ = zs.reduce((best, z) => (Math.abs(z) < Math.abs(best) ? z : best));
      for (const [face, dir] of [[houseInner, -1], [houseOuter, 1]] as const) {
        for (const z of zs) {
          const door = dir < 0 && z === doorZ;
          pushWallOpening(boxes, face, dir, door ? base + 0.05 : base + 1.4, door ? 2.9 : 2.0, p.z + z, door ? 1.6 : 1.3, door);
          pushWallOpening(boxes, face, dir, base + DEPOT_GROUND + 0.9, 1.8, p.z + z, 1.2, false);
        }
      }
      // the name over the door, under the awning's eaves
      boxes.push({ cx: houseInner - 0.32, cy: base + 3.45, cz: p.z + doorZ, sx: 0.22, sy: 0.75, sz: Math.min(6, p.length * 0.45), color: SIGN_COLOR, material: "sign", label: true });
      // an attic window in each gable
      for (const end of [-1, 1]) {
        boxes.push({ cx: bcx, cy: eaveY + rise * 0.35, cz: p.z + end * (p.length / 2 + 0.05), sx: 1.0, sy: 1.1, sz: 0.12, color: STEEL_DARK, material: "glass" });
      }
    } else if (p.kind === "wing") {
      // its eaves clear the awning that runs along its wall
      const eaveY = base + 4.9;
      boxes.push({ cx: bcx, cy: base + 0.4, cz: p.z, sx: buildingW + 0.3, sy: 0.8, sz: p.length + 0.3, color: BRICK_COLOR, material: "brick" });
      boxes.push({ lod: "shell", cx: bcx, cy: (base + eaveY) / 2, cz: p.z, sx: buildingW - 0.4, sy: eaveY - base, sz: p.length, color: STUCCO, material: "brick" });
      boxes.push({ cx: bcx, cy: eaveY - 0.18, cz: p.z, sx: buildingW, sy: 0.36, sz: p.length + 0.2, color: WOOD_CREAM, material: "brick" });
      pushGableRoof(boxes, bcx, p.z, buildingW - 0.4, p.length, eaveY, 26, TILE_COLOR, "tile", STUCCO);
      for (const [face, dir] of [[houseInner + 0.2, -1], [houseOuter - 0.2, 1]] as const) {
        for (const z of windows(p.length)) pushWallOpening(boxes, face, dir, base + 0.9, 2.4, p.z + z, 1.3, false);
      }
    } else if (p.kind === "shed") {
      const eaveY = base + 4.4;
      const shedW = buildingW - 0.2;
      boxes.push({ lod: "shell", cx: bcx, cy: (base + eaveY) / 2, cz: p.z, sx: shedW, sy: eaveY - base, sz: p.length, color: WOOD_COLOR, material: "wood" });
      // vertical battens over the planking
      for (let z = -p.length / 2 + 0.6; z <= p.length / 2 - 0.5; z += 1.2) {
        for (const sgn of [-1, 1]) boxes.push({ cx: bcx + sgn * (shedW / 2 + 0.04), cy: (base + eaveY) / 2, cz: p.z + z, sx: 0.1, sy: eaveY - base - 0.1, sz: 0.16, color: [104, 70, 44], material: "wood" });
      }
      // the sliding door to the track, its rail, and the timber loading apron
      const doorW = Math.min(4, p.length * 0.4);
      boxes.push({ cx: houseInner + 0.1 - 0.12, cy: base + 1.6, cz: p.z, sx: 0.12, sy: 3.2, sz: doorW, color: [96, 64, 40], material: "wood" });
      boxes.push({ cx: houseInner + 0.1 - 0.2, cy: base + 3.35, cz: p.z, sx: 0.16, sy: 0.18, sz: doorW * 2 + 0.4, color: STEEL_DARK, material: "steel" });
      boxes.push({ cx: houseInner - 0.6, cy: base + 0.06, cz: p.z, sx: 1.4, sy: 0.12, sz: doorW * 2 + 1, color: WOOD_COLOR, material: "wood" });
      pushGableRoof(boxes, bcx, p.z, shedW, p.length, eaveY, 22, SHED_ROOF, "roof", WOOD_COLOR);
    } else {
      const h = 2.8;
      const pw = Math.min(2.8, buildingW - 1);
      const px = houseOuter - pw / 2 - 0.2;
      boxes.push({ lod: "shell", cx: px, cy: base + h / 2, cz: p.z, sx: pw, sy: h, sz: p.length, color: BRICK_COLOR, material: "brick" });
      boxes.push({ cx: px, cy: base + h + 0.25, cz: p.z, sx: pw + 0.6, sy: 0.22, sz: p.length + 0.5, rotZ: 0.12, color: SHED_ROOF, material: "roof" });
      boxes.push({ cx: px - pw / 2 - 0.05, cy: base + 1.05, cz: p.z, sx: 0.1, sy: 2.1, sz: 1.0, color: WOOD_COLOR, material: "wood" });
    }
  }

  // the awning along the house and its wing, over the waiting area
  const covered = pieces.filter((p) => p.kind === "house" || p.kind === "wing");
  const awnZ0 = Math.min(...covered.map((p) => p.z - p.length / 2)) - 1;
  const awnZ1 = Math.max(...covered.map((p) => p.z + p.length / 2)) + 1;
  const awnInner = houseBand.minX + 0.2;
  const awnSlope = 0.16;
  const awnTopY = PLATFORM_HEIGHT + 3.4;
  const awnMid = (houseInner + awnInner) / 2;
  const awnLen = awnZ1 - awnZ0;
  const awnCz = (awnZ0 + awnZ1) / 2;
  if (houseInner - awnInner > 1) {
    boxes.push({
      cx: awnMid,
      cy: awnTopY + (awnMid - awnInner) * Math.tan(awnSlope),
      cz: awnCz,
      sx: (houseInner - awnInner) / Math.cos(awnSlope),
      sy: 0.3,
      sz: awnLen,
      rotZ: awnSlope,
      color: TILE_COLOR,
      material: "tile",
      lod: "shell",
    });
    // the fretted valance and the brackets on every post
    boxes.push({ cx: awnInner + 0.15, cy: awnTopY - 0.45, cz: awnCz, sx: 0.12, sy: 0.75, sz: awnLen, color: WOOD_CREAM, material: "wood" });
    for (let z = awnZ0 + 0.5; z <= awnZ1 - 0.4; z += 1) {
      boxes.push({ rotX: Math.PI / 4, cx: awnInner + 0.15, cy: awnTopY - 0.95, cz: z, sx: 0.1, sy: 0.35, sz: 0.35, color: WOOD_CREAM, material: "wood" });
    }
    for (const z of bayPositions(awnLen + 4, 4.5)) {
      boxes.push({ lod: "support", cx: awnInner + 0.5, cy: (PLATFORM_HEIGHT + awnTopY) / 2, cz: awnCz + z, sx: 0.32, sy: awnTopY - PLATFORM_HEIGHT, sz: 0.32, color: WOOD_COLOR, material: "wood" });
      boxes.push({ cx: awnInner + 1.0, cy: awnTopY - 0.45, cz: awnCz + z, sx: 1.3, sy: 0.18, sz: 0.18, rotZ: 0.6, color: WOOD_COLOR, material: "wood" });
    }
    for (const z of bayPositions(awnLen + 4, 9)) {
      // a lamp hung just under the awning
      const underside = awnTopY + 1.6 * Math.tan(awnSlope) - 0.15;
      boxes.push({ cx: awnInner + 1.6, cy: underside - 0.3, cz: awnCz + z, sx: 0.6, sy: 0.6, sz: 0.6, color: LIGHT_COLOR, material: "light" });
    }
    for (const z of [awnZ0 + awnLen / 4, awnZ1 - awnLen / 4]) pushBench(boxes, layout, awnInner + 2.3, z);
  }

  // name boards on posts at the ends of the outer platform, like the default deck
  const outerBand = bands[0]!;
  if (outerBand.maxX - outerBand.minX >= 2.5) {
    for (const sgn of [-1, 1]) {
      pushNameBoard(boxes, { cx: outerBand.centerX, cz: sgn * (length / 2 - RAMP_LENGTH - 1.2), facing: "x", width: Math.min(8, length * 0.12) });
    }
  }
  // a post-and-rail fence along the far platform, and its lamps
  const fenceX = -(half - 0.9);
  const fenceHalf = length / 2 - RAMP_LENGTH - 0.5;
  const posts = Math.max(2, Math.round((fenceHalf * 2) / 4) + 1);
  for (let i = 0; i < posts; i++) {
    const z = -fenceHalf + (i * fenceHalf * 2) / (posts - 1);
    boxes.push({ cx: fenceX, cy: PLATFORM_HEIGHT + 0.7, cz: z, sx: 0.25, sy: 1.4, sz: 0.25, color: WOOD_CREAM, material: "wood" });
  }
  for (const y of [0.55, 1.2]) {
    boxes.push({ cx: fenceX, cy: PLATFORM_HEIGHT + y, cz: 0, sx: 0.12, sy: 0.16, sz: fenceHalf * 2, color: WOOD_CREAM, material: "wood" });
  }
  for (const z of bayPositions(length - 2 * RAMP_LENGTH, 22)) {
    boxes.push({ cx: fenceX + 2.2, cy: PLATFORM_HEIGHT + 2.6, cz: z, sx: 0.4, sy: 4.4, sz: 0.4, color: WOOD_COLOR, material: "wood" });
    boxes.push({ cx: fenceX + 2.2, cy: PLATFORM_HEIGHT + 5.1, cz: z, sx: 1.0, sy: 1.0, sz: 1.0, color: LIGHT_COLOR, material: "light" });
  }
  return boxes;
}

// --- heritage umbrella canopy ---------------------------------------------
// A gabled timber canopy on every deck band, on a single row of cast-iron posts.
// The eaves stop at the platform edge, so the tracks stay open to the sky.
const HERITAGE_EAVE_HEIGHT = 6.4;
const HERITAGE_PITCH_DEG = 24;
const HERITAGE_VALANCE_STEP = 2.5;

function buildHeritageCanopy(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  const wells = islandWells(layout, underpassZs(length));
  pushDeck(boxes, length, layout, false, { ramp: true, wells });
  pushUnderpasses(boxes, wells);
  const zLen = length - 3;
  const pitch = (HERITAGE_PITCH_DEG * Math.PI) / 180;

  for (const band of deckBands(layout, false)) {
    const inner = band.minX + (band.edgeLeft ? 0.2 : -1.5);
    const outer = band.maxX - (band.edgeRight ? 0.2 : -1.5);
    const halfW = (outer - inner) / 2;
    if (halfW < 1.4) continue;
    const centerX = (inner + outer) / 2;
    const eaveY = PLATFORM_HEIGHT + HERITAGE_EAVE_HEIGHT;
    const ridgeY = eaveY + halfW * Math.tan(pitch);

    for (const side of [-1, 1]) {
      boxes.push({
        cx: centerX + (side * halfW) / 2,
        cy: (eaveY + ridgeY) / 2 + 0.2,
        cz: 0,
        sx: halfW / Math.cos(pitch),
        sy: 0.42,
        sz: zLen,
        rotZ: -side * pitch,
        color: CANOPY_GREEN,
        material: "tile",
        lod: "shell",
      });
      const eaveX = centerX + side * (halfW - 0.15);
      boxes.push({ cx: eaveX, cy: eaveY - 0.35, cz: 0, sx: 0.32, sy: 1.2, sz: zLen, color: WOOD_CREAM, material: "wood" });
      for (let z = -zLen / 2 + 1; z <= zLen / 2 - 1; z += HERITAGE_VALANCE_STEP) {
        boxes.push({ cx: eaveX, cy: eaveY - 0.95, cz: z, sx: 0.3, sy: 0.4, sz: 1.1, color: WOOD_CREAM, material: "wood" });
      }
    }
    boxes.push({ lod: "shell", cx: centerX, cy: ridgeY + 0.55, cz: 0, sx: 1.3, sy: 0.6, sz: zLen, color: WOOD_COLOR, material: "wood" });
    if (zLen > 16) {
      boxes.push({ cx: centerX, cy: ridgeY + 1.0, cz: 0, sx: 1.1, sy: 0.7, sz: zLen - 14, color: GLASS_COLOR, material: "glass" });
      boxes.push({ cx: centerX, cy: ridgeY + 1.48, cz: 0, sx: 1.8, sy: 0.22, sz: zLen - 13, color: CANOPY_GREEN, material: "tile" });
    }
    const canopyBays = bayPositions(length, 10);
    for (const z of canopyBays) {
      boxes.push({ lod: "support", cx: centerX, cy: (PLATFORM_HEIGHT + eaveY + 0.6) / 2, cz: z, sx: 0.75, sy: eaveY + 0.6 - PLATFORM_HEIGHT, sz: 0.75, color: IRON_GREEN, material: "column" });
      for (const side of [-1, 1]) {
        boxes.push({ cx: centerX + side * 1.1, cy: eaveY - 0.6, cz: z, sx: 2.6, sy: 0.35, sz: 0.4, rotZ: side * 0.5, color: IRON_GREEN, material: "column" });
      }
      boxes.push({ cx: centerX + Math.min(halfW * 0.25, 1.5), cy: eaveY - 1.5, cz: z, sx: 1.2, sy: 1.5, sz: 1.2, color: LIGHT_COLOR, material: "light" });
    }
    for (const zs of [-1, 1]) {
      boxes.push({ lod: "shell", profile: "gable", cx: centerX, cy: (eaveY + ridgeY) / 2 + 0.2, cz: zs * (zLen / 2 + 0.08), sx: halfW * 2, sy: ridgeY - eaveY, sz: 0.22, color: WOOD_CREAM, material: "wood" });
      // name board on the gable face, reading along the track -- outboard of the
      // gable boards and beyond every post, so nothing crosses it
      boxes.push({ cx: centerX, cy: eaveY + 0.9, cz: zs * (zLen / 2 + 0.28), sx: Math.min(halfW * 1.6, 9), sy: 1.6, sz: 0.3, color: SIGN_COLOR, material: "sign", label: true });
    }
    for (let i = 0; i + 1 < canopyBays.length; i += 2) {
      pushBench(boxes, layout, centerX, (canopyBays[i] + canopyBays[i + 1]) / 2);
    }
  }
  return boxes;
}

// --- grand terminus -------------------------------------------------------
// Glazed vaults over the whole station on stone platform arcades. Up to two track
// groups share one great vault; a wider station gets a basilica: a tall nave over
// the middle group or two and a lower aisle vault over each other group, with a
// stone clerestory wall where an aisle meets the nave. Every vault shows a
// monumental upper facade at both ends -- the nave's with the clock, the name and
// the roof cross. Below the gauge line the platforms close with framed glass
// screens round an open passage, and the through-track openings stay clear.
const GRAND_SPRING_HEIGHT = 9.0; // the nave's springing line above the deck
const GRAND_AISLE_SPRING_HEIGHT = 7.0;
const GRAND_RISE_RATIO = 0.55; // crown height as a fraction of the half span
const GRAND_AISLE_RISE_RATIO = 0.75;
const GRAND_RIB_SPACING = 14;
const GRAND_LAMP_SPACING = 26;

type GrandVault = { v: Vault; nave: boolean };

/** The terminus' vaults: one over up to two groups, else a nave between aisles. */
function grandVaults(layout: StationLayout): GrandVault[] {
  const bands = deckBands(layout, false);
  const groups = trackGroups(layout);
  const half = layoutWidth(layout) / 2;
  const nave = (left: number, right: number): GrandVault =>
    ({ v: makeVault(left, right, PLATFORM_HEIGHT + GRAND_SPRING_HEIGHT, GRAND_RISE_RATIO, railsBetween(layout, left, right), 1.2), nave: true });
  if (groups.length <= 2) {
    const left = bands.length > 0 ? bands[0]!.centerX : -half;
    const right = bands.length > 0 ? bands[bands.length - 1]!.centerX : half;
    return [nave(left, right)];
  }
  const first = Math.floor((groups.length - 1) / 2);
  const last = Math.ceil((groups.length - 1) / 2);
  const out: GrandVault[] = [];
  groups.forEach((g, i) => {
    if (i === first) out.push(nave(g.outerLeftX, groups[last]!.outerRightX));
    if (i >= first && i <= last) return;
    out.push({ v: makeVault(g.outerLeftX, g.outerRightX, PLATFORM_HEIGHT + GRAND_AISLE_SPRING_HEIGHT, GRAND_AISLE_RISE_RATIO, g.rails, 1.2), nave: false });
  });
  return out;
}

function buildGrandTerminus(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  const zLen = length - 3;
  const clearY = PLATFORM_HEIGHT + ROOF_HEIGHT;
  const bands = deckBands(layout, false);
  const overTrack = overTrackIn(layout);
  const vaults = grandVaults(layout);
  const ribs = bayPositions(zLen + 7, GRAND_RIB_SPACING);
  const midRibs = ribs.slice(1).map((z, i) => (z + ribs[i]!) / 2);
  const lampZs = bayPositions(length, GRAND_LAMP_SPACING);

  // the underpasses sit between the island's bench bays
  const mids = lampZs.slice(1).map((z, i) => (z + lampZs[i]!) / 2);
  const wellZs = underpassZs(length).map((z) => (mids.length ? mids.reduce((best, m) => (Math.abs(m - z) < Math.abs(best - z) ? m : best)) : z));
  const wells = islandWells(layout, [...new Set(wellZs)]);
  pushDeck(boxes, length, layout, false, { wells });
  pushUnderpasses(boxes, wells);

  // the pier lines, each with the springing lines of the vaults that land on it
  const lines = new Map<string, { x: number; springs: number[] }>();
  for (const { v } of vaults) {
    for (const x of [v.midX - v.span, v.midX + v.span]) {
      const key = x.toFixed(3);
      const line = lines.get(key) ?? { x, springs: [] };
      line.springs.push(v.springY);
      lines.set(key, line);
    }
  }

  const stone = (cx: number, sx: number, lo: number, hi: number, cz: number, sz: number, color = STONE_LIGHT) => {
    if (hi - lo < 0.25 || sx <= 0) return;
    boxes.push({ cx, cy: (lo + hi) / 2, cz, sx, sy: hi - lo, sz, color, material: "brick", lod: "shell" });
  };

  for (const { v, nave } of vaults) {
    const { midX, span, rise, springY } = v;
    // Continuous glazing on evenly spaced ribs, including the two ends.
    pushVaultArc(boxes, v, 0, zLen, 0.3, 0, GLASS_COLOR, "glass", "shell");
    for (const z of ribs) pushVaultArc(boxes, v, z, 0.8, 0.8, 0.25, STEEL_DARK, "steel");
    for (const z of midRibs) pushVaultArc(boxes, v, z, 0.35, 0.35, 0.18, STEEL_DARK, "steel");
    pushVaultPurlins(boxes, v, zLen, 0.24);
    if (nave) pushCrownLantern(boxes, v, zLen);

    // --- the vault's facades at both ends ---
    // Built panel by panel across the arc. A panel that crosses a track starts at
    // the clearance line instead of the deck: the facade is a screen, never a wall
    // across the rails.
    const panelW = (span * 2) / v.segments;
    const panelTops: { dx: number; top: number }[] = [];
    for (let i = 0; i < v.segments; i++) {
      const dx = -span + (i + 0.5) * panelW;
      panelTops.push({ dx, top: Math.min(vaultHeightAt(v, dx - panelW / 2), vaultHeightAt(v, dx + panelW / 2)) - 0.2 });
    }
    const crownY = vaultHeightAt(v, 0);
    // Scale the upper facade to the space above the loading gauge.
    const avail = Math.max(0.6, crownY - clearY);
    const bandBottom = clearY + 0.05;
    const bandTop = bandBottom + Math.max(0.8, Math.min(2.2, avail * 0.3));
    // the entablature stops where the arch drops below it, so it never juts outside
    // the vault's profile
    const bandRatio = Math.max(0, (bandTop + 0.3 - springY) / rise);
    const bandHalf = bandRatio >= 1 ? span * 0.5 : span * Math.sqrt(Math.max(0.04, 1 - bandRatio ** 2));
    const sillY = bandTop + 0.15;
    const giantHalf = Math.min(span * (nave ? 0.42 : 0.3), 16);
    const hasWindow = crownY - sillY > 3;

    for (const endSign of [-1, 1]) {
      const zOut = (offset: number) => endSign * (zLen / 2 + offset);
      for (let i = 0; i < panelTops.length; i++) {
        const { dx, top } = panelTops[i]!;
        const px = midX + dx;
        const overRail = overTrack(px, panelW / 2);
        const frontBottom = Math.max(bandTop, overRail ? clearY : PLATFORM_HEIGHT);
        if (top - frontBottom <= 0.6) continue;
        // One broad fanlight in the middle, framed by solid stone side bays.
        let glassLo = top;
        if (hasWindow && Math.abs(dx) <= giantHalf) glassLo = Math.max(frontBottom, sillY);
        if (top - glassLo < 0.8) glassLo = top;
        // Panels meet edge to edge in X; narrow applied mullions frame the glass.
        stone(px, panelW, frontBottom, glassLo, zOut(0.55), 0.9);
        if (top - glassLo >= 0.8) {
          boxes.push({ cx: px, cy: (glassLo + top) / 2, cz: zOut(0.55), lod: "shell", sx: panelW, sy: top - glassLo, sz: 0.12, color: GLASS_COLOR, material: "glass" });
          boxes.push({ cx: px - panelW / 2 + 0.09, cy: (glassLo + top) / 2, cz: zOut(0.66), sx: 0.18, sy: top - glassLo, sz: 0.18, color: STEEL_DARK, material: "steel" });
        }
      }
      // stone archivolt along the arch, and the entablature
      pushVaultArc(boxes, v, zOut(0.85), 0.9, 0.9, 0.5, STONE_LIGHT, "brick", "shell");
      stone(midX, bandHalf * 2 + 1.6, bandBottom, bandTop, zOut(0.9), 1.1);
      const scale = Math.max(0.6, Math.min(2, span / 16));
      const crossBase = crownY + 0.35;
      if (!nave) {
        // an aisle's crown carries a plain stone finial
        boxes.push({ lod: "shell", cx: midX, cy: crossBase + 0.9 * scale, cz: zOut(0.85), sx: 0.9 * scale, sy: 1.8 * scale, sz: 0.9 * scale, color: STONE_DARK, material: "brick" });
        continue;
      }
      const boardH = Math.min(1.5, bandTop - bandBottom - 0.35);
      boxes.push({ cx: midX, cy: (bandBottom + bandTop) / 2, cz: zOut(1.55), sx: Math.min(bandHalf * 1.5, 22), sy: boardH, sz: 0.35, color: SIGN_COLOR, material: "sign", label: true });
      // Fit a clock above the name band even on the small, solid upper gables.
      const clock = Math.min(6, Math.max(1.1, avail * 0.28), giantHalf * 0.6, Math.max(0.4, (crownY - sillY - 0.16) * 0.8));
      const clockY = sillY + 0.08 + clock / 2;
      if (clockY + clock / 2 + 0.08 <= vaultHeightAt(v, clock / 2)) pushClock(boxes, midX, clockY, zOut(1.35), clock, endSign);
      boxes.push({ lod: "shell", cx: midX, cy: crossBase + 0.3 * scale, cz: zOut(0.85), sx: 1.8 * scale, sy: 0.6 * scale, sz: 1.4 * scale, color: STONE_DARK, material: "brick" });
      boxes.push({ lod: "shell", cx: midX, cy: crossBase + 1.9 * scale, cz: zOut(0.85), sx: 0.5 * scale, sy: 2.6 * scale, sz: 0.5 * scale, color: STONE_LIGHT, material: "brick" });
      boxes.push({ lod: "shell", cx: midX, cy: crossBase + 2.25 * scale, cz: zOut(0.85), sx: 1.8 * scale, sy: 0.5 * scale, sz: 0.5 * scale, color: STONE_LIGHT, material: "brick" });
    }
  }

  // stone arcades on the pier lines: a plinth wall, a pilaster under every rib, the
  // cornice each vault springs from, the clerestory wall between an aisle's springing
  // and the nave's, and a statue at both ends
  const statueScale = Math.max(0.6, Math.min(2, Math.max(...vaults.map((g) => g.v.span)) / 16));
  for (const { x, springs } of lines.values()) {
    const lo = Math.min(...springs);
    const hi = Math.max(...springs);
    boxes.push({ lod: "shell", cx: x, cy: PLATFORM_HEIGHT + 0.9, cz: 0, sx: 1.6, sy: 1.8, sz: zLen, color: STONE_LIGHT, material: "brick" });
    for (const s of new Set(springs)) {
      boxes.push({ lod: "shell", cx: x, cy: s + 0.5, cz: 0, sx: 2.8, sy: 1.0, sz: zLen, color: STONE_LIGHT, material: "brick" });
    }
    if (hi - lo > 1.2) boxes.push({ lod: "shell", cx: x, cy: (lo + 1.0 + hi) / 2, cz: 0, sx: 1.4, sy: hi - lo - 1.0, sz: zLen, color: STONE_DARK, material: "brick" });
    for (const z of ribs) {
      boxes.push({ lod: "support", cx: x, cy: (PLATFORM_HEIGHT + hi) / 2, cz: z, sx: 2.2, sy: hi - PLATFORM_HEIGHT, sz: 2.2, color: STONE_LIGHT, material: "brick" });
    }
    for (const endSign of [-1, 1]) {
      const z = endSign * (zLen / 2 + 0.85);
      boxes.push({ cx: x, cy: hi + 1.0 + 0.5 * statueScale, cz: z, sx: 2.4 * statueScale, sy: 1.0 * statueScale, sz: 2.4 * statueScale, color: STONE_DARK, material: "brick" });
      boxes.push({ cx: x, cy: hi + 1.0 + 2.2 * statueScale, cz: z, sx: 0.9 * statueScale, sy: 2.4 * statueScale, sz: 0.9 * statueScale, color: STONE_LIGHT, material: "brick" });
    }
  }
  const pierX = [...lines.values()].map((l) => l.x);

  for (const band of bands) {
    const w = band.maxX - band.minX;
    const onPierLine = pierX.some((x) => Math.abs(x - band.centerX) < 0.5);
    // the islands are the concourse: lamp standards down the middle (where no pier
    // line runs), benches beside
    if (w >= 9) {
      for (const z of lampZs) {
        if (!onPierLine) {
          boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT + 2.6, cz: z, sx: 0.45, sy: 5.2, sz: 0.45, color: STEEL_DARK, material: "column" });
          boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT + 5.6, cz: z, sx: 1.2, sy: 1.0, sz: 1.2, color: LIGHT_COLOR, material: "light" });
        }
        for (const sgn of [-1, 1]) pushBench(boxes, layout, band.centerX + sgn * 3.2, z);
      }
    }
    // The end screens under the gauge line: a stone lintel, jambs either side of an
    // open passage and mullioned glass round it, on every platform end.
    const sw = Math.max(0.6, w - 0.2);
    for (const endSign of [-1, 1]) {
      const zOut = (offset: number) => endSign * (zLen / 2 + offset);
      stone(band.centerX, sw + 1.2, clearY + 0.1, clearY + 1.0, zOut(0.7), 1.4);
      const passage = Math.min(4, sw - 2);
      if (passage < 1.5) {
        // too narrow for glass: a plain stone portal
        for (const sgn of [-1, 1]) stone(band.centerX + sgn * (sw / 2 - 0.3), 0.6, PLATFORM_HEIGHT, clearY + 0.1, zOut(0.7), 0.8);
        continue;
      }
      const transomY = PLATFORM_HEIGHT + 3.6;
      const gz = zOut(0.4);
      boxes.push({ cx: band.centerX, cy: (transomY + clearY + 0.1) / 2, cz: gz, sx: sw, sy: clearY + 0.1 - transomY, sz: 0.2, color: GLASS_COLOR, material: "glass" });
      const sideW = (sw - passage) / 2 - 0.5;
      for (const sgn of [-1, 1]) {
        if (sideW > 0.4) {
          boxes.push({ cx: band.centerX + sgn * (passage / 2 + 0.5 + sideW / 2), cy: (PLATFORM_HEIGHT + 0.6 + transomY) / 2, cz: gz, sx: sideW, sy: transomY - PLATFORM_HEIGHT - 0.6, sz: 0.2, color: GLASS_COLOR, material: "glass" });
          stone(band.centerX + sgn * (passage / 2 + 0.5 + sideW / 2), sideW, PLATFORM_HEIGHT, PLATFORM_HEIGHT + 0.6, gz, 0.5);
        }
        // the passage's jambs
        stone(band.centerX + sgn * (passage / 2 + 0.25), 0.5, PLATFORM_HEIGHT, transomY + 0.2, zOut(0.5), 0.7);
      }
      boxes.push({ cx: band.centerX, cy: transomY, cz: zOut(0.5), sx: sw, sy: 0.3, sz: 0.35, color: STEEL_DARK, material: "steel" });
      const mullions = Math.max(2, Math.round(sw / 2));
      for (let i = 1; i < mullions; i++) {
        const mx = band.centerX - sw / 2 + (i * sw) / mullions;
        const inPassage = Math.abs(mx - band.centerX) < passage / 2 + 0.5;
        const lo = inPassage ? transomY : PLATFORM_HEIGHT + 0.6;
        boxes.push({ cx: mx, cy: (lo + clearY + 0.1) / 2, cz: zOut(0.53), sx: 0.14, sy: clearY + 0.1 - lo, sz: 0.14, color: STEEL_DARK, material: "steel" });
      }
    }
  }
  return boxes;
}
