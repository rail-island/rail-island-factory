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

// Deck slabs + edge trim + yellow safety lines, from the layout's rows. Every type
// starts from this.
function pushDeck(boxes: StationBox[], length: number, layout: StationLayout, fillBetweenRails: boolean): void {
  const half = layoutWidth(layout) / 2;
  for (const band of deckBands(layout, fillBetweenRails)) {
    const w = band.maxX - band.minX;
    if (w <= 0.1) continue;
    boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT / 2, cz: 0, sx: w, sy: PLATFORM_HEIGHT, sz: length, color: PLATFORM_COLOR, material: "platform" });
    for (const side of [-1, 1]) {
      if (!(side < 0 ? band.edgeLeft : band.edgeRight)) continue;
      boxes.push({ cx: side < 0 ? band.minX + 0.18 : band.maxX - 0.18, cy: PLATFORM_HEIGHT - 0.12, cz: 0, sx: 0.36, sy: 0.3, sz: length, color: EDGE_COLOR, material: "edge" });
    }
    // safety line 0.5 studs back from every edge that faces a track
    if (band.edgeLeft && w > 1.4) {
      boxes.push({ cx: band.minX + 0.5, cy: PLATFORM_HEIGHT + 0.1, cz: 0, sx: 0.3, sy: 0.05, sz: length - 2, color: SAFETY_COLOR, material: "safety" });
    }
    if (band.edgeRight && w > 1.4) {
      boxes.push({ cx: band.maxX - 0.5, cy: PLATFORM_HEIGHT + 0.1, cz: 0, sx: 0.3, sy: 0.05, sz: length - 2, color: SAFETY_COLOR, material: "safety" });
    }
  }
  // cobblestone trim down the two outer edges
  const edgeWidth = 0.5;
  const edgeHeight = PLATFORM_HEIGHT + 0.2;
  for (const sgn of [-1, 1]) {
    boxes.push({ cx: sgn * (half - edgeWidth / 2), cy: edgeHeight / 2, cz: 0, sx: edgeWidth, sy: edgeHeight, sz: length, color: EDGE_COLOR, material: "edge" });
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
  if (!boxes.some((b) => b.label)) pushFallbackNameBoards(boxes, length, layout);
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
function pushFallbackNameBoards(boxes: StationBox[], length: number, layout: StationLayout): void {
  const bands = deckBands(layout, false);
  if (bands.length === 0) return;
  const band = bands[0].maxX - bands[0].minX >= bands[bands.length - 1].maxX - bands[bands.length - 1].minX ? bands[0] : bands[bands.length - 1];
  // sit it toward the edge that does not face a track, clear of a centred pier/post
  const edgeX = band.edgeLeft ? band.maxX - 1 : band.minX + 1;
  const width = Math.min(8, length * 0.12);
  for (const sgn of [-1, 1]) {
    pushNameBoard(boxes, { cx: edgeX, cz: sgn * (length / 2 - 1.5), facing: "x", width });
  }
}

// --- default deck ---------------------------------------------------------
// The fallback renderer: it must cope with ANY layout, including row types this
// build does not know (they are paved as deck) and structures no current type would
// produce. Nothing is built above the deck, so there is nothing to clash.
function buildDefaultDeck(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, true);
  // name signs on posts at both ends of the outermost deck bands. The post stops at
  // the board's underside (a lollipop) so it never crosses the readable face.
  const bands = deckBands(layout, false);
  if (bands.length > 0) {
    const signZ = length / 2 - 1.5;
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

// --- island platforms (free, redesigned) ----------------------------------
// Tracks in pairs; every deck band carries a V-roof draining to its middle, on a
// double row of columns. Wide islands between the pairs are the point of the type.
function buildIslandPlatforms(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, false);
  const slopeRad = (SHARED_ROOF_SLOPE_DEG * Math.PI) / 180;
  const roofZ = length - 4;
  const bays = bayPositions(length, ROOF_COLUMN_SPACING);

  for (const band of deckBands(layout, false)) {
    const halfW = (band.maxX - band.minX) / 2;
    if (halfW < 1.6) continue;
    const edgeY = PLATFORM_HEIGHT + SHARED_ROOF_HEIGHT;
    const drop = halfW * Math.tan(slopeRad);
    const vertexY = edgeY - drop;
    const slabLen = halfW / Math.cos(slopeRad);
    for (const sgn of [-1, 1]) {
      boxes.push({
        cx: band.centerX + (sgn * halfW) / 2,
        cy: (edgeY + vertexY) / 2,
        cz: 0,
        sx: slabLen,
        sy: 0.5,
        sz: roofZ,
        rotZ: sgn * slopeRad,
        color: ROOF_COLOR,
        material: "roof",
        lod: "shell",
      });
      for (const z of bays) {
        boxes.push({
          cx: band.centerX + sgn * (halfW - 0.5),
          cy: PLATFORM_HEIGHT + SHARED_ROOF_HEIGHT / 2,
          cz: z,
          sx: 0.6,
          sy: SHARED_ROOF_HEIGHT,
          lod: "support",
          sz: 0.6,
          color: COLUMN_COLOR,
          material: "column",
        });
      }
    }
    boxes.push({ cx: band.centerX, cy: vertexY + 0.16, cz: 0, sx: 0.45, sy: 0.25, sz: roofZ, color: COLUMN_COLOR, material: "column" });
    for (const z of bays) {
      boxes.push({ cx: band.centerX, cy: vertexY - 0.3, cz: z, sx: halfW * 2 - 0.7, sy: 0.25, sz: 0.3, color: COLUMN_COLOR, material: "column" });
    }
    // name board hung off the roof end at both ends -- just BEYOND the eave (the
    // V-roof dips lowest at the band centre, so a board tucked under it is hidden),
    // benches down the middle
    for (const sgn of [-1, 1]) {
      boxes.push({ cx: band.centerX, cy: edgeY - 1.3, cz: sgn * (roofZ / 2 + 0.45), sx: Math.min(band.maxX - band.minX - 1, 12), sy: 1.8, sz: 0.3, color: SIGN_COLOR, material: "sign", label: true });
    }
    if (halfW > 3) {
      for (const z of bayPositions(length, 24)) {
        pushBench(boxes, layout, band.centerX, z, 1.6);
      }
    }
  }
  return boxes;
}

// --- arched train shed ----------------------------------------------------
// One segmental glass vault per track group, springing from brick piers on the
// platforms either side of the group.
const ARCH_SEGMENTS = 18;
const ARCH_SPRING_HEIGHT = 4.8; // pier top above the deck
const ARCH_RISE_RATIO = 0.92; // crown height as a fraction of the half span

function buildArchShed(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, false);
  const zLen = length - 3;
  const springY = PLATFORM_HEIGHT + ARCH_SPRING_HEIGHT;
  const clearY = PLATFORM_HEIGHT + ROOF_HEIGHT;
  const railBands = rowSpans(layout).filter((s) => s.type === "rail");
  const overTrack = (cx: number, halfW: number) =>
    railBands.some((r) => Math.min(cx + halfW, r.centerX + BALLAST_WIDTH / 2) - Math.max(cx - halfW, r.centerX - BALLAST_WIDTH / 2) > 0.01);

  for (const group of trackGroups(layout)) {
    const left = group.outerLeftX;
    const right = group.outerRightX;
    const span = (right - left) / 2;
    const midX = (left + right) / 2;
    // Rise: the usual proportion, but never so low that the vault dips into a
    // track's clearance. A narrow group (a single track, or a pair with narrow
    // platforms) gets a steeper arch instead of a clipped one.
    const edgeDx = Math.max(
      ...group.rails.map((r) => Math.max(Math.abs(r.centerX - BALLAST_WIDTH / 2 - midX), Math.abs(r.centerX + BALLAST_WIDTH / 2 - midX))),
    );
    // Check the constraint one chord OUTSIDE the ballast edge: the slab whose span
    // reaches the edge has its centre further out, and it is that slab's low
    // corner that would clip a train.
    const chord = (Math.PI * span) / (2 * ARCH_SEGMENTS);
    const k = Math.sqrt(Math.max(0.05, 1 - Math.min(0.99, (edgeDx + chord) / span) ** 2));
    const clearanceRise = (PLATFORM_HEIGHT + ROOF_HEIGHT + 1.0 - springY) / k;
    const rise = Math.max(span * ARCH_RISE_RATIO, clearanceRise);
    const arcPoint = (t: number) => ({ x: span * Math.sin(t), y: rise * Math.cos(t) });
    const arcHeightAt = (dx: number) => {
      const ratio = Math.min(1, Math.abs(dx) / span);
      return springY + rise * Math.sqrt(Math.max(0, 1 - ratio * ratio));
    };

    const pushArc = (cz: number, thickZ: number, thickY: number, radialOffset: number, color: [number, number, number], material: StationBoxMaterial) => {
      for (let i = 0; i < ARCH_SEGMENTS; i++) {
        const t0 = -Math.PI / 2 + (Math.PI * i) / ARCH_SEGMENTS;
        const t1 = -Math.PI / 2 + (Math.PI * (i + 1)) / ARCH_SEGMENTS;
        const a = arcPoint(t0);
        const b = arcPoint(t1);
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const normal = Math.atan2(my / (rise * rise), mx / (span * span));
        boxes.push({
          cx: midX + mx + Math.cos(normal) * radialOffset,
          cy: springY + my + Math.sin(normal) * radialOffset,
          cz,
          sx: material === "glass" ? segLen : segLen * 1.015,
          sy: thickY,
          sz: thickZ,
          rotZ: angle,
          color,
          material,
          lod: material === "glass" ? "shell" : undefined,
        });
      }
    };

    pushArc(0, zLen, 0.28, 0, GLASS_COLOR, "glass");
    const ribs = bayPositions(zLen + 7, 15);
    for (const z of ribs) pushArc(z, 0.7, 0.7, 0.22, STEEL_DARK, "steel");

    for (const t of [-Math.PI / 4, 0, Math.PI / 4]) {
      const p = arcPoint(t);
      boxes.push({ cx: midX + p.x, cy: springY + p.y + 0.25, cz: 0, sx: 0.24, sy: 0.24, sz: zLen, color: STEEL_DARK, material: "steel" });
    }
    // springing beam + brick piers on the platforms either side
    for (const sgn of [-1, 1]) {
      const px = midX + sgn * span;
      boxes.push({ lod: "shell", cx: px, cy: springY + 0.4, cz: 0, sx: 1.6, sy: 1.0, sz: zLen, color: STEEL_DARK, material: "steel" });
      boxes.push({ lod: "shell", cx: px, cy: PLATFORM_HEIGHT + 0.6, cz: 0, sx: 1.1, sy: 1.2, sz: zLen, color: BRICK_COLOR, material: "brick" });
      for (const z of ribs) {
        boxes.push({ lod: "support", cx: px, cy: (PLATFORM_HEIGHT + springY) / 2, cz: z, sx: 1.5, sy: springY - PLATFORM_HEIGHT, sz: 1.8, color: BRICK_COLOR, material: "brick" });
      }
    }

    // glazed gable screen at both ends: it only closes above the clearance line
    // where it crosses a track, so the train openings stay open
    const panelW = (span * 2) / ARCH_SEGMENTS;
    for (const sgn of [-1, 1]) {
      const zEnd = sgn * (zLen / 2 - 0.1);
      for (let i = 0; i < ARCH_SEGMENTS; i++) {
        const dx = -span + (i + 0.5) * panelW;
        const px = midX + dx;
        const top = Math.min(arcHeightAt(dx - panelW / 2), arcHeightAt(dx + panelW / 2)) - 0.3;
        const bottom = overTrack(px, panelW / 2) ? clearY : springY;
        if (top - bottom < 0.6) continue;
        boxes.push({ cx: px, cy: (bottom + top) / 2, cz: zEnd, sx: panelW - 0.08, sy: top - bottom, sz: 0.12, color: GLASS_COLOR, material: "glass" });
      }
      // clock + name board, stacked down from the crown. The board is the wider of
      // the two, so it decides whether the stack has to sit above the clearance.
      const clockH = 2.4;
      const boardH = 1.8;
      const boardW = Math.min(length * 0.2, 13);
      const stackTop = arcHeightAt(Math.max(1.2, boardW / 2)) - 0.6;
      const crossesTrack = overTrack(midX, boardW / 2) || overTrack(midX, clockH / 2);
      const stackBottom = Math.max(crossesTrack ? clearY : springY + rise * 0.5 - clockH / 2, stackTop - clockH - boardH - 0.6);
      if (stackBottom + clockH + boardH + 0.6 <= stackTop) {
        pushClock(boxes, midX, stackBottom + boardH + 0.6 + clockH / 2, zEnd + sgn * 0.35, clockH, sgn);
        boxes.push({ cx: midX, cy: stackBottom + boardH / 2, cz: zEnd + sgn * 0.35, sx: boardW, sy: boardH, sz: 0.35, color: SIGN_COLOR, material: "sign", label: true });
      }
    }

    // pendant lamps down the crown
    const lampH = 0.35;
    const lampBottom = Math.max(overTrack(midX, 0.9) ? clearY : springY + rise - 2.6, springY + rise - 2.6);
    const crownY = arcHeightAt(0) - 0.4;
    if (lampBottom + lampH + 0.3 <= crownY) {
      for (const z of bayPositions(length, 9)) {
        boxes.push({ cx: midX, cy: (lampBottom + lampH + crownY) / 2, cz: z, sx: 0.15, sy: crownY - lampBottom - lampH, sz: 0.15, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx: midX, cy: lampBottom + lampH / 2, cz: z, sx: 1.8, sy: lampH, sz: 1.8, color: LIGHT_COLOR, material: "light" });
      }
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
  pushDeck(boxes, length, layout, false);
  const zLen = length - 4;
  const headY = PLATFORM_HEIGHT + WING_MAST_HEIGHT;
  const clearY = PLATFORM_HEIGHT + ROOF_HEIGHT;
  const bays = bayPositions(length, 12);
  const bands = deckBands(layout, false);

  for (const band of bands) {
    const mastX = band.centerX;
    for (const z of bays) {
      boxes.push({ lod: "support", cx: mastX, cy: (PLATFORM_HEIGHT + headY) / 2, cz: z, sx: 0.85, sy: headY - PLATFORM_HEIGHT, sz: 0.85, color: STEEL_DARK, material: "steel" });
    }
    boxes.push({ lod: "shell", cx: mastX, cy: headY - 0.5, cz: 0, sx: 1.2, sy: 0.9, sz: zLen, color: STEEL_DARK, material: "steel" });
    // LED strip along each platform edge
    for (const sgn of [-1, 1]) {
      const edgeX = sgn < 0 ? band.minX : band.maxX;
      if (!(sgn < 0 ? band.edgeLeft : band.edgeRight)) continue;
      boxes.push({ cx: edgeX - sgn * 0.6, cy: headY - 1.4, cz: 0, sx: 0.5, sy: 0.18, sz: Math.max(4, zLen - 6), color: LIGHT_COLOR, material: "light" });
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
      // name board hung under the wing over the platform edge, at both ends
      const boardX = mastX + dir * 1.4;
      for (const zs of [-1, 1]) {
        boxes.push({
          cx: boardX,
          cy: wingY(boardX) - 2.4,
          cz: zs * Math.max(2, zLen / 2 - 8),
          sx: 0.35,
          sy: 1.8,
          sz: Math.min(10, length * 0.15),
          color: SIGN_COLOR,
          material: "sign",
          label: true,
        });
      }
      // Diagonal tie from the mast out under the wing. It hangs well below the wing
      // plane, so it stops short of the first ballast bed rather than reaching over
      // a track.
      const ballastEdges = group.rails
        .flatMap((r) => [r.centerX - BALLAST_WIDTH / 2, r.centerX + BALLAST_WIDTH / 2])
        .filter((x) => (dir > 0 ? x > mastX : x < mastX));
      const toBallast = ballastEdges.length > 0 ? Math.min(...ballastEdges.map((x) => Math.abs(x - mastX))) - 0.4 : run;
      const tieRun = Math.max(1.0, Math.min(6.4, run * 0.6, toBallast));
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
    for (const z of bayPositions(length, 24)) {
      boxes.push({ cx: outerX, cy: PLATFORM_HEIGHT + 1.7, cz: z, sx: 0.2, sy: 3.4, sz: 7, color: GLASS_COLOR, material: "glass" });
      pushBench(boxes, layout, band.centerX, z, 1.1, 4.5, STEEL_DARK, "steel");
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
  pushDeck(boxes, length, layout, false);
  const zLen = length - 4;
  const half = layoutWidth(layout) / 2;
  const canopyY = PLATFORM_HEIGHT + CONCOURSE_CANOPY_HEIGHT;
  const bands = deckBands(layout, false);

  for (const band of bands) {
    const w = band.maxX - band.minX;
    if (w < 1.6) continue;
    for (const end of [-1, 1]) {
      const canopyZ = end * (zLen + 8.4) / 4;
      const canopyLength = (zLen - 8.4) / 2;
      boxes.push({ lod: "shell", cx: band.centerX, cy: canopyY, cz: canopyZ, sx: w, sy: 0.4, sz: canopyLength, color: STEEL_WHITE, material: "steel" });
      for (const sgn of [-1, 1]) {
        const edgeX = sgn < 0 ? band.minX : band.maxX;
        boxes.push({ lod: "shell", cx: edgeX - sgn * 0.2, cy: canopyY - 0.55, cz: canopyZ, sx: 0.3, sy: 0.8, sz: canopyLength, color: STEEL_DARK, material: "steel" });
        boxes.push({ cx: edgeX - sgn * 1.2, cy: canopyY - 0.75, cz: canopyZ, sx: 0.45, sy: 0.16, sz: Math.max(2, canopyLength - 2), color: LIGHT_COLOR, material: "light" });
      }
    }
    for (const z of bayPositions(length, 12)) {
      if (Math.abs(z) < 4.5) continue;
      boxes.push({ lod: "support", cx: band.centerX, cy: (PLATFORM_HEIGHT + canopyY) / 2, cz: z, sx: 0.6, sy: canopyY - PLATFORM_HEIGHT, sz: 0.6, color: STEEL_DARK, material: "steel" });
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
    boxes.push({ cx: 0, cy: deckY + 2.4, cz: sgn * (bridgeZ / 2 + 0.35), sx: Math.min(15, half), sy: 2, sz: 0.3, color: SIGN_COLOR, material: "sign", label: true });
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
// A station house on the layout's "building" row, with a tiled awning over the
// waiting area next to the track.
const DEPOT_WALL_HEIGHT = 6.5;
const DEPOT_PITCH_DEG = 32;

function buildVillageDepot(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, true);
  const spans = rowSpans(layout);
  const half = layoutWidth(layout) / 2;
  const buildingRow = spans.find((s) => s.type === "building") ?? spans[spans.length - 1];
  const bands = deckBands(layout, false);
  const houseBand = bands.find((b) => b.row.index === buildingRow.index) ?? bands[bands.length - 1];

  // house on the outer part of the building row, awning over the rest
  const houseOuter = houseBand.maxX - 0.3;
  const bandW = houseBand.maxX - houseBand.minX;
  // the house takes the outer part of the band, the waiting area under the awning
  // keeps the part next to the track
  const buildingW = Math.max(3.5, Math.min(7, bandW * 0.6));
  const houseInner = houseOuter - buildingW;
  const bcx = (houseInner + houseOuter) / 2;
  const buildingLen = Math.max(12, Math.min(length * 0.45, 26));
  const eaveY = PLATFORM_HEIGHT + DEPOT_WALL_HEIGHT;
  const pitch = (DEPOT_PITCH_DEG * Math.PI) / 180;

  boxes.push({ lod: "shell", cx: bcx, cy: PLATFORM_HEIGHT + DEPOT_WALL_HEIGHT / 2, cz: 0, sx: buildingW, sy: DEPOT_WALL_HEIGHT, sz: buildingLen, color: BRICK_COLOR, material: "brick" });
  boxes.push({ cx: bcx, cy: PLATFORM_HEIGHT + 0.6, cz: 0, sx: buildingW + 0.7, sy: 1.2, sz: buildingLen + 0.7, color: WOOD_CREAM, material: "platform" });
  const slope = (buildingW / 2 + 1.3) / Math.cos(pitch);
  for (const sgn of [-1, 1]) {
    boxes.push({
      cx: bcx + sgn * (buildingW / 4 + 0.65),
      cy: eaveY + 0.15 + (buildingW / 4 - 0.65) * Math.tan(pitch),
      cz: 0,
      sx: slope,
      sy: 0.5,
      sz: buildingLen + 2.2,
      rotZ: -sgn * pitch,
      color: TILE_COLOR,
      material: "tile",
      lod: "shell",
    });
    const gableRise = buildingW / 2 * Math.tan(pitch);
    boxes.push({ lod: "shell", profile: "gable", cx: bcx, cy: eaveY + 0.15 + gableRise / 2, cz: sgn * (buildingLen / 2 + 0.08), sx: buildingW, sy: gableRise, sz: 0.2, color: WOOD_CREAM, material: "wood" });
  }
  boxes.push({ lod: "shell", cx: bcx + buildingW * 0.28, cy: eaveY + 4.4, cz: -buildingLen / 4, sx: 1.7, sy: 6.0, sz: 1.7, color: BRICK_COLOR, material: "brick" });

  // door and windows facing the platform
  boxes.push({ cx: houseInner - 0.1, cy: PLATFORM_HEIGHT + 1.9, cz: 0, sx: 0.35, sy: 3.8, sz: 2.6, color: WOOD_COLOR, material: "wood" });
  for (const face of [houseInner - 0.22, houseOuter + 0.22]) {
    for (const z of [-buildingLen / 3, buildingLen / 3]) {
      boxes.push({ cx: face, cy: PLATFORM_HEIGHT + 3.6, cz: z, sx: 0.18, sy: 2.8, sz: 3.4, color: WOOD_CREAM, material: "wood" });
      const front = face + (face < bcx ? -0.12 : 0.12);
      boxes.push({ cx: front, cy: PLATFORM_HEIGHT + 3.6, cz: z, sx: 0.08, sy: 2.3, sz: 2.9, color: STEEL_DARK, material: "steel" });
      boxes.push({ cx: front + (face < bcx ? -0.06 : 0.06), cy: PLATFORM_HEIGHT + 3.6, cz: z, sx: 0.06, sy: 2.3, sz: 0.12, color: WOOD_CREAM, material: "wood" });
    }
  }
  boxes.push({ cx: bcx + buildingW * 0.28, cy: eaveY + 7.45, cz: -buildingLen / 4, sx: 2.0, sy: 0.3, sz: 2.0, color: WOOD_CREAM, material: "wood" });
  // name boards on posts at the ends of the outer platform, like the default deck
  const outerBand = bands[0];
  if (outerBand.maxX - outerBand.minX >= 2.5) {
    for (const sgn of [-1, 1]) {
      pushNameBoard(boxes, { cx: outerBand.centerX, cz: sgn * (length / 2 - 1.5), facing: "x", width: Math.min(8, length * 0.12) });
    }
  }

  // awning from the house out over the waiting area
  const awnInner = houseBand.minX + 0.2;
  const awnSlope = 0.16;
  const awnTopY = PLATFORM_HEIGHT + 6.2;
  const awnMid = (houseInner + awnInner) / 2;
  const awnLen = Math.min(length - 4, buildingLen + 16);
  if (houseInner - awnInner > 1) {
    boxes.push({
      cx: awnMid,
      cy: awnTopY + (awnMid - awnInner) * Math.tan(awnSlope),
      cz: 0,
      sx: (houseInner - awnInner) / Math.cos(awnSlope),
      sy: 0.4,
      sz: awnLen,
      rotZ: awnSlope,
      color: TILE_COLOR,
      material: "tile",
      lod: "shell",
    });
    boxes.push({ cx: awnInner + 0.25, cy: awnTopY - 0.6, cz: 0, sx: 0.3, sy: 1.1, sz: awnLen, color: WOOD_CREAM, material: "wood" });
    for (const z of bayPositions(awnLen, 8)) {
      boxes.push({ lod: "support", cx: awnInner + 0.5, cy: (PLATFORM_HEIGHT + awnTopY) / 2, cz: z, sx: 0.65, sy: awnTopY - PLATFORM_HEIGHT, sz: 0.65, color: WOOD_COLOR, material: "wood" });
      boxes.push({ cx: awnInner + 1.6, cy: awnTopY - 1.2, cz: z, sx: 2.4, sy: 0.3, sz: 0.3, rotZ: -0.7, color: WOOD_COLOR, material: "wood" });
      boxes.push({ cx: awnInner + 1.4, cy: awnTopY - 2.4, cz: z, sx: 0.8, sy: 0.9, sz: 0.8, color: LIGHT_COLOR, material: "light" });
    }
  }

  // benches under the awning, lamps and a picket fence along the far platform
  for (const z of [-awnLen / 4, awnLen / 4]) {
    pushBench(boxes, layout, awnInner + 2.6, z);
  }
  const fenceX = -(half - 0.9);
  for (let z = -length / 2 + 1.5; z <= length / 2 - 1.5; z += 2) {
    boxes.push({ cx: fenceX, cy: PLATFORM_HEIGHT + 1.1, cz: z, sx: 0.25, sy: 2.2, sz: 0.55, color: WOOD_CREAM, material: "wood" });
  }
  boxes.push({ cx: fenceX, cy: PLATFORM_HEIGHT + 1.7, cz: 0, sx: 0.2, sy: 0.25, sz: length - 3, color: WOOD_CREAM, material: "wood" });
  for (const z of bayPositions(length, 22)) {
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
  pushDeck(boxes, length, layout, false);
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
// One great glazed vault over the whole station, on stone platform arcades.
// Both ends share the monumental upper facade, clock and roof cross. Transparent
// lower screens occupy only deck bands, leaving the through-track openings clear.
const GRAND_SEGMENTS = 20;
const GRAND_SPRING_HEIGHT = 9.0; // pier top (springing line) above the deck
const GRAND_RISE_RATIO = 0.55; // crown height as a fraction of the half span
const GRAND_RIB_SPACING = 14;
const GRAND_LAMP_SPACING = 26;

function buildGrandTerminus(length: number, layout: StationLayout): StationBox[] {
  const boxes: StationBox[] = [];
  pushDeck(boxes, length, layout, false);
  const zLen = length - 3;
  const springY = PLATFORM_HEIGHT + GRAND_SPRING_HEIGHT;
  const clearY = PLATFORM_HEIGHT + ROOF_HEIGHT;
  const bands = deckBands(layout, false);
  const railBands = rowSpans(layout).filter((s) => s.type === "rail");
  const overTrack = (cx: number, halfW: number) =>
    railBands.some((r) => Math.min(cx + halfW, r.centerX + BALLAST_WIDTH / 2) - Math.max(cx - halfW, r.centerX - BALLAST_WIDTH / 2) > 0.01);

  const half = layoutWidth(layout) / 2;
  const leftX = bands.length > 0 ? bands[0].centerX : -half;
  const rightX = bands.length > 0 ? bands[bands.length - 1].centerX : half;
  const midX = (leftX + rightX) / 2;
  const span = Math.max(2, (rightX - leftX) / 2);

  // Rise: the usual proportion, but never so low that the vault dips into a track's
  // clearance. Measured one chord OUTSIDE the outermost ballast edge, because it is
  // that slab's low corner -- not the arc itself -- that would clip a train.
  const edgeDx = railBands.length
    ? Math.max(...railBands.map((r) => Math.max(Math.abs(r.centerX - BALLAST_WIDTH / 2 - midX), Math.abs(r.centerX + BALLAST_WIDTH / 2 - midX))))
    : 0;
  const chord = (Math.PI * span) / (2 * GRAND_SEGMENTS);
  const k = Math.sqrt(Math.max(0.05, 1 - Math.min(0.99, (edgeDx + chord) / span) ** 2));
  const rise = Math.max(span * GRAND_RISE_RATIO, (clearY + 1.2 - springY) / k);
  const arcPoint = (t: number) => ({ x: span * Math.sin(t), y: rise * Math.cos(t) });
  const arcHeightAt = (dx: number) => {
    const ratio = Math.min(1, Math.abs(dx) / span);
    return springY + rise * Math.sqrt(Math.max(0, 1 - ratio * ratio));
  };

  const pushArc = (cz: number, thickZ: number, thickY: number, radialOffset: number, color: [number, number, number], material: StationBoxMaterial) => {
    for (let i = 0; i < GRAND_SEGMENTS; i++) {
      const t0 = -Math.PI / 2 + (Math.PI * i) / GRAND_SEGMENTS;
      const t1 = -Math.PI / 2 + (Math.PI * (i + 1)) / GRAND_SEGMENTS;
      const a = arcPoint(t0);
      const b = arcPoint(t1);
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const normal = Math.atan2(my / (rise * rise), mx / (span * span));
      boxes.push({
        cx: midX + mx + Math.cos(normal) * radialOffset,
        cy: springY + my + Math.sin(normal) * radialOffset,
        cz,
        sx: material === "glass" ? segLen : segLen * 1.015,
        sy: thickY,
        sz: thickZ,
        rotZ: angle,
        color,
        material,
        lod: material === "glass" || material === "brick" ? "shell" : undefined,
      });
    }
  };

  // Continuous glazing on evenly spaced ribs, including the two ends.
  const ribs = bayPositions(zLen + 7, GRAND_RIB_SPACING);
  pushArc(0, zLen, 0.3, 0, GLASS_COLOR, "glass");
  for (const z of ribs) pushArc(z, 0.8, 0.8, 0.25, STEEL_DARK, "steel");

  for (const t of [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3]) {
    const p = arcPoint(t);
    boxes.push({ cx: midX + p.x, cy: springY + p.y + 0.3, cz: 0, sx: 0.28, sy: 0.28, sz: zLen, color: STEEL_DARK, material: "steel" });
  }
  // stone arcade on each outer platform: a plinth wall, a pilaster under every rib
  // and the cornice the vault springs from
  for (const sgn of [-1, 1]) {
    const px = midX + sgn * span;
    boxes.push({ lod: "shell", cx: px, cy: PLATFORM_HEIGHT + 0.9, cz: 0, sx: 1.6, sy: 1.8, sz: zLen, color: STONE_LIGHT, material: "brick" });
    boxes.push({ lod: "shell", cx: px, cy: springY + 0.5, cz: 0, sx: 2.8, sy: 1.0, sz: zLen, color: STONE_LIGHT, material: "brick" });
    for (const z of ribs) {
      boxes.push({ lod: "support", cx: px, cy: (PLATFORM_HEIGHT + springY) / 2, cz: z, sx: 2.2, sy: springY - PLATFORM_HEIGHT, sz: 2.2, color: STONE_LIGHT, material: "brick" });
    }
  }

  // the islands are the concourse: lamp standards down the middle, benches beside
  for (const band of bands) {
    const w = band.maxX - band.minX;
    if (w < 9) continue; // the outer platforms carry the arcade instead
    for (const z of bayPositions(length, GRAND_LAMP_SPACING)) {
      boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT + 2.6, cz: z, sx: 0.45, sy: 5.2, sz: 0.45, color: STEEL_DARK, material: "column" });
      boxes.push({ cx: band.centerX, cy: PLATFORM_HEIGHT + 5.6, cz: z, sx: 1.2, sy: 1.0, sz: 1.2, color: LIGHT_COLOR, material: "light" });
      for (const sgn of [-1, 1]) {
        pushBench(boxes, layout, band.centerX + sgn * 3.2, z);
      }
    }
  }

  // --- matching facades at both ends ---
  // Both are built panel by panel across the arc. A panel that crosses a track
  // starts at the clearance line instead of the deck, which is what keeps the train
  // openings open: the facade is a screen, never a wall across the rails.
  const panelW = (span * 2) / GRAND_SEGMENTS;
  const panelTops: { dx: number; top: number }[] = [];
  for (let i = 0; i < GRAND_SEGMENTS; i++) {
    const dx = -span + (i + 0.5) * panelW;
    panelTops.push({ dx, top: Math.min(arcHeightAt(dx - panelW / 2), arcHeightAt(dx + panelW / 2)) - 0.2 });
  }

  const crownY = arcHeightAt(0);
  // Scale the upper facade to the space above the loading gauge.
  const avail = Math.max(0.6, crownY - clearY);
  const bandBottom = clearY + 0.05;
  const bandTop = bandBottom + Math.max(0.8, Math.min(2.2, avail * 0.3));
  // the entablature stops where the arch drops below it, so it never juts outside
  // the vault's profile
  const bandRatio = Math.max(0, (bandTop + 0.3 - springY) / rise);
  const bandHalf = bandRatio >= 1 ? span * 0.5 : span * Math.sqrt(Math.max(0.04, 1 - bandRatio ** 2));
  const sillY = bandTop + 0.15;
  const giantHalf = Math.min(span * 0.42, 16);
  const hasWindow = crownY - sillY > 3;

  const stone = (cx: number, sx: number, lo: number, hi: number, cz: number, sz: number, color = STONE_LIGHT) => {
    if (hi - lo < 0.25 || sx <= 0) return;
    boxes.push({ cx, cy: (lo + hi) / 2, cz, sx, sy: hi - lo, sz, color, material: "brick", lod: "shell" });
  };

  for (const endSign of [-1, 1]) {
    const zOut = (offset: number) => endSign * (zLen / 2 + offset);
    // Reuse the former rear's clear lower screen at both ends. The stone
    // imposts sit above the loading gauge and support the upper facade.
    for (const band of bands) {
      const w = Math.max(0.6, band.maxX - band.minX - 0.2);
      stone(band.centerX, w + 1.2, bandBottom + 0.05, bandBottom + 0.95, zOut(0.7), 1.4);
      boxes.push({ cx: band.centerX, cy: (PLATFORM_HEIGHT + bandBottom) / 2, cz: zOut(0.4), sx: w, sy: bandBottom - PLATFORM_HEIGHT, sz: 0.3, color: GLASS_COLOR, material: "glass" });
    }

    for (let i = 0; i < panelTops.length; i++) {
      const { dx, top } = panelTops[i];
      const px = midX + dx;
      const overRail = overTrack(px, panelW / 2);
      // The upper screen starts above the entablature and the track openings.
      const frontBottom = Math.max(bandTop, overRail ? clearY : PLATFORM_HEIGHT);
      if (top - frontBottom > 0.6) {
        const giant = Math.abs(dx) <= giantHalf;
        // One broad fanlight in the middle, framed by solid stone side bays.
        let glassLo = top;
        let glassHi = top;
        if (hasWindow && giant) {
          glassLo = Math.max(frontBottom, sillY);
        }
        if (glassHi - glassLo < 0.8) {
          glassLo = top;
          glassHi = top;
        }
        // Panels meet edge to edge in X; narrow applied mullions frame the glass.
        stone(px, panelW, frontBottom, glassLo, zOut(0.55), 0.9);
        if (glassHi - glassLo >= 0.8) {
          boxes.push({ cx: px, cy: (glassLo + glassHi) / 2, cz: zOut(0.55), lod: "shell", sx: panelW, sy: glassHi - glassLo, sz: 0.12, color: GLASS_COLOR, material: "glass" });
          boxes.push({ cx: px - panelW / 2 + 0.09, cy: (glassLo + glassHi) / 2, cz: zOut(0.66), sx: 0.18, sy: glassHi - glassLo, sz: 0.18, color: STEEL_DARK, material: "steel" });
        }
        stone(px, panelW, glassHi, top, zOut(0.55), 0.9);
      }
    }

    // stone archivolt along the arch, and the entablature that carries the name
    pushArc(zOut(0.85), 0.9, 0.9, 0.5, STONE_LIGHT, "brick");
    stone(midX, bandHalf * 2 + 1.6, bandBottom, bandTop, zOut(0.9), 1.1);

    const boardH = Math.min(1.5, bandTop - bandBottom - 0.35);
    const boardY = (bandBottom + bandTop) / 2;
    boxes.push({ cx: midX, cy: boardY, cz: zOut(1.55), sx: Math.min(bandHalf * 1.5, 22), sy: boardH, sz: 0.35, color: SIGN_COLOR, material: "sign", label: true });

    // Fit a clock above the name band even on the small, solid upper gables.
    const clock = Math.min(6, Math.max(1.1, avail * 0.28), giantHalf * 0.6, Math.max(0.4, (crownY - sillY - 0.16) * 0.8));
    const clockY = sillY + 0.08 + clock / 2;
    if (clockY + clock / 2 + 0.08 <= arcHeightAt(clock / 2)) {
      pushClock(boxes, midX, clockY, zOut(1.35), clock, endSign);
    }

    // Side finials and a clearly shaped cross on the crown at each end.
    const scale = Math.max(0.6, Math.min(2, span / 16));
    const statueAt = (cx: number, baseY: number) => {
      boxes.push({ cx, cy: baseY + 0.5 * scale, cz: zOut(0.85), sx: 2.4 * scale, sy: 1.0 * scale, sz: 2.4 * scale, color: STONE_DARK, material: "brick" });
      boxes.push({ cx, cy: baseY + 2.2 * scale, cz: zOut(0.85), sx: 0.9 * scale, sy: 2.4 * scale, sz: 0.9 * scale, color: STONE_LIGHT, material: "brick" });
    };
    for (const sgn of [-1, 1]) statueAt(midX + sgn * span, springY + 1.0);
    const crossBase = crownY + 0.35;
    boxes.push({ lod: "shell", cx: midX, cy: crossBase + 0.3 * scale, cz: zOut(0.85), sx: 1.8 * scale, sy: 0.6 * scale, sz: 1.4 * scale, color: STONE_DARK, material: "brick" });
    boxes.push({ lod: "shell", cx: midX, cy: crossBase + 1.9 * scale, cz: zOut(0.85), sx: 0.5 * scale, sy: 2.6 * scale, sz: 0.5 * scale, color: STONE_LIGHT, material: "brick" });
    boxes.push({ lod: "shell", cx: midX, cy: crossBase + 2.25 * scale, cz: zOut(0.85), sx: 1.8 * scale, sy: 0.5 * scale, sz: 0.5 * scale, color: STONE_LIGHT, material: "brick" });
  }

  return boxes;
}
