// The catenary styles (docs/models/sets.md): what holds an overhead line up. The
// game plans the line -- where each mast or pole stands along the track, which side,
// which tracks it serves, where the wires run and where a structure overhead takes
// them -- and draws the wires; a style draws one support from that plan: the railway
// ladder mast with its footing, its arms over a single track or its portal beam over
// a corridor, or the street-tram pole with its bracket arm. The game passes the
// heights it plans with (the railhead, the contact and messenger wires) and the
// sizes its planner leaves room for (a deck pedestal).
//
// Frame: one cross-section of the track. `x` is lateral (the game's right of
// travel), `y` is world height, `along` the offset along the track.
//
// Pure data and functions, no imports: bundled into export/sets/catenaryStyle.js.

/** Which buffer a part draws into: the steel, a footing's concrete, an insulator, or the wire. */
export type CatenaryMaterial = "column" | "footing" | "insulator" | "wire";

export type CatenaryPart =
  /** A box `sx` across, `sy` tall and `sz` along the track, centred at (x, y), `along` down the track. */
  | { shape: "box"; x: number; y: number; along: number; sx: number; sy: number; sz: number; material: CatenaryMaterial }
  /** A square bar `thick` wide between two points of the cross-section. */
  | { shape: "bar"; ax: number; ay: number; bx: number; by: number; thick: number; material: CatenaryMaterial }
  /** A round pole from y0 up to y1, `radius` at the top and `bottomRadius` at the foot. */
  | { shape: "pole"; x: number; y0: number; y1: number; radius: number; bottomRadius: number; material: CatenaryMaterial };

/** One style: the support it draws. */
export interface CatenaryStyleData { support: "mast" | "pole" }

export const TYPE_META: Record<string, CatenaryStyleData> = {
  rail_mast: { support: "mast" },
  tram_pole: { support: "pole" },
};

// --- the railway mast (studs) ---
/** Mast top above the railhead. */
export const MAST_HEIGHT = 11.2;
export const MAST_THICKNESS = 0.22;
/** The two uprights of a ladder mast, along the track. */
export const MAST_UPRIGHT_SPACING = 0.55;
const MAST_RUNG_COUNT = 8;
export const ARM_THICKNESS = 0.18;
const PORTAL_BEAM_THICKNESS = 0.3;
/** A ground mast's footing: sunk below the ground, standing proud of it, and its width. */
export const FOOTING_SINK = 0.4;
export const FOOTING_RISE = 0.7;
export const FOOTING_WIDTH = 1.5;

/** One planned mast, and the heights it is drawn to (y relative to the ground beside the bed). */
export interface MastInput {
  /** The lateral offset of each upright: one is a trackside mast, two a portal. */
  uprights: number[];
  /** The lateral offset of each track it serves. */
  drops: number[];
  /** Standing on a bridge deck (on a pedestal) rather than buried beside the bed. */
  deck: boolean;
  /** The ground's world height at the mast. */
  groundY: number;
  /** The railhead above the ground, and the contact and messenger wires above the railhead. */
  railTop: number;
  contact: number;
  messenger: number;
  /** A deck's top above the ground (the rail's), and the pedestal width the planner leaves room for. */
  deckRise: number;
  deckFootingWidth: number;
  /** The wire's thickness (a portal's steady rod is half as thick again). */
  wire: number;
}

/**
 * A `style` railway mast: per upright a ladder mast (two thin uprights and their
 * rungs) on a footing -- buried beside the bed, or a pedestal on a deck -- then over
 * a corridor a portal beam between the outer tops with a drop, a steady rod and an
 * insulator over every track, or beside a single track the arms reaching over each
 * track it serves. An unknown style draws as the rail mast.
 */
export function mast(_style: string, m: MastInput): CatenaryPart[] {
  const out: CatenaryPart[] = [];
  const railTopY = m.groundY + m.railTop;
  const mastTopY = railTopY + MAST_HEIGHT;
  const ins = ARM_THICKNESS * 1.4;
  const baseY = m.deck ? m.groundY + m.deckRise : m.groundY;
  for (const u of m.uprights) {
    const mastBottomY = m.deck ? baseY : baseY - FOOTING_SINK; // buried with the footing
    const mastHeight = mastTopY - mastBottomY;
    const cy = (mastBottomY + mastTopY) / 2;
    out.push({ shape: "box", x: u, y: cy, along: MAST_UPRIGHT_SPACING / 2, sx: MAST_THICKNESS, sy: mastHeight, sz: MAST_THICKNESS, material: "column" });
    out.push({ shape: "box", x: u, y: cy, along: -MAST_UPRIGHT_SPACING / 2, sx: MAST_THICKNESS, sy: mastHeight, sz: MAST_THICKNESS, material: "column" });
    const rungBase = baseY + FOOTING_RISE;
    for (let rung = 1; rung <= MAST_RUNG_COUNT; rung++) {
      const rungY = rungBase + ((mastTopY - rungBase) * rung) / (MAST_RUNG_COUNT + 1);
      out.push({ shape: "box", x: u, y: rungY, along: 0, sx: MAST_THICKNESS, sy: MAST_THICKNESS, sz: MAST_UPRIGHT_SPACING + MAST_THICKNESS, material: "column" });
    }
    // a deck mast's pedestal is narrower than a buried footing: it stands on the
    // deck between the ballast and the parapet
    const foot = m.deck ? m.deckFootingWidth : FOOTING_WIDTH;
    out.push({
      shape: "box", x: u, along: 0,
      y: m.deck ? baseY + FOOTING_RISE / 2 : baseY + (FOOTING_RISE - FOOTING_SINK) / 2,
      sx: foot, sy: m.deck ? FOOTING_RISE : FOOTING_SINK + FOOTING_RISE, sz: foot, material: "footing",
    });
  }
  if (m.uprights.length >= 2) {
    // portal: the crossbeam, then per track a drop to the messenger, a steady rod
    // to the contact wire and an insulator
    out.push({ shape: "bar", ax: m.uprights[0]!, ay: mastTopY, bx: m.uprights[m.uprights.length - 1]!, by: mastTopY, thick: PORTAL_BEAM_THICKNESS, material: "column" });
    for (const drop of m.drops) {
      out.push({ shape: "bar", ax: drop, ay: mastTopY, bx: drop, by: railTopY + m.messenger, thick: ARM_THICKNESS, material: "column" });
      out.push({ shape: "bar", ax: drop, ay: railTopY + m.messenger, bx: drop, by: railTopY + m.contact, thick: m.wire * 1.5, material: "column" });
      out.push({ shape: "box", x: drop, y: railTopY + m.contact, along: 0, sx: ins, sy: ins, sz: ins, material: "insulator" });
    }
  } else if (m.uprights.length === 1) {
    // trackside: a horizontal arm and two diagonals reaching over each served track
    const u = m.uprights[0]!;
    for (const drop of m.drops) {
      out.push({ shape: "bar", ax: u, ay: railTopY + m.contact, bx: drop, by: railTopY + m.contact, thick: ARM_THICKNESS, material: "column" });
      out.push({ shape: "bar", ax: u, ay: mastTopY, bx: drop, by: railTopY + m.contact, thick: ARM_THICKNESS, material: "column" });
      out.push({ shape: "bar", ax: u, ay: mastTopY, bx: drop, by: railTopY + m.messenger, thick: ARM_THICKNESS, material: "column" });
      out.push({ shape: "box", x: drop, y: railTopY + m.contact, along: 0, sx: ins, sy: ins, sz: ins, material: "insulator" });
    }
  }
  return out;
}

// --- the street-tram pole (studs) ---
export const POLE_RADIUS = 0.16;
const POLE_ARM_THICKNESS = 0.14;
/** The pole top above the trolley wire. */
export const POLE_TOP_ABOVE_WIRE = 1.2;

/** One planned pole, and the heights it is drawn to. */
export interface PoleInput {
  /** The pole's lateral offset, and every track's. */
  offset: number;
  offsets: number[];
  /** The ground's world height at the pole, and the world height of each track's running surface. */
  groundY: number;
  trackYs: number[];
  /** The trolley wire above a track's running surface. */
  wireLift: number;
  /** Standing on a bridge deck, `deckRise` above the road, on a pedestal. */
  deck: boolean;
  deckRise: number;
  /** The wire's thickness (each drop is half as thick again). */
  wire: number;
}

/**
 * A `style` tram pole: a round pole from below the ground (or a deck pedestal) to
 * above the wire, a bracket arm from its top out over the farthest track, and a short
 * drop to the wire over every track the arm crosses. An unknown style draws as the
 * tram pole.
 */
export function pole(_style: string, p: PoleInput): CatenaryPart[] {
  const out: CatenaryPart[] = [];
  const supportY = Math.max(p.groundY, ...p.trackYs);
  const topY = supportY + p.wireLift + POLE_TOP_ABOVE_WIRE;
  const bottomY = p.deck ? p.groundY + p.deckRise : p.groundY - 0.4;
  if (p.deck) out.push({ shape: "box", x: p.offset, y: bottomY + 0.1, along: 0, sx: 0.45, sy: 0.2, sz: 0.45, material: "column" });
  out.push({ shape: "pole", x: p.offset, y0: bottomY, y1: topY, radius: POLE_RADIUS, bottomRadius: POLE_RADIUS * 1.25, material: "column" });
  const side = p.offset >= 0 ? 1 : -1;
  let far = 0;
  for (const off of p.offsets) far = Math.max(far, Math.abs(p.offset - off));
  const armEndX = p.offset - side * (far + 0.4), armEndY = supportY + p.wireLift + 0.35;
  const armStartY = topY - 0.15;
  out.push({ shape: "bar", ax: p.offset, ay: armStartY, bx: armEndX, by: armEndY, thick: POLE_ARM_THICKNESS, material: "column" });
  p.offsets.forEach((off, i) => {
    // the arm's height over this track, then a short drop to the wire plane
    const span = armEndX - p.offset;
    const t = Math.abs(span) > 1e-9 ? Math.min(1, Math.max(0, (off - p.offset) / span)) : 0;
    const armY = armStartY + (armEndY - armStartY) * t;
    out.push({ shape: "bar", ax: off, ay: armY, bx: off, by: p.trackYs[i]! + p.wireLift, thick: p.wire * 1.5, material: "wire" });
  });
  return out;
}
