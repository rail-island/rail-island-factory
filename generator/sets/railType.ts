// The rail types (docs/models/sets.md): what a railway is built of. Every type shares
// one cross-section -- the rails and their gauge, the sleepers' size and spacing, the
// ballast bed, the track spacing a second line keeps, the simplified track the game
// draws at mid distance -- and differs in its sleeper colour and material (and so its
// mid-distance sleeper band) and in whether it is wired, naming the catenary style its
// masts are (the catenaryStyle set). The game reads this through the set's meta; its
// track generation, junctions and catenary planner stay its own.
//
// Pure data, no imports: bundled into export/sets/railType.js.

/**
 * The rail's cross-section (studs): rail centre to rail centre, and the flat-bottom
 * profile -- a head, a web and a foot, stacked from the foot up to the running
 * surface, `height` in all.
 */
export interface RailSection {
  gauge: number;
  height: number;
  headWidth: number;
  headHeight: number;
  webWidth: number;
  footWidth: number;
  footHeight: number;
}

/** A rail type's sleepers: colour and material, size (studs) and spacing along the track. */
export interface SleeperData {
  color: [number, number, number];
  material: "wood" | "concrete";
  /** Across the track. */
  length: number;
  /** Along the track. */
  width: number;
  height: number;
  /** Centre to centre along the track. */
  spacing: number;
}

/**
 * The track's simplified form, which the game draws between full detail and its
 * far bed (its mid level of detail): no sleepers and one plain box per rail.
 */
export interface FarTrackData {
  /**
   * The simplified rail: one box per rail, centred on the rail centre (`rail.gauge`
   * apart), its top at the running surface, `height` tall and `width` across.
   */
  rail: { width: number; height: number };
  /** A street tram's grooved rail, simplified: one flush strip per rail, `width` across. */
  streetRailWidth: number;
  /**
   * What the bed paints where the sleepers were: the colour the sleeper photo reads
   * as (sRGB bytes), the band's width across the track, and how much of it the
   * sleepers cover (their width over their spacing).
   */
  sleeperBand: { color: [number, number, number]; width: number; cover: number };
}

/** One rail type: its rails, its sleepers, its cross-section (studs) and its overhead line. */
export interface RailTypeData {
  rail: RailSection;
  sleeper: SleeperData;
  /** The simplified track the game draws at mid distance. */
  far: FarTrackData;
  /** The ballast bed's width and height; half the width is the ground the bed lays on. */
  ballast: { width: number; height: number };
  /** Centreline to centreline of two parallel tracks. */
  trackSpacing: number;
  /** The catenary style its masts are, or null for an unwired line. */
  catenary: string | null;
}

// The game draws vehicles at 1.5 studs a metre, so the track is that real track
// scaled: standard gauge (1,435 mm between the rail heads' inner faces) with a
// UIC 60-like rail (72 mm head, 150 mm foot, 172 mm tall), the web thickened to
// stay visible. Every rail vehicle's wheel tread runs 0.665-0.80 m off its centre
// line, so the 1,507 mm between rail centres puts each head under its tread
// (test/railSupports.test.ts pins the two together).
const STUDS_PER_M = 1.5;
const r3 = (x: number): number => Math.round(x * 1000) / 1000;
const RAIL: RailSection = {
  gauge: r3((1.435 + 0.072) * STUDS_PER_M),
  height: r3(0.172 * STUDS_PER_M),
  headWidth: r3(0.072 * STUDS_PER_M),
  headHeight: r3(0.05 * STUDS_PER_M),
  webWidth: r3(0.03 * STUDS_PER_M),
  footWidth: r3(0.15 * STUDS_PER_M),
  footHeight: r3(0.02 * STUDS_PER_M),
};
// mainline sleepers: 2.6 m long, 0.26 m wide, about 0.23 m deep, 0.6 m apart
const SLEEPER = { length: r3(2.6 * STUDS_PER_M), width: r3(0.26 * STUDS_PER_M), height: 0.35, spacing: r3(0.6 * STUDS_PER_M) };
const BED = { width: 5.0, height: (0.8 * 2) / 3 };
const SPACING = 8;

// The simplified track. The rail box is a little wider than the head (90 mm against
// 72 mm) so it keeps a pixel at the distances it is drawn at, and full rail height so
// the running surface does not move. A street rail is the head, the groove and the
// lip read as one dark strip. The band spans a sleeper's length; its colour is what
// the game's sleeper photo averages to under its tint (the timber and concrete
// photos' mean albedo, the tie colour lifted half way to white, the per-sleeper
// shading), so a tile that drops its sleepers keeps their tone.
const FAR_RAIL = { width: r3(0.09 * STUDS_PER_M), height: RAIL.height };
const STREET_RAIL_WIDTH = r3(0.12 * STUDS_PER_M);
const bandOf = (color: [number, number, number]) => ({ color, width: SLEEPER.length, cover: r3(SLEEPER.width / SLEEPER.spacing) });
const WOOD_FAR: FarTrackData = { rail: FAR_RAIL, streetRailWidth: STREET_RAIL_WIDTH, sleeperBand: bandOf([64, 51, 41]) };
const CONCRETE_FAR: FarTrackData = { rail: FAR_RAIL, streetRailWidth: STREET_RAIL_WIDTH, sleeperBand: bandOf([78, 78, 75]) };

export const TYPE_META: Record<string, RailTypeData> = {
  wooden_sleepers: { rail: RAIL, sleeper: { color: [101, 67, 33], material: "wood", ...SLEEPER }, far: WOOD_FAR, ballast: BED, trackSpacing: SPACING, catenary: null },
  concrete_sleepers: { rail: RAIL, sleeper: { color: [180, 180, 170], material: "concrete", ...SLEEPER }, far: CONCRETE_FAR, ballast: BED, trackSpacing: SPACING, catenary: null },
  concrete_sleepers_wire: { rail: RAIL, sleeper: { color: [180, 180, 170], material: "concrete", ...SLEEPER }, far: CONCRETE_FAR, ballast: BED, trackSpacing: SPACING, catenary: "rail_mast" },
};
