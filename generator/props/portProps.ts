// A port's fixed props (docs/models/props.md): the ship-to-shore crane, a container
// slot, the fisherman's hut with its crates, a floodlight mast, a bollard and a
// mooring post. Each stands at its origin on the deck (y = 0 is the deck top); the
// game lays them out along its moles and quays and turns them to the deck's axes.

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { propModel, type PropBox, type Rgb } from "./propKit.ts";

const TIMBER: Rgb = [122, 88, 58];
const TIMBER_DARK: Rgb = [88, 62, 40];
const HUT_ROOF: Rgb = [96, 68, 48];
const STEEL_RED: Rgb = [186, 78, 56];
const STEEL_GREY: Rgb = [92, 98, 106];
const STEEL_LIGHT: Rgb = [150, 156, 162];
const BOLLARD: Rgb = [44, 46, 50];
const SAFETY_YELLOW: Rgb = [228, 196, 64];
const GLASS: Rgb = [168, 205, 226];
const LAMP_GLOW: Rgb = [255, 236, 178];
/** A container yard is a mixed bag of liveries: the game picks one per slot. */
export const CONTAINER_COLORS: readonly Rgb[] = [
  [170, 58, 50], [48, 92, 148], [62, 128, 82], [204, 146, 46], [110, 112, 118], [150, 88, 46],
];

const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: Rgb, material: string, extra: Partial<PropBox> = {}): PropBox =>
  ({ cx, cy, cz, sx, sy, sz, color, material, ...extra });

// --- the crane ---
const CRANE_RAIL_INSET = 2.6;
const CRANE_LEG = 15;
const CRANE_LEG_SIZE = 1.3;
const CRANE_PORTAL_DEPTH = 8.4;
const CRANE_GIRDER_THICKNESS = 1.4;
const CRANE_BOOM_LENGTH = 22;
const CRANE_BOOM_THICKNESS = 1.2;
const CRANE_BOOM_ELEVATION = (70 * Math.PI) / 180;
const CRANE_BACKREACH = 7;
/** The deck a crane straddles: a sea mole's, or a river wharf's depth. */
export const CRANE_DECKS = { sea: 12, river: 16 } as const;

/**
 * The ship-to-shore crane: four legs on the crane rails `span` apart along X, a
 * portal girder, the machinery house and the boom luffed up over the water at +X,
 * the back reach level over the land at -X.
 */
export function craneBoxes(span: number): PropBox[] {
  const out: PropBox[] = [];
  const legU = span / 2;
  const legV = CRANE_PORTAL_DEPTH / 2 - CRANE_LEG_SIZE / 2;
  const girderY = CRANE_LEG + CRANE_GIRDER_THICKNESS / 2;
  for (const u of [-legU, legU]) {
    for (const v of [-legV, legV]) out.push(box(u, CRANE_LEG / 2, v, CRANE_LEG_SIZE, CRANE_LEG, CRANE_LEG_SIZE, STEEL_RED, "steel"));
    // the sill beam tying each pair of legs together at the bottom
    out.push(box(u, 0.7, 0, CRANE_LEG_SIZE + 0.3, 1.0, CRANE_PORTAL_DEPTH, STEEL_RED, "steel"));
  }
  out.push(box(0, girderY, 0, span + CRANE_LEG_SIZE, CRANE_GIRDER_THICKNESS, CRANE_PORTAL_DEPTH, STEEL_RED, "steel"));
  // the machinery house, set back from the water side, and the A-frame apex above it
  out.push(box(-1.5, girderY + CRANE_GIRDER_THICKNESS / 2 + 1.6, 0, 5, 3.2, 5, STEEL_GREY, "steel"));
  out.push(box(-1.5, girderY + CRANE_GIRDER_THICKNESS / 2 + 3.2 + 2.2, 0, 1.0, 4.4, 1.0, STEEL_GREY, "steel"));
  // the operator's cab hanging under the girder on the water side
  out.push(box(legU - 1.6, girderY - CRANE_GIRDER_THICKNESS / 2 - 1.0, 0, 2.2, 2.0, 2.2, STEEL_GREY, "steel"));
  // the boom, luffed up over the water
  const px = legU + CRANE_LEG_SIZE / 2;
  out.push(box(px + Math.cos(CRANE_BOOM_ELEVATION) * (CRANE_BOOM_LENGTH / 2), girderY + Math.sin(CRANE_BOOM_ELEVATION) * (CRANE_BOOM_LENGTH / 2), 0,
    CRANE_BOOM_LENGTH, CRANE_BOOM_THICKNESS, CRANE_BOOM_THICKNESS, STEEL_RED, "steel", { rotZ: CRANE_BOOM_ELEVATION }));
  // and the back reach, level, on the landward side
  out.push(box(-(legU + CRANE_LEG_SIZE / 2 + CRANE_BACKREACH / 2), girderY + 0.2, 0, CRANE_BACKREACH, CRANE_BOOM_THICKNESS, CRANE_BOOM_THICKNESS, STEEL_RED, "steel"));
  for (const b of out) b.lod = "shell";
  // a hanging hoist and the glazed cab front
  const hx = legU + 3.5;
  const hoistTop = girderY + (3.5 - CRANE_LEG_SIZE / 2) * Math.tan(CRANE_BOOM_ELEVATION);
  const hoistBottom = girderY - 7;
  out.push(box(hx, (hoistTop + hoistBottom) / 2, 0, 0.12, hoistTop - hoistBottom, 0.12, STEEL_GREY, "steel"));
  out.push(box(hx, girderY - 7, 0, 1.0, 0.5, 3.2, SAFETY_YELLOW, "steel"));
  out.push(box(legU - 1.6 + 1.12, girderY - 1.4, 0, 0.12, 1.2, 1.8, GLASS, "glass"));
  return out;
}

// --- a container slot ---
const CONTAINER_LENGTH = 6;
const CONTAINER_WIDTH = 2.45;
const CONTAINER_HEIGHT = 2.55;

/** One container slot, the length along X: `stack` high, the bottom one in livery `livery`, ribs on the top. */
export function containerBoxes(livery: number, stack: number): PropBox[] {
  const out: PropBox[] = [];
  for (let s = 0; s < stack; s++) {
    const color = CONTAINER_COLORS[(livery + s * 2) % CONTAINER_COLORS.length]!;
    out.push(box(0, CONTAINER_HEIGHT / 2 + s * CONTAINER_HEIGHT, 0, CONTAINER_LENGTH, CONTAINER_HEIGHT, CONTAINER_WIDTH, color, "sign", { lod: "shell" }));
    // only the exposed top gets ribs
    for (let r = 0; s === stack - 1 && r < 4; r++) {
      out.push(box((r - 1.5) * 1.35, (s + 1) * CONTAINER_HEIGHT + 0.04, 0, 0.12, 0.08, CONTAINER_WIDTH - 0.2, STEEL_LIGHT, "steel"));
    }
  }
  return out;
}

// --- the hut and its crates ---
const HUT_WIDTH = 8;
const HUT_DEPTH = 6;
const HUT_WALL_HEIGHT = 3.6;
const HUT_ROOF_SLOPE = (30 * Math.PI) / 180;

/** The fisherman's hut, its door toward +Z (the water), and the crates left beside it. */
export function hutBoxes(): PropBox[] {
  const out: PropBox[] = [];
  const w = HUT_WIDTH;
  const d = HUT_DEPTH;
  const eave = HUT_WALL_HEIGHT;
  out.push(box(0, HUT_WALL_HEIGHT / 2, 0, w, HUT_WALL_HEIGHT, d, TIMBER, "wood", { lod: "shell" }));
  out.push(box(w * 0.2, 1.2, d / 2 + 0.06, 1.2, 2.4, 0.12, TIMBER_DARK, "wood"));
  out.push(box(-w * 0.2, 2.2, d / 2 + 0.06, 1.4, 1.0, 0.12, GLASS, "glass"));
  // the roof: two slabs pitched to a ridge running along Z, with the gable under it
  const halfW = w / 2 + 0.6;
  const rise = halfW * Math.tan(HUT_ROOF_SLOPE);
  out.push(box(0, eave + w / 4 * Math.tan(HUT_ROOF_SLOPE), 0, w, w / 2 * Math.tan(HUT_ROOF_SLOPE), d, TIMBER, "wood", { profile: "gable", lod: "shell" }));
  for (const sgn of [-1, 1]) {
    out.push(box((sgn * halfW) / 2, eave + rise / 2 - (halfW - w / 2) * Math.tan(HUT_ROOF_SLOPE), 0,
      halfW / Math.cos(HUT_ROOF_SLOPE), 0.35, d + 1.2, HUT_ROOF, "roof", { rotZ: -sgn * HUT_ROOF_SLOPE, lod: "shell" }));
  }
  // a small landing porch and corner boards
  const porchZ = d / 2 + 0.8;
  out.push(box(0, eave - 0.6, porchZ, w * 0.85, 0.3, 1.8, HUT_ROOF, "roof", { lod: "shell" }));
  for (const side of [-1, 1]) {
    out.push(box(side * w * 0.36, (HUT_WALL_HEIGHT - 0.75) / 2, porchZ + 0.65, 0.22, HUT_WALL_HEIGHT - 0.75, 0.22, TIMBER_DARK, "wood"));
    out.push(box(side * (w / 2 - 0.15), HUT_WALL_HEIGHT / 2, d / 2 + 0.08, 0.3, HUT_WALL_HEIGHT, 0.16, TIMBER_DARK, "wood"));
  }
  // the crates and a barrel, 8 studs along and half a stud back
  const x = 8, z = -0.5;
  out.push(box(x, 0.75, z, 1.5, 1.5, 1.5, TIMBER, "wood"));
  out.push(box(x + 1.7, 0.6, z + 0.3, 1.2, 1.2, 1.2, TIMBER, "wood"));
  out.push(box(x + 0.2, 1.5 + 0.55, z - 0.1, 1.1, 1.1, 1.1, TIMBER_DARK, "wood"));
  out.push(box(x - 1.8, 0.7, z + 0.6, 1.0, 1.4, 1.0, TIMBER_DARK, "wood"));
  return out;
}

// --- the small furniture ---
const FLOODLIGHT_HEIGHT = 12;
const FLOODLIGHT_POST = 0.55;

/** A floodlight mast: a tall post with a bank of lamps on a crossbar along X. */
export function floodlightBoxes(): PropBox[] {
  return [
    box(0, FLOODLIGHT_HEIGHT / 2, 0, FLOODLIGHT_POST, FLOODLIGHT_HEIGHT, FLOODLIGHT_POST, STEEL_GREY, "column"),
    box(0, FLOODLIGHT_HEIGHT - 0.5, 0, 2.6, 0.3, 0.5, STEEL_GREY, "steel"),
    box(0, FLOODLIGHT_HEIGHT, 0, 2.4, 0.7, 1.1, LAMP_GLOW, "light"),
  ];
}

const BOLLARD_PLATE = 1.7;
const BOLLARD_PLATE_THICKNESS = 0.24;
const BOLLARD_POST = 0.9;
const BOLLARD_POST_HEIGHT = 1.1;
const BOLLARD_CAP = 1.25;
const BOLLARD_CAP_THICKNESS = 0.4;

/** A bollard: a base plate, the post and its cap. */
export function bollardBoxes(): PropBox[] {
  const postBase = BOLLARD_PLATE_THICKNESS;
  return [
    box(0, BOLLARD_PLATE_THICKNESS / 2, 0, BOLLARD_PLATE, BOLLARD_PLATE_THICKNESS, BOLLARD_PLATE, BOLLARD, "steel"),
    box(0, postBase + BOLLARD_POST_HEIGHT / 2, 0, BOLLARD_POST, BOLLARD_POST_HEIGHT, BOLLARD_POST, BOLLARD, "steel"),
    box(0, postBase + BOLLARD_POST_HEIGHT + BOLLARD_CAP_THICKNESS / 2, 0, BOLLARD_CAP, BOLLARD_CAP_THICKNESS, BOLLARD_CAP, BOLLARD, "steel"),
  ];
}

const MOORING_POST = 0.85;
const MOORING_POST_HEIGHT = 2.2;

/** A timber mooring post, sunk half a stud below the deck. */
export function mooringPostBoxes(): PropBox[] {
  return [box(0, -0.5 + MOORING_POST_HEIGHT / 2, 0, MOORING_POST, MOORING_POST_HEIGHT, MOORING_POST, TIMBER_DARK, "wood")];
}

// --- the designs ---
const CRANE_PARAMS: ParamSpec[] = [{ name: "deck", title: "Deck", default: "sea", values: [{ value: "sea", title: "Sea mole" }, { value: "river", title: "River wharf" }] }];
const CONTAINER_PARAMS: ParamSpec[] = [
  { name: "livery", title: "Livery", default: "0", values: CONTAINER_COLORS.map((_, i) => ({ value: String(i), title: `Livery ${i + 1}` })) },
  { name: "stack", title: "Stack", default: "one", values: [{ value: "one", title: "One" }, { value: "two", title: "Two" }] },
];
const craneOf = (values?: Record<string, string>): PropBox[] =>
  craneBoxes(CRANE_DECKS[resolveParams(CRANE_PARAMS, values).deck as keyof typeof CRANE_DECKS] - 2 * CRANE_RAIL_INSET);
export function portCrane(values?: Record<string, string>): MeshBuilder { return propModel(craneOf(values)); }
export function portCraneLod(values?: Record<string, string>): MeshBuilder { return propModel(craneOf(values), true); }
const containerOf = (values?: Record<string, string>): PropBox[] => {
  const v = resolveParams(CONTAINER_PARAMS, values);
  return containerBoxes(Number(v.livery), v.stack === "two" ? 2 : 1);
};
export function portContainer(values?: Record<string, string>): MeshBuilder { return propModel(containerOf(values)); }
export function portContainerLod(values?: Record<string, string>): MeshBuilder { return propModel(containerOf(values), true); }
export function portHut(): MeshBuilder { return propModel(hutBoxes()); }
export function portHutLod(): MeshBuilder { return propModel(hutBoxes(), true); }
export function portFloodlight(): MeshBuilder { return propModel(floodlightBoxes()); }
export function portFloodlightLod(): MeshBuilder { return propModel(floodlightBoxes(), true); }
export function portBollard(): MeshBuilder { return propModel(bollardBoxes()); }
export function portBollardLod(): MeshBuilder { return propModel(bollardBoxes(), true); }
export function portMooringPost(): MeshBuilder { return propModel(mooringPostBoxes()); }
export function portMooringPostLod(): MeshBuilder { return propModel(mooringPostBoxes(), true); }

const PROP_CATALOG = { category: "Props", group: "props", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const PORT_PROPS: ProceduralDesign[] = [
  { id: "proc-prop-port-crane", title: "Port Crane", build: portCrane, buildLod: portCraneLod, lodTriangles: 200 as const, params: CRANE_PARAMS },
  { id: "proc-prop-port-container", title: "Container", build: portContainer, buildLod: portContainerLod, params: CONTAINER_PARAMS },
  { id: "proc-prop-port-hut", title: "Fisherman's Hut", build: portHut, buildLod: portHutLod },
  { id: "proc-prop-port-floodlight", title: "Floodlight Mast", build: portFloodlight, buildLod: portFloodlightLod },
  { id: "proc-prop-port-bollard", title: "Bollard", build: portBollard, buildLod: portBollardLod },
  { id: "proc-prop-port-mooring-post", title: "Mooring Post", build: portMooringPost, buildLod: portMooringPostLod },
].map((d) => ({ ...d, catalog: { ...PROP_CATALOG } }));
