// The set registry (docs/models/sets.md): every content set the factory owns
// besides the models -- the game's structure types, rail and road types, block
// types, catenary styles -- with its frozen ids, picker order, retired aliases
// and English names. The game derives its pickers, collection lists, gating
// lists, tool-pref validation and type unions from what this exports
// (sets.meta.json files, setsExport.ts), and stores these ids in saved maps, D1
// collection keys and simulations: NEVER rename a shipped id; retire it with an
// alias instead.
//
// English names and descriptions live here and are the source of the exported
// text (text.ts); the other 13 languages are in text/<code>.json.
//
// No node: imports: the site may import types from here.

/** The collection kinds of the game (its Rewards.ts StructureKind). */
export type StructureKind = "station" | "bridge" | "busStop" | "roadStation" | "cableCarStation" | "airport" | "port" | "dam";

export type SetName =
  | "blockType" | "busStop" | "cableCarStation" | "port" | "airport" | "decoration" | "tunnelPortal"
  | "railType" | "roadType" | "dam" | "station" | "roadStation" | "bridge" | "catenaryStyle";

/** One type of a set: the id saved maps store, its English name and description. */
export interface SetType {
  id: string;
  label: string;
  description?: string;
}

/** A named group of types the game's picker shows together (road families). */
export interface SetGroup {
  id: string;
  label: string;
  description?: string;
  types: string[];
}

export interface SetDef {
  set: SetName;
  /** The game's collection kind when a type of this set is a collectible reward. */
  collectible?: StructureKind;
  /** The spec phase that moves the set's definitions into the factory (docs/specs/2026-10-23-...). */
  phase: number;
  /**
   * Whether the set's definitions live in the factory yet. Until they do, the
   * game's own code draws the types, so the ids are frozen to the game's list
   * (test/sets.test.ts refuses a new one).
   */
  landed: boolean;
  /** What an unknown stored id draws as, after the retired aliases. */
  defaultId: string;
  /** Old id -> the shipped id it now draws as. */
  retired: Record<string, string>;
  /** In picker order. */
  types: SetType[];
  groups?: SetGroup[];
}

export const SETS: readonly SetDef[] = [
  {
    set: "blockType",
    phase: 2,
    landed: true,
    defaultId: "comm_small",
    retired: {},
    types: [
      { id: "village", label: "Village houses" },
      { id: "village_red", label: "Red village houses" },
      { id: "comm_classic", label: "Classic shops" },
      { id: "comm_large", label: "Large commercial" },
      { id: "comm_small", label: "Small shops" },
      { id: "comm_low", label: "Low commercial" },
      { id: "comm_oldtown", label: "Old town" },
      { id: "comm_street", label: "Main street" },
      { id: "comm_tenement", label: "Tenements" },
      { id: "skyscraper_a", label: "Skyscrapers" },
      { id: "skyscraper_b", label: "Glass towers" },
      { id: "industry", label: "Industry" },
      { id: "tower", label: "Tower block" },
      { id: "historical", label: "Historical building" },
      { id: "landmark", label: "Landmark" },
    ],
  },
  {
    set: "busStop",
    collectible: "busStop",
    phase: 3,
    landed: true,
    defaultId: "shelter",
    retired: {},
    types: [
      { id: "shelter", label: "Glass shelter",
        description: "A compact glass shelter with a bench, timetable and boarding strip." },
      { id: "canopy", label: "Covered stop",
        description: "A spacious canopy with timber seating and a departure display." },
      { id: "cargo", label: "Cargo loading stop",
        description: "A covered loading platform with crates and safety markings, made for trucks and cargo." },
    ],
  },
  {
    set: "cableCarStation",
    collectible: "cableCarStation",
    phase: 3,
    landed: true,
    defaultId: "open_gantry",
    retired: {},
    types: [
      { id: "open_gantry", label: "Open gantry" },
      { id: "alpine_chalet", label: "Alpine chalet" },
      { id: "glass_modern", label: "Glass modern" },
      { id: "concrete_drive", label: "Concrete drive-house" },
    ],
  },
  {
    set: "port",
    collectible: "port",
    phase: 3,
    landed: true,
    defaultId: "wooden_jetty",
    retired: {},
    types: [
      { id: "wooden_jetty", label: "Wooden jetty",
        description: "Timber piers on driven piles, with lamps along the quay. The plain harbour." },
      { id: "concrete_quay", label: "Concrete quay",
        description: "Broad concrete molos with mooring bollards and a gantry crane over the quay." },
      { id: "passenger_terminal", label: "Passenger terminal",
        description: "A concrete harbour with a glazed terminal hall behind the quay and a canopy over the gangways." },
      { id: "river_jetty", label: "River jetty",
        description: "A timber wharf lying along the bank. Ships tie up alongside and carry on the way they came." },
      { id: "river_quay", label: "River quay",
        description: "A concrete wharf along the bank with bollards and a crane. Longer quays berth more ships end to end." },
      { id: "river_terminal", label: "River terminal",
        description: "A wharf along the bank with a glazed hall behind it, for river packets calling in town." },
    ],
  },
  {
    set: "airport",
    collectible: "airport",
    phase: 3,
    landed: true,
    defaultId: "regional",
    retired: {},
    types: [
      { id: "grass_field", label: "Grass airfield",
        description: "A mown strip with a timber clubhouse and an open hangar. No paint, no lights." },
      { id: "regional", label: "Regional airport",
        description: "Asphalt runways with centreline paint and edge lights, a terminal hall and a control tower." },
      { id: "international", label: "International hub",
        description: "Concrete runways, a tall control tower and jet bridges at every stand." },
    ],
  },
  {
    set: "decoration",
    phase: 4,
    landed: true,
    defaultId: "fence",
    retired: {},
    types: [
      { id: "trees", label: "Tree alley" },
      { id: "wall", label: "Anti-sound wall" },
      { id: "fence", label: "Fence" },
      { id: "guardrail", label: "Guardrail" },
      { id: "gallery", label: "Alpine gallery" },
    ],
  },
  {
    set: "tunnelPortal",
    phase: 4,
    landed: true,
    defaultId: "stone",
    retired: {},
    types: [
      { id: "stone", label: "Stone Tunnel",
        description: "Masonry portals and a segmented oval stone lining bored through a hill." },
    ],
  },
  {
    set: "railType",
    phase: 4,
    landed: true,
    defaultId: "wooden_sleepers",
    retired: {},
    types: [
      { id: "wooden_sleepers", label: "Wooden sleepers",
        description: "Classic rails with wooden sleepers." },
      { id: "concrete_sleepers", label: "Concrete sleepers",
        description: "Modern rails with light concrete sleepers." },
      { id: "concrete_sleepers_wire", label: "Electric",
        description: "Concrete sleepers with overhead electric wires on long segments." },
    ],
  },
  {
    set: "roadType",
    phase: 4,
    landed: true,
    defaultId: "narrow_asphalt",
    retired: {},
    types: [
      { id: "narrow_asphalt", label: "Narrow asphalt",
        description: "Single-lane asphalt road." },
      { id: "narrow_paved", label: "Narrow paved",
        description: "Single-lane cobblestone road." },
      { id: "wide_asphalt", label: "Wide asphalt",
        description: "Two-lane asphalt road with center line." },
      { id: "wide_paved", label: "Wide paved",
        description: "Two-lane cobblestone road with center line." },
      { id: "narrow_asphalt_tram", label: "Narrow asphalt with tram",
        description: "Single-lane asphalt road with one embedded tram track." },
      { id: "wide_asphalt_tram", label: "Wide asphalt with tram",
        description: "Two-lane asphalt road with two embedded tram tracks." },
      { id: "narrow_paved_tram", label: "Narrow paved with tram",
        description: "Single-lane cobblestone road with one embedded tram track." },
      { id: "wide_paved_tram", label: "Wide paved with tram",
        description: "Two-lane cobblestone road with two embedded tram tracks." },
      { id: "tram_single", label: "Tram track",
        description: "Single tram track on ballast with wooden sleepers." },
      { id: "tram_double", label: "Double tram track",
        description: "Two tram tracks on ballast with wooden sleepers." },
    ],
    groups: [
      { id: "asphalt", label: "Asphalt", description: "Plain asphalt road.", types: ["narrow_asphalt","wide_asphalt"] },
      { id: "paved", label: "Paved", description: "Cobblestone road.", types: ["narrow_paved","wide_paved"] },
      { id: "asphalt_tram", label: "Asphalt with tram", description: "Asphalt road with embedded tram track(s).", types: ["narrow_asphalt_tram","wide_asphalt_tram"] },
      { id: "paved_tram", label: "Paved with tram", description: "Cobblestone road with embedded tram track(s).", types: ["narrow_paved_tram","wide_paved_tram"] },
      { id: "tram", label: "Tram track only", description: "Tram track on ballast, with no road surface.", types: ["tram_single","tram_double"] },
    ],
  },
  {
    set: "dam",
    collectible: "dam",
    phase: 4,
    landed: true,
    defaultId: "concrete",
    retired: {"arch":"concrete"},
    types: [
      { id: "concrete", label: "Concrete dam",
        description: "A hydroelectric dam with a service bridge; water passes through an unseen power plant" },
      { id: "concrete-lock", label: "Concrete dam with lock",
        description: "A concrete dam with a closed lock chamber for the two smaller ferries" },
      { id: "weir", label: "Weir",
        description: "A waterfall over the downstream river channel, with simple concrete walls on either side" },
      { id: "weir-lock", label: "Weir with lock",
        description: "A weir with a closed lock chamber for the two smaller ferries" },
      { id: "stone", label: "Stone dam with towers",
        description: "A masonry overflow dam whose arcaded roadway carries turreted towers over the falling water" },
    ],
  },
  {
    set: "station",
    collectible: "station",
    phase: 5,
    landed: true,
    defaultId: "platforms_only",
    retired: {"platforms_with_roof":"platforms_only"},
    types: [
      { id: "platforms_only", label: "Platforms only",
        description: "Bare concrete platforms with edge trim and safety lines, tracks side by side." },
      { id: "platforms_shared", label: "Island platforms",
        description: "Tracks in pairs with a wide roofed island between them, platforms only around each pair." },
      { id: "arch_shed", label: "Arched train shed",
        description: "Glass barrel vault on steel ribs and brick piers, one vault over every pair of tracks." },
      { id: "cantilever_wings", label: "Cantilever wings",
        description: "Steel masts on every platform carrying white wings over the pairs, with a glazed daylight slot." },
      { id: "concourse", label: "Overhead concourse",
        description: "Glazed footbridge across every track, stair towers on the outer platforms and low canopies." },
      { id: "village_depot", label: "Village depot",
        description: "Brick station house behind a wide tiled awning, with lamps, benches and a picket fence." },
      { id: "heritage_canopy", label: "Heritage umbrella canopy",
        description: "Gabled timber canopy per platform on cast-iron posts, with a scalloped valance and hanging lamps." },
      { id: "grand_terminus", label: "Grand terminus",
        description: "One glazed vault over every track on stone piers, with monumental clock facades at both ends." },
    ],
  },
  {
    set: "roadStation",
    collectible: "roadStation",
    phase: 5,
    landed: true,
    defaultId: "open_bays",
    retired: {},
    types: [
      { id: "open_bays", label: "Open bays",
        description: "Concrete islands between the stands with numbered bays and simple post shelters." },
      { id: "sawtooth_canopy", label: "Sawtooth canopy",
        description: "A folded steel canopy over every island, with benches and departure boards." },
      { id: "terminal_hall", label: "Terminal hall",
        description: "One high glazed roof over every stand, with a clock tower at the entrance." },
      { id: "gravel_yard", label: "Truck yard",
        description: "A plain paved yard with floodlight masts and a site office portacabin." },
      { id: "loading_docks", label: "Loading docks",
        description: "Raised docks along every stand with roll-up doors in a warehouse wall." },
      { id: "logistics_hub", label: "Logistics hub",
        description: "A cross-dock canopy over the stands, an entry gantry, container stacks and a weighbridge kiosk." },
    ],
  },
  {
    set: "bridge",
    collectible: "bridge",
    phase: 6,
    landed: true,
    defaultId: "beam",
    retired: {},
    types: [
      { id: "beam", label: "Beam Bridge",
        description: "Flat concrete deck on regularly spaced piers. Simple span across short gaps." },
      { id: "truss", label: "Truss Bridge",
        description: "Concrete deck with steel side trusses in a Pratt triangle pattern." },
      { id: "cantilever", label: "Cantilever Bridge",
        description: "Two tall pier-towers anchor the deck via triangular cantilever side bracing." },
      { id: "arch", label: "Arch Bridge",
        description: "Concrete deck-arch: a single concrete arch springs from each endpoint and carries the deck on top." },
      { id: "stone_arch", label: "Stone Arch Bridge",
        description: "Older masonry bridge with short repeated arches and full-width stone piers." },
      { id: "brick_arch", label: "Brick Arch Bridge",
        description: "Like the stone arch, but the masonry is red brick: short repeated arches and full-width brick piers." },
      { id: "tied_arch", label: "Tied Arch Bridge",
        description: "Through-arch: two side arches rise above the deck with vertical hanger rods supporting it." },
      { id: "suspension", label: "Suspension Bridge",
        description: "Two tall towers carry parabolic main cables; vertical hangers suspend the deck." },
      { id: "cable_stayed", label: "Cable-stayed Bridge",
        description: "Two towers with straight stay cables fanning out diagonally to anchor points on the deck." },
      { id: "plate_girder", label: "Steel Plate Girder",
        description: "Low steel side girders with broad flanges and riveted stiffeners." },
      { id: "timber_trestle", label: "Timber Trestle",
        description: "A timber deck carried by repeated splayed wooden bents and diagonal braces." },
      { id: "box_girder", label: "Box-girder Viaduct",
        description: "A modern concrete box girder on tapered piers with broad supporting caps." },
      { id: "deck_truss", label: "Deck Truss",
        description: "Steel lattice girders below the deck leave the skyline open." },
      { id: "network_arch", label: "Network Arch",
        description: "Twin steel arches support the deck with crossing diagonal hangers." },
    ],
  },
  {
    set: "catenaryStyle",
    phase: 7,
    landed: false,
    defaultId: "rail_mast",
    retired: {},
    types: [
      { id: "rail_mast", label: "Lattice masts",
        description: "Lattice masts with cantilever arms, and portals over several tracks." },
      { id: "tram_pole", label: "Tram poles",
        description: "Slim poles with bracket arms and span wires over the street." },
    ],
  },
];

/** The set named `name`. */
export function setDef(name: SetName): SetDef {
  const def = SETS.find((s) => s.set === name);
  if (!def) throw new Error(`unknown set ${name}`);
  return def;
}

/** The shipped id a stored `id` draws as: itself, its retired alias, or the set's default. */
export function resolveSetId(def: SetDef, id: string | null | undefined): string {
  if (id != null && def.types.some((t) => t.id === id)) return id;
  if (id != null && def.retired[id]) return def.retired[id]!;
  return def.defaultId;
}
