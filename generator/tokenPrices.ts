// Rail token prices (docs/models/token-prices.md): what the game charges, in rail
// tokens (RT), to unlock one whole design for an account's collection -- every
// variant of it at once; a single livery or look is never sold on its own.
//
// A vehicle's price is derived from its category, its declared game figures and
// its measured size, then multiplied by how many looks its parameters draw. A
// landmark's, a draught animal's and a structure type's price is stated in the
// tables below. Pure: no `node:` imports, so the site and the tests read it too.
//
// The game decides what is free (its default package): the factory exports a
// price for every collectible item, defaults included.

/** The steps every price snaps to. */
export const TOKEN_LADDER: readonly number[] = [50, 75, 100, 150, 200, 250, 300, 400, 500, 650, 800, 1000, 1250, 1500, 2000, 2500, 3000];

/**
 * The parameters that draw a different look of a vehicle. A train's length and
 * car position (`unit`, `cars`, `trainCars`), a road train's trailers (`load`), the
 * harnessed animal (`animal`, `team`: the animals are collected apart) and a pose
 * (`gear`) are the same vehicle and do not count.
 */
export const LOOK_PARAMS: readonly string[] = ["livery", "body", "colour", "color", "variant", "version", "operator", "cover", "length", "seats"];
/** What each look beyond the first adds, as a fraction of the single-look price. */
export const LOOK_STEP = 0.15;
/** The most the looks multiply a price by. */
export const LOOK_CAP = 2.5;

/** The vehicle categories that carry a price. */
export const PRICED_VEHICLE_CATEGORIES: readonly string[] = ["Rail vehicles", "Road vehicles", "Ships", "Aircraft", "Cable car"];

/**
 * Single-look prices stated by hand, for the vehicles the rules cannot price:
 * the legacy airliners that declare no airport class.
 */
export const VEHICLE_BASE_OVERRIDES: Readonly<Record<string, number>> = {
  "proc-vehicle-boeing-747": 1000,
  "proc-vehicle-mcdonnell-douglas-md11": 1000,
  "proc-vehicle-airbus-beluga": 1000,
};

/** Cable car cabins of a named line, dearer than a plain gondola. */
export const SIGNATURE_CABINS: readonly string[] = [
  "proc-vehicle-titlis-rotair", "proc-vehicle-stanserhorn-cabrio", "proc-vehicle-vanoise-express",
  "proc-vehicle-peak-2-peak", "proc-vehicle-sugarloaf-bondinho", "proc-vehicle-roosevelt-island-tram",
];

/** The plaza landmarks and the famous towers, by fame, size and detail. */
export const LANDMARK_TOKEN_PRICES: Readonly<Record<string, number>> = {
  "proc-building-prague-castle-st-vitus": 2500,
  "proc-building-notre-dame": 2500,
  "proc-building-hist-colosseum": 2500,
  "proc-building-tower-eiffel": 2500,
  "proc-building-st-basils-cathedral": 2000,
  "proc-building-hist-palace": 2000,
  "proc-building-white-house": 1500,
  "proc-building-tower-bigben": 1500,
  "proc-building-castle": 1500,
  "proc-building-brandenburg-gate": 1250,
  "proc-building-prague-main-station": 1250,
  "proc-building-hist-pagoda": 1000,
  "proc-building-st-nicholas-church": 800,
  "proc-building-twin-tower-baroque-church": 800,
  "proc-building-church-vrchlabi": 650,
  "proc-building-louvre-pyramid": 500,
  "proc-building-baroque-church": 500,
  // the plaza landmarks of docs/models/plaza-landmarks.md
  "proc-building-taj-mahal": 2500,
  "proc-building-statue-of-liberty": 2500,
  "proc-building-arc-de-triomphe": 2000,
  "proc-building-leaning-tower-of-pisa": 2000,
  "proc-building-us-capitol": 2000,
  "proc-building-hagia-sophia": 2000,
  "proc-building-parthenon": 2000,
  "proc-building-temple-of-heaven": 1500,
  "proc-building-gate-of-heavenly-peace": 1500,
  "proc-building-reichstag": 1500,
  "proc-building-pantheon": 1500,
  "proc-building-prague-old-town-hall": 1500,
  "proc-building-atomium": 1250,
  "proc-building-brussels-town-hall": 1250,
  "proc-building-belfry-of-bruges": 1250,
  "proc-building-cloth-hall": 1250,
  "proc-building-nelsons-column": 1000,
  "proc-building-gateway-of-india": 1000,
  "proc-building-half-timbered-town-hall": 800,
  "proc-building-market-hall": 800,
  "proc-building-equestrian-statue": 500,
  "proc-building-plague-column": 400,
  "proc-building-market-cross": 400,
  "proc-building-village-chapel": 400,
  "proc-building-war-memorial": 300,
  "proc-building-bandstand": 300,
};

/** The draught animals (proc-animal-<species>), each unlocking every animal-drawn vehicle it can pull. */
export const ANIMAL_TOKEN_PRICES: Readonly<Record<string, number>> = {
  "proc-animal-horse": 100,
  "proc-animal-donkey": 100,
  "proc-animal-mule": 100,
  "proc-animal-cow": 150,
  "proc-animal-camel": 250,
  "proc-animal-elephant": 400,
};

/** Every type of every collectible set (registry.ts `collectible`), by set and type id. */
export const STRUCTURE_TOKEN_PRICES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  station: {
    platforms_only: 150, platforms_shared: 200, village_depot: 300, cantilever_wings: 400,
    concourse: 500, heritage_canopy: 500, arch_shed: 650, grand_terminus: 800,
  },
  bridge: {
    beam: 150, truss: 200, deck_truss: 250, timber_trestle: 250, arch: 300, stone_arch: 400,
    tied_arch: 400, cantilever: 500, suspension: 650, cable_stayed: 650,
  },
  busStop: { shelter: 50, canopy: 100, cargo: 100 },
  roadStation: {
    open_bays: 100, gravel_yard: 100, sawtooth_canopy: 150, loading_docks: 150, terminal_hall: 250, logistics_hub: 300,
  },
  cableCarStation: { open_gantry: 150, concrete_drive: 250, glass_modern: 300, alpine_chalet: 400 },
  airport: { grass_field: 200, regional: 500, heliport: 400, international: 1250 },
  port: {
    wooden_jetty: 100, river_jetty: 100, concrete_quay: 250, river_quay: 250, passenger_terminal: 400, river_terminal: 400,
  },
  dam: { concrete: 200, "concrete-lock": 300, weir: 100, "weir-lock": 200, stone: 400 },
};

/** What a vehicle's price is worked out from. `length` and `height` are its default build's extents, metres. */
export interface VehiclePriceInput {
  id: string;
  category: string;
  group: string;
  traction?: string;
  year?: number;
  game?: {
    weight?: number | null; power?: number | null; maxspeed?: number | null;
    sizeClass?: string; aircraftKind?: string; ropeway?: string;
  };
  params?: ReadonlyArray<{ name: string; values: readonly unknown[] }>;
  length: number;
  height: number;
}

/** The ladder step nearest to `v` (the lower one on a tie). */
export function snapToLadder(v: number): number {
  let best = TOKEN_LADDER[0]!;
  for (const step of TOKEN_LADDER) if (Math.abs(step - v) < Math.abs(best - v)) best = step;
  return best;
}

/** How many looks a design's parameters draw: the product of its look parameters' value counts. */
export function looksOf(params: VehiclePriceInput["params"]): number {
  let n = 1;
  for (const p of params ?? []) if (LOOK_PARAMS.includes(p.name)) n *= p.values.length;
  return n;
}

/** The multiplier `looks` looks earn: 15 % a look beyond the first, at most 2.5. */
export function lookMultiplier(looks: number): number {
  return Math.min(LOOK_CAP, 1 + LOOK_STEP * (Math.max(1, looks) - 1));
}

/** A vehicle's price for one look, before the ladder; null for a category that carries none. */
export function singleLookPrice(v: VehiclePriceInput): number | null {
  const override = VEHICLE_BASE_OVERRIDES[v.id];
  if (override !== undefined) return override;
  const g = v.game ?? {};
  const speed = g.maxspeed ?? 0;
  const power = g.power ?? 0;
  const weight = g.weight ?? 0;
  const { length, height } = v;
  switch (v.category) {
    case "Rail vehicles": {
      if (v.traction === "animal") return 150;
      if (v.group === "coach") return 75 + (speed >= 160 ? 50 : 0) + (speed >= 200 ? 25 : 0);
      if (v.group === "wagon") return weight >= 40 || length >= 18 ? 75 : 50;
      if (v.group === "tram" && v.traction !== "steam") {
        return 125 + (speed >= 80 ? 50 : 0) + (length >= 30 ? 100 : length >= 20 ? 50 : 0);
      }
      let price = 100;
      price += speed <= 60 ? 0 : speed <= 100 ? 50 : speed <= 140 ? 100 : speed <= 180 ? 200 : speed <= 230 ? 350 : speed <= 280 ? 550 : 800;
      price += power < 1000 ? 0 : power < 3000 ? 50 : power < 6000 ? 100 : 150;
      if (v.traction === "steam") price += 150 + (power >= 2000 || weight >= 200 ? 100 : 0);
      return price;
    }
    case "Road vehicles": {
      if (v.traction === "animal") return 150;
      if (v.group === "bus") {
        if (length < 7) return 75;
        return 125 + (length >= 15 ? 100 : 0) + (height >= 4 ? 50 : 0) + (length >= 22 ? 50 : 0);
      }
      return 75 + (power >= 300 ? 50 : 0) + (weight >= 40 ? 50 : 0) + (length >= 18 ? 50 : 0) + (weight >= 100 ? 150 : 0);
    }
    case "Ships":
      return length < 15 ? 100 : length < 40 ? 200 : length < 100 ? 350 : length < 200 ? 550 : length < 300 ? 800 : 1100;
    case "Aircraft": {
      if (g.aircraftKind === "helicopter") return 400;
      if (speed >= 1500) return 1500;
      if (g.sizeClass === "big") return weight >= 400 ? 1250 : 1000;
      if (g.sizeClass === "medium") return 650;
      if (g.sizeClass === "small") return (v.year ?? 2000) < 1950 ? 250 : 300;
      throw new Error(`${v.id}: an aircraft without an airport class needs a price in VEHICLE_BASE_OVERRIDES (generator/tokenPrices.ts)`);
    }
    case "Cable car":
      if (SIGNATURE_CABINS.includes(v.id)) return 300;
      return g.ropeway === "jigback" ? 250 : 150;
    default:
      return null;
  }
}

/** A vehicle's price: one look's, times its looks' multiplier, on the ladder; null for a category that carries none. */
export function vehicleTokenPrice(v: VehiclePriceInput): number | null {
  const single = singleLookPrice(v);
  return single === null ? null : snapToLadder(single * lookMultiplier(looksOf(v.params)));
}

/** A building's or an animal's stated price, when it has one. */
export function statedTokenPrice(id: string): number | undefined {
  return LANDMARK_TOKEN_PRICES[id] ?? ANIMAL_TOKEN_PRICES[id];
}

/** A collectible set type's price; throws when the table misses it. */
export function structureTokenPrice(set: string, type: string): number {
  const price = STRUCTURE_TOKEN_PRICES[set]?.[type];
  if (price === undefined) throw new Error(`${set}:${type}: a collectible structure type needs a price in STRUCTURE_TOKEN_PRICES (generator/tokenPrices.ts)`);
  return price;
}

/**
 * What is wrong with a whole export's prices: a priced vehicle category's record,
 * a landmark or an animal without a price, and a table naming a model that does
 * not exist. Empty when all is well.
 */
export function tokenPriceProblems(
  records: ReadonlyArray<{ id: string; category: string; tokenPrice?: number }>,
  ids: Iterable<string>,
): string[] {
  const known = new Set(ids);
  const problems: string[] = [];
  for (const id of [...Object.keys(LANDMARK_TOKEN_PRICES), ...Object.keys(VEHICLE_BASE_OVERRIDES), ...Object.keys(ANIMAL_TOKEN_PRICES), ...SIGNATURE_CABINS]) {
    if (!known.has(id)) problems.push(`names no such model: ${id}`);
  }
  for (const r of records) {
    const priced = PRICED_VEHICLE_CATEGORIES.includes(r.category) || statedTokenPrice(r.id) !== undefined;
    if (priced && r.tokenPrice === undefined) problems.push(`${r.id} has no price`);
    if (r.tokenPrice !== undefined && !TOKEN_LADDER.includes(r.tokenPrice)) problems.push(`${r.id}: ${r.tokenPrice} is not on the ladder`);
  }
  return problems;
}
