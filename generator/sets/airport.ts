// The airport types (docs/models/sets.md, docs/models/airfield.md). The game's layout
// solver owns WHERE everything is -- runways, taxiways, stands, the terminal pad, the
// helipads, the footprint -- and saves it in the map as positions that never move,
// since aircraft are routed over them. This module owns what is DRAWN on such a saved
// layout: the whole airfield (`airfield(layout, type, heading)`: the paved deck, the
// runway paint and numbers, edge lights, taxiway lines, stop bars, the helipads, the
// terminal, the name board and the perimeter fence) with the jet bridges as parts the
// game poses (`JetBridge`, `jetBridgeBoxes`), its far level
// (`airfieldLowDetail`), and the heights a vehicle stands at on it (`APRON_SURFACE`,
// `PAD_SURFACE`). A type decides the terminal on its pad (`terminal`), the props round
// it -- the control tower and the windsock (generator/props/airportProps.ts), placed
// at the furniture scale -- its helipads (`TYPE_META`, `helipad`), its pavement
// surface, and the paint and fittings on the field. A heliport has pads and no runway
// (`runways: false`).
//
// Pure data, no imports: bundled into export/sets/airport.js for the game.

export type Rgb = [number, number, number];
export type TerminalMaterial = "brick" | "wood" | "roof" | "steel" | "glass" | "sign" | "column" | "platform" | "edge" | "safety" | "light" | "netting";

/**
 * The shapes beyond the box, as the station vocabulary has them (docs/models/station-types.md,
 * "Shapes"): the game meshes them with the station set's `stationBoxMesh`, so the
 * airport draws exactly what a station would. Declared here, not imported: this
 * module imports nothing.
 */
export type TerminalShape = "cylinder" | "sphere" | "dome" | "bar" | "arc" | "ring";
export interface TerminalArc { rx: number; ry: number; a0: number; a1: number; thick: number }
export interface TerminalRing { rIn: number; rOut: number; a0?: number; a1?: number; fillet?: boolean }

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
 * - `material: "netting"` is a fence's chain-link mesh: grey, see-through, two-sided.
 */
export interface TerminalBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  color: Rgb;
  material: TerminalMaterial;
  rotZ?: number;
  rotX?: number;
  /** Turn about Y (radians, three.js sense), applied last about the centre; a bar ignores it. */
  rotY?: number;
  profile?: "gable";
  /** A station shape (cylinder, sphere, dome, bar, arc, ring); absent: a box. */
  shape?: TerminalShape;
  /** A round shape's sides, an arc's or a ring's segments. */
  sides?: number;
  /** A bar's two ends. */
  from?: [number, number, number];
  to?: [number, number, number];
  arc?: TerminalArc;
  ring?: TerminalRing;
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
      // broad barrel-vaulted roof bays across the hall, each closed by two end walls
      // (their lower halves sunk in the flat roof) and glazed along its crown; the far
      // level keeps the flat roof under them
      const folds = Math.max(3, Math.ceil(hallD / (32 * s)));
      const pitch = hallD / folds;
      const spring = h + 1.1 * s - 0.2;
      const rise = 5 * s;
      for (let i = 0; i < folds; i++) {
        const z = b.cz - hallD / 2 + (i + 0.5) * pitch;
        const vx = b.cx - b.w * 0.04, half = b.w * 0.45;
        out.push({ cx: vx, cy: spring, cz: z, sx: 2 * half, sy: rise, sz: pitch * 0.84, color: C.white!, material: "roof",
          shape: "arc", sides: 10, arc: { rx: half, ry: rise, a0: Math.PI, a1: 0, thick: 0.5 * s } });
        for (const end of [-1, 1]) {
          out.push({ cx: vx, cy: spring, cz: z + end * (pitch * 0.42 - 0.3 * s), sx: 2 * half - 0.3 * s, sy: 0.3 * s, sz: 2 * rise - 0.3 * s,
            color: C.cream!, material: "brick", shape: "cylinder", sides: 12, rotX: Math.PI / 2 });
        }
        add(vx, spring + rise + 0.15 * s, z, b.w * 0.2, 0.4 * s, pitch * 0.7, C.blue!, "roof");
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
 * its white edge and the yellow aiming circle (one ring of paint), the "H"
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
  // the yellow aiming circle: one flat ring of paint
  const r = half * 0.62;
  const sw = 0.9 * k;
  out.push({ cx: site.cx, cy: top + 0.008, cz: site.cz, sx: 2 * r + sw, sy: paint, sz: 2 * r + sw, color: C.orange!, material: "safety",
    shape: "ring", sides: 32, ring: { rIn: r - sw / 2, rOut: r + sw / 2 } });
  // the "H": two uprights along z and the bar
  const hh = side * 0.34;
  const hw = side * 0.22;
  const bar = 1.2 * k;
  for (const sgn of [-1, 1]) add(sgn * (hw / 2 - bar / 2), top + 0.012, 0, bar, paint, hh, C.white!, "edge");
  add(0, top + 0.016, 0, hw - 2 * bar + 0.02, paint, bar, C.white!, "edge");
  // green edge lights at the corners, their feet seated 0.1 into the slab (a foot on
  // the slab's top face would share its plane and flicker)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(sx * (half - 0.9 * k), slab + 0.2, sz * (half - 0.9 * k), 0.5, 0.6, 0.5, [60, 200, 90], "light");
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

/**
 * The airfield's boxes, the perimeter fittings the far level never sees, and the jet
 * bridges the game poses (one per stand at an international hub; none elsewhere).
 */
export interface Airfield { boxes: AirfieldBox[]; details: AirfieldBox[]; bridges: JetBridge[] }

/**
 * Where a jet bridge stands (docs/models/airfield.md, "Jet bridges"): a pose of its
 * moving parts. Angles are radians in the three.js sense about +Y (a yaw of 0 points
 * along +X, PI/2 along -Z).
 */
export interface JetBridgePose {
  /** The tunnel's heading, from the rotunda out. */
  yaw: number;
  /** In plan, from the rotunda's axis to the tunnel's end (the cab's rear), studs. */
  length: number;
  /** The cab floor's height over the airport origin, studs: the tunnel slopes to it. */
  lift: number;
  /** The cab's heading: the way its door face looks. It turns about the tunnel's end. */
  cabYaw: number;
}

/**
 * One stand's jet bridge, as the game poses it. The fixed link, the rotunda and its
 * column are drawn in the field's `boxes`; the moving parts are here, each in its own
 * frame (studs, Y up):
 *
 * - `outer`: the tunnel frame -- origin on the rotunda's axis at `floor`, +X along the
 *   tunnel (pitched to the cab), the section from `radius` to `radius + BRIDGE_OUTER`.
 * - `inner`: origin at the tunnel's end, the section reaching back along -X.
 * - `cab`: origin at the tunnel's end at the cab floor, kept level, +X its door face.
 * - `bogie`: origin on the apron under the tunnel, `bogieBack` short of its end, +X
 *   along the tunnel in plan: the wheels.
 * - `leg`: the bogie's column, ONE stud tall from y 0: the game stretches it from the
 *   wheels (at `legBase`) up to the tunnel's underside.
 *
 * `rest` is the pose clear of every stand's traffic; `reach`, `lift` and `maxSlope`
 * bound any other. A box's `lod: "shell"` is kept by the far level, which draws the
 * bridge at rest.
 */
export interface JetBridge {
  /** The stand it serves (AirfieldStand.id). */
  stand: number;
  /** The rotunda's axis, airport-local studs. */
  pivot: { x: number; z: number };
  /** The tunnel floor's height at the rotunda. */
  floor: number;
  /** The rotunda's radius: where the outer section starts. */
  radius: number;
  /** The shortest and longest `length`. */
  reach: [number, number];
  /** The lowest and highest cab floor. */
  lift: [number, number];
  /** The steepest slope of the tunnel, rise over run. */
  maxSlope: number;
  /** The cab's depth, rear to door face. */
  cabDepth: number;
  /** How far short of the tunnel's end the bogie stands, in plan. */
  bogieBack: number;
  /** Where the leg starts over the bogie frame's origin, and how far under the tunnel floor it ends. */
  legBase: number;
  legTop: number;
  rest: JetBridgePose;
  parts: { outer: AirfieldBox[]; inner: AirfieldBox[]; cab: AirfieldBox[]; bogie: AirfieldBox[]; leg: AirfieldBox[] };
}

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
// Enclosed passenger bridges at international gates (studs at furniture scale 1).
/** The tunnel's cross-section: the outer section's; the inner one is a tenth smaller. */
const BRIDGE_WIDTH = 4.5;
const BRIDGE_HEIGHT = 4;
/** The tunnel floor's height at the rotunda. */
const BRIDGE_FLOOR = 5;
/** The fixed link out of the glazing to the rotunda, and the rotunda's radius. */
const BRIDGE_LINK = 5;
const BRIDGE_ROTUNDA = 2.8;
/**
 * How far to the parked aircraft's left (-Z) of the stand's centreline the rotunda
 * stands; never nearer than BRIDGE_OFFSET_MIN, so a small hub's bridge at rest still
 * clears a fuselage (aircraft are not drawn at furniture scale).
 */
const BRIDGE_OFFSET = 10;
const BRIDGE_OFFSET_MIN = 6.5;
/** The two telescoping sections, and how much of the inner stays in the outer at full stretch. */
const BRIDGE_OUTER = 11;
const BRIDGE_INNER = 12;
const BRIDGE_OVERLAP = 1;
/** The cab, from its rear (where the tunnel ends) to its door face; the bogie behind the tunnel's end. */
const BRIDGE_CAB = 3;
const BRIDGE_BOGIE = 2.5;
/** How low and how high the cab floor goes (absolute studs: aircraft are not drawn at furniture scale). */
const BRIDGE_LIFT_RANGE: [number, number] = [2, 9];
/** The steepest the tunnel may slope, rise over run. */
const BRIDGE_MAX_SLOPE = 0.15;
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
  const grid = deckGrid(rects);
  if (!grid) return [];
  const { xs, zs, covered } = grid;
  const nx = xs.length - 1;
  const nz = zs.length - 1;

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
 * The grid every rectangle edge of a union draws: its lines and, per cell, whether the
 * union paves it (`covered[ix][iz]`: the cell between xs[ix]..xs[ix+1] and
 * zs[iz]..zs[iz+1]). Null for an empty union.
 */
function deckGrid(rects: readonly DeckRect[]): { xs: number[]; zs: number[]; covered: boolean[][] } | null {
  const live = rects.filter((r) => r.x1 - r.x0 > 1e-6 && r.z1 - r.z0 > 1e-6);
  if (live.length === 0) return null;
  const xs = axisLines(live.flatMap((r) => [r.x0, r.x1]));
  const zs = axisLines(live.flatMap((r) => [r.z0, r.z1]));
  const covered: boolean[][] = [];
  for (let ix = 0; ix < xs.length - 1; ix++) {
    const mx = (xs[ix]! + xs[ix + 1]!) / 2;
    const column: boolean[] = [];
    for (let iz = 0; iz < zs.length - 1; iz++) {
      const mz = (zs[iz]! + zs[iz + 1]!) / 2;
      column.push(live.some((r) => mx > r.x0 && mx < r.x1 && mz > r.z0 && mz < r.z1));
    }
    covered.push(column);
  }
  return { xs, zs, covered };
}

/** Whether two plan rectangles overlap (touching edges do not). */
function overlaps(a: DeckRect, b: DeckRect, margin = 0): boolean {
  return a.x0 < b.x1 + margin - 1e-6 && b.x0 < a.x1 + margin - 1e-6 && a.z0 < b.z1 + margin - 1e-6 && b.z0 < a.z1 + margin - 1e-6;
}

/** The share of the open ground before the next pavement a fillet may take, either way. */
const FILLET_GAP_SHARE = 0.35;

/** One rounded inside corner of the pavement: the corner, the way it opens and its radius. */
export interface DeckFillet { x: number; z: number; dx: 1 | -1; dz: 1 | -1; r: number; rect: DeckRect }

/**
 * The inside corners of the paved union, each rounded by a fillet: every grid vertex
 * three of whose four cells are paved is a corner, opening into the fourth. Its radius
 * is `radius`, at most FILLET_GAP_SHARE of the open ground before the next pavement
 * along either axis (two corners facing across a gap leave grass between them), cut down (to 3 studs at least, else no
 * fillet) until the fillet's square meets no pavement and no fillet placed before it.
 * In grid order: deterministic.
 */
export function deckFillets(rects: readonly DeckRect[], radius: number): DeckFillet[] {
  const grid = deckGrid(rects);
  if (!grid) return [];
  const { xs, zs, covered } = grid;
  const out: DeckFillet[] = [];
  const cell = (ix: number, iz: number): boolean => covered[ix]?.[iz] ?? false;
  for (let ix = 1; ix < xs.length - 1; ix++) {
    for (let iz = 1; iz < zs.length - 1; iz++) {
      const quads: [number, number][] = [[ix - 1, iz - 1], [ix, iz - 1], [ix - 1, iz], [ix, iz]];
      const open = quads.filter(([a, b]) => !cell(a, b));
      if (open.length !== 1) continue;
      const [ux, uz] = open[0]!;
      const dx = ux === ix ? 1 : -1, dz = uz === iz ? 1 : -1;
      const x = xs[ix]!, z = zs[iz]!;
      // at most a share of the open ground before the next pavement, either way: a
      // corner facing another across a gap leaves grass between the two
      let gapX = Infinity, gapZ = Infinity;
      for (const p of rects) {
        if (p.z0 < Math.max(z, z + dz) - 1e-6 && p.z1 > Math.min(z, z + dz) + 1e-6) {
          const g = dx > 0 ? p.x0 - x : x - p.x1;
          if (g > 1e-6) gapX = Math.min(gapX, g);
        }
        if (p.x0 < Math.max(x, x + dx) - 1e-6 && p.x1 > Math.min(x, x + dx) + 1e-6) {
          const g = dz > 0 ? p.z0 - z : z - p.z1;
          if (g > 1e-6) gapZ = Math.min(gapZ, g);
        }
      }
      for (let r = Math.floor(Math.min(radius, gapX * FILLET_GAP_SHARE, gapZ * FILLET_GAP_SHARE)); r >= 3; r--) {
        const rect: DeckRect = { x0: Math.min(x, x + dx * r), x1: Math.max(x, x + dx * r), z0: Math.min(z, z + dz * r), z1: Math.max(z, z + dz * r) };
        if (rects.some((p) => overlaps(p, rect)) || out.some((f) => overlaps(f.rect, rect))) continue;
        out.push({ x, z, dx, dz, r, rect });
        break;
      }
    }
  }
  return out;
}

/**
 * The flat ring box of a quarter turn about (cx, cz) between radii rIn and rOut, from
 * the direction (ux, uz) to (vx, vz) (unit vectors along the axes, a right angle apart).
 */
function quarterRing(cx: number, cy: number, cz: number, rIn: number, rOut: number, thick: number,
  u: [number, number], v: [number, number], color: Rgb, material: TerminalMaterial, extra: Partial<TerminalBox> = {}, fillet = false): TerminalBox {
  let a = Math.atan2(u[1], u[0]);
  let b = Math.atan2(v[1], v[0]);
  if (b - a > Math.PI) b -= 2 * Math.PI;
  if (a - b > Math.PI) b += 2 * Math.PI;
  return {
    cx, cy, cz, sx: 2 * rOut, sy: thick, sz: 2 * rOut, color, material, shape: "ring", sides: fillet ? 6 : 8,
    ring: { rIn: fillet ? 0 : rIn, rOut, a0: Math.min(a, b), a1: Math.max(a, b), ...(fillet ? { fillet: true } : {}) }, ...extra,
  };
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
  const scale = furnitureScale(layout);
  const bridges: JetBridge[] = [];

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
  // the apron's service road, between the stands' pads and the terminal frontage:
  // ground like the rest, so every type paves it (a grass field's is mown grass)
  const strip = serviceStrip(layout, standPad);
  if (strip) deck.push(strip);
  for (const piece of pavementDeck(deck)) {
    boxes.push(box(
      (piece.x0 + piece.x1) / 2, slabY(PAVE_TOP), (piece.z0 + piece.z1) / 2,
      piece.x1 - piece.x0, PAVE_THICKNESS, piece.z1 - piece.z0,
      paveColor, paveMaterial, { depthLayer: LAYER_PAVE },
    ));
  }
  // every inside corner of the pavement rounded, as a taxiway's fillet is: the same
  // surface at the same height, filling only ground the rectangles leave open
  const widest = Math.max(TAXI_LINE_WIDTH * 4, ...layout.edges.map((e) => e.width));
  const fillets = deckFillets(deck, widest * FILLET_SHARE);
  for (const f of fillets) {
    boxes.push(quarterRing(f.x + f.dx * f.r, slabY(PAVE_TOP), f.z + f.dz * f.r, 0, f.r, PAVE_THICKNESS,
      [-f.dx, 0], [0, -f.dz], paveColor, paveMaterial, { depthLayer: LAYER_PAVE }, true));
  }
  const paved = [...deck, ...fillets.map((f) => f.rect)];

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
      pushEdgeLights(boxes, rw.cx, rw.cz, rw.length, rw.width, paved);
    }
  }

  // --- taxiway guide lines ---
  // Where a rung's or a stub's line runs onto the spine's, it is trimmed back half a
  // line width so the two BUTT -- a T of paint, not a stack. Membership is by POSITION:
  // a rung's spine end and the spine's own chain are distinct nodes at one place.
  // Where exactly two lines meet at a right angle (the spine's ends), both stop short
  // and a quarter circle of paint joins them, the way an aircraft turns.
  const spineNodes = new Set<string>();
  const at = new Map<string, { edge: AirfieldEdge; ux: number; uz: number }[]>();
  for (const e of layout.edges) {
    const a = nodes.get(e.a);
    const b = nodes.get(e.b);
    if (!a || !b) continue;
    if (e.kind === "spine") for (const n of [a, b]) spineNodes.add(`${n.x},${n.z}`);
    const alongX = Math.abs(a.x - b.x) >= Math.abs(a.z - b.z);
    for (const [n, o] of [[a, b], [b, a]] as const) {
      const key = `${n.x},${n.z}`;
      const list = at.get(key) ?? [];
      list.push({ edge: e, ux: alongX ? Math.sign(o.x - n.x) : 0, uz: alongX ? 0 : Math.sign(o.z - n.z) });
      at.set(key, list);
    }
  }
  const edgeLength = (e: AirfieldEdge): number => {
    const a = nodes.get(e.a), b = nodes.get(e.b);
    return a && b ? Math.abs(a.x - b.x) + Math.abs(a.z - b.z) : 0;
  };
  /**
   * The turn radius of the line at a right-angled corner of exactly two lines: half the
   * narrower taxiway's width, at most half the shorter of the two edges (so the turn
   * never reaches the next junction); 0 for no turn.
   */
  const cornerRadius = (x: number, z: number): number => {
    const list = at.get(`${x},${z}`);
    if (!list || list.length !== 2) return 0;
    const p = list[0]!, q = list[1]!;
    if (p.ux * q.ux + p.uz * q.uz !== 0) return 0;
    const r = Math.min(p.edge.width / 2, q.edge.width / 2, edgeLength(p.edge) / 2, edgeLength(q.edge) / 2);
    return r > TAXI_LINE_WIDTH ? r : 0;
  };
  if (!grass) {
    for (const e of layout.edges) {
      const a = nodes.get(e.a);
      const b = nodes.get(e.b);
      if (!a || !b) continue;
      const cx = (a.x + b.x) / 2;
      const cz = (a.z + b.z) / 2;
      const alongX = Math.abs(a.x - b.x) >= Math.abs(a.z - b.z);
      const len = alongX ? Math.abs(a.x - b.x) + e.width : Math.abs(a.z - b.z) + e.width;
      const trimAt = (n: AirfieldNode): number => {
        const r = cornerRadius(n.x, n.z);
        if (r > 0) return r;
        return e.kind !== "spine" && spineNodes.has(`${n.x},${n.z}`) ? TAXI_LINE_WIDTH / 2 : 0;
      };
      const trimA = trimAt(a);
      const trimB = trimAt(b);
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
    // the corner arcs, once per corner position
    for (const [key, list] of [...at.entries()].sort(([p], [q]) => (p < q ? -1 : p > q ? 1 : 0))) {
      const [x, z] = key.split(",").map(Number) as [number, number];
      const r = cornerRadius(x, z);
      if (r <= 0) continue;
      const p = list[0]!, q = list[1]!;
      boxes.push(quarterRing(x + (p.ux + q.ux) * r, paintY(), z + (p.uz + q.uz) * r,
        r - TAXI_LINE_WIDTH / 2, r + TAXI_LINE_WIDTH / 2, PAINT_THICKNESS,
        [-q.ux, -q.uz], [-p.ux, -p.uz], PAINT_YELLOW, "sign", { depthLayer: LAYER_PAINT }));
    }
    pushHoldingPoints(boxes, layout, nodes);
  }

  // --- stands ---
  for (const st of layout.stands) {
    if (!grass) {
      // the stop bar an aircraft noses up to, across the stand
      boxes.push(box(st.x + standPad / 2 - 3, paintY(), st.z, 1.4, PAINT_THICKNESS, standPad - 6, PAINT_YELLOW, "sign", { depthLayer: LAYER_PAINT }));
    }
    if (type === "international") bridges.push(jetBridge(boxes, layout.building, st, scale));
  }

  // --- the service road's paint, floodlights and ground equipment ---
  if (strip && !grass) pushApronService(boxes, layout, strip, scale, type);

  // --- helipads ---
  for (const p of layout.pads ?? []) boxes.push(...helipad({ cx: p.cx, cz: p.cz, pad: p.pad }, type));

  // --- the terminal and its name board ---
  boxes.push(...terminal(layout.building, type));
  const b = layout.building;
  const wallLift = type === "international" ? furniture(b, type).height - 5.5 * scale : undefined;
  pushNameBoard(boxes, b.cx - b.w / 2, b.cz, b.d, scale, wallLift);

  // --- what stands on the grass: runway signs and PAPIs, the service area ---
  const ground = new Ground(layout, paved);
  if (!grass) for (const rw of layout.runways) pushPapi(boxes, ground, rw);
  if (!grass) pushHoldSigns(boxes, ground, layout, nodes);
  pushServiceArea(boxes, ground, layout, type, scale);

  return { boxes, details: perimeter(layout, type, paved), bridges };
}

/**
 * The far level of an airfield's boxes: the deck's rectangles and the shell masses,
 * glass made opaque, and the jet bridges' shells at rest.
 */
export function airfieldLowDetail(boxes: readonly AirfieldBox[], bridges: readonly JetBridge[] = []): AirfieldBox[] {
  // the deck's rectangles, not its rounded corners: the far level stays as cheap as it was
  return [...boxes, ...bridges.flatMap((b) => jetBridgeBoxes(b, b.rest))]
    .filter((b) => (b.depthLayer === 1 && !b.shape) || b.lod === "shell")
    .map((b) => b.material === "glass" ? { ...b, material: "roof", color: [132, 191, 211] } : b);
}

/**
 * A jet bridge's moving parts drawn at `pose`, in airport-local studs: what the game's
 * own transforms of the parts come to, for the far level and the site's previews.
 */
export function jetBridgeBoxes(bridge: JetBridge, pose: JetBridgePose): AirfieldBox[] {
  const rise = pose.lift - bridge.floor;
  const pitch = Math.atan2(rise, pose.length);
  const slope = Math.hypot(pose.length, rise);
  const cy = Math.cos(pose.yaw), sy = Math.sin(pose.yaw);
  /** A point of a frame at (ox, oy, oz) turned `yaw` about Y and pitched `p` about its Z, into the airport. */
  const place = (b: AirfieldBox, ox: number, oy: number, oz: number, yaw: number, p: number, stretch = 1): AirfieldBox => {
    const lx = b.cx, ly = b.cy * stretch, lz = b.cz;
    // pitch about Z (three.js sense: +X turns toward +Y), then yaw about Y
    const px = lx * Math.cos(p) - ly * Math.sin(p);
    const py = lx * Math.sin(p) + ly * Math.cos(p);
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return {
      ...b, cx: ox + px * c + lz * s, cy: oy + py, cz: oz - px * s + lz * c, sy: b.sy * stretch,
      ...(p !== 0 ? { rotZ: p } : {}), ...(yaw !== 0 ? { rotY: yaw } : {}),
    };
  };
  const { x: px, z: pz } = bridge.pivot;
  const ex = px + pose.length * cy, ez = pz - pose.length * sy;
  const bx = ex - bridge.bogieBack * cy, bz = ez + bridge.bogieBack * sy;
  // the tunnel's underside over the bogie, and the leg stretched to it
  const under = bridge.floor + rise * (pose.length - bridge.bogieBack) / pose.length - bridge.legTop;
  const leg = Math.max(0.1, under - bridge.legBase);
  return [
    ...bridge.parts.outer.map((b) => place(b, px, bridge.floor, pz, pose.yaw, pitch)),
    ...bridge.parts.inner.map((b) => place({ ...b, cx: b.cx + slope }, px, bridge.floor, pz, pose.yaw, pitch)),
    ...bridge.parts.cab.map((b) => place(b, ex, pose.lift, ez, pose.cabYaw, 0)),
    ...bridge.parts.bogie.map((b) => place(b, bx, 0, bz, pose.yaw, 0)),
    ...bridge.parts.leg.map((b) => place({ ...b, cy: b.cy }, bx, bridge.legBase, bz, pose.yaw, 0, leg)),
  ];
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

// --- the apron, the holding points and the service area ---

/** A fillet's radius, as a share of the widest taxiway. */
const FILLET_SHARE = 0.5;
/** How far a runway's holding point stands back from its edge, at most. */
const HOLD_OFFSET = 10;
/** How far off the pavement a building in the service area keeps, and off a runway. */
const SERVICE_CLEAR = 10;
const SERVICE_RUNWAY_CLEAR = 20;

const GSE_YELLOW: Rgb = [226, 170, 40];
const GSE_WHITE: Rgb = [220, 222, 218];
const TYRE: Rgb = [28, 30, 32];
const FIRE_RED: Rgb = [178, 34, 30];
const SIGN_RED: Rgb = [176, 32, 30];
const PAPI_RED: Rgb = [214, 40, 36];
/** The service road's lines: an apron white, a shade off the runway's. */
const APRON_WHITE: Rgb = [226, 228, 228];

/**
 * The apron's service road: the strip between the stands' pads and the terminal's
 * frontage, the length of the terminal and clear of its helipads. Null without stands
 * or room for a road.
 */
function serviceStrip(layout: AirfieldLayout, standPad: number): DeckRect | null {
  if (layout.stands.length === 0) return null;
  const b = layout.building;
  const x0 = Math.max(...layout.stands.map((st) => st.x)) + standPad / 2;
  // run a little under the terminal's plinth, so no grass shows at its foot
  const x1 = b.cx - b.w / 2 + 0.5;
  if (x1 - x0 < 6) return null;
  let z0 = b.cz - b.d * 0.48, z1 = b.cz + b.d * 0.48;
  for (const p of layout.pads ?? []) {
    const half = HELIPAD_SIDE[p.pad] / 2 + 2;
    if (p.cx + half <= x0 || p.cx - half >= x1) continue;
    if (p.cz > b.cz) z1 = Math.min(z1, p.cz - half);
    else z0 = Math.max(z0, p.cz + half);
  }
  return z1 - z0 > 10 ? { x0, x1, z0, z1 } : null;
}

/** Every runway's holding point on its links: where the hold bars cross, which way is off the runway. */
interface HoldPoint { x: number; z: number; u: 1 | -1; width: number }

function holdPoints(layout: AirfieldLayout, nodes: ReadonlyMap<number, AirfieldNode>): HoldPoint[] {
  const out: HoldPoint[] = [];
  const widthAt = (n: AirfieldNode, skip: AirfieldEdge): number => {
    let w = 0;
    for (const e of layout.edges) {
      if (e === skip) continue;
      for (const id of [e.a, e.b]) {
        const m = nodes.get(id);
        if (m && m.x === n.x && m.z === n.z) w = Math.max(w, e.width);
      }
    }
    return w;
  };
  for (const e of layout.edges) {
    if (e.kind !== "runwayLink") continue;
    const a = nodes.get(e.a), b = nodes.get(e.b);
    if (!a || !b || Math.abs(a.z - b.z) > 1e-6) continue;
    const inside = (n: AirfieldNode, rw: AirfieldRunway): boolean => Math.abs(n.x - rw.cx) <= rw.width / 2 && Math.abs(n.z - rw.cz) <= rw.length / 2;
    const rw = layout.runways.find((r) => inside(a, r) || inside(b, r));
    if (!rw) continue;
    const [p, q] = inside(a, rw) ? [a, b] : [b, a];
    const u: 1 | -1 = q.x > p.x ? 1 : -1;
    const edgeX = rw.cx + u * rw.width / 2;
    const span = Math.abs(q.x - edgeX) - widthAt(q, e) / 2;
    if (span < 10) continue;
    out.push({ x: edgeX + u * Math.min(HOLD_OFFSET, span * 0.3), z: p.z, u, width: e.width });
  }
  return out;
}

/**
 * The runway-holding position markings across each link: two dashed bars on the
 * runway's side and two solid ones on the taxiway's, broken round the centreline so
 * no paint lies on paint.
 */
function pushHoldingPoints(boxes: TerminalBox[], layout: AirfieldLayout, nodes: ReadonlyMap<number, AirfieldNode>): void {
  const bar = 0.5, pitch = 1.1;
  const gap = TAXI_LINE_WIDTH / 2 + 0.4;
  for (const h of holdPoints(layout, nodes)) {
    const reach = h.width / 2 - 1;
    for (let k = 0; k < 4; k++) {
      const x = h.x + h.u * k * pitch;
      for (const side of [-1, 1]) {
        const from = gap, to = reach;
        if (k >= 2) {
          boxes.push(box(x, paintY(), h.z + side * (from + to) / 2, bar, PAINT_THICKNESS, to - from, PAINT_YELLOW, "sign", { depthLayer: LAYER_PAINT }));
          continue;
        }
        const dash = 1.6, space = 1.2;
        for (let d = from; d + dash <= to + 1e-6; d += dash + space) {
          boxes.push(box(x, paintY(), h.z + side * (d + dash / 2), bar, PAINT_THICKNESS, dash, PAINT_YELLOW, "sign", { depthLayer: LAYER_PAINT }));
        }
      }
    }
  }
}

/**
 * The open grass of a field, for standing things on: inside the fence's reach, a
 * margin off the pavement (more off a runway), off the terminal, the helipads, the
 * service gate and whatever was stood there before. Spots are searched on a 2-stud
 * grid nearest a target, in a fixed order: deterministic.
 */
class Ground {
  private readonly taken: DeckRect[] = [];
  private readonly bounds: DeckRect;
  private readonly runways: DeckRect[];
  constructor(layout: AirfieldLayout, private readonly paved: readonly DeckRect[]) {
    const f = layout.footprint;
    this.bounds = rectAround(f.cx, f.cz, f.w - 10, f.d - 10);
    this.runways = layout.runways.map((rw) => rectOf(rw.cx, rw.cz, rw.width, rw.length));
    const b = layout.building;
    this.taken.push(rectAround(b.cx, b.cz, b.w, b.d, 3));
    for (const p of layout.pads ?? []) this.taken.push(rectAround(p.cx, p.cz, HELIPAD_SIDE[p.pad], HELIPAD_SIDE[p.pad], 3));
    this.taken.push(serviceGateApproach(layout));
  }

  /** Whether a rectangle is open: in bounds, `clear` off the pavement, `runwayClear` off a runway, off everything taken. */
  free(r: DeckRect, clear: number, runwayClear: number): boolean {
    if (r.x0 < this.bounds.x0 || r.x1 > this.bounds.x1 || r.z0 < this.bounds.z0 || r.z1 > this.bounds.z1) return false;
    if (this.paved.some((p) => overlaps(p, r, clear))) return false;
    if (this.runways.some((p) => overlaps(p, r, runwayClear))) return false;
    return !this.taken.some((p) => overlaps(p, r, 1));
  }

  /**
   * The centre of the free w x d spot nearest (tx, tz) within `reach` studs, which is
   * then taken; null if there is none.
   */
  place(w: number, d: number, tx: number, tz: number, clear: number, runwayClear: number, reach = Infinity): { x: number; z: number } | null {
    let best: { x: number; z: number; d2: number } | null = null;
    const step = 2;
    const x0 = Math.max(this.bounds.x0 + w / 2, tx - reach), x1 = Math.min(this.bounds.x1 - w / 2, tx + reach);
    const z0 = Math.max(this.bounds.z0 + d / 2, tz - reach), z1 = Math.min(this.bounds.z1 - d / 2, tz + reach);
    for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) {
      for (let z = Math.ceil(z0 / step) * step; z <= z1; z += step) {
        const d2 = (x - tx) ** 2 + (z - tz) ** 2;
        if (d2 > reach * reach || (best && d2 >= best.d2)) continue;
        if (this.free(rectAround(x, z, w, d), clear, runwayClear)) best = { x, z, d2 };
      }
    }
    if (best) this.taken.push(rectAround(best.x, best.z, w, d));
    return best && { x: best.x, z: best.z };
  }
}

/** The ground inside the service gate, kept open for the road in: its booth and barrier stand there. */
function serviceGateApproach(layout: AirfieldLayout): DeckRect {
  const g = serviceGate(layout);
  return { x0: g.x0 - 8, x1: g.x1 + 4, z0: g.z - 14, z1: g.z };
}

/** The service gate in the far cross-fence: its two posts' positions along X, at the fence's Z. */
function serviceGate(layout: AirfieldLayout): { x0: number; x1: number; z: number } {
  const f = layout.footprint;
  const boundary = rectAround(f.cx, f.cz, f.w - 2.4, f.d - 2.4);
  return { x0: boundary.x1 - 18, x1: boundary.x1 - 6, z: boundary.z1 };
}

/** A red mandatory sign beside each holding point, read by the crew of an aircraft taxiing out. */
function pushHoldSigns(boxes: TerminalBox[], ground: Ground, layout: AirfieldLayout, nodes: ReadonlyMap<number, AirfieldNode>): void {
  for (const h of holdPoints(layout, nodes)) {
    // toward the field's middle first, then the other side
    const order = h.z > layout.footprint.cz ? [-1, 1] : [1, -1];
    for (const side of order) {
      const spot = ground.place(1, 4.6, h.x + h.u * 3, h.z + side * (h.width / 2 + 4), 1.5, 4, 20);
      if (!spot) continue;
      for (const dz of [-1.6, 1.6]) boxes.push(standing(spot.x, 0, spot.z + dz, 0.25, 1.5, 0.25, STEEL_GREY, "column"));
      boxes.push(box(spot.x, 1.8, spot.z, 0.3, 1.3, 4.2, SIGN_RED, "sign"));
      boxes.push(box(spot.x, 1.8, spot.z, 0.38, 0.5, 2.8, PAINT_WHITE, "sign"));
      break;
    }
  }
}

/**
 * The PAPI at each runway end: four lamp housings in a row out from the runway's
 * edge on the landing aircraft's left, abeam the aiming point, two showing white and
 * two red.
 */
function pushPapi(boxes: TerminalBox[], ground: Ground, rw: AirfieldRunway): void {
  const scale = Math.min(1, rw.width / RUNWAY_WIDTH);
  for (const end of [-1, 1]) {
    const side = end === -1 ? 1 : -1;
    const pitch = 2.6;
    const span = 4 * pitch;
    const tx = rw.cx + side * (rw.width / 2 + 6 + span / 2);
    const tz = rw.cz + end * (rw.length / 2 - rw.length * 0.25);
    const spot = ground.place(span, 2.4, tx, tz, 2, 4, 24 * Math.max(0.5, scale));
    if (!spot) continue;
    for (let i = 0; i < 4; i++) {
      const x = spot.x - side * (span / 2 - pitch / 2 - i * pitch);
      boxes.push(standing(x, 0, spot.z, 1.4, 0.9, 1.1, STEEL_GREY, "steel"));
      // the lens faces the approach
      boxes.push(box(x, 0.55, spot.z + end * 0.6, 1, 0.45, 0.16, i < 2 ? PAINT_WHITE : PAPI_RED, "sign"));
    }
  }
}

/**
 * A jet bridge at an international stand (docs/models/airfield.md, "Jet bridges"): a
 * fixed link out of the terminal's glazing to a rotunda on its column, drawn into
 * `boxes`, and the parts the game poses -- the two telescoping tunnel sections, the cab
 * and the bogie -- returned with their limits and the pose at rest. The rotunda stands
 * to the parked aircraft's left (it parks nose-in, heading +X, so its left is -Z), so
 * the tunnel reaches the forward left door from the side, never across the fuselage;
 * at rest it lies short and straight back from the rotunda, clear of every airframe.
 */
function jetBridge(boxes: TerminalBox[], b: TerminalPad, st: AirfieldStand, s: number): JetBridge {
  const front = b.cx - b.w / 2;
  const floor = BRIDGE_FLOOR * s;
  const height = BRIDGE_HEIGHT * s, width = BRIDGE_WIDTH * s;
  const radius = BRIDGE_ROTUNDA * s;
  const link = BRIDGE_LINK * s;
  const px = front - link - radius, pz = st.z - Math.max(BRIDGE_OFFSET_MIN, BRIDGE_OFFSET * s);
  const mid = floor + height / 2;
  // the fixed link, the rotunda and its column: static, merged with the field
  boxes.push(box(front - (link + radius * 0.5) / 2 + 0.1, mid, pz, link + radius * 0.5 + 0.2, height * 0.9, width * 0.9, STEEL_GREY, "roof"));
  boxes.push({ cx: px, cy: mid, cz: pz, sx: 2 * radius, sy: height * 1.15, sz: 2 * radius, color: [200, 204, 206], material: "steel", shape: "cylinder", sides: 10 });
  boxes.push(standing(px, 0, pz, 1.4 * s, mid - height * 0.55, 1.4 * s, STEEL_GREY, "column"));

  /**
   * A tunnel section from x0 to x1 in its frame: the body, its glazing on the -Z side,
   * its roof. The far level keeps the outer body only: at rest the inner one is inside it.
   */
  const section = (x0: number, x1: number, k: number): TerminalBox[] => {
    const len = x1 - x0, cx = (x0 + x1) / 2, h = height * k, w = width * k;
    return [
      box(cx, h / 2, 0, len, h, w, STEEL_GREY, "steel", k === 1 ? { lod: "shell" } : {}),
      box(cx, h / 2 + 0.3 * s, -w / 2 - 0.05, len * 0.9, 1.8 * s * k, 0.2 * s, [132, 191, 211], "glass"),
      box(cx, h + 0.3 * s, 0, len + 0.5 * s, 0.6 * s, w + 0.5 * s, [236, 231, 214], "roof"),
    ];
  };
  const outerLen = BRIDGE_OUTER * s, innerLen = BRIDGE_INNER * s, cab = BRIDGE_CAB * s;
  const legTop = 0.2 * s, legBase = PAVE_TOP + 1.6 * s;
  return {
    stand: st.id,
    pivot: { x: px, z: pz },
    floor,
    radius,
    reach: [radius + outerLen, radius + outerLen + innerLen - BRIDGE_OVERLAP * s],
    lift: [...BRIDGE_LIFT_RANGE],
    maxSlope: BRIDGE_MAX_SLOPE,
    cabDepth: cab,
    bogieBack: BRIDGE_BOGIE * s,
    legBase,
    legTop,
    // short and straight back from the rotunda, level, the cab looking along it
    rest: { yaw: Math.PI, length: radius + outerLen, lift: floor, cabYaw: Math.PI },
    parts: {
      outer: section(radius, radius + outerLen, 1),
      inner: section(-innerLen, 0, 0.9),
      // the cab, a little bigger than the tunnel, and its bellows round the door face
      cab: [
        box(cab / 2, height * 0.6 - 0.3 * s, 0, cab, height * 1.2, width * 1.2, [38, 49, 57], "roof", { lod: "shell" }),
        box(cab + 0.25 * s, height * 0.55 - 0.3 * s, 0, 0.5 * s, height * 1.05, width * 1.05, [70, 76, 80], "roof"),
      ],
      // two wheels either side of the bogie's beam, on the apron
      bogie: [
        box(0, PAVE_TOP + 1.3 * s, 0, 1.2 * s, 0.6 * s, 4.6 * s, STEEL_GREY, "steel"),
        ...[-1, 1].map((side) => box(0, PAVE_TOP + 0.85 * s - SEAT / 2, side * 2 * s, 2.1 * s, 1.7 * s + SEAT, 0.9 * s, TYRE, "roof")),
      ],
      leg: [box(0, 0.5, 0, 1.2 * s, 1, 1.2 * s, STEEL_GREY, "column", { lod: "shell" })],
    },
  };
}

/**
 * The service road's paint (an edge line on the stands' side, a dashed centre line),
 * floodlight masts between the stands near the terminal and, in turn, a baggage train,
 * nothing (only the mast) or a belt loader parked in those gaps on the stands' side.
 */
function pushApronService(boxes: TerminalBox[], layout: AirfieldLayout, strip: DeckRect, s: number, type: string): void {
  const width = strip.x1 - strip.x0;
  const z0 = strip.z0 + 2, z1 = strip.z1 - 2;
  boxes.push(box(strip.x0 + 1.2, paintY(), (z0 + z1) / 2, 0.5, PAINT_THICKNESS, z1 - z0, APRON_WHITE, "sign", { depthLayer: LAYER_PAINT }));
  const mid = (strip.x0 + 1.5 + strip.x1 - 0.5) / 2;
  if (width >= 12) {
    for (let z = z0 + 2; z + 5 <= z1 - 2; z += 10) {
      boxes.push(box(mid, paintY(), z + 2.5, 0.4, PAINT_THICKNESS, 5, APRON_WHITE, "sign", { depthLayer: LAYER_PAINT }));
    }
  }
  // the gaps between the stands, and beyond the outer two
  const zs = layout.stands.map((st) => st.z).sort((p, q) => p - q);
  const gaps: number[] = [];
  const pitch = zs.length > 1 ? (zs[zs.length - 1]! - zs[0]!) / (zs.length - 1) : 40;
  gaps.push(zs[0]! - pitch / 2);
  for (let i = 1; i < zs.length; i++) gaps.push((zs[i - 1]! + zs[i]!) / 2);
  gaps.push(zs[zs.length - 1]! + pitch / 2);
  const top = PAVE_TOP;
  let kind = 0;
  for (const gz of gaps) {
    if (gz < z0 + 4 || gz > z1 - 4) continue;
    // a floodlight mast by the terminal
    const mx = strip.x1 - 0.5 - 2.4 * s;
    const mast = (type === "international" ? 22 : 16) * s;
    boxes.push(standing(mx, top, gz, 1.6 * s, 0.6, 1.6 * s, [150, 152, 148], "column"));
    boxes.push({ cx: mx, cy: top + 0.3 + mast / 2, cz: gz, sx: 0.7 * s, sy: mast, sz: 0.7 * s, color: STEEL_GREY, material: "steel", shape: "cylinder", sides: 8 });
    boxes.push(box(mx, top + mast + 0.4 * s, gz, 1.1 * s, 1.2 * s, 4 * s, STEEL_GREY, "steel"));
    for (const dz of [-1.3, 0, 1.3]) boxes.push(box(mx - 0.6 * s, top + mast + 0.4 * s, gz + dz * s, 0.2, 0.8 * s, 1.1 * s, LAMP_GLOW, "sign"));
    // a ground vehicle on the stands' side of the road, every third gap left to its mast
    const slot = kind++ % 3;
    if (width >= 9 && slot !== 1) pushGroundVehicle(boxes, strip.x0 + 2 + 1.3 * s, top, gz, s, slot === 0 ? "baggage" : "loader");
  }
}

/** One parked ground vehicle, its length along Z, standing on `top`: a baggage train or a belt loader. */
function pushGroundVehicle(boxes: TerminalBox[], x: number, top: number, z: number, s: number, kind: "baggage" | "loader"): void {
  const k = Math.max(0.7, s);
  const axle = (az: number, w: number): void => { boxes.push(box(x, top + 0.4 * k, az, w + 0.3 * k, 0.9 * k, 0.9 * k, TYRE, "roof")); };
  if (kind === "baggage") {
    // the tractor and two baggage carts behind it
    const tz = z - 4.6 * k;
    boxes.push(standing(x, top + 0.5 * k, tz, 1.7 * k, 0.9 * k, 2.6 * k, GSE_YELLOW, "steel"));
    boxes.push(box(x, top + 2.4 * k, tz + 0.3 * k, 1.8 * k, 0.15 * k, 1.8 * k, [40, 44, 46], "roof"));
    for (const dx of [-0.8, 0.8]) boxes.push(box(x + dx * k, top + 1.85 * k, tz + 1.1 * k, 0.14 * k, 1.1 * k, 0.14 * k, [40, 44, 46], "steel"));
    for (const az of [tz - 0.8 * k, tz + 0.8 * k]) axle(az, 1.7 * k);
    for (const cz of [z - 0.8 * k, z + 2.4 * k]) {
      boxes.push(box(x, top + 1 * k, cz, 1.8 * k, 0.25 * k, 2.6 * k, [70, 76, 80], "steel"));
      boxes.push(box(x, top + 1.65 * k, cz, 1.4 * k, 1 * k, 2.2 * k, [52, 80, 120], "roof"));
      boxes.push(box(x, top + 2.35 * k, cz, 1.9 * k, 0.12 * k, 2.7 * k, GSE_WHITE, "roof"));
      axle(cz, 1.8 * k);
    }
    return;
  }
  // a belt loader: low chassis, a cab at the side and its conveyor raised toward the hold
  boxes.push(box(x, top + 0.9 * k, z, 1.8 * k, 0.5 * k, 6 * k, GSE_YELLOW, "steel"));
  boxes.push(standing(x - 0.4 * k, top + 1.1 * k, z + 1.6 * k, 0.9 * k, 1.3 * k, 1.2 * k, GSE_YELLOW, "steel"));
  boxes.push(box(x + 0.3 * k, top + 2.1 * k, z - 0.4 * k, 1 * k, 0.25 * k, 7 * k, [40, 44, 46], "roof", { rotX: 0.32 }));
  for (const az of [z - 2.2 * k, z + 2.2 * k]) axle(az, 1.8 * k);
}

/**
 * The service area on the open grass: a maintenance hangar under a barrel vault, its
 * door to the field; a fuel farm of round tanks in a bund; a fire station with its
 * tender. What a type has, and how big, follows its class and the furniture scale.
 */
function pushServiceArea(boxes: TerminalBox[], ground: Ground, layout: AirfieldLayout, type: string, s: number): void {
  if (type === "grass_field") return;
  const b = layout.building;
  const f = layout.footprint;
  const south = f.cz - f.d / 2, north = f.cz + f.d / 2;
  const front = b.cx - b.w / 2;
  if (type !== "heliport") {
    const k = type === "international" ? 1 : 0.8;
    const L = 30 * s * k, W = 36 * s * k;
    const spot = ground.place(L, W, front - L / 2 - 10, south + W / 2 + 6, SERVICE_CLEAR, SERVICE_RUNWAY_CLEAR);
    if (spot) pushHangar(boxes, spot.x, spot.z, L, W, s * k);
    const fire = ground.place(24 * s, 18 * s, front - L - 30 * s, south + 9 * s + 6, SERVICE_CLEAR, SERVICE_RUNWAY_CLEAR);
    if (fire) pushFireStation(boxes, fire.x, fire.z, s);
  }
  const tanks = type === "international" ? 3 : type === "regional" ? 2 : 1;
  const d = 9 * s, pitch = d + 3 * s;
  const farm = ground.place(d + 4 * s, tanks * pitch + 2 * s, front - 20, north - (tanks * pitch) / 2 - 8, SERVICE_CLEAR, SERVICE_RUNWAY_CLEAR);
  if (farm) pushFuelFarm(boxes, farm.x, farm.z, tanks, d, pitch, s);
}

/** A hangar L along X by W along Z centred at (x, z): side and back walls, the door to -X, a barrel vault over it. */
function pushHangar(boxes: TerminalBox[], x: number, z: number, L: number, W: number, s: number): void {
  const eave = 8 * s, rise = 7 * s, wall = 0.6 * s;
  const clad: Rgb = [176, 184, 186];
  for (const side of [-1, 1]) boxes.push(standing(x, 0, z + side * (W / 2 - wall / 2), L, eave, wall, clad, "steel"));
  boxes.push(standing(x + L / 2 - wall / 2, 0, z, wall, eave, W - 2 * wall, clad, "steel"));
  // the vault, swept along X, and its two end walls (the lower halves hidden in the walls and doors)
  boxes.push({ cx: x, cy: eave, cz: z, sx: W, sy: rise, sz: L + 0.4 * s, color: [128, 140, 146], material: "roof",
    shape: "arc", sides: 12, arc: { rx: W / 2 - 0.1, ry: rise, a0: Math.PI, a1: 0, thick: 0.5 * s }, rotY: Math.PI / 2 });
  for (const ex of [x - L / 2 + 0.9 * s, x + L / 2 - 0.4 * s]) {
    boxes.push({ cx: ex, cy: eave, cz: z, sx: W - 0.4, sy: 0.3 * s, sz: 2 * rise - 0.2, color: clad, material: "steel",
      shape: "cylinder", sides: 12, rotX: Math.PI / 2, rotY: Math.PI / 2 });
  }
  // the sliding door leaves, in three panels, with a header beam over them
  const leaf = (W - 2 * wall) / 3;
  for (let i = 0; i < 3; i++) {
    boxes.push(standing(x - L / 2 + 0.3 * s + (i % 2) * 0.35 * s, 0, z - W / 2 + wall + leaf * (i + 0.5), 0.3 * s, eave - 0.6 * s, leaf - 0.1, i === 1 ? [150, 160, 164] : [196, 202, 204], "steel"));
  }
  boxes.push(box(x - L / 2 + 0.45 * s, eave - 0.3 * s, z, 0.9 * s, 0.8 * s, W, [83, 100, 110], "steel"));
  // a band of roof lights along the crown
  boxes.push(box(x, eave + rise + 0.1 * s, z, L * 0.7, 0.4 * s, 2.4 * s, [132, 191, 211], "roof"));
}

/** A fire station at (x, z): the appliance bay with red doors to -X, a drill tower and the tender out front. */
function pushFireStation(boxes: TerminalBox[], x: number, z: number, s: number): void {
  const bx = x + 5 * s;
  const w = 14 * s, d = 18 * s, h = 6 * s;
  boxes.push(standing(bx, 0, z, w, h, d, [196, 186, 168], "brick"));
  boxes.push(standing(bx, h, z, w + 0.6 * s, 0.6 * s, d + 0.6 * s, [70, 74, 78], "roof"));
  for (let i = 0; i < 3; i++) boxes.push(standing(bx - w / 2 - 0.1, 0, z - d / 3 + i * d / 3, 0.4, h * 0.72, d / 3 - 1.2 * s, FIRE_RED, "steel"));
  boxes.push(standing(bx + w / 2 - 2 * s, h + 0.6 * s, z + d / 2 - 2 * s, 3 * s, 8 * s, 3 * s, [196, 186, 168], "brick"));
  // the crash tender, nose to the field
  const tx = bx - w / 2 - 5 * s;
  boxes.push(standing(tx, 0.6 * s, z, 6.5 * s, 2.4 * s, 2.6 * s, FIRE_RED, "steel"));
  boxes.push(box(tx - 3.3 * s, 2.2 * s, z, 0.1, 0.9 * s, 2.2 * s, [132, 191, 211], "glass"));
  // the beacon bar: steel, not a lamp (only runway lights are `light`, and a low `sign` reads as paint)
  boxes.push(box(tx - 2.2 * s, 3.2 * s, z, 0.5 * s, 0.25 * s, 1.6 * s, [60, 90, 200], "steel"));
  boxes.push(box(tx + 1.5 * s, 3.3 * s, z, 1.6 * s, 0.4 * s, 0.4 * s, [200, 200, 196], "steel"));
  for (const ax of [tx - 2 * s, tx + 0.4 * s, tx + 2.4 * s]) boxes.push(box(ax, 0.55 * s, z, 1.1 * s, 1.1 * s, 2.9 * s, TYRE, "roof"));
}

/** A fuel farm at (x, z): `count` round tanks along Z in a low bund. */
function pushFuelFarm(boxes: TerminalBox[], x: number, z: number, count: number, d: number, pitch: number, s: number): void {
  const h = 6 * s;
  const bundW = d + 3 * s, bundD = count * pitch + 1 * s;
  for (const side of [-1, 1]) {
    boxes.push(standing(x + side * bundW / 2, 0, z, 0.5 * s, 1.1 * s, bundD + 0.5 * s, [150, 152, 148], "column"));
    boxes.push(standing(x, 0, z + side * bundD / 2, bundW - 0.5 * s, 1.1 * s, 0.5 * s, [150, 152, 148], "column"));
  }
  for (let i = 0; i < count; i++) {
    const tz = z - bundD / 2 + 0.5 * s + pitch * (i + 0.5);
    boxes.push({ cx: x, cy: h / 2 - 0.2, cz: tz, sx: d, sy: h + 0.4, sz: d, color: [222, 224, 220], material: "steel", shape: "cylinder", sides: 12 });
    boxes.push({ cx: x, cy: h + 0.1 * s, cz: tz, sx: d * 0.94, sy: 0.6 * s, sz: d * 0.94, color: [150, 156, 158], material: "roof", shape: "cylinder", sides: 12 });
    boxes.push({ cx: x + d / 2 + 0.3 * s, cy: h / 2, cz: tz, sx: 0.3 * s, sy: 0.3 * s, sz: h, color: STEEL_GREY, material: "steel", shape: "bar",
      from: [x + d / 2 + 0.3 * s, 0.1, tz], to: [x + d / 2 + 0.3 * s, h + 0.4 * s, tz] });
  }
}

// --- the perimeter ---

/** A rectangle by its centre and size, grown by `margin`. */
function rectAround(cx: number, cz: number, w: number, d: number, margin = 0): DeckRect {
  return { x0: cx - w / 2 - margin, x1: cx + w / 2 + margin, z0: cz - d / 2 - margin, z1: cz + d / 2 + margin };
}

/**
 * The fittings round the saved surfaces, near-only: the perimeter fence, opened
 * wherever the terminal or the deck meets it plus a service gate; and on a grass field
 * the runway marker boards, grass tufts, a fuel cabinet and crates, each only where the
 * footprint leaves room off the pavement.
 *
 * The fence is drawn per straight run, not per bay: only the posts repeat. A paved
 * field's is a security fence - posts, a top and a bottom rail and ONE pane of
 * chain-link mesh (`netting`) per run, barbed wire on arms leaning out from every
 * second post - with a lifting barrier and a guard booth at the service gate. A grass
 * field's is timber post-and-rail.
 */
function perimeter(layout: AirfieldLayout, type: string, paved: readonly DeckRect[]): TerminalBox[] {
  const boxes: TerminalBox[] = [];
  const grass = type === "grass_field";
  const f = layout.footprint, b = layout.building;
  const boundary = rectAround(f.cx, f.cz, f.w - 2.4, f.d - 2.4);
  const obstacles = [rectAround(b.cx, b.cz, b.w, b.d, 2),
    ...paved.map((p) => ({ x0: p.x0 - 2, x1: p.x1 + 2, z0: p.z0 - 2, z1: p.z1 + 2 }))];
  const add = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number,
    color: Rgb, material: TerminalMaterial, extra: Partial<TerminalBox> = {}): void => {
    boxes.push({ cx, cy, cz, sx, sy, sz, color, material, ...extra });
  };
  const timber: Rgb = [82, 65, 42];
  const steel: Rgb = [54, 67, 66];
  const mesh: Rgb = [150, 158, 160];
  const fenceColor = grass ? timber : steel;
  const fenceMaterial: TerminalMaterial = grass ? "wood" : "steel";
  const height = grass ? 2.4 : 3.6;
  const gate = serviceGate(layout);

  // Openings wherever a saved terminal or pavement meets the boundary; the terminal is
  // the landside entrance, and a service gate is left in the far cross-fence. `out` is
  // the way out of the field, which the barbed wire leans toward.
  const fence = (alongX: boolean, fixed: number, start: number, end: number, out: 1 | -1): void => {
    let spans: [number, number][] = [[start, end]];
    const cuts = obstacles.filter((r) => alongX ? fixed >= r.z0 && fixed <= r.z1 : fixed >= r.x0 && fixed <= r.x1)
      .map((r): [number, number] => alongX ? [r.x0, r.x1] : [r.z0, r.z1]);
    if (alongX && fixed === boundary.z1) cuts.push([gate.x0, gate.x1]);
    for (const [lo, hi] of cuts) {
      spans = spans.flatMap(([a, z]): [number, number][] => {
        if (hi <= a || lo >= z) return [[a, z]];
        const out: [number, number][] = [];
        if (lo > a) out.push([a, lo]);
        if (hi < z) out.push([hi, z]);
        return out;
      });
    }
    /** A box along the run from `a` to `z` at height `y`, `out` studs toward the outside. */
    const run = (a: number, z: number, y: number, h: number, thickness: number, color: Rgb, material: TerminalMaterial, offset = 0): void => {
      const at = (a + z) / 2, length = z - a;
      add(alongX ? at : fixed + offset, y, alongX ? fixed + offset : at,
        alongX ? length : thickness, h, alongX ? thickness : length, color, material);
    };
    for (const [a, z] of spans) {
      if (z - a < 2) continue;
      const count = Math.ceil((z - a) / (grass ? 10 : 8));
      const pitch = (z - a) / count;
      const post = (at: number, size: number, h: number): void => {
        add(alongX ? at : fixed, (h - 0.4) / 2, alongX ? fixed : at, size, h + 0.4, size, fenceColor, fenceMaterial);
      };
      for (let i = 0; i <= count; i++) post(a + i * pitch, i === 0 || i === count ? 0.55 : 0.42, height);
      if (grass) {
        for (const y of [height * 0.38, height * 0.82]) run(a, z, y, 0.22, 0.16, fenceColor, fenceMaterial, 0.3);
        continue;
      }
      run(a, z, height - 0.1, 0.12, 0.12, fenceColor, fenceMaterial, 0.28);
      run(a, z, 0.25, 0.12, 0.12, fenceColor, fenceMaterial, 0.28);
      // the chain-link, one see-through pane over the whole run (two triangles in the game)
      run(a, z, (height + 0.1) / 2, height - 0.3, 0.05, mesh, "netting", 0.3);
      // barbed wire: arms leaning out from every second post, three strands along them
      const lean = 0.75, rise = 0.75;
      for (let i = 0; i <= count; i += 2) {
        const at = a + i * pitch;
        const foot: [number, number, number] = alongX ? [at, height - 0.05, fixed] : [fixed, height - 0.05, at];
        const head: [number, number, number] = alongX ? [at, height + rise, fixed + out * lean] : [fixed + out * lean, height + rise, at];
        add((foot[0] + head[0]) / 2, (foot[1] + head[1]) / 2, (foot[2] + head[2]) / 2, 0.1, 0.1, Math.hypot(lean, rise),
          fenceColor, fenceMaterial, { shape: "bar", from: foot, to: head });
      }
      for (const t of [0.35, 0.65, 0.95]) run(a, z, height - 0.05 + rise * t, 0.05, 0.05, fenceColor, fenceMaterial, out * lean * t);
    }
  };
  fence(false, boundary.x0, boundary.z0 + 0.5, boundary.z1 - 0.5, -1);
  fence(false, boundary.x1, boundary.z0 + 0.5, boundary.z1 - 0.5, 1);
  fence(true, boundary.z0, boundary.x0, boundary.x1, -1);
  fence(true, boundary.z1, boundary.x0, boundary.x1, 1);

  if (!grass) {
    // the service gate: stout gate posts, a red and white lifting barrier, a guard booth inside
    for (const x of [gate.x0, gate.x1]) add(x, (height + 0.2) / 2 - 0.2, gate.z, 0.8, height + 0.6, 0.8, fenceColor, fenceMaterial);
    const span = gate.x1 - gate.x0 - 1.4;
    add(gate.x1 - 0.9, 0.6, gate.z - 1.2, 0.7, 1.6, 0.7, [220, 220, 216], "steel");
    for (let i = 0; i < 4; i++) {
      add(gate.x1 - 1.3 - span * (i + 0.5) / 4, 1.2, gate.z - 1.2, span / 4 - 0.02, 0.22, 0.18, i % 2 ? PAINT_WHITE : SIGN_RED, "sign");
    }
    const bx = gate.x0 - 3.2, bz = gate.z - 4;
    add(bx, 1.1, bz, 3, 2.6, 3, [220, 218, 206], "brick");
    add(bx, 2.55, bz, 3.6, 0.3, 3.6, [57, 87, 104], "roof");
    add(bx + 1.53, 1.5, bz, 0.08, 1, 2.2, [132, 191, 211], "glass");
  }

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
