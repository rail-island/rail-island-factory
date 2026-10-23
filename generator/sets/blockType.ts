// The block types of the game's city generator (docs/models/sets.md, "Block types"):
// what a block of a settlement is filled with. Each type names its pools (the
// factory's building groups) and their mix, how a block is filled (`perimeter`
// frontages or one `single` building), its facade style -- a NAME the game owns the
// numbers of (FACADE_STYLES) -- an optional centrepiece pool, an exclusion key no two
// neighbouring blocks may share, ring pools for a single building, whether it is the
// settlement's landmark, and which settlements grow it: a weight per city type and
// ring (`cities`) and a per-settlement cap (`limits`). The flags replace ids the game
// used to hard-code: `district` (the family a city profile reweights and
// neighbouring blocks attract), `overlay` (the city overlay's colour family),
// `profileFactors` (a profile's extra factor on this type) and `decoration` (what
// lines a road beside it: village or industrial fences, a tenement's noise wall).
//
// Pure data, no imports: the game reads it from blockType.meta.json (TYPE_META).

/** The facade styles the game knows the numbers of (its core/city/BlockTypes.ts). */
export const FACADE_STYLES = ["terraced", "industrial", "detached"] as const;
/** The game's city types and rings a block type may name. */
export const CITY_TYPES = ["village", "town", "city"] as const;
export const RINGS = ["center", "outer"] as const;
/** The district families a city profile reweights. */
export const DISTRICTS = ["historic", "industrial", "residential", "commercial", "highrise"] as const;
/** The road decorations a block type asks for beside it. */
export const DECORATIONS = ["fence_village", "fence_industrial", "noise_wall"] as const;

export interface BlockTypeData {
  placement: "perimeter" | "single";
  facade: (typeof FACADE_STYLES)[number];
  pools: { group: string; weight: number }[];
  centerpiece?: string;
  exclusionKey?: string;
  ringPools?: { center: string; outer: string };
  landmark?: boolean;
  /** Weight per city type and ring; a city type or ring absent never grows it. */
  cities: Partial<Record<(typeof CITY_TYPES)[number], Partial<Record<(typeof RINGS)[number], number>>>>;
  /** The most blocks of this type one settlement of a city type may have. */
  limits?: Partial<Record<(typeof CITY_TYPES)[number], number>>;
  district?: (typeof DISTRICTS)[number];
  overlay: "residential" | "commercial" | "industrial" | "historic" | "highrise";
  profileFactors?: Record<string, number>;
  /**
   * What lines a road beside a building of this block: `kind`, raised only by the
   * houses of the listed `pools` (all of the block's when absent).
   */
  decoration?: { kind: (typeof DECORATIONS)[number]; pools?: string[] };
}

/** Every block type's data, by id (the registry's order and English names are in registry.ts). */
export const TYPE_META: Readonly<Record<string, BlockTypeData>> = {
  "village": {"placement": "perimeter", "facade": "detached", "pools": [{"group": "village", "weight": 1}], "cities": {"village": {"center": 7, "outer": 7}, "town": {"outer": 5}, "city": {"outer": 2}}, "district": "residential", "overlay": "residential", "decoration": {"kind": "fence_village", "pools": ["village"]}},
  "village_red": {"placement": "perimeter", "facade": "detached", "pools": [{"group": "village_red", "weight": 1}], "cities": {"village": {"center": 3, "outer": 3}, "town": {"outer": 1}}, "district": "residential", "overlay": "residential", "profileFactors": {"red_roofs": 6, "rural": 0.35}, "decoration": {"kind": "fence_village", "pools": ["village_red"]}},
  "comm_classic": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "comm_classic", "weight": 1}], "cities": {"town": {"center": 4}, "city": {"center": 3}}, "district": "commercial", "overlay": "commercial"},
  "comm_large": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "commercial", "weight": 1}], "cities": {"city": {"center": 2, "outer": 2}}, "district": "commercial", "overlay": "commercial"},
  "comm_small": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "commercial", "weight": 6}, {"group": "comm_classic", "weight": 4}], "cities": {"town": {"center": 3}, "city": {"outer": 3}}, "district": "commercial", "overlay": "commercial"},
  "comm_low": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "commercial", "weight": 1}], "cities": {"town": {"center": 2, "outer": 2}, "city": {"outer": 3}}, "district": "commercial", "overlay": "commercial"},
  "comm_oldtown": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "commercial", "weight": 1}], "cities": {"town": {"center": 3, "outer": 1}, "city": {"center": 2}}, "district": "historic", "overlay": "historic"},
  "comm_street": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "commercial", "weight": 8}, {"group": "comm_classic", "weight": 2}], "cities": {"town": {"center": 3, "outer": 3}, "city": {"center": 1, "outer": 3}}, "district": "commercial", "overlay": "commercial"},
  "comm_tenement": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "commercial", "weight": 6}, {"group": "comm_classic", "weight": 4}], "cities": {"town": {"center": 2}, "city": {"center": 3, "outer": 1}}, "district": "commercial", "overlay": "commercial", "decoration": {"kind": "noise_wall"}},
  "skyscraper_a": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "skyscraper_c", "weight": 1}], "cities": {"city": {"center": 3}}, "district": "highrise", "overlay": "highrise"},
  "skyscraper_b": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "skyscraper_c", "weight": 1}], "cities": {"city": {"center": 2}}, "district": "highrise", "overlay": "highrise"},
  "industry": {"placement": "perimeter", "facade": "industrial", "pools": [{"group": "industry", "weight": 7}, {"group": "comm_classic", "weight": 3}], "cities": {"town": {"outer": 2}, "city": {"outer": 3}}, "district": "industrial", "overlay": "industrial", "decoration": {"kind": "fence_industrial", "pools": ["industry"]}},
  "tower": {"placement": "perimeter", "facade": "terraced", "pools": [{"group": "comm_classic", "weight": 1}], "centerpiece": "towers", "exclusionKey": "tower", "cities": {"town": {"center": 1}, "city": {"center": 1}}, "overlay": "highrise"},
  "historical": {"placement": "single", "facade": "detached", "pools": [], "exclusionKey": "historical", "ringPools": {"center": "hist_center", "outer": "hist_center"}, "cities": {"town": {"center": 1, "outer": 1}, "city": {"center": 1, "outer": 1}}, "overlay": "historic", "profileFactors": {"historic": 2}},
  "landmark": {"placement": "single", "facade": "detached", "pools": [], "exclusionKey": "historical", "landmark": true, "cities": {"village": {"center": 1, "outer": 1}}, "limits": {"village": 1}, "overlay": "historic"},
};
