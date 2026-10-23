// The texture library and the named surfaces (docs/models/surfaces.md).
//
// TEXTURES are the photo sets in assets/textures/ (albedo, normal, roughness at
// 512 px, CC0, listed in its SOURCES.md). A SURFACE is a named look built from one:
// which photo, how many world units one repeat spans, and how a material's flat
// colour becomes the tint the photo is multiplied by. The game binds every photo it
// draws through this table - its bridges, roads, rail beds, stops, airports, dams,
// tunnel portals, galleries and house plinths - and a factory design may name a
// surface on a material (`surfaceMaterial`), opt-in: the export then generates the
// UVs (threeBuilder.ts toGroup) and the game binds the photo after it builds the
// model. The material keeps its honest flat colour, so thumbnails, the far LOD band,
// the GLB and every untextured path still read right.
//
// The tint rule, as the game applies it: tint = colour lifted toward white by
// `tintLift`, times `gain` (a tint can only darken a photo, so a near-black colour
// over a mid-grey photo needs the lift). `tint` replaces that with a fixed linear
// multiplier. `fill` is an albedo-coloured self-light that keeps detail in deep
// shadow. `flat` is the sRGB colour the surface reads as without its photo.
//
// No node: imports: the site and the model bundles may import from here.

/** Every photo set: its key -> Poly Haven slug (assets/textures/SOURCES.md). */
export const TEXTURE_SLUGS = {
  asphalt: "aerial_asphalt_01",
  bigstone: "rocks_ground_06",
  cobblestone: "cobblestone_floor_04",
  concrete: "concrete_floor_worn_001",
  grass: "aerial_grass_rock",
  gravel: "gravel_embedded_concrete",
  ground: "aerial_ground_rock",
  mud: "aerial_mud_1",
  pavement: "floor_tiles_02",
  rock: "rock_ground",
  sand: "coast_sand_01",
  slate: "dark_rock",
  snow: "snow_field_aerial",
  wall: "red_brick_03",
  wood: "weathered_planks",
} as const;

export type TextureName = keyof typeof TEXTURE_SLUGS;
export const TEXTURE_NAMES = Object.keys(TEXTURE_SLUGS).sort() as TextureName[];
/** The three maps of every set, `<name>_<channel>.jpg`. */
export const TEXTURE_CHANNELS = ["albedo", "normal", "rough"] as const;
/** Every map is this many pixels square: the game has no texture quality tier. */
export const TEXTURE_SIZE = 512;
/**
 * The most photo sets the library may hold (test/surfaces.test.ts): every set is
 * about 4 MiB on the GPU with mips and there is no texture compression, so a new
 * look reuses a photo where it can.
 */
export const MAX_TEXTURES = 16;
/**
 * The mean albedo of each photo, sRGB hex: what a surface's honest flat colour is
 * held near (test/surfaces.test.ts measures the files against it).
 */
export const TEXTURE_AVERAGE: Readonly<Record<TextureName, string>> = {
  asphalt: "#676268",
  bigstone: "#928373",
  cobblestone: "#8a7d62",
  concrete: "#565754",
  grass: "#726125",
  gravel: "#958e84",
  ground: "#80695a",
  mud: "#3e3835",
  pavement: "#9f907f",
  rock: "#726960",
  sand: "#82735c",
  slate: "#211c18",
  snow: "#878694",
  wall: "#6b534c",
  wood: "#50433b",
};

export interface SurfacePreset {
  texture: TextureName;
  /** World units (studs, or a model's own units) one repeat of the photo spans. */
  tile: number;
  /** How far the material's colour is lifted toward white before it multiplies the photo, 0..1. */
  tintLift: number;
  /** Linear multiplier on the lifted tint (default 1). */
  gain?: number;
  /** A fixed linear tint multiplier instead of the lifted colour (an airport's pavement). */
  tint?: readonly [number, number, number];
  /** Emissive self-fill of the albedo, keeping detail in shadow (default none). */
  fill?: number;
  /** Strength of the normal map (default 1). */
  normalScale?: number;
  /** sRGB hex the surface reads as without its photo (the far band, a headless build). */
  flat?: string;
}

/** Every named surface. Keys are stable: the game names them, and designs store them. */
export const SURFACES = {
  // bridges (the game's render/BridgeMesh.ts)
  "bridge-timber": { texture: "wood", tile: 5, tintLift: 0.92, fill: 0.15 },
  "bridge-deck": { texture: "concrete", tile: 5, tintLift: 0.92, gain: 1.65, fill: 0.22 },
  "bridge-parapet": { texture: "concrete", tile: 5, tintLift: 0.92, gain: 1.65, fill: 0.2 },
  "bridge-pier": { texture: "concrete", tile: 5, tintLift: 0.92, gain: 1.65, fill: 0.12 },
  "bridge-tower": { texture: "concrete", tile: 5, tintLift: 0.92, gain: 1.65, fill: 0.16 },
  "bridge-stone": { texture: "cobblestone", tile: 6, tintLift: 0.92, fill: 0.45, flat: "#9b8c70" },
  "bridge-brick": { texture: "wall", tile: 6, tintLift: 0, fill: 0.55, flat: "#995848" },
  // roads, and the road surfaces of stops and road stations (RoadMesh, BusStopMesh)
  "road-asphalt": { texture: "asphalt", tile: 10, tintLift: 0.6 },
  "road-cobblestone": { texture: "cobblestone", tile: 4, tintLift: 0.6 },
  "road-pavement": { texture: "pavement", tile: 4, tintLift: 0.6 },
  "road-gravel": { texture: "gravel", tile: 6, tintLift: 0.6 },
  // a stop's or road station's dressing boxes (BusStopMesh)
  "stop-wood": { texture: "wood", tile: 5, tintLift: 0.85 },
  "stop-concrete": { texture: "concrete", tile: 5, tintLift: 0.85 },
  "stop-wall": { texture: "wall", tile: 5, tintLift: 0.85 },
  // track (RailMesh, TramMesh): the ballast and footing colours are already pale
  // shades of their photos; a sleeper's stored colour is lifted half way
  "rail-ballast": { texture: "gravel", tile: 2, tintLift: 0 },
  "rail-tie-wood": { texture: "wood", tile: 4, tintLift: 0.5 },
  "rail-tie-concrete": { texture: "concrete", tile: 4, tintLift: 0.5 },
  "rail-footing": { texture: "concrete", tile: 1.5, tintLift: 0 },
  "tram-tie": { texture: "wood", tile: 4, tintLift: 0.5 },
  // airports, by type (AirportMesh): a fixed tint, and a softer normal map
  "airport-grass": { texture: "grass", tile: 12, tintLift: 0, tint: [0.9, 1.35, 1.5], normalScale: 0.3 },
  "airport-asphalt": { texture: "asphalt", tile: 16, tintLift: 0, tint: [0.87, 1.04, 0.94], normalScale: 0.45 },
  "airport-concrete": { texture: "concrete", tile: 36, tintLift: 0, tint: [3.2, 3.15, 3.05], normalScale: 0.45 },
  // dams (DamMesh)
  "dam-concrete": { texture: "concrete", tile: 6, tintLift: 0.92, gain: 1.4, normalScale: 0.45, flat: "#636462" },
  "dam-stone": { texture: "cobblestone", tile: 6, tintLift: 0.92, gain: 1.4, normalScale: 0.45, flat: "#8a8068" },
  // tunnel portals (TunnelMesh), the alpine gallery (LineDecorationLayer), house plinths (HouseMesh)
  "tunnel-portal": { texture: "cobblestone", tile: 6, tintLift: 0.85, fill: 0.3, flat: "#9b8c70" },
  "gallery-concrete": { texture: "concrete", tile: 6, tintLift: 0.92, gain: 1.65 },
  "house-plinth": { texture: "cobblestone", tile: 8, tintLift: 0, flat: "#87827c" },
  // for factory designs, in metres (a building's own units)
  "model-brick": { texture: "wall", tile: 2, tintLift: 0.85, fill: 0.2 },
  "model-stone": { texture: "cobblestone", tile: 2.5, tintLift: 0.85, fill: 0.2 },
  "model-concrete": { texture: "concrete", tile: 3, tintLift: 0.92, gain: 1.4, fill: 0.15 },
  "model-timber": { texture: "wood", tile: 2, tintLift: 0.85, fill: 0.15 },
  // the site's texture pages (proc-preview-texture-*): each photo as it is, untinted;
  // nothing in the game binds these
  "swatch-asphalt": { texture: "asphalt", tile: 4, tintLift: 1 },
  "swatch-bigstone": { texture: "bigstone", tile: 4, tintLift: 1 },
  "swatch-cobblestone": { texture: "cobblestone", tile: 4, tintLift: 1 },
  "swatch-concrete": { texture: "concrete", tile: 4, tintLift: 1 },
  "swatch-grass": { texture: "grass", tile: 4, tintLift: 1 },
  "swatch-gravel": { texture: "gravel", tile: 4, tintLift: 1 },
  "swatch-ground": { texture: "ground", tile: 4, tintLift: 1 },
  "swatch-mud": { texture: "mud", tile: 4, tintLift: 1 },
  "swatch-pavement": { texture: "pavement", tile: 4, tintLift: 1 },
  "swatch-rock": { texture: "rock", tile: 4, tintLift: 1 },
  "swatch-sand": { texture: "sand", tile: 4, tintLift: 1 },
  "swatch-slate": { texture: "slate", tile: 4, tintLift: 1 },
  "swatch-snow": { texture: "snow", tile: 4, tintLift: 1 },
  "swatch-wall": { texture: "wall", tile: 4, tintLift: 1 },
  "swatch-wood": { texture: "wood", tile: 4, tintLift: 1 },
} as const satisfies Record<string, SurfacePreset>;

export type SurfaceId = keyof typeof SURFACES;
export const SURFACE_IDS = Object.keys(SURFACES).sort() as SurfaceId[];

/**
 * A material that draws with surface `id`: pass its result to `MeshCore.material`.
 * `color` stays the material's honest flat colour (default: the photo's average),
 * and the tile travels with the material so the module needs no table.
 */
export function surfaceMaterial(id: SurfaceId, opts: { color?: string; roughness?: number; metallic?: number } = {}): {
  color: string; roughness: number; metallic: number; surface: SurfaceId; surfaceTile: number;
} {
  const preset: SurfacePreset = SURFACES[id];
  return {
    color: opts.color ?? preset.flat ?? TEXTURE_AVERAGE[preset.texture],
    roughness: opts.roughness ?? 1,
    metallic: opts.metallic ?? 0,
    surface: id,
    surfaceTile: preset.tile,
  };
}
