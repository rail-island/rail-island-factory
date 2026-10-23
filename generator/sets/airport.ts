// The airport types (docs/models/sets.md). The type does not reach the airfield's
// geometry -- a grass field and an international hub of one size taxi identically,
// and the game's layout solver owns runways, taxiways and stands. What a type
// decides is the TERMINAL on its pad (a function of the pad's size, `terminal`) and
// the props that stand round it: the control tower and the windsock
// (generator/props/airportProps.ts), placed at the furniture scale.
//
// Pure data, no imports: bundled into export/sets/airport.js for the game.

export type Rgb = [number, number, number];
export type TerminalMaterial = "brick" | "wood" | "roof" | "steel" | "glass" | "sign" | "column";

/** One terminal box in the airport's local frame: the game's station box vocabulary. */
export interface TerminalBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  color: Rgb;
  material: TerminalMaterial;
  rotZ?: number;
  profile?: "gable";
  /** Kept by the far level; every other box is near-only fitting. */
  lod?: "shell";
}

/** The terminal pad, as the game's layout lays it out. */
export interface TerminalPad { cx: number; cz: number; w: number; d: number }

/** Per type: the tower it raises (none on a grass field). */
export const TYPE_META: Record<string, { tower: { prop: string; values: Record<string, string> } | null; windsock: { prop: string } }> = {
  grass_field: { tower: null, windsock: { prop: "proc-prop-airport-windsock" } },
  regional: { tower: { prop: "proc-prop-airport-tower", values: { kind: "regional" } }, windsock: { prop: "proc-prop-airport-windsock" } },
  international: { tower: { prop: "proc-prop-airport-tower", values: { kind: "international" } }, windsock: { prop: "proc-prop-airport-windsock" } },
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
  const height = (type === "grass_field" ? 12 : type === "regional" ? 18 : 26) * scale;
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

  if (type === "grass_field") {
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
