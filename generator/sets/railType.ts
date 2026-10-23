// The rail types (docs/models/sets.md): what a railway is built of. Every type shares
// one cross-section -- the ballast bed, the track spacing a second line keeps -- and
// differs in its sleepers and in whether it is wired, naming the catenary style its
// masts are (the catenaryStyle set). The game reads this through the set's meta; its
// track generation, junctions and catenary planner stay its own.
//
// Pure data, no imports: bundled into export/sets/railType.js.

/** One rail type: its sleepers, its cross-section (studs) and its overhead line. */
export interface RailTypeData {
  sleeper: { color: [number, number, number]; material: "wood" | "concrete" };
  /** The ballast bed's width and height; half the width is the ground the bed lays on. */
  ballast: { width: number; height: number };
  /** Centreline to centreline of two parallel tracks. */
  trackSpacing: number;
  /** The catenary style its masts are, or null for an unwired line. */
  catenary: string | null;
}

const BED = { width: 5.0, height: (0.8 * 2) / 3 };
const SPACING = 8;

export const TYPE_META: Record<string, RailTypeData> = {
  wooden_sleepers: { sleeper: { color: [101, 67, 33], material: "wood" }, ballast: BED, trackSpacing: SPACING, catenary: null },
  concrete_sleepers: { sleeper: { color: [180, 180, 170], material: "concrete" }, ballast: BED, trackSpacing: SPACING, catenary: null },
  concrete_sleepers_wire: { sleeper: { color: [180, 180, 170], material: "concrete" }, ballast: BED, trackSpacing: SPACING, catenary: "rail_mast" },
};
