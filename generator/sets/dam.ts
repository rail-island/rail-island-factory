// The dam types (docs/models/sets.md): what a dam is built as. The game solves where
// a dam stands -- its body across the valley, its crest, its spillways, the water on
// both sides -- and draws the wall itself; a type decides the BODY (a gravity wall, or
// an overflow weir whose crest is the water), its masonry, whether it has a LOCK, and
// the parts drawn on it: the gravity wall's piers, gates and service bridge, the lock's
// walls and its four gate leaves (each its own named node, hinged at its origin, which
// the game swings), and the stone dam's arcaded roadway with its towers.
//
// Frame: +X runs along the crest, +Z is UPSTREAM, y is world height.
//
// Pure data and functions, no imports: bundled into export/sets/dam.js.

export type Rgb = [number, number, number];
export type DamMaterial = "platform" | "edge" | "steel" | "glass" | "sign";

/** One box of a dam part: the game's station box vocabulary. */
export interface DamBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  color: Rgb;
  material: DamMaterial;
  rotX?: number;
  rotZ?: number;
  lod?: "shell";
}

/** A lock's chamber: clear length and width, and its walls' thickness. */
export interface LockSize { length: number; width: number; wall: number }

/** One type: its body, its masonry (the named surface it is faced with), its lock and its arcade. */
export interface DamTypeData {
  body: "gravity" | "weir";
  surface: string;
  lock: LockSize | null;
  arcade: boolean;
}

const LOCK: LockSize = { length: 60, width: 16, wall: 1.5 };

export const TYPE_META: Record<string, DamTypeData> = {
  concrete: { body: "gravity", surface: "dam-concrete", lock: null, arcade: false },
  "concrete-lock": { body: "gravity", surface: "dam-concrete", lock: LOCK, arcade: false },
  weir: { body: "weir", surface: "dam-concrete", lock: null, arcade: false },
  "weir-lock": { body: "weir", surface: "dam-concrete", lock: LOCK, arcade: false },
  stone: { body: "weir", surface: "dam-stone", lock: null, arcade: true },
};

/** The masonry colours: a concrete wall, its light dressings, steelwork, dark gates, a stone face. */
export const COLORS: Record<"concrete" | "light" | "steel" | "dark" | "stone", Rgb> = {
  concrete: [174, 169, 150], light: [205, 201, 184], steel: [75, 111, 121], dark: [76, 85, 83], stone: [150, 143, 126],
};
const { concrete: CONCRETE, light: LIGHT, steel: STEEL, dark: DARK } = COLORS;

// --- the gravity wall's parts ---

/** One span of a gravity wall: its ends along the crest, its half-depth, foot, crest and batter. */
export interface GravitySpan { left: number; right: number; halfWidth: number; base: number; top: number; height: number; batter: number }

/**
 * The parts on one span of a gravity wall: piers running down the battered face,
 * closed steel gates with their ribs between them, the continuous service bridge with
 * parapets and rails, and an operations cabin on the abutment. `simplified` is the
 * distant proxy: fewer bays, no ribs, rails, posts or glazing.
 */
export function gravityParts(span: GravitySpan, simplified: boolean): DamBox[] {
  const out: DamBox[] = [];
  const length = span.right - span.left, middle = (span.left + span.right) / 2;
  if (length < 4) return out;
  const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: Rgb, material: DamMaterial = "platform", rotX?: number): void => {
    out.push({ cx, cy, cz, sx, sy, sz, color, material, rotX, lod: "shell" });
  };
  const { base, top, height, batter } = span;
  const front = -span.halfWidth + batter;
  const bays = simplified ? Math.max(2, Math.ceil(length / 27)) : Math.max(2, Math.ceil(length / 9)), spacing = length / bays;
  const gateHeight = Math.min(3, height * 0.35), bridge = top + gateHeight + 0.8;
  const tilt = Math.atan2(batter, height);
  // structural piers down the sloping wall; closed gates and their ribs give the
  // face depth without suggesting a spill
  for (let k = 0; k <= bays; k++) {
    const x = span.left + spacing * k;
    box(x, base + height / 2, -span.halfWidth + batter / 2 - 0.3, 0.95, Math.hypot(height, batter), 0.9, LIGHT, "platform", tilt);
    box(x, top + gateHeight / 2, front + 0.2, 1.2, gateHeight + 1.6, 2.3, LIGHT);
    box(x, bridge - 0.4, front + 0.2, 1.65, 0.45, 3, LIGHT, "edge");
    if (k === bays) continue;
    const cx = x + spacing / 2;
    box(cx, top + gateHeight / 2 - 0.2, front + 0.55, spacing - 1.25, gateHeight, 0.3, DARK, "steel");
    for (let r = 1; !simplified && r <= 3; r++) box(cx, top - 0.2 + gateHeight * r / 4, front + 0.3, spacing - 1.25, 0.1, 0.2, STEEL, "steel");
    box(cx, bridge + 0.25, front + 0.2, 1.1, 0.4, 1.15, STEEL, "steel");
  }
  // the continuous service bridge, parapets and fine safety rails
  box(middle, bridge, front + 0.3, length + 1.6, 0.5, 3.6, LIGHT, "edge");
  for (const z of [front - 1.35, front + 1.95]) {
    box(middle, bridge + 0.45, z, length + 1.6, 0.55, 0.22, CONCRETE, "edge");
    for (const y of simplified ? [] : [bridge + 0.95, bridge + 1.45]) box(middle, y, z, length + 1.6, 0.12, 0.13, STEEL, "steel");
    const posts = Math.ceil(length / 3);
    for (let k = 0; !simplified && k <= posts; k++) box(span.left + length * k / posts, bridge + 1, z, 0.12, 0.95, 0.12, STEEL, "steel");
  }
  // a small operations cabin on one abutment and a weather cap over it
  const cabinX = span.right - Math.min(3, length / 6);
  box(cabinX, bridge + 1.5, front + 0.3, 3.5, 2.6, 2.8, LIGHT);
  box(cabinX, bridge + 2.9, front + 0.3, 4, 0.25, 3.3, STEEL, "steel");
  if (!simplified) box(cabinX, bridge + 1.8, front - 1.12, 2.5, 1, 0.06, [103, 155, 168], "glass");
  return out;
}

// --- the lock ---

/** Where a lock's chamber lies: its walls across the crest and its ends upstream and down. */
export interface LockPlace { left: number; right: number; centre: number; upstream: number; downstream: number }

/** One gate leaf: a named node hinged at its origin, swung by the game about +Y. */
export interface GateLeaf {
  name: string;
  /** Where its hinge stands. */
  x: number; y: number; z: number;
  /** Which way it turns to swing outward (away from the chamber). */
  openSign: number;
  /** Its free end, in its own frame. */
  tipX: number;
  boxes: DamBox[];
}

/**
 * A lock's walls, floor and copings, and its four gate leaves: two per gate, each
 * half the chamber's width, hinged on its own wall. Shut they meet in one straight
 * line across the chamber; open they swing OUTWARD -- a leaf opening into the
 * chamber would sweep through the hull lying in it.
 */
export function lockParts(lock: LockPlace, size: LockSize, floor: number, top: number, foundation: number, simplified: boolean): { boxes: DamBox[]; leaves: GateLeaf[] } {
  const boxes: DamBox[] = [];
  const wall = size.wall;
  const length = lock.upstream - lock.downstream, middle = (lock.upstream + lock.downstream) / 2;
  const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: Rgb = CONCRETE, material: DamMaterial = "platform"): void => {
    boxes.push({ cx, cy, cz, sx, sy, sz, color, material, lod: "shell" });
  };
  box(lock.centre, (floor + foundation) / 2, middle, lock.right - lock.left, floor - foundation, length);
  for (const x of [lock.left + wall / 2, lock.right - wall / 2]) {
    box(x, (floor + top) / 2, middle, wall, top - floor, length);
    box(x, top + 0.15, middle, wall + 0.4, 0.3, length, LIGHT, "edge");
    if (!simplified) for (let z = lock.downstream + 3; z < lock.upstream; z += 6) {
      box(x, top + 0.65, z, 0.15, 1, 0.15, STEEL, "steel");
      box(x, top + 1.1, z, 0.12, 0.12, 5.8, STEEL, "steel");
    }
  }
  const leaves: GateLeaf[] = [];
  for (const end of ["upper", "lower"] as const) {
    const z = end === "upper" ? lock.upstream - wall / 2 : lock.downstream + wall / 2;
    const outward = end === "upper" ? 1 : -1; // local +Z is upstream
    for (const side of ["left", "right"] as const) {
      const toward = side === "left" ? 1 : -1; // the leaf reaches for the middle
      const span = size.width / 2;
      const leaf: DamBox[] = [{ cx: toward * span / 2, cy: 0, cz: 0, sx: span, sy: top - floor, sz: wall, color: DARK, material: "steel", lod: "shell" }];
      if (!simplified) for (let y = floor + 1; y < top; y += 1.2) {
        leaf.push({ cx: toward * span / 2, cy: y - (floor + top) / 2, cz: -wall / 2 - 0.08, sx: span, sy: 0.12, sz: 0.2, color: STEEL, material: "steel", lod: "shell" });
      }
      leaves.push({
        name: `lock-gate-${end}-${side}`,
        x: lock.centre - toward * size.width / 2, y: (floor + top) / 2, z,
        openSign: -toward * outward,
        tipX: toward * span,
        boxes: leaf,
      });
    }
  }
  return { boxes, leaves };
}

// --- the stone dam's arcade ---

const STONE_LIGHT: Rgb = [192, 185, 165];
const WINDOW: Rgb = [46, 40, 36];
/** Depth of the arcade, as a multiple of the straight body's half-depth. */
const ARCADE_SHARE = 1.7;
/** Studs of masonry around the arch opening. */
const RING = 0.8;
/** Target spacing of the arcade's piers, in studs. */
const BAY = 11;
/** The tile colour of the towers' pyramid roofs. */
export const TILE_COLOR = 0x8f3a2c;

export interface ArcadeOptions {
  left: number;
  right: number;
  /** Half the body's depth. */
  halfWidth: number;
  /** Underside of the wall, which the piers are carried down to. */
  base: number;
  /** Top of the weir's concrete wings, which the arcade springs clear of. */
  wingTop: number;
  /** Coarser arcade, no turrets, no rails: the distant proxy. */
  simplified?: boolean;
}

/** A square pyramid roof: its centre, eave height, half-width at the eave and height. */
export interface TowerRoof { x: number; y: number; z: number; half: number; height: number }

/**
 * Where the arcade's bays, springing line, crown and roadway fall. The bay count does
 * NOT depend on `simplified`, so a level switch does not walk the silhouette along
 * the crest.
 */
export function arcadeLayout(opts: ArcadeOptions): { length: number; bays: number; spacing: number; pierWidth: number; radius: number; springing: number; crown: number; deck: number; depth: number } {
  const length = opts.right - opts.left;
  const bays = Math.max(2, Math.round(length / BAY));
  const spacing = length / bays;
  const pierWidth = Math.min(3, spacing * 0.3);
  const radius = (spacing - pierWidth) / 2;
  const springing = opts.wingTop + 1.6, crown = springing + radius + RING;
  return { length, bays, spacing, pierWidth, radius, springing, crown, deck: crown + 1.1, depth: opts.halfWidth * ARCADE_SHARE };
}

/**
 * The stone dam's arcaded roadway over the overflow, carried on piers to the
 * foundation, with towers standing on the piers -- or null when the dam is too short
 * to carry two bays (a lone arch reads as a hole).
 */
export function arcadeParts(opts: ArcadeOptions): { boxes: DamBox[]; roofs: TowerRoof[] } | null {
  const { length, bays, spacing, pierWidth, radius, springing, crown, deck, depth } = arcadeLayout(opts);
  if (length < 12) return null;
  const boxes: DamBox[] = [];
  const roofs: TowerRoof[] = [];
  const STONE = COLORS.stone;
  const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: Rgb = STONE, material: DamMaterial = "platform", rotZ?: number): void => {
    if (sx <= 0 || sy <= 0 || sz <= 0) return;
    boxes.push({ cx, cy, cz, sx, sy, sz, color, material, rotZ, lod: "shell" });
  };
  // piers: carried past the crest to the foundation, dividing the spill between them
  for (let k = 0; k <= bays; k++) {
    const x = opts.left + spacing * k;
    box(x, (opts.base + crown) / 2, 0, pierWidth, crown - opts.base, depth);
    box(x, springing - 0.25, 0, pierWidth + 0.7, 0.5, depth + 0.5, STONE_LIGHT, "edge");
  }
  // arch rings and the spandrel masonry between each ring and its piers
  const voussoirs = opts.simplified ? 5 : 11;
  const courses = opts.simplified ? 2 : 4;
  for (let k = 0; k < bays; k++) {
    const cx = opts.left + spacing * (k + 0.5);
    for (let v = 0; v < voussoirs; v++) {
      const angle = Math.PI * (v + 0.5) / voussoirs, mid = radius + RING / 2;
      box(cx + Math.cos(angle) * mid, springing + Math.sin(angle) * mid, 0,
        Math.PI * mid / voussoirs * 1.3, RING, depth + 0.3, STONE_LIGHT, "edge", angle + Math.PI / 2);
    }
    for (let c = 0; c < courses; c++) {
      const low = springing + (radius + RING) * c / courses;
      const high = springing + (radius + RING) * (c + 1) / courses;
      // clear of the extrados at the course's top, so no course cuts the opening
      const clear = Math.sqrt(Math.max(0, (radius + RING) ** 2 - (high - springing) ** 2));
      for (const side of [-1, 1]) box(cx + side * (clear + radius) / 2, (low + high) / 2, 0, radius - clear, high - low, depth);
    }
  }
  // the spandrel band over the crowns, the roadway slab and its parapets
  box((opts.left + opts.right) / 2, (crown + deck - 0.4) / 2, 0, length, Math.max(0.01, deck - 0.4 - crown), depth);
  box((opts.left + opts.right) / 2, deck, 0, length + 1, 0.8, depth + 1.2, STONE_LIGHT, "edge");
  for (const z of [-(depth + 1.2) / 2 + 0.3, (depth + 1.2) / 2 - 0.3]) {
    box((opts.left + opts.right) / 2, deck + 0.95, z, length + 1, 1.1, 0.4, STONE_LIGHT, "edge");
    const posts = Math.ceil(length / 4);
    for (let k = 0; !opts.simplified && k <= posts; k++) box(opts.left + length * k / posts, deck + 1.25, z, 0.7, 1.9, 0.7, STONE);
  }
  // towers on the piers: a tall one at mid-span, one on each abutment, a pair of
  // turrets at the quarter points once there are bays enough to space them
  const plan: { k: number; height: number; width: number }[] = [
    { k: 0, height: 8, width: pierWidth + 2.2 },
    { k: bays, height: 8, width: pierWidth + 2.2 },
    { k: Math.round(bays / 2), height: 12, width: pierWidth + 3.4 },
  ];
  if (bays >= 6) for (const share of [0.25, 0.75]) plan.push({ k: Math.round(bays * share), height: 6, width: pierWidth + 1.6 });
  const placed = new Set<number>();
  for (const tower of plan) {
    if (placed.has(tower.k)) continue;
    placed.add(tower.k);
    const x = opts.left + spacing * tower.k, w = tower.width, d = Math.max(w, depth + 1.4);
    const head = deck + tower.height;
    box(x, (opts.base + head) / 2, 0, w, head - opts.base, d);
    box(x, head + 0.3, 0, w + 1, 0.6, d + 1, STONE_LIGHT, "edge");
    roofs.push({ x, y: head + 0.6, z: 0, half: Math.max(w, d) / 2 + 0.5, height: Math.max(w, d) * 0.95 });
    if (opts.simplified) continue;
    // arrow slits on both faces, and a turret on each corner of the head
    for (const side of [-1, 1]) for (const level of [0.45, 0.75]) box(x, deck + tower.height * level, side * d / 2, 0.5, 1.6, 0.3, WINDOW, "sign");
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const tx = x + sx * (w / 2 - 0.1), tz = sz * (d / 2 - 0.1), foot = deck + tower.height * 0.5;
      box(tx, (foot + head + 1.2) / 2, tz, 1.4, head + 1.2 - foot, 1.4);
      roofs.push({ x: tx, y: head + 1.2, z: tz, half: 1.05, height: 2.2 });
    }
  }
  return { boxes, roofs };
}
