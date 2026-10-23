// The road types (docs/models/sets.md): a road's full cross-section -- its deck width,
// the shoulder strip either side, the carriageway's surface, the centre line a
// two-lane road is marked with, the tram tracks embedded in it and their offsets,
// the terrain bands it flattens and stands on, and the tightest curve it may turn.
// A type is a width (narrow or wide, the registry's road families pair them) and a
// surface. The game reads this through the set's meta; its routing, junctions, tile
// batching and terrain flattening stay its own.
//
// Pure data, no imports: bundled into export/sets/roadType.js.

type Rgb = [number, number, number];

/** One road type's cross-section, in studs. */
export interface RoadTypeData {
  /** Deck width, edge to edge, shoulders included. */
  width: number;
  wide: boolean;
  /** The shoulder strip either side of the carriageway, and what it is paved with. */
  shoulder: { width: number; texture: string; color: Rgb };
  /** The carriageway's surface (a tram-only track: its ballast bed). */
  surface: { texture: string; color: Rgb };
  /** The dashed centre line, or null where there is none. */
  centerLine: { width: number; dash: number; gap: number; color: Rgb } | null;
  /** Tram track centrelines, signed right of the way's direction; [] without rails. */
  tramTracks: number[];
  /** No drivable surface: a tram-only corridor buses never route over. */
  trackOnly: boolean;
  /** Half-widths of the terrain corridor the road flattens and of the band it stands on. */
  corridorHalf: number;
  requiredHalf: number;
  /** Tightest arc radius it may be built with. */
  minArcRadius: number;
}

const NARROW = 8;
const WIDE = 16;
const SHOULDER = 1.4;
const KERB: Rgb = [155, 155, 150];
const ASPHALT = { texture: "asphalt", color: [60, 60, 64] as Rgb };
const PAVED = { texture: "cobblestone", color: [120, 116, 108] as Rgb };
const GRAVEL = { texture: "gravel", color: [168, 164, 156] as Rgb };
const CENTER_LINE = { width: 0.5, dash: 4, gap: 4, color: [235, 235, 225] as Rgb };
/** A double tram line's tracks: the wide road's lane centres. */
const TRAM_OFFSET = WIDE / 4;
// the terrain bands: the deck's half-width plus the aprons every way type leaves
const CORRIDOR_APRON = 4;
const REQUIRED_APRON = 2;

function road(wide: boolean, surface: { texture: string; color: Rgb }, opts: { tram?: boolean; trackOnly?: boolean } = {}): RoadTypeData {
  const width = wide ? WIDE : NARROW;
  return {
    width,
    wide,
    shoulder: { width: SHOULDER, ...(opts.trackOnly ? surface : { texture: "pavement", color: KERB }) },
    surface,
    centerLine: wide && !opts.tram ? CENTER_LINE : null,
    tramTracks: opts.tram ? (wide ? [-TRAM_OFFSET, TRAM_OFFSET] : [0]) : [],
    trackOnly: opts.trackOnly === true,
    corridorHalf: width / 2 + CORRIDOR_APRON,
    requiredHalf: width / 2 + REQUIRED_APRON,
    minArcRadius: wide ? 10 : 5,
  };
}

export const TYPE_META: Record<string, RoadTypeData> = {
  narrow_asphalt: road(false, ASPHALT),
  narrow_paved: road(false, PAVED),
  wide_asphalt: road(true, ASPHALT),
  wide_paved: road(true, PAVED),
  narrow_asphalt_tram: road(false, ASPHALT, { tram: true }),
  wide_asphalt_tram: road(true, ASPHALT, { tram: true }),
  narrow_paved_tram: road(false, PAVED, { tram: true }),
  wide_paved_tram: road(true, PAVED, { tram: true }),
  tram_single: road(false, GRAVEL, { tram: true, trackOnly: true }),
  tram_double: road(true, GRAVEL, { tram: true, trackOnly: true }),
};
