// The airport types (docs/models/sets.md, docs/models/airfield.md). The game's layout
// solver owns WHERE everything is -- runways, taxiways, stands, the terminal pad, the
// helipads, the footprint -- and saves it in the map as positions that never move,
// since aircraft are routed over them. This module owns what is DRAWN on such a saved
// layout: the whole airfield (`airfield(layout, type, heading)`: the paved deck, the
// runway paint and numbers, edge lights, taxiway lines, stop bars, jet bridges, the
// helipads, the terminal, the name board and the perimeter fence), its far level
// (`airfieldLowDetail`), and the heights a vehicle stands at on it (`APRON_SURFACE`,
// `PAD_SURFACE`). A type decides the terminal on its pad (`terminal`), the props round
// it -- the control tower and the windsock (generator/props/airportProps.ts), placed
// at the furniture scale -- its helipads (`TYPE_META`, `helipad`), its pavement
// surface, and the paint and fittings on the field. A heliport has pads and no runway
// (`runways: false`).
//
// Pure data, no imports: bundled into export/sets/airport.js for the game.

export type Rgb = [number, number, number];
export type TerminalMaterial = "brick" | "wood" | "roof" | "steel" | "glass" | "sign" | "column" | "platform" | "edge" | "safety" | "light";

/**
 * One box in the airport's local frame (X across the runways, positive toward the
 * terminal; Z along them; Y up from the airport's origin, at apron level): the game's
 * station box vocabulary. The game reacts to these tags, so they are the contract:
 *
 * - `depthLayer` 1 is the paved deck and 2 the paint on it: each layer gets its own
 *   depth bias; the far level keeps layer 1; the fence opens where layer 1 meets it.
 * - `material: "light"` is a runway edge light, which the game flashes.
 * - `material: "wood"` on layer 2 at a grass field is a mown runway edge, which the
 *   game textures with the grass photo.
 * - `lod: "shell"` is kept by the far level; every other box is a near-only fitting.
 * - `label: true` is the name board, across whose large faces the game paints the
 *   airport's name.
 */
export interface TerminalBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  color: Rgb;
  material: TerminalMaterial;
  rotZ?: number;
  profile?: "gable";
  /** Kept by the far level; every other box is near-only fitting. */
  lod?: "shell";
  /** 1: the paved deck; 2: the paint on it. */
  depthLayer?: number;
  /** The name board. */
  label?: boolean;
}

/** Every box the airfield is drawn from: the terminal's vocabulary. */
export type AirfieldBox = TerminalBox;

/** The terminal pad, as the game's layout lays it out. */
export interface TerminalPad { cx: number; cz: number; w: number; d: number }

/**
 * A helipad's class: the largest helicopter it takes, by the helicopter's D-value
 * (its overall length with the rotors turning; the factory's design.ts HELIPAD_D):
 * a small pad up to 16 m, a large one up to 26 m.
 */
export type HelipadClass = "small" | "large";

/** The side of a pad's square touchdown area, studs: its D-value at 1.5 studs a metre, rounded up. */
export const HELIPAD_SIDE: Record<HelipadClass, number> = { small: 24, large: 39 };

/** Per type's helipads: how many the layout lays out beside the terminal, and their class (count 0: none). */
export interface HelipadMeta { count: number; pad: HelipadClass }

/**
 * Per type: the tower it raises (none on a grass field or a heliport), the
 * windsock, whether its layout has runways (a heliport has none: pads only) and its
 * helipads.
 */
export const TYPE_META: Record<string, {
  tower: { prop: string; values: Record<string, string> } | null;
  windsock: { prop: string };
  runways: boolean;
  helipads: HelipadMeta;
  /** The named surface the deck is paved with (generator/surfaces.ts); the game binds its photo. */
  surface: string;
}> = {
  grass_field: { tower: null, windsock: { prop: "proc-prop-airport-windsock" }, runways: true, helipads: { count: 0, pad: "small" }, surface: "airport-grass" },
  regional: { tower: { prop: "proc-prop-airport-tower", values: { kind: "regional" } }, windsock: { prop: "proc-prop-airport-windsock" }, runways: true, helipads: { count: 1, pad: "large" }, surface: "airport-asphalt" },
  international: { tower: { prop: "proc-prop-airport-tower", values: { kind: "international" } }, windsock: { prop: "proc-prop-airport-windsock" }, runways: true, helipads: { count: 2, pad: "large" }, surface: "airport-concrete" },
  heliport: { tower: null, windsock: { prop: "proc-prop-airport-windsock" }, runways: false, helipads: { count: 4, pad: "large" }, surface: "airport-concrete" },
};

const C: Record<string, Rgb> = {
  cream: [222, 216, 202], concrete: [177, 181, 177], steel: [83, 100, 110],
  roof: [57, 87, 104], glass: [132, 191, 211], white: [236, 231, 214],
  wood: [153, 109, 67], darkWood: [87, 65, 46], red: [166, 65, 44],
  dark: [38, 49, 57], orange: [236, 119, 44], blue: [57, 111, 142],
};

/** The pad depth at which the furniture is drawn full size (the largest airport's). */
const FULL_SIZE_DEPTH = 48;
/** The control tower's full-size shaft height, by kind. */
const TOWER_HEIGHT = { regional: 28, international: 48 };

/**
 * Where the terminal's furniture stands and how big it is drawn: `scale` (0.45..1,
 * from the pad), the hall's eave `height`, the tower's foot and shaft height (the
 * tower prop is drawn full size and placed at `scale`), and the windsock's mast head.
 */
export function furniture(pad: TerminalPad, type: string): {
  scale: number; height: number; tower: { x: number; z: number; height: number }; windsock: { x: number; z: number; y: number };
} {
  const scale = Math.max(0.45, Math.min(1, pad.w / FULL_SIZE_DEPTH));
  const height = (type === "grass_field" ? 12 : type === "heliport" ? 10 : type === "regional" ? 18 : 26) * scale;
  const towerHeight = (type === "international" ? TOWER_HEIGHT.international : TOWER_HEIGHT.regional) * scale;
  // keep even the gallery inside the pad, including on a one-stand layout
  const tower = { x: pad.cx + pad.w * 0.22, z: pad.cz + pad.d * 0.39, height: towerHeight };
  const windsock = { x: pad.cx - pad.w * 0.3, z: pad.cz - pad.d * 0.43, y: height + 9 * scale };
  return { scale, height, tower, windsock };
}

/**
 * The terminal a type builds on `pad`: the hall (or a grass field's flying club and
 * hangar), its roof works, the windsock's mast and a service cabinet. The control
 * tower is a prop the game places at `furniture(pad, type).tower`.
 */
export function terminal(pad: TerminalPad, type: string): TerminalBox[] {
  const out: TerminalBox[] = [];
  const b = pad;
  const { scale: s, height: h, windsock } = furniture(pad, type);
  const front = b.cx - b.w / 2;
  const back = b.cx + b.w / 2;
  const add = (x: number, y: number, z: number, w: number, hh: number, d: number, color: Rgb, material: TerminalMaterial, extra: Partial<TerminalBox> = {}): void => {
    out.push({ cx: x, cy: y, cz: z, sx: w, sy: hh, sz: d, color, material, ...extra });
  };
  // bury joints into their supporting surface to avoid coincident faces
  const stand = (x: number, base: number, z: number, w: number, hh: number, d: number, color: Rgb, material: TerminalMaterial, extra: Partial<TerminalBox> = {}): void =>
    add(x, base + hh / 2 - 0.2, z, w, hh + 0.4, d, color, material, extra);
  const shell = { lod: "shell" } as const;

  if (type === "heliport") {
    // a low glazed operations building with a flat roof, an orange band and a rooftop plant box
    const hallD = b.d * 0.8;
    stand(b.cx, 0, b.cz, b.w * 0.9, 1.2 * s, hallD, C.concrete!, "brick", shell);
    stand(b.cx + b.w * 0.05, 1.2 * s, b.cz, b.w * 0.75, h - 1.2 * s, hallD - s, C.white!, "brick", shell);
    add(front + b.w * 0.07, h * 0.5, b.cz, 0.22, h * 0.6, hallD * 0.86, C.glass!, "glass");
    stand(b.cx, h, b.cz, b.w * 0.92, 0.8 * s, hallD + 0.6 * s, C.roof!, "roof", shell);
    add(front + b.w * 0.06, h * 0.9, b.cz, 0.3, 0.9 * s, hallD * 0.9, C.orange!, "steel");
    stand(b.cx + b.w * 0.2, h + 0.8 * s - 0.2, b.cz + hallD * 0.2, 4 * s, 1.8 * s + 0.2, 5 * s, C.steel!, "steel");
    for (const dz of [-0.3, 0.3]) stand(front + b.w * 0.04, 1.2 * s, b.cz + hallD * dz, 0.4 * s, h * 0.62, 0.5 * s, C.steel!, "steel");
  } else if (type === "grass_field") {
    // a low red-roofed flying club beside a taller, recessed hangar
    const clubZ = b.cz - b.d * 0.325;
    const clubD = b.d * 0.32;
    stand(b.cx, 0, clubZ, b.w * 0.96, h * 0.69, clubD, C.cream!, "wood", shell);
    stand(b.cx, h * 0.69, clubZ, b.w, h * 0.31, clubD + s, C.red!, "roof", { ...shell, profile: "gable" });
    const hangZ = b.cz + b.d * 0.17;
    const hangD = b.d * 0.61;
    stand(back - 1.5 * s, 0, hangZ, 3 * s, h, hangD, C.wood!, "wood", shell);
    for (const side of [-1, 1]) stand(b.cx - 1.5 * s, 0, hangZ + side * (hangD / 2 - s), b.w - 3 * s, h, 2 * s, C.wood!, "wood", shell);
    add(back - 3.1 * s, h * 0.43, hangZ, 0.3, h * 0.83, hangD - 5 * s, C.darkWood!, "wood", shell);
    stand(b.cx, h, hangZ, b.w, h * 0.35, hangD + s, C.roof!, "roof", { ...shell, profile: "gable" });
    add(front + s, h * 0.88, hangZ, 2 * s, h * 0.23, hangD, C.darkWood!, "wood", shell);
    // sliding door leaves, tracks and the repeated corrugated wall ribs
    for (const side of [-1, 1]) stand(front + 0.7 * s, 0, hangZ + side * hangD * 0.38, 0.8 * s, h * 0.76, hangD * 0.18, C.steel!, "steel");
    add(front - 0.15 * s, h * 0.79, hangZ, 0.6 * s, 0.5 * s, hangD * 0.96, C.white!, "steel");
    const ribs = Math.max(4, Math.ceil(hangD / (7 * s)));
    for (let i = 0; i <= ribs; i++) {
      const z = hangZ - hangD * 0.46 + i * hangD * 0.92 / ribs;
      stand(back - 0.15 * s, 0, z, 0.6 * s, h * 0.98, 0.5 * s, C.darkWood!, "wood");
    }
    for (const dz of [-0.3, 0.3]) {
      add(front - 0.1, h * 0.43, clubZ + clubD * dz, 0.4, h * 0.28, 4 * s, C.white!, "wood");
      add(front - 0.35, h * 0.43, clubZ + clubD * dz, 0.15, h * 0.22, 3.2 * s, C.glass!, "glass");
    }
    stand(front - 0.15, 0, clubZ, 0.5, h * 0.53, 3.1 * s, C.darkWood!, "wood");
    // porch and braces belong to the club, clear of the parking stands
    add(front - 2 * s, h * 0.6, clubZ, 5 * s, 0.65 * s, clubD * 0.88, C.red!, "roof", shell);
    for (const side of [-1, 1]) stand(front - 4 * s, 0, clubZ + side * clubD * 0.37, 0.7 * s, h * 0.62, 0.7 * s, C.white!, "wood", shell);
  } else {
    const intl = type === "international";
    const hallD = b.d * 0.91;
    stand(b.cx, 0, b.cz, b.w, 1.7 * s, hallD, C.concrete!, "brick", shell);
    // the landside wall inset under the roof and plinth: flush faces would shimmer
    stand(b.cx + b.w * 0.06, 1.7 * s, b.cz, b.w * 0.84, h - 1.7 * s, hallD - s, C.cream!, "brick", shell);
    stand(front + b.w * 0.06, 2 * s, b.cz, 0.6 * s, h * 0.7, hallD * 0.93, C.glass!, "roof", shell);
    add(front - 0.12, h * 0.46, b.cz, 0.22, h * 0.66, hallD * 0.91, C.glass!, "glass");
    const bays = Math.max(3, Math.ceil(hallD / (14 * s)));
    for (let i = 0; i <= bays; i++) {
      const z = b.cz - hallD * 0.47 + i * hallD * 0.94 / bays;
      stand(front - 0.3 * s, 1.6 * s, z, 0.8 * s, h * 0.78, 0.65 * s, C.white!, "steel");
      add(back - b.w * 0.02 + 0.04, h * 0.53, z, 0.16, h * 0.33, hallD * 0.75 / bays, C.blue!, "roof");
    }
    add(front - 0.5 * s, h * 0.48, b.cz, 0.7 * s, 0.6 * s, hallD * 0.96, C.steel!, "steel");
    for (const dz of [-2.5, 2.5]) stand(front - 0.65 * s, 1.8 * s, b.cz + dz * s, 0.4 * s, 4.3 * s, 3.3 * s, C.dark!, "sign");
    stand(b.cx, h, b.cz, b.w, 1.1 * s, hallD + s, C.roof!, "roof", shell);
    if (intl) {
      // a solid header above the glazing carries the airport name, above the gates
      stand(front, h * 0.78, b.cz, s, h * 0.22, hallD, C.roof!, "roof", shell);
      // broad folded roof bays and raised skylights
      const folds = Math.max(3, Math.ceil(hallD / (32 * s)));
      const pitch = hallD / folds;
      for (let i = 0; i < folds; i++) {
        const z = b.cz - hallD / 2 + (i + 0.5) * pitch;
        stand(b.cx - b.w * 0.04, h + 1.1 * s, z, b.w * 0.9, 5 * s, pitch * 0.84, C.white!, "roof", { ...shell, profile: "gable" });
        add(b.cx - b.w * 0.03, h + 6.2 * s, z, b.w * 0.25, 0.4 * s, pitch * 0.68, C.blue!, "roof");
      }
      // a lower departure concourse at the opposite end from the control tower
      stand(b.cx, 0, b.cz - b.d * 0.47, b.w * 0.86, h * 0.61, b.d * 0.06, C.glass!, "roof", shell);
      stand(b.cx, h * 0.61, b.cz - b.d * 0.47, b.w * 0.9, 0.8 * s, b.d * 0.065, C.white!, "roof", shell);
    } else {
      // regional sawtooth clerestories, a projecting blue canopy and solar panels
      const teeth = Math.max(3, Math.ceil(hallD / (27 * s)));
      for (let i = 0; i < teeth; i++) {
        const z = b.cz - hallD * 0.38 + (i + 0.5) * hallD * 0.7 / teeth;
        stand(b.cx - b.w * 0.07, h + 1.1 * s, z, b.w * 0.45, 3.7 * s, hallD * 0.53 / teeth, C.glass!, "roof", { ...shell, profile: "gable" });
        add(b.cx + b.w * 0.31, h + 1.95 * s, z, b.w * 0.2, 0.35 * s, hallD * 0.47 / teeth, C.blue!, "steel", { rotZ: 0.12 });
      }
      add(front - 2.3 * s, h * 0.76, b.cz, 6 * s, 0.8 * s, hallD * 0.91, C.blue!, "roof", shell);
    }
    // roof plant with inset ventilation grilles, tucked behind the glass frontage
    for (const frac of [-0.24, 0.17]) {
      const z = b.cz + hallD * frac;
      stand(b.cx + b.w * 0.27, h + 1.1 * s - 0.2, z, 5 * s, 2.6 * s + 0.2, 6 * s, C.steel!, "steel");
      for (let i = -1; i <= 1; i++) add(b.cx + b.w * 0.27 + i * s, h + 3.85 * s, z, 0.45 * s, 0.15 * s, 4.5 * s, C.dark!, "steel");
    }
  }
  // every type has a windsock: its pole is the terminal's, the fabric a prop the game swings
  const poleBase = type === "grass_field" ? h * 0.6 : h - 0.2;
  stand(windsock.x, poleBase, windsock.z, 0.5 * s, windsock.y - poleBase, 0.5 * s, C.white!, "steel");
  // a service cabinet at the frontage, clear of parked aircraft noses
  const serviceZ = b.cz - b.d * 0.41;
  stand(front - 2.5 * s, 0, serviceZ, 4 * s, 2.8 * s, 3 * s, C.orange!, "steel");
  return out;
}

/** One helipad the game's layout places: the touchdown square's centre (airport-local studs, on the ground) and its class. */
export interface HelipadSite { cx: number; cz: number; pad: HelipadClass }

/**
 * The boxes of one helipad on `site`: a concrete slab a little above the apron,
 * its white edge and the yellow aiming circle (an octagon of stripes), the "H"
 * along local Z, and four green edge lights at the corners. Axis-aligned, so the
 * "H" reads along the airport's runway heading (or, at a heliport, its own).
 */
export function helipad(site: HelipadSite, _type: string): TerminalBox[] {
  const out: TerminalBox[] = [];
  const side = HELIPAD_SIDE[site.pad];
  const half = side / 2;
  const k = side / HELIPAD_SIDE.large;
  const slab = 0.3;
  const paint = 0.06;
  const top = slab + paint / 2 - 0.02;
  const add = (x: number, y: number, z: number, w: number, hh: number, d: number, color: Rgb, material: TerminalMaterial, extra: Partial<TerminalBox> = {}): void => {
    out.push({ cx: site.cx + x, cy: y, cz: site.cz + z, sx: w, sy: hh, sz: d, color, material, ...extra });
  };
  // the slab, buried a little into the apron so no face is coplanar with it
  add(0, (slab - 0.1) / 2, 0, side, slab + 0.1, side, C.concrete!, "platform", { lod: "shell" });
  // the white edge
  const e = 0.6 * k;
  for (const sgn of [-1, 1]) {
    add(0, top, sgn * (half - e / 2 - 0.3 * k), side - 0.6 * k, paint, e, C.white!, "edge");
    add(sgn * (half - e / 2 - 0.3 * k), top + 0.004, 0, e, paint, side - 2 * e - 0.6 * k, C.white!, "edge");
  }
  // the yellow aiming circle: eight stripes round an octagon
  const r = half * 0.62;
  const sw = 0.9 * k;
  const chord = 2 * r * Math.tan(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const [cx, cz] = [r * Math.cos(a), r * Math.sin(a)];
    // the stripes square to x and z are boxes; the diagonal four are short runs of boxes
    if (i % 2 === 0) add(cx, top + 0.008, cz, Math.abs(Math.cos(a)) > 0.5 ? sw : chord, paint, Math.abs(Math.cos(a)) > 0.5 ? chord : sw, C.orange!, "safety");
    else {
      const steps = 3;
      for (let j = 0; j < steps; j++) {
        const t = (j + 0.5) / steps - 0.5;
        add(cx - Math.sin(a) * t * chord, top + 0.008, cz + Math.cos(a) * t * chord, chord / steps + sw * 0.4, paint, chord / steps + sw * 0.4, C.orange!, "safety");
      }
    }
  }
  // the "H": two uprights along z and the bar
  const hh = side * 0.34;
  const hw = side * 0.22;
  const bar = 1.2 * k;
  for (const sgn of [-1, 1]) add(sgn * (hw / 2 - bar / 2), top + 0.012, 0, bar, paint, hh, C.white!, "edge");
  add(0, top + 0.016, 0, hw - 2 * bar + 0.02, paint, bar, C.white!, "edge");
  // green edge lights at the corners, standing on the slab
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(sx * (half - 0.9 * k), slab + 0.25, sz * (half - 0.9 * k), 0.5, 0.5, 0.5, [60, 200, 90], "light");
  return out;
}

// --- the airfield --------------------------------------------------------------
//
// What `airfield` reads of the game's saved layout (the game's AirportLayout, in
// airport-local studs). The layout is solved once by the game and never re-solved, so
// every shape a saved map can hold must draw: several runways (from when they were
// buildable), no `pads` (from before helipads), no runways at all (a heliport). Every
// edge runs along an axis -- the ladder's rungs across, the spine and the stubs along --
// which every layout the game generates does; a diagonal one would come with a new
// layout version on the game's side.

/** One junction of the taxi graph. */
export interface AirfieldNode { id: number; x: number; z: number }
/** One taxiway between two nodes, `width` studs wide. */
export interface AirfieldEdge { id: number; a: number; b: number; width: number; kind: "spine" | "runwayLink" | "standLink" }
/** A runway rectangle centred on (cx, cz), running along local Z. */
export interface AirfieldRunway { id: number; cx: number; cz: number; length: number; width: number }
/** A stand an aircraft parks in, nose-in toward the terminal. */
export interface AirfieldStand { id: number; x: number; z: number }
/** A helipad's touchdown square: its centre and class. */
export interface AirfieldPad { id: number; cx: number; cz: number; pad: HelipadClass }
/** The rectangle the terrain is flattened to and the fence runs round. */
export interface AirfieldRect { cx: number; cz: number; w: number; d: number }

/** The saved layout, as far as the drawing reads it. */
export interface AirfieldLayout {
  nodes: readonly AirfieldNode[];
  edges: readonly AirfieldEdge[];
  runways: readonly AirfieldRunway[];
  stands: readonly AirfieldStand[];
  pads?: readonly AirfieldPad[];
  building: TerminalPad;
  footprint: AirfieldRect;
}

/** The airfield's boxes, and the perimeter fittings the far level never sees. */
export interface Airfield { boxes: AirfieldBox[]; details: AirfieldBox[] }

// --- heights (studs, relative to the airport origin, which sits at apron level) ---
// There is ONE deck. Runway, taxiways and stands are a single surface at a single
// height, in a single material, and no two of the rectangles it is drawn from overlap
// each other -- `pavementDeck` cuts the union of them into disjoint pieces before any
// box is emitted. Overlapping coplanar faces in one merged mesh z-fight per pixel;
// separating them in height instead (as a ladder of decks once did) reads as steps in
// the tarmac. The deck stands clear of the game's terrain flatten tolerance (0.1
// studs) by 5x, or graded ground pokes through it.
const PAVE_THICKNESS = 1;
/** The one height every square stud of an airport's pavement sits at. */
const PAVE_TOP = 0.5;
/** How far above the airport's origin an aircraft's wheels stand: the deck's top. */
export const APRON_SURFACE: number = PAVE_TOP;
/** How far above the airport's origin a helicopter's skids rest on a pad: its slab and paint (0.3 + 0.06). */
export const PAD_SURFACE: number = 0.36;
// Painted markings sit at ONE level above the deck and never overlap each other in
// plan (a joining line is trimmed back half a line width where it meets the spine's).
const PAINT_LIFT = 0.02;
const PAINT_THICKNESS = 0.12;
// Depth-bias layers (TerminalBox.depthLayer): the tarmac, and the paint on it.
const LAYER_PAVE = 1;
const LAYER_PAINT = 2;
/**
 * The widest runway and taxiway the game lays out (its big class). The paint is sized
 * to the big runway and scales down by a runway's own saved width; the stand pads are
 * sized from the big taxiway and clamped to a layout's own stand spacing. These are
 * drawing constants: a saved layout carries its own widths.
 */
export const RUNWAY_WIDTH: number = 92;
export const TAXIWAY_WIDTH: number = 30;
// Runway centreline dashes, threshold bars and the taxi line, sized to a 92-wide runway.
const DASH_LENGTH = 30;
const DASH_GAP = 34;
const DASH_WIDTH = 3;
// Taxiway centreline.
const TAXI_LINE_WIDTH = 2;
// Runway edge lights.
const EDGE_LIGHT_SPACING = 40;
const EDGE_LIGHT_SIZE = 1.2;
const EDGE_LIGHT_HEIGHT = 1.4;
// Enclosed passenger bridges at international gates.
const BRIDGE_LENGTH = 28;
const BRIDGE_WIDTH = 4.5;
const BRIDGE_HEIGHT = 4;
const BRIDGE_LIFT = 6.5;
// Name board on the terminal frontage.
const BOARD_WIDTH = 34;
const BOARD_HEIGHT = 4.5;
const BOARD_THICKNESS = 0.4;
const BOARD_POST = 0.7;
const BOARD_LIFT = 4.5;

// Linear RGB averages of the tinted surface photos the game paves with, so the plain
// distant deck keeps the same overall hue and brightness when the textures go.
const ASPHALT: Rgb = [31, 33, 33];
const CONCRETE: Rgb = [76, 77, 69];
const GRASS_STRIP: Rgb = [39, 42, 10];
const GRASS_STRIP_DARK: Rgb = [28, 30, 7];
const PAINT_WHITE: Rgb = [236, 238, 240];
const PAINT_YELLOW: Rgb = [226, 190, 60];
const STEEL_GREY: Rgb = [92, 98, 106];
const SIGN: Rgb = [30, 50, 80];
const LAMP_GLOW: Rgb = [255, 236, 178];

function box(
  cx: number, cy: number, cz: number, sx: number, sy: number, sz: number,
  color: Rgb, material: TerminalMaterial, extra?: Partial<TerminalBox>,
): TerminalBox {
  return { cx, cy, cz, sx, sy, sz, color, material, ...extra };
}

/**
 * How far a box that STANDS ON something sinks into what it stands on: a box that
 * merely butts against the surface under it shares that plane and shimmers. 0.4 studs,
 * four times the terrain flatten's tolerance, so a piece on the ground is buried.
 */
const SEAT = 0.4;

/** A box `height` tall standing on a surface at `base`, its underside sunk SEAT studs. */
function standing(
  cx: number, base: number, cz: number, sx: number, height: number, sz: number,
  color: Rgb, material: TerminalMaterial, extra?: Partial<TerminalBox>,
): TerminalBox {
  return box(cx, base + height / 2 - SEAT / 2, cz, sx, height + SEAT, sz, color, material, extra);
}

/** Centre height of a pavement slab whose TOP sits at `top`. */
function slabY(top: number): number {
  return top - PAVE_THICKNESS / 2;
}

/**
 * How big everything BUILT on this airport is, relative to the biggest class: read
 * off the terminal pad's own saved depth (1 at the big class, about half at the small).
 */
function furnitureScale(layout: AirfieldLayout): number {
  const depth = layout.building.w;
  if (!Number.isFinite(depth) || depth <= 0) return 1;
  return Math.max(0.45, Math.min(1, depth / FULL_SIZE_DEPTH));
}

/** Centre height of every painted line: one level, above the deck. */
function paintY(): number {
  return PAVE_TOP + PAINT_LIFT + PAINT_THICKNESS / 2;
}

/** Smallest gap between neighbouring stands in a layout, for sizing their pads. */
function minStandGap(layout: AirfieldLayout): number {
  const zs = layout.stands.map((st) => st.z).sort((p, q) => p - q);
  let gap = Infinity;
  for (let i = 1; i < zs.length; i++) gap = Math.min(gap, zs[i]! - zs[i - 1]!);
  return gap;
}

/** An axis-aligned rectangle in airport-local space, by its two corners. */
export interface DeckRect { x0: number; x1: number; z0: number; z1: number }

/** The rectangle a box of this centre and size covers in plan. */
function rectOf(cx: number, cz: number, sx: number, sz: number): DeckRect {
  return { x0: cx - sx / 2, x1: cx + sx / 2, z0: cz - sz / 2, z1: cz + sz / 2 };
}

/**
 * Cut the UNION of a set of axis-aligned rectangles into rectangles that cover exactly
 * the same ground and do not overlap each other: every rectangle edge becomes a grid
 * line, the covered cells are marked, and a greedy column-then-row sweep merges them
 * back into maximal rectangles. The grid is tiny (about twenty rectangles at the
 * largest airport) and runs once per airport.
 */
export function pavementDeck(rects: readonly DeckRect[]): DeckRect[] {
  const live = rects.filter((r) => r.x1 - r.x0 > 1e-6 && r.z1 - r.z0 > 1e-6);
  if (live.length === 0) return [];
  const xs = axisLines(live.flatMap((r) => [r.x0, r.x1]));
  const zs = axisLines(live.flatMap((r) => [r.z0, r.z1]));
  const nx = xs.length - 1;
  const nz = zs.length - 1;
  // covered[ix][iz]: is the cell between xs[ix]..xs[ix+1] and zs[iz]..zs[iz+1] paved?
  const covered: boolean[][] = [];
  for (let ix = 0; ix < nx; ix++) {
    const mx = (xs[ix]! + xs[ix + 1]!) / 2;
    const column: boolean[] = [];
    for (let iz = 0; iz < nz; iz++) {
      const mz = (zs[iz]! + zs[iz + 1]!) / 2;
      column.push(live.some((r) => mx > r.x0 && mx < r.x1 && mz > r.z0 && mz < r.z1));
    }
    covered.push(column);
  }

  const out: DeckRect[] = [];
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      if (!covered[ix]![iz]) continue;
      // Grow along Z first (one column of cells), then along X while the whole run
      // stays paved; every cell is consumed exactly once.
      let lastZ = iz;
      while (lastZ + 1 < nz && covered[ix]![lastZ + 1]) lastZ++;
      let lastX = ix;
      while (lastX + 1 < nx) {
        let full = true;
        for (let k = iz; k <= lastZ && full; k++) full = covered[lastX + 1]![k]!;
        if (!full) break;
        lastX++;
      }
      for (let a = ix; a <= lastX; a++) for (let b = iz; b <= lastZ; b++) covered[a]![b] = false;
      out.push({ x0: xs[ix]!, x1: xs[lastX + 1]!, z0: zs[iz]!, z1: zs[lastZ + 1]! });
    }
  }
  return out;
}

/**
 * Sorted, de-duplicated grid lines. The layout rounds to four decimals, so two
 * rectangles meant to butt can land a rounding apart; the tolerance keeps that from
 * becoming an invisible sliver of geometry.
 */
function axisLines(values: readonly number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of sorted) {
    if (out.length === 0 || v - out[out.length - 1]! > 1e-4) out.push(v);
  }
  return out;
}

/**
 * The whole airfield a type draws on a saved layout, in airport-local studs. `heading`
 * is the airport's rotation in degrees, which is literally its runway heading: the
 * runway numbers read it. The type only decides what is drawn ON the layout's
 * geometry -- every rectangle's position and size comes from the layout. `type` is a
 * known type; the game resolves a stored id before it calls.
 */
export function airfield(layout: AirfieldLayout, type: string, heading: number = 0): Airfield {
  const boxes: TerminalBox[] = [];
  const grass = type === "grass_field";
  // ONE surface, so ONE colour and ONE material: which part of the pavement is a
  // runway is said by the paint on it, not by a change of material under it.
  const paveColor = grass ? GRASS_STRIP : type === "regional" ? ASPHALT : CONCRETE;
  const paveMaterial: TerminalMaterial = grass ? "wood" : "platform";

  // --- the deck ---
  const standGap = minStandGap(layout);
  // The stand pad is clamped to the SAVED layout's own stand spacing, so an old frozen
  // layout's pads never run out past its apron.
  const standPad = Math.min(TAXIWAY_WIDTH + 24, standGap - 2);
  const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
  const deck: DeckRect[] = [];
  for (const rw of layout.runways) deck.push(rectOf(rw.cx, rw.cz, rw.width, rw.length));
  for (const e of layout.edges) {
    const a = nodes.get(e.a);
    const b = nodes.get(e.b);
    if (!a || !b) continue;
    // each edge is an axis-aligned slab (see the layout's note above)
    const alongX = Math.abs(a.x - b.x) >= Math.abs(a.z - b.z);
    const len = alongX ? Math.abs(a.x - b.x) + e.width : Math.abs(a.z - b.z) + e.width;
    deck.push(rectOf(
      (a.x + b.x) / 2, (a.z + b.z) / 2,
      alongX ? len : e.width, alongX ? e.width : len,
    ));
  }
  for (const st of layout.stands) deck.push(rectOf(st.x, st.z, standPad, standPad));
  for (const piece of pavementDeck(deck)) {
    boxes.push(box(
      (piece.x0 + piece.x1) / 2, slabY(PAVE_TOP), (piece.z0 + piece.z1) / 2,
      piece.x1 - piece.x0, PAVE_THICKNESS, piece.z1 - piece.z0,
      paveColor, paveMaterial, { depthLayer: LAYER_PAVE },
    ));
  }

  // --- runway markings ---
  for (const rw of layout.runways) {
    if (grass) {
      // A grass strip has no paint: it reads as a runway by the two mown edges worn
      // along it, which also keeps it from vanishing into the field around it.
      for (const dx of [-rw.width / 2 + 1.2, rw.width / 2 - 1.2]) {
        boxes.push(box(rw.cx + dx, paintY(), rw.cz, 2.4, PAINT_THICKNESS, rw.length, GRASS_STRIP_DARK, "wood", { depthLayer: LAYER_PAINT }));
      }
    } else {
      pushRunwayMarkings(boxes, rw, heading);
      pushEdgeLights(boxes, rw.cx, rw.cz, rw.length, rw.width, deck);
    }
  }

  // --- taxiway guide lines ---
  // Where a rung's or a stub's line runs onto the spine's, it is trimmed back half a
  // line width so the two BUTT -- a T of paint, not a stack. Membership is by POSITION:
  // a rung's spine end and the spine's own chain are distinct nodes at one place.
  const spineNodes = new Set<string>();
  for (const e of layout.edges) {
    if (e.kind !== "spine") continue;
    for (const id of [e.a, e.b]) {
      const n = nodes.get(id);
      if (n) spineNodes.add(`${n.x},${n.z}`);
    }
  }
  if (!grass) {
    for (const e of layout.edges) {
      const a = nodes.get(e.a);
      const b = nodes.get(e.b);
      if (!a || !b) continue;
      const cx = (a.x + b.x) / 2;
      const cz = (a.z + b.z) / 2;
      const alongX = Math.abs(a.x - b.x) >= Math.abs(a.z - b.z);
      const len = alongX ? Math.abs(a.x - b.x) + e.width : Math.abs(a.z - b.z) + e.width;
      const trimA = e.kind !== "spine" && spineNodes.has(`${a.x},${a.z}`) ? TAXI_LINE_WIDTH / 2 : 0;
      const trimB = e.kind !== "spine" && spineNodes.has(`${b.x},${b.z}`) ? TAXI_LINE_WIDTH / 2 : 0;
      const lineLen = len - e.width - trimA - trimB;
      if (lineLen <= 0) continue;
      // the trim moves the centre toward the untrimmed end, along the line's axis
      const axisX = alongX ? Math.sign(b.x - a.x) : 0;
      const axisZ = alongX ? 0 : Math.sign(b.z - a.z);
      const shift = (trimA - trimB) / 2;
      boxes.push(box(
        cx + axisX * shift, paintY(), cz + axisZ * shift,
        alongX ? lineLen : TAXI_LINE_WIDTH, PAINT_THICKNESS, alongX ? TAXI_LINE_WIDTH : lineLen,
        PAINT_YELLOW, "sign", { depthLayer: LAYER_PAINT },
      ));
    }
  }

  // --- stands ---
  const scale = furnitureScale(layout);
  for (const st of layout.stands) {
    if (!grass) {
      // the stop bar an aircraft noses up to, across the stand
      boxes.push(box(st.x + standPad / 2 - 3, paintY(), st.z, 1.4, PAINT_THICKNESS, standPad - 6, PAINT_YELLOW, "sign", { depthLayer: LAYER_PAINT }));
    }
    if (type === "international") {
      const len = BRIDGE_LENGTH * scale;
      boxes.push(box(
        layout.building.cx - layout.building.w / 2 - len / 2, (BRIDGE_LIFT + BRIDGE_HEIGHT / 2) * scale, st.z,
        len, BRIDGE_HEIGHT * scale, BRIDGE_WIDTH * scale, STEEL_GREY, "steel", { lod: "shell" },
      ));
      const front = layout.building.cx - layout.building.w / 2;
      // blue window ribbon, roof cap, docking bellows and a supporting bogie
      boxes.push(box(front - len / 2, 8.8 * scale, st.z - 2.3 * scale,
        len * 0.9, 1.8 * scale, 0.2 * scale, [132, 191, 211], "glass"));
      boxes.push(box(front - len / 2, 10.8 * scale, st.z,
        len + scale, 0.7 * scale, 5 * scale, [236, 231, 214], "roof"));
      boxes.push(box(front - len, 8.4 * scale, st.z,
        3 * scale, 4.8 * scale, 5.4 * scale, [38, 49, 57], "roof", { lod: "shell" }));
      boxes.push(standing(front - len + 2 * scale, 0, st.z,
        1.2 * scale, 6.7 * scale, 3.6 * scale, STEEL_GREY, "column", { lod: "shell" }));
      for (const side of [-1, 1]) {
        boxes.push(box(front - len + 2 * scale, 1.1 * scale, st.z + side * 2 * scale,
          2.1 * scale, 1.7 * scale, 0.9 * scale, [38, 49, 57], "roof"));
      }
    }
  }

  // --- helipads ---
  for (const p of layout.pads ?? []) boxes.push(...helipad({ cx: p.cx, cz: p.cz, pad: p.pad }, type));

  // --- the terminal and its name board ---
  boxes.push(...terminal(layout.building, type));
  const b = layout.building;
  const wallLift = type === "international" ? furniture(b, type).height - 5.5 * scale : undefined;
  pushNameBoard(boxes, b.cx - b.w / 2, b.cz, b.d, scale, wallLift);

  return { boxes, details: perimeter(layout, type, boxes) };
}

/** The far level of an airfield's boxes: the deck and the shell masses, glass made opaque. */
export function airfieldLowDetail(boxes: readonly AirfieldBox[]): AirfieldBox[] {
  return boxes.filter((b) => b.depthLayer === 1 || b.lod === "shell")
    .map((b) => b.material === "glass" ? { ...b, material: "roof", color: [132, 191, 211] } : b);
}

// A compact stencil vocabulary of flat paint rectangles, so the runway numbers stay
// sharp without label textures and add nothing to the far level.
const RUNWAY_DIGITS: readonly (readonly string[])[] = [
  ["111", "101", "101", "101", "111"], ["010", "110", "010", "010", "111"],
  ["111", "001", "111", "100", "111"], ["111", "001", "111", "001", "111"],
  ["101", "101", "111", "001", "001"], ["111", "100", "111", "001", "111"],
  ["111", "100", "111", "101", "111"], ["111", "001", "001", "001", "001"],
  ["111", "101", "111", "101", "111"], ["111", "101", "111", "001", "111"],
];

/** The runway designator for a heading in degrees (0 = local +Z), its reciprocal at +180. */
export function runwayNumber(heading: number): string {
  const number = Math.round(((heading % 360) + 360) % 360 / 10) % 36 || 36;
  return String(number).padStart(2, "0");
}

function pushRunwayMarkings(boxes: TerminalBox[], rw: AirfieldRunway, heading: number): void {
  const { cx, cz, width, length } = rw;
  const scale = Math.min(1, width / RUNWAY_WIDTH, length / 360);
  const paint = (x: number, z: number, w: number, d: number): void => {
    boxes.push(box(x, paintY(), z, w, PAINT_THICKNESS, d, PAINT_WHITE, "sign", { depthLayer: LAYER_PAINT }));
  };
  // Both threshold and number zones are left clear of centreline dashes; the side
  // stripes start beyond the end taxiways, so no yellow guide line shares their plane.
  const usable = length - 140 * scale;
  const dash = DASH_LENGTH * scale;
  const pitch = (DASH_LENGTH + DASH_GAP) * scale;
  const count = Math.max(1, Math.floor((usable + DASH_GAP * scale) / pitch));
  const span = (count - 1) * pitch + dash;
  for (let i = 0; i < count; i++) paint(cx, cz - span / 2 + dash / 2 + i * pitch, DASH_WIDTH * scale, dash);
  for (const side of [-1, 1]) {
    paint(cx + side * (width / 2 - 2 * scale), cz, scale, length - 64 * scale);
  }
  for (const end of [-1, 1]) {
    const threshold = cz + end * length / 2;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        paint(cx + side * width * (0.13 + i * 0.08), threshold - end * 18 * scale,
          width * 0.045, 20 * scale);
      }
      paint(cx + side * width * 0.22, threshold - end * length * 0.25, 6 * scale, 24 * scale);
    }
    const number = runwayNumber(heading + (end === 1 ? 180 : 0));
    const cellW = 1.8 * scale, cellD = 3.6 * scale;
    for (let digit = 0; digit < 2; digit++) {
      for (const [row, pixels] of RUNWAY_DIGITS[Number(number[digit])]!.entries()) {
        // consecutive pixels merge into one stroke, so no two strokes overlap
        for (let col = 0; col < 3;) {
          if (pixels[col] === "0") { col++; continue; }
          const start = col;
          while (col < 3 && pixels[col] === "1") col++;
          const x = (digit * 4 + (start + col) / 2 - 3.5) * cellW;
          paint(cx - end * x, threshold - end * (40 * scale + (5 - row - 0.5) * cellD),
            (col - start) * cellW, cellD);
        }
      }
    }
  }
}

function pushEdgeLights(boxes: TerminalBox[], cx: number, cz: number, length: number, width: number, pavement: readonly DeckRect[]): void {
  const count = Math.max(2, Math.round(length / EDGE_LIGHT_SPACING));
  for (let i = 0; i <= count; i++) {
    const z = cz - length / 2 + (i / count) * length;
    for (const dx of [-width / 2 - 1.5, width / 2 + 1.5]) {
      const x = cx + dx;
      const half = EDGE_LIGHT_SIZE / 2;
      // Raised edge lights stand beside the pavement: a gap is left wherever a taxiway
      // joins the runway, rather than a bollard in the aircraft's path.
      if (pavement.some((r) => x + half > r.x0 && x - half < r.x1
        && z + half > r.z0 && z - half < r.z1)) continue;
      boxes.push(standing(x, PAVE_TOP, z, EDGE_LIGHT_SIZE, EDGE_LIGHT_HEIGHT, EDGE_LIGHT_SIZE, LAMP_GLOW, "light"));
    }
  }
}

/** The airport's name board, facing the apron; the game paints the name on it (`label`). */
function pushNameBoard(boxes: TerminalBox[], frontX: number, cz: number, depth: number, scale = 1, wallLift?: number): void {
  const boardWidth = Math.min(BOARD_WIDTH * scale, depth - 6);
  if (boardWidth < 6) return;
  // a hub's board is seated into the upper fascia, clear of every jet bridge
  const x = wallLift === undefined ? frontX - 1.6 : frontX - 0.5 * scale - BOARD_THICKNESS / 2 + 0.1;
  const height = BOARD_HEIGHT * scale;
  const lift = wallLift ?? BOARD_LIFT * scale;
  // The posts stand SEAT proud of the board's top and are buried at the foot. Their
  // centres are hoisted out of the for-of header: the game's bundler mis-parses a
  // for-of whose iterable divides by an identifier the minifier names `of`.
  const postZ = [-boardWidth / 2 + BOARD_POST / 2, boardWidth / 2 - BOARD_POST / 2];
  if (wallLift === undefined) {
    for (const dz of postZ) {
      boxes.push(standing(x, 0, cz + dz, BOARD_POST, lift + height + SEAT, BOARD_POST, STEEL_GREY, "column"));
    }
  }
  boxes.push(
    box(x, lift + height / 2, cz, BOARD_THICKNESS, height, boardWidth, SIGN, "sign", { label: true }),
  );
}

// --- the perimeter ---

/** A rectangle by its centre and size, grown by `margin`. */
function rectAround(cx: number, cz: number, w: number, d: number, margin = 0): DeckRect {
  return { x0: cx - w / 2 - margin, x1: cx + w / 2 + margin, z0: cz - d / 2 - margin, z1: cz + d / 2 + margin };
}

/**
 * The fittings round the saved surfaces, near-only: the perimeter fence (timber on a
 * grass field, steel palings elsewhere), opened wherever the terminal or the deck meets
 * it plus a service gate; and on a grass field the runway marker boards, grass tufts,
 * a fuel cabinet and crates, each only where the footprint leaves room off the pavement.
 */
function perimeter(layout: AirfieldLayout, type: string, pavement: readonly TerminalBox[]): TerminalBox[] {
  const boxes: TerminalBox[] = [];
  const grass = type === "grass_field";
  const f = layout.footprint, b = layout.building;
  const boundary = rectAround(f.cx, f.cz, f.w - 2.4, f.d - 2.4);
  const obstacles = [rectAround(b.cx, b.cz, b.w, b.d, 2),
    ...pavement.filter((p) => p.depthLayer === 1).map((p) => rectAround(p.cx, p.cz, p.sx, p.sz, 2))];
  const add = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number,
    color: Rgb, material: TerminalMaterial, extra: Partial<TerminalBox> = {}): void => {
    boxes.push({ cx, cy, cz, sx, sy, sz, color, material, ...extra });
  };
  const timber: Rgb = [82, 65, 42];
  const steel: Rgb = [54, 67, 66];
  const fenceColor = grass ? timber : steel;
  const fenceMaterial: TerminalMaterial = grass ? "wood" : "steel";
  const height = grass ? 2.4 : 3.6;

  // Openings wherever a saved terminal or pavement meets the boundary; the terminal is
  // the landside entrance, and a service gate is left in the far cross-fence.
  const fence = (alongX: boolean, fixed: number, start: number, end: number): void => {
    let spans: [number, number][] = [[start, end]];
    const cuts = obstacles.filter((r) => alongX ? fixed >= r.z0 && fixed <= r.z1 : fixed >= r.x0 && fixed <= r.x1)
      .map((r): [number, number] => alongX ? [r.x0, r.x1] : [r.z0, r.z1]);
    if (alongX && fixed === boundary.z1) cuts.push([boundary.x1 - 18, boundary.x1 - 6]);
    for (const [lo, hi] of cuts) {
      spans = spans.flatMap(([a, z]): [number, number][] => {
        if (hi <= a || lo >= z) return [[a, z]];
        const out: [number, number][] = [];
        if (lo > a) out.push([a, lo]);
        if (hi < z) out.push([hi, z]);
        return out;
      });
    }
    for (const [a, z] of spans) {
      if (z - a < 2) continue;
      const count = Math.ceil((z - a) / (grass ? 10 : 8));
      const pitch = (z - a) / count;
      const place = (at: number, y: number, length: number, h: number, thickness: number): void => {
        add(alongX ? at : fixed, y, alongX ? fixed : at,
          alongX ? length : thickness, h, alongX ? thickness : length, fenceColor, fenceMaterial);
      };
      for (let i = 0; i <= count; i++) place(a + i * pitch, (height - 0.4) / 2, 0.42, height + 0.4, 0.42);
      for (let i = 0; i < count; i++) {
        for (const y of [height * 0.38, height * 0.82]) {
          place(a + (i + 0.5) * pitch, y, pitch - 0.44, grass ? 0.22 : 0.12, grass ? 0.16 : 0.10);
        }
        if (!grass) {
          // open metal palings read as a security fence without alpha maps
          for (let j = 1; j < 4; j++) place(a + (i + j / 4) * pitch, height / 2, 0.09, height * 0.9, 0.09);
        }
      }
    }
  };
  fence(false, boundary.x0, boundary.z0 + 0.5, boundary.z1 - 0.5);
  fence(false, boundary.x1, boundary.z0 + 0.5, boundary.z1 - 0.5);
  fence(true, boundary.z0, boundary.x0, boundary.x1);
  fence(true, boundary.z1, boundary.x0, boundary.x1);

  if (grass) {
    const clear = (x: number, z: number, w: number, d: number): boolean => {
      const r = rectAround(x, z, w, d);
      return r.x0 > boundary.x0 + 0.5 && r.x1 < boundary.x1 - 0.5
        && r.z0 > boundary.z0 + 0.5 && r.z1 < boundary.z1 - 0.5
        && !obstacles.some((o) => r.x0 < o.x1 && r.x1 > o.x0 && r.z0 < o.z1 && r.z1 > o.z0);
    };
    for (const rw of layout.runways) {
      const count = Math.max(2, Math.floor(rw.length / 36));
      for (const side of [-1, 1]) for (let i = 0; i <= count; i++) {
        const x = rw.cx + side * (rw.width / 2 + 3.3);
        const z = rw.cz - rw.length / 2 + i * rw.length / count;
        if (clear(x, z, 1.4, 2.2)) {
          add(x, 0.42, z, 1.4, 0.84, 2.2, [208, 204, 177], "roof");
          add(x, 0.9, z, 1.1, 0.16, 0.7, [155, 68, 24], "roof");
        }
        // deterministic, irregular tuft spacing, all clumps off the pavement
        const tz = z + 9 + Math.sin(i * 7.13) * 3;
        if (clear(x, tz, 1.5, 2)) {
          for (let blade = 0; blade < 3; blade++) {
            add(x + (blade - 1) * 0.32, 0.43, tz + (blade % 2) * 0.4,
              0.13, 0.85 + blade * 0.12, 0.65, blade === 1 ? [69, 73, 29] : [44, 60, 21], "wood",
              { rotZ: (blade - 1) * 0.3 });
          }
        }
      }
    }
    // a compact fuel cabinet and timber supply crates beside the hangar
    const z = b.cz + b.d / 2 + 4;
    for (let i = 0; i < 3; i++) {
      const x = b.cx - 4 + i * 3;
      if (!clear(x, z, 2, 2)) continue;
      add(x, i === 0 ? 1.3 : 0.65, z, 1.8, i === 0 ? 2.6 : 1.3, 1.8,
        i === 0 ? [116, 39, 23] : timber, i === 0 ? "steel" : "wood");
      add(x, i === 0 ? 2.65 : 1.32, z, 1.95, 0.12, 1.95, [63, 64, 51], "roof");
    }
  }
  return boxes;
}
