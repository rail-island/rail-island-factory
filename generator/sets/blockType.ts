// The block types of the game's city generator (docs/models/sets.md, "Block types"):
// what a block of a settlement is filled with, and HOW. There are seven archetypes,
// each with a fixed pool mix (the factory's building groups) and a parameter space
// a city samples per block: the spacing (how far apart its buildings stand, down to
// wall to wall), a colour scheme (one of the named PALETTES the buildings' colour
// values are tagged with) and a height band. Beside the data, the module holds the
// one fill both the game and the site's block previews run: picking a building for a
// frontage slot, sampling its colours, walking a frontage, and finding the walls two
// buildings share (party walls, which the buildings then draw without windows).
//
// The flags replace ids the game used to hard-code: `district` (the family a city
// profile reweights and neighbouring blocks attract), `overlay` (the city overlay's
// colour family), `profileFactors` (a profile's extra factor on this type) and
// `decoration` (what lines a road beside it: village or industrial fences, a noise
// wall beside a street of tenements or taller).
//
// Pure, deterministic, no imports: the game reads the data from blockType.meta.json
// (TYPE_META) and runs the functions from blockType.js.

/** The game's city types and rings a block type may name. */
export const CITY_TYPES = ["village", "town", "city"] as const;
export const RINGS = ["center", "outer"] as const;
/** The district families a city profile reweights. */
export const DISTRICTS = ["historic", "industrial", "residential", "commercial", "highrise"] as const;
/**
 * The road decorations a block type asks for beside it. A city never walls its
 * streets: a noise wall in town read as a fence round nothing, so none is offered.
 */
export const DECORATIONS = ["fence_village", "fence_industrial"] as const;
/** What a block's open ground is paved with (null keeps the island's biome). */
export const GROUNDS = ["pavement", "concrete"] as const;

/**
 * The named colour schemes. A building's colour values (a roof, a wall finish) are
 * tagged with the palettes they belong to (the factory's cityVariants.ts); a block
 * picks one palette and its buildings prefer the values tagged with it.
 */
export const PALETTES = ["warm", "earth", "brick", "pastel", "cool", "stone"] as const;
/** The height bands a building's height parameter values are tagged with; `mixed` takes any. */
export const HEIGHT_BANDS = ["low", "mid", "tall"] as const;
export const BLOCK_HEIGHTS = ["mixed", "low", "mid", "tall"] as const;
/** The sides of a building a neighbour may stand against: front is +Z (the street), right is +X. */
export const PARTY_SIDES = ["front", "back", "left", "right"] as const;
/** A party wall's parameter value: the side drawn blank, without windows. */
export const PARTY_BLANK = "yes";

/** How tightly a block's frontages pack: the numbers a spacing value stands for. */
export interface Spacing {
  /** Studs always left after a building before the next may start (0: wall to wall). */
  gap: number;
  /** Extra gap rolled on top of `gap` (0..jitter studs). */
  jitter: number;
  /** Studs between a building's street face and the street deck's edge. */
  setback: number;
  /** Added to the city type's per-slot density (clamped to 0..0.98). */
  densityBoost: number;
  /** Corner clearance at the start of a frontage, plus 0..cornerJitter studs. */
  corner: number;
  cornerJitter: number;
  /** Whether it builds rows: the buildings that draw party walls are ROW_BIAS times commoner. */
  rows: boolean;
}

/**
 * The spacing values. `touching` stands buildings wall to wall (party walls where
 * both designs draw them, else `MIN_GAP` apart); `tight` is a terraced street whose
 * rows break now and then for a passage; `open` keeps detached houses apart; `wide`
 * is a garden suburb. Whatever the spacing, a gap narrower than `MIN_GAP` is never
 * left: two buildings that would stand closer touch (when both draw party walls)
 * or move apart to it. The setback is half a terrain cell for the street spacings: the city
 * re-asserts its street decks after every pad and resolves a building it touched
 * on a foundation, so a terraced front can meet the kerb.
 */
export const SPACINGS: Readonly<Record<string, Spacing>> = {
  touching: { gap: 0, jitter: 0, setback: 2, densityBoost: 0.16, corner: 0, cornerJitter: 0, rows: true },
  tight: { gap: 1, jitter: 3, setback: 2, densityBoost: 0.12, corner: 0, cornerJitter: 2, rows: true },
  open: { gap: 2, jitter: 6, setback: 4, densityBoost: 0, corner: 2, cornerJitter: 4, rows: false },
  wide: { gap: 5, jitter: 8, setback: 6, densityBoost: -0.06, corner: 3, cornerJitter: 5, rows: false },
};
/**
 * The narrowest gap two buildings of a frontage keep when they do not touch: a
 * narrower one reads as a mistake, not a passage, so the walk closes it (wall to
 * wall, when both draw party walls) or widens it to this.
 */
export const MIN_GAP = 2.5;
/**
 * How much commoner a building that draws party walls on its flanks is on a block
 * whose spacing builds rows (`touching`, `tight`): a village's row houses, a
 * street's terraces.
 */
export const ROW_BIAS = 8;

/** A block's parameters: one value of each, sampled when the city grows it. */
export interface BlockParams {
  spacing: string;
  colour: string;
  height: string;
}
export const BLOCK_PARAM_NAMES = ["spacing", "colour", "height"] as const;

export interface BlockTypeData {
  placement: "perimeter" | "single";
  /** What the block's open ground is paved with; null keeps the biome. */
  ground: (typeof GROUNDS)[number] | null;
  pools: { group: string; weight: number }[];
  centerpiece?: string;
  exclusionKey?: string;
  ringPools?: { center: string; outer: string };
  /**
   * The city types whose blocks of this type stand the settlement's LANDMARK (a
   * model of the catalog's plaza landmarks for that city type, as a square would
   * have) instead of a ring pool's building: a village's church.
   */
  landmarkIn?: (typeof CITY_TYPES)[number][];
  /** The values of each block parameter a block of this type may take, with their weights. */
  params: {
    spacing: Partial<Record<string, number>>;
    height: Partial<Record<(typeof BLOCK_HEIGHTS)[number], number>>;
  };
  /** Weight per city type and ring; a city type or ring absent never grows it. */
  cities: Partial<Record<(typeof CITY_TYPES)[number], Partial<Record<(typeof RINGS)[number], number>>>>;
  /** The most blocks of this type one settlement of a city type may have. */
  limits?: Partial<Record<(typeof CITY_TYPES)[number], number>>;
  district?: (typeof DISTRICTS)[number];
  overlay: "residential" | "commercial" | "industrial" | "historic" | "highrise";
  profileFactors?: Record<string, number>;
  /**
   * What lines a road beside a building of this block: `kind`, raised only by the
   * houses of the listed `pools` (all of the block's when absent) and only in blocks
   * whose height is one of `heights` (any when absent).
   */
  decoration?: { kind: (typeof DECORATIONS)[number]; pools?: string[]; heights?: (typeof BLOCK_HEIGHTS)[number][] };
}

/** Every block type's data, by id (the registry's order and English names are in registry.ts). */
export const TYPE_META: Readonly<Record<string, BlockTypeData>> = {
  "houses": {
    "placement": "perimeter", "ground": null,
    "pools": [{ "group": "village", "weight": 7 }, { "group": "village_red", "weight": 3 }],
    "params": { "spacing": { "open": 3, "wide": 1, "tight": 1 }, "height": { "mixed": 3, "low": 1, "mid": 1 } },
    "cities": { "village": { "center": 10, "outer": 10 }, "town": { "outer": 6 }, "city": { "outer": 2 } },
    "district": "residential", "overlay": "residential",
    "decoration": { "kind": "fence_village" },
  },
  "street": {
    "placement": "perimeter", "ground": "pavement",
    "pools": [{ "group": "commercial", "weight": 6 }, { "group": "comm_classic", "weight": 4 }],
    "params": { "spacing": { "touching": 3, "tight": 4 }, "height": { "mixed": 2, "low": 2, "mid": 3, "tall": 1 } },
    "cities": { "town": { "center": 17, "outer": 6 }, "city": { "center": 11, "outer": 12 } },
    "district": "commercial", "overlay": "commercial",
  },
  "highrise": {
    "placement": "perimeter", "ground": "pavement",
    "pools": [{ "group": "skyscraper_c", "weight": 1 }],
    "params": { "spacing": { "tight": 2, "open": 1 }, "height": { "mixed": 2, "tall": 1 } },
    "cities": { "city": { "center": 5 } },
    "district": "highrise", "overlay": "highrise",
  },
  "industrial": {
    "placement": "perimeter", "ground": "concrete",
    "pools": [{ "group": "industry", "weight": 7 }, { "group": "comm_classic", "weight": 3 }],
    "params": { "spacing": { "tight": 2, "open": 2 }, "height": { "mixed": 1 } },
    "cities": { "town": { "outer": 2 }, "city": { "outer": 3 } },
    "district": "industrial", "overlay": "industrial",
    "decoration": { "kind": "fence_industrial", "pools": ["industry"] },
  },
  "towerblock": {
    "placement": "perimeter", "ground": "pavement",
    "pools": [{ "group": "comm_classic", "weight": 1 }], "centerpiece": "towers", "exclusionKey": "tower",
    "params": { "spacing": { "tight": 1, "touching": 1 }, "height": { "mixed": 2, "mid": 1 } },
    "cities": { "town": { "center": 1 }, "city": { "center": 1 } },
    "overlay": "highrise",
  },
  "panel_estate": {
    "placement": "perimeter", "ground": null,
    "pools": [{ "group": "panel", "weight": 1 }],
    "params": { "spacing": { "open": 3, "wide": 2, "touching": 1 }, "height": { "mixed": 3, "low": 1, "mid": 2, "tall": 2 } },
    "cities": { "town": { "outer": 2 }, "city": { "center": 1, "outer": 5 } },
    "district": "residential", "overlay": "residential",
  },
  "landmark": {
    "placement": "single", "ground": null,
    "pools": [], "exclusionKey": "historical",
    "ringPools": { "center": "hist_center", "outer": "hist_center" }, "landmarkIn": ["village"],
    "params": { "spacing": { "open": 1 }, "height": { "mixed": 1 } },
    "cities": { "village": { "center": 1, "outer": 1 }, "town": { "center": 1, "outer": 1 }, "city": { "center": 1, "outer": 1 } },
    "limits": { "village": 1 },
    "overlay": "historic", "profileFactors": { "historic": 2 },
  },
};

/**
 * The block types retired into the archetypes (the registry's aliases), each with
 * the block parameters it is read with: a saved city's `comm_low` block is a
 * `street` block of the `low` height band. A parameter a block record stores
 * itself wins over these.
 */
export const RETIRED_PARAMS: Readonly<Record<string, Partial<BlockParams>>> = {
  "village": {},
  "village_red": { "colour": "brick" },
  "comm_classic": {},
  "comm_large": { "height": "tall" },
  "comm_small": { "height": "low" },
  "comm_low": { "height": "low" },
  "comm_oldtown": { "spacing": "touching", "colour": "earth" },
  "comm_street": {},
  "comm_tenement": { "spacing": "touching", "height": "mid" },
  "skyscraper_a": {},
  "skyscraper_b": { "colour": "cool" },
  "industry": {},
  "tower": {},
  "historical": {},
};

// ---- block parameters ----

/** A weighted roll over `weights` (keys in insertion order); the last key when the weights are all zero. */
function roll(weights: readonly (readonly [string, number])[], random: () => number): string {
  let total = 0;
  for (const [, w] of weights) total += Math.max(0, w);
  let r = random() * total;
  for (const [k, w] of weights) {
    if (w <= 0) continue;
    r -= w;
    if (r < 0) return k;
  }
  return weights[weights.length - 1]![0];
}

/** The values each parameter of a block type may take, in a stable order. */
export function blockParamValues(typeId: string): { spacing: string[]; colour: string[]; height: string[] } {
  const t = TYPE_META[typeId];
  return {
    spacing: Object.keys(SPACINGS).filter((s) => (t?.params.spacing[s] ?? 0) > 0),
    colour: [...PALETTES],
    height: BLOCK_HEIGHTS.filter((h) => (t?.params.height[h] ?? 0) > 0),
  };
}

/** How a city steers a block's colour: its dominant palettes and its neighbours' schemes. */
export interface ColourBias {
  /** The settlement's dominant palettes, strongest first. */
  palettes?: readonly string[];
  /** The colour schemes of the blocks already grown next to this one. */
  neighbours?: readonly string[];
}

/** How much a city's first and second dominant palette outweigh any other. */
export const CITY_PALETTE_WEIGHTS: readonly number[] = [6, 3];

/**
 * A block's parameters: `fixed` values where given and valid for the type, the
 * rest rolled -- spacing and height from the type's weights, the colour from the
 * palettes with the city's dominant ones and the neighbours' schemes favoured.
 * Always draws three numbers, so a fixed value never shifts the rolls after it.
 */
export function rollBlockParams(typeId: string, random: () => number, bias: ColourBias = {}, fixed: Partial<BlockParams> = {}): BlockParams {
  const t = TYPE_META[typeId];
  const spacingW = Object.keys(SPACINGS).map((s) => [s, t?.params.spacing[s] ?? 0] as const);
  const heightW = BLOCK_HEIGHTS.map((h) => [h, t?.params.height[h] ?? 0] as const);
  const colourW = PALETTES.map((p) => {
    let w = 1;
    const at = (bias.palettes ?? []).indexOf(p);
    if (at >= 0) w *= CITY_PALETTE_WEIGHTS[at] ?? 1;
    const near = (bias.neighbours ?? []).filter((n) => n === p).length;
    w *= 1 + Math.min(2, near);
    return [p, w] as const;
  });
  const spacing = roll(spacingW.some(([, w]) => w > 0) ? spacingW : [["open", 1]], random);
  const height = roll(heightW.some(([, w]) => w > 0) ? heightW : [["mixed", 1]], random);
  const colour = roll(colourW, random);
  const valid = blockParamValues(typeId);
  return {
    spacing: fixed.spacing && SPACINGS[fixed.spacing] ? fixed.spacing : spacing,
    colour: fixed.colour && valid.colour.includes(fixed.colour) ? fixed.colour : colour,
    height: fixed.height && (BLOCK_HEIGHTS as readonly string[]).includes(fixed.height) ? fixed.height : height,
  };
}

/**
 * The block parameters a stored record is read with: its own values, then the
 * retired id's (RETIRED_PARAMS), keeping only names the module knows. Missing ones
 * are left for rollBlockParams.
 */
export function storedBlockParams(storedId: string | null | undefined, own?: Readonly<Record<string, string>>): Partial<BlockParams> {
  const out: Partial<BlockParams> = { ...(storedId ? RETIRED_PARAMS[storedId] ?? {} : {}) };
  for (const name of BLOCK_PARAM_NAMES) {
    const v = own?.[name];
    if (typeof v === "string") out[name] = v;
  }
  return out;
}

/** The spacing numbers of a block's parameters (an unknown value reads as `open`). */
export function spacingOf(params: Pick<BlockParams, "spacing">): Spacing {
  return SPACINGS[params.spacing] ?? SPACINGS.open!;
}

/** Whether a block of `typeId` with `height` lines its roads with `decoration`. */
export function decorates(typeId: string, height: string): boolean {
  const d = TYPE_META[typeId]?.decoration;
  return !!d && (!d.heights || (d.heights as readonly string[]).includes(height));
}

// ---- buildings ----

/** One colour parameter of a building a city may vary: each value with the palettes it belongs to. */
export interface ColourChoice {
  name: string;
  values: readonly { value: string; palettes: readonly string[] }[];
}

/**
 * One building a block may stand: a design at one selection of its shape
 * parameters, sized. `key` is the caller's (a model reference); the fill only
 * passes it back.
 */
export interface FillCandidate {
  key: string;
  group: string;
  /** Along the street and into the block, studs. */
  w: number;
  d: number;
  /** How much commoner than the group's other candidates (default 1). */
  weight?: number;
  /** The height band of its height parameter value; none when it has no height parameter. */
  band?: string;
  /** The sides it can draw as a blank party wall. */
  party?: readonly string[];
  /** Its colour parameters a city may vary. */
  colours?: readonly ColourChoice[];
}

/** The map's building variants already standing, and the budget of new ones this city may add. */
export interface VariantReuse {
  /** Whether a variant key already stands on the map (or in this city). */
  has(key: string): boolean;
  /** Whether this city may still add a variant the map does not have. */
  canAdd(): boolean;
  /** Called with every key the fill stands. */
  note(key: string): void;
}

/** How much commoner a variant already standing is than a new one. */
export const REUSE_BIAS = 3;
/** The weight of a colour value tagged with none of the palettes: neutral in all of them. */
export const UNTAGGED_COLOUR = 0.5;
/** The weight of a colour value tagged with other palettes than the block's. */
export const OFF_PALETTE_COLOUR = 0.06;
/** The colour combinations considered at most; a design with more keeps its defaults past them. */
const MAX_COLOUR_COMBOS = 256;

/** A colour value's weight in a block of `palette`. */
export function colourWeight(palettes: readonly string[], palette: string): number {
  if (!palettes.length) return UNTAGGED_COLOUR;
  return palettes.includes(palette) ? 1 : OFF_PALETTE_COLOUR;
}

/**
 * The colour values a building takes in a block of `palette`: every combination of
 * its colour parameters weighted by its values' palette weights, the ones already
 * standing on the map favoured (REUSE_BIAS) -- and, once the city has used its
 * budget of new variants, the only ones considered when there is any.
 */
export function chooseColours(
  c: FillCandidate,
  palette: string,
  random: () => number,
  keyOf: (c: FillCandidate, colours: Readonly<Record<string, string>>) => string,
  reuse?: VariantReuse,
): Record<string, string> {
  const choices = c.colours ?? [];
  if (!choices.length) return {};
  let combos: { colours: Record<string, string>; w: number }[] = [{ colours: {}, w: 1 }];
  for (const ch of choices) {
    const next: { colours: Record<string, string>; w: number }[] = [];
    for (const combo of combos) for (const v of ch.values) {
      if (next.length >= MAX_COLOUR_COMBOS) break;
      next.push({ colours: { ...combo.colours, [ch.name]: v.value }, w: combo.w * colourWeight(v.palettes, palette) });
    }
    combos = next;
  }
  const keyed = combos.map((x) => ({ ...x, used: reuse ? reuse.has(keyOf(c, x.colours)) : false }));
  const pool = reuse && !reuse.canAdd() && keyed.some((x) => x.used) ? keyed.filter((x) => x.used) : keyed;
  const pick = roll(pool.map((x, i) => [String(i), x.w * (x.used ? REUSE_BIAS : 1)] as const), random);
  return pool[Number(pick)]!.colours;
}

/** Whether a candidate suits a block's height: any for `mixed` or a candidate without a band. */
export function bandFits(c: FillCandidate, height: string): boolean {
  return height === "mixed" || !c.band || c.band === height;
}

/**
 * A candidate for a frontage slot `alongLimit` long and `depthLimit` deep: a group
 * by the block's mix (among the groups with anything that fits), then a candidate
 * in it weighted by its width (a wide slot takes a wide building) times its own
 * weight. The block's height band filters the group first, unless that leaves
 * nothing that fits. Null when nothing fits.
 */
export function pickCandidate(
  pools: ReadonlyMap<string, readonly FillCandidate[]>,
  mix: readonly { group: string; weight: number }[],
  height: string,
  random: () => number,
  alongLimit: number,
  depthLimit: number,
): FillCandidate | null {
  const fitting: { list: FillCandidate[]; weight: number }[] = [];
  for (const p of mix) {
    if (p.weight <= 0) continue;
    const fits = (pools.get(p.group) ?? []).filter((c) => c.w <= alongLimit && c.d <= depthLimit);
    if (!fits.length) continue;
    const banded = fits.filter((c) => bandFits(c, height));
    fitting.push({ list: banded.length ? banded : fits, weight: p.weight });
  }
  if (!fitting.length) return null;
  const group = fitting[Number(roll(fitting.map((f, i) => [String(i), f.weight] as const), random))]!;
  let widths = 0;
  for (const c of group.list) widths += c.w * (c.weight ?? 1);
  if (!(widths > 0)) return group.list[Math.floor(random() * group.list.length)]!;
  let r = random() * widths;
  for (const c of group.list) {
    r -= c.w * (c.weight ?? 1);
    if (r < 0) return c;
  }
  return group.list[group.list.length - 1]!;
}

// ---- the frontage walk ----

/** One frontage: a run of street `length` studs long, buildings up to `depthLimit` deep. */
export interface FillRun {
  length: number;
  depthLimit: number;
}

/** What a frontage walk needs beyond the run: the block, its candidates and the caller's hooks. */
export interface FillContext {
  /** The block type's id (TYPE_META). */
  typeId: string;
  params: BlockParams;
  pools: ReadonlyMap<string, readonly FillCandidate[]>;
  /** The settlement's per-slot density, before the spacing's boost. */
  density: number;
  random: () => number;
  /** How far the walk moves on when a placement is refused. */
  retryStep: number;
  /** The model reference a candidate is stood as with `colours`. */
  keyOf: (c: FillCandidate, colours: Readonly<Record<string, string>>) => string;
  reuse?: VariantReuse;
  /** On a refused placement, try the other fitting candidates (smallest first) before moving on. */
  fallback?: boolean;
  /** The widest building a slot may take (the city type's footprint ceiling). */
  maxWidth?: number;
}

/**
 * The caller's verdict on a building at `at` along the run: stood (true), refused
 * (false: the walk moves on by `retryStep`), or blocked by a building already in the
 * block whose far edge is at `skipTo` along the run -- the walk resumes there, wall
 * to wall when both draw party walls (`party`) and the spacing is `touching`.
 */
export type FillVerdict = boolean | { skipTo: number; party?: boolean };

/** A building the walk stood: where it starts along the run, what, and as which key. */
export interface FillPlacement {
  at: number;
  candidate: FillCandidate;
  colours: Record<string, string>;
  key: string;
}

/** Whether a candidate draws a party wall on either flank (left or right). */
function flankParty(c: FillCandidate): boolean {
  return !!c.party && (c.party.includes("left") || c.party.includes("right"));
}

/** The candidates with the row builders (flank party walls) made `ROW_BIAS` times commoner. */
function rowPools(pools: ReadonlyMap<string, readonly FillCandidate[]>): Map<string, readonly FillCandidate[]> {
  const out = new Map<string, readonly FillCandidate[]>();
  for (const [group, list] of pools) out.set(group, list.map((c) => flankParty(c) ? { ...c, weight: (c.weight ?? 1) * ROW_BIAS } : c));
  return out;
}

/**
 * Walks one frontage: from the corner clearance to the end, a slot at a time --
 * skipped by the density roll, else a candidate picked, coloured and offered to
 * `tryPlace` -- leaving the block's spacing after every building. A gap narrower
 * than MIN_GAP is closed when both neighbours draw party walls and widened to
 * MIN_GAP otherwise; a block whose spacing builds rows favours the buildings
 * that draw party walls (ROW_BIAS). Every random draw comes from `ctx.random`, in walk order.
 */
export function fillRun(run: FillRun, ctx: FillContext, tryPlace: (at: number, c: FillCandidate, key: string) => FillVerdict): FillPlacement[] {
  const t = TYPE_META[ctx.typeId];
  const out: FillPlacement[] = [];
  if (!t || run.length <= 0 || run.depthLimit <= 0) return out;
  const sp = spacingOf(ctx.params);
  const density = Math.min(0.98, Math.max(0, ctx.density + sp.densityBoost));
  const random = ctx.random;
  const pools = sp.rows ? rowPools(ctx.pools) : ctx.pools;
  let cursor = sp.corner + random() * sp.cornerJitter;
  // the end of the last building stood, and whether it draws a party wall
  let lastEnd = -Infinity;
  let lastParty = false;
  // whether nothing was refused since that end: a refused wall-to-wall slot is not retried
  let fresh = true;
  const limitOf = (at: number): number => Math.min(run.length - at, ctx.maxWidth ?? Infinity);
  while (cursor < run.length) {
    if (random() > density) {
      cursor += 8 + random() * 8;
      continue;
    }
    let c = pickCandidate(pools, t.pools, ctx.params.height, random, limitOf(cursor), run.depthLimit);
    if (!c) break;
    // no gap under MIN_GAP: wall to wall between two party walls (unless that was
    // refused already), else MIN_GAP apart
    if (cursor - lastEnd < MIN_GAP) {
      cursor = fresh && lastParty && flankParty(c) ? lastEnd : Math.max(cursor, lastEnd + MIN_GAP);
      if (c.w > limitOf(cursor)) continue;
    }
    const tries: FillCandidate[] = [c];
    if (ctx.fallback) {
      const rest = t.pools.flatMap((p) => pools.get(p.group) ?? [])
        .filter((o) => o !== c && o.w <= limitOf(cursor) && o.d <= run.depthLimit)
        .sort((a, b) => a.w * a.d - b.w * b.d || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
      tries.push(...rest);
    }
    let stood = false;
    let skip: { skipTo: number; party?: boolean } | null = null;
    for (const cand of tries) {
      const colours = chooseColours(cand, ctx.params.colour, random, ctx.keyOf, ctx.reuse);
      const key = ctx.keyOf(cand, colours);
      const verdict = tryPlace(cursor, cand, key);
      if (verdict === true) {
        out.push({ at: cursor, candidate: cand, colours, key });
        ctx.reuse?.note(key);
        lastEnd = cursor + cand.w;
        lastParty = flankParty(cand);
        fresh = true;
        cursor = lastEnd + sp.gap + random() * sp.jitter;
        stood = true;
        c = cand;
        break;
      }
      if (verdict !== false) {
        skip = verdict;
        break;
      }
    }
    if (stood) continue;
    if (skip && skip.skipTo > cursor) {
      // on past the building in the way; the next pick closes or widens the gap as above
      lastEnd = skip.skipTo;
      lastParty = !!skip.party;
      fresh = true;
      cursor = skip.skipTo + sp.gap;
      continue;
    }
    fresh = false;
    cursor += ctx.retryStep;
  }
  return out;
}

// ---- party walls ----

/** A building's footprint in the world: centre, turn (degrees; front(rot) = (sin rot, cos rot)), size. */
export interface Footprint {
  x: number;
  z: number;
  rot: number;
  w: number;
  d: number;
}

/** How close two faces must lie to count as one wall, studs. */
export const PARTY_EPS = 0.15;
/** The share of a face a neighbour must cover for the face to be drawn blank. */
export const PARTY_COVER = 0.5;

interface Face {
  side: (typeof PARTY_SIDES)[number];
  /** Centre, outward normal, unit tangent and half length, in the world. */
  cx: number;
  cz: number;
  nx: number;
  nz: number;
  tx: number;
  tz: number;
  half: number;
}

function facesOf(f: Footprint): Face[] {
  const r = (f.rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  // model (x, z) -> world: x' = x cos + z sin, z' = -x sin + z cos
  const toWorld = (mx: number, mz: number): [number, number] => [mx * cos + mz * sin, -mx * sin + mz * cos];
  const face = (side: Face["side"], mx: number, mz: number, nmx: number, nmz: number, half: number): Face => {
    const [ox, oz] = toWorld(mx, mz);
    const [nx, nz] = toWorld(nmx, nmz);
    return { side, cx: f.x + ox, cz: f.z + oz, nx, nz, tx: -nz, tz: nx, half };
  };
  return [
    face("front", 0, f.d / 2, 0, 1, f.w / 2),
    face("back", 0, -f.d / 2, 0, -1, f.w / 2),
    face("right", f.w / 2, 0, 1, 0, f.d / 2),
    face("left", -f.w / 2, 0, -1, 0, f.d / 2),
  ];
}

/**
 * The sides of each footprint a neighbour stands against: a face lying on a face
 * of another footprint (opposite normals, within PARTY_EPS) that covers at least
 * PARTY_COVER of it. A street face never touches anything a city stands, so in
 * practice these are flanks and backs: the walls a terrace shares.
 */
export function touchingSides(prints: readonly Footprint[]): (typeof PARTY_SIDES)[number][][] {
  const faces = prints.map(facesOf);
  const out: (typeof PARTY_SIDES)[number][][] = prints.map(() => []);
  for (let i = 0; i < prints.length; i++) {
    for (let j = 0; j < prints.length; j++) {
      if (i === j) continue;
      const pi = prints[i]!;
      const pj = prints[j]!;
      const reach = Math.hypot(pi.w, pi.d) / 2 + Math.hypot(pj.w, pj.d) / 2 + PARTY_EPS;
      if (Math.hypot(pi.x - pj.x, pi.z - pj.z) > reach) continue;
      for (const a of faces[i]!) {
        if (out[i]!.includes(a.side)) continue;
        for (const b of faces[j]!) {
          if (a.nx * b.nx + a.nz * b.nz > -0.999) continue;
          // b's centre on a's plane, and the overlap of the two along a's tangent
          const off = (b.cx - a.cx) * a.nx + (b.cz - a.cz) * a.nz;
          if (Math.abs(off) > PARTY_EPS) continue;
          const along = (b.cx - a.cx) * a.tx + (b.cz - a.cz) * a.tz;
          const overlap = Math.min(a.half, along + b.half) - Math.max(-a.half, along - b.half);
          if (overlap >= PARTY_COVER * 2 * a.half - 1e-6) {
            out[i]!.push(a.side);
            break;
          }
        }
      }
    }
  }
  return out.map((sides) => PARTY_SIDES.filter((s) => sides.includes(s)));
}

/** The parameter a party wall on `side` is drawn by (`partyLeft`, ...). */
export function partyParam(side: (typeof PARTY_SIDES)[number]): string {
  return `party${side[0]!.toUpperCase()}${side.slice(1)}`;
}

/** The party-wall parameter values for the touched sides a building can draw blank. */
export function partyValues(touched: readonly string[], supported: readonly string[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const side of PARTY_SIDES) if (touched.includes(side) && supported?.includes(side)) out[partyParam(side)] = PARTY_BLANK;
  return out;
}
