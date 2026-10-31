// The characters (docs/models/characters.md): the walking avatar the game's walk
// mode moves through the world. A blocky, Roblox-like figure of boxes in metres,
// like the vehicles: +X forward (its face), +Y up, +Z to its right, feet at y = 0,
// the origin between the feet. Every limb is a part the clips turn about its joint:
//
//   torso      the upper body's root, pivot at the hips; carries the head and arms
//   head       pivot at the neck
//   leftArm    pivot at the shoulder (-Z), rightArm (+Z)
//   leftLeg    the thigh, pivot at the hip; leftShin (shin and shoe) at the knee
//   rightLeg   likewise, rightShin
//
// The clips (meshCore.ts ClipDrive): `idle` (time), `walk` and `run` (distance,
// in place: the game moves the figure), and the chosen motions `jump`, `fall` and
// `sit` (motion). Every clip moves the same tracks - each part's rotation and the
// torso's and both legs' translation - so a consumer can cross-fade any two. Where
// the figure stands, the hips are lowered (never raised past the rest height
// except in a run's flight) until the lowest corner of a shoe touches y = 0, so the
// stance foot plants on the ground at every sample.
//
// The low detail is eight plain boxes under 100 triangles in the rest pose: one
// static mesh like every low detail (no parts, no clips).

import { resolveParams, type CharacterPreset, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { chamferedRect, rect, type AnimationTrack, type Vec3 } from "./meshCore.ts";
import { block, cube, qAxis, qMul, qRotate, r9, TAU, type Quat } from "./characterKit.ts";

// ------------------------------------------------------------------ the figure

/** The avatar's measures, metres. */
export const AVATAR = {
  /** The hip joint's height: the legs' pivots and the torso's. */
  hip: 0.78,
  /** Hip to knee. */
  thigh: 0.39,
  /** The hip joints' offset across, either side. */
  hipZ: 0.12,
  /** The shoulder joints: height and offset across. */
  shoulderY: 1.3,
  shoulderZ: 0.36,
  /** The neck joint. */
  neckY: 1.41,
  /** Walking pace, m/s, and the metres one walk cycle (two steps) covers. */
  walkSpeed: 1.4,
  walkStride: 1.6,
  /** Running pace and the metres one run cycle covers. */
  runSpeed: 4,
  runStride: 3.2,
} as const;

/** The facing the game reads off characters.meta.json: the face looks along +X, as a vehicle's nose does. */
export const AVATAR_FACING = "+x";

// ------------------------------------------------------------------ the look

/** One enum value with its English title (exported game text, docs/models/text.md). */
const v = (value: string, title: string) => ({ value, title });

/** The colour palettes: each value's sRGB hex. */
export const SKIN_TONES: Record<string, string> = { light: "#eac086", fair: "#f3d3b5", tan: "#c99764", brown: "#8d5a3b", dark: "#5a3a26" };
export const SHIRT_COLOURS: Record<string, string> = {
  blue: "#2f6fd0", red: "#c8352e", green: "#3f8f45", yellow: "#e8c33a", white: "#e9e9e4",
  black: "#26262b", orange: "#e07a26", purple: "#7a4bb0", navy: "#1f2b4d",
};
export const TROUSER_COLOURS: Record<string, string> = { navy: "#3b4a63", black: "#232328", grey: "#6f737a", beige: "#b9a47c", denim: "#3f6390", brown: "#5e4430" };
export const HAIR_COLOURS: Record<string, string> = { brown: "#3d2817", black: "#17151a", blonde: "#d6b25e", red: "#a2462a", grey: "#9c9c9e" };

/**
 * The avatar's parameters (docs/models/characters.md): five that change its shape and
 * four colour palettes (finish parameters). Names and values are stored in the game's
 * saved maps - never rename a shipped one. The defaults draw the original figure.
 */
export const AVATAR_PARAMS: readonly ParamSpec[] = [
  { name: "hair", title: "Hair", default: "short", values: [v("short", "Short"), v("curls", "Curls"), v("long", "Long"), v("ponytail", "Ponytail"), v("bald", "Bald")] },
  {
    name: "headwear", title: "Headwear", default: "none",
    values: [v("none", "None"), v("cap", "Cap"), v("hat", "Hat"), v("beanie", "Beanie"), v("helmet", "Hard hat"), v("conductor", "Conductor's cap")],
  },
  { name: "bag", title: "Bag", default: "none", values: [v("none", "None"), v("backpack", "Backpack"), v("shoulderBag", "Shoulder bag"), v("suitcase", "Suitcase")] },
  { name: "body", title: "Body", default: "standard", values: [v("standard", "Standard"), v("slim", "Slim"), v("broad", "Broad")] },
  { name: "clothing", title: "Clothing", default: "tshirt", values: [v("tshirt", "T-shirt"), v("jacket", "Jacket"), v("dress", "Dress"), v("vest", "High-vis vest")] },
  {
    name: "skin", title: "Skin", default: "light",
    values: [v("light", "Light"), v("fair", "Fair"), v("tan", "Tan"), v("brown", "Brown"), v("dark", "Dark")],
  },
  {
    name: "shirtColour", title: "Top colour", default: "blue",
    values: [v("blue", "Blue"), v("red", "Red"), v("green", "Green"), v("yellow", "Yellow"), v("white", "White"), v("black", "Black"), v("orange", "Orange"), v("purple", "Purple"), v("navy", "Navy")],
  },
  {
    name: "trousersColour", title: "Trousers colour", default: "navy",
    values: [v("navy", "Navy"), v("black", "Black"), v("grey", "Grey"), v("beige", "Beige"), v("denim", "Denim"), v("brown", "Brown")],
  },
  { name: "hairColour", title: "Hair colour", default: "brown", values: [v("brown", "Brown"), v("black", "Black"), v("blonde", "Blonde"), v("red", "Red"), v("grey", "Grey")] },
];

/** The parameters that only recolour the avatar (ProceduralDesign.finishParams). */
export const AVATAR_FINISH_PARAMS = ["skin", "shirtColour", "trousersColour", "hairColour"] as const;

/**
 * The named looks the game offers as avatar types (characters.meta.json `presets`),
 * each a full set of parameter values and the grammatical gender of the first name
 * the game gives a new avatar of that look. Ids are stored in saved maps.
 */
export const AVATAR_PRESETS: readonly CharacterPreset[] = [
  { id: "classic", title: "Classic", nameGender: "male", params: {} },
  { id: "conductor", title: "Conductor", nameGender: "male", params: { headwear: "conductor", clothing: "jacket", shirtColour: "navy", trousersColour: "navy" } },
  { id: "worker", title: "Worker", nameGender: "male", params: { headwear: "helmet", clothing: "vest", body: "broad", shirtColour: "white", trousersColour: "denim", skin: "tan" } },
  { id: "hiker", title: "Hiker", nameGender: "female", params: { hair: "ponytail", headwear: "cap", bag: "backpack", shirtColour: "green", trousersColour: "brown", hairColour: "blonde" } },
  { id: "tourist", title: "Tourist", nameGender: "male", params: { headwear: "hat", bag: "shoulderBag", shirtColour: "red", trousersColour: "beige", skin: "fair" } },
  { id: "traveller", title: "Traveller", nameGender: "female", params: { hair: "long", bag: "suitcase", clothing: "dress", shirtColour: "purple", hairColour: "black", skin: "brown" } },
  { id: "student", title: "Student", nameGender: "female", params: { hair: "curls", bag: "backpack", body: "slim", shirtColour: "yellow", trousersColour: "denim", hairColour: "black", skin: "dark" } },
  { id: "business", title: "Business", nameGender: "male", params: { bag: "suitcase", clothing: "jacket", shirtColour: "black", trousersColour: "black", hairColour: "grey" } },
  { id: "commuter", title: "Commuter", nameGender: "female", params: { hair: "ponytail", bag: "shoulderBag", clothing: "jacket", body: "slim", shirtColour: "red", trousersColour: "black", hairColour: "red" } },
  { id: "pensioner", title: "Pensioner", nameGender: "male", params: { hair: "bald", headwear: "hat", body: "broad", shirtColour: "green", trousersColour: "grey", hairColour: "grey" } },
];

/** The upper body's measures per body shape; the legs and the joints below the neck stay the same for every shape. */
const BODIES: Record<string, { tw: number; td: number; shoulderZ: number; limb: number }> = {
  standard: { tw: 0.26, td: 0.48, shoulderZ: 0.36, limb: 1 },
  slim: { tw: 0.215, td: 0.42, shoulderZ: 0.33, limb: 0.88 },
  broad: { tw: 0.32, td: 0.54, shoulderZ: 0.4, limb: 1.1 },
};

/** A resolved look: the parameter values and the measures they pick. */
interface Look {
  hair: string;
  headwear: string;
  bag: string;
  clothing: string;
  tw: number;
  td: number;
  shoulderZ: number;
  limb: number;
}

function lookOf(params?: ParamValues): { look: Look; palette: Record<string, MaterialSpec> } {
  const p = resolveParams(AVATAR_PARAMS, params);
  const body = BODIES[p.body!]!;
  const look: Look = { hair: p.hair!, headwear: p.headwear!, bag: p.bag!, clothing: p.clothing!, ...body };
  const palette: Record<string, MaterialSpec> = {
    skin: { color: SKIN_TONES[p.skin!]!, roughness: 0.7 },
    shirt: { color: SHIRT_COLOURS[p.shirtColour!]!, roughness: 0.85 },
    trousers: { color: TROUSER_COLOURS[p.trousersColour!]!, roughness: 0.9 },
    shoes: { color: "#2a2a2e", roughness: 0.6 },
    hair: { color: HAIR_COLOURS[p.hairColour!]!, roughness: 0.9 },
    face: { color: "#1c1c22", roughness: 0.5 },
    mouth: { color: "#8a3a34", roughness: 0.6 },
  };
  const add = (name: string, color: string, roughness = 0.8, metallic = 0): void => {
    palette[name] = { color, roughness, ...(metallic ? { metallic } : {}) };
  };
  if (look.clothing === "jacket") add("undershirt", "#ecebe6", 0.85);
  if (look.clothing === "vest") {
    add("vest", "#d6ea2a", 0.7);
    add("reflector", "#c9cdd2", 0.35, 0.4);
  }
  const headwear: Record<string, [string, string?]> = {
    cap: ["#c8352e"], hat: ["#b89a6a", "#5b4430"], beanie: ["#5f8a3a", "#e9e6dc"], helmet: ["#f2c230"], conductor: ["#1f2a4a", "#d4af37"],
  };
  const hw = headwear[look.headwear];
  if (hw) {
    add("headwear", hw[0], look.headwear === "helmet" ? 0.45 : 0.85);
    if (hw[1]) add("headwearTrim", hw[1], 0.6, look.headwear === "conductor" ? 0.6 : 0);
  }
  const bags: Record<string, string> = { backpack: "#46583a", shoulderBag: "#6b4a2e", suitcase: "#8a2f2f" };
  if (bags[look.bag]) {
    add("bag", bags[look.bag]!, 0.75);
    add("strap", "#2b2b2f", 0.8);
  }
  return { look, palette };
}

const PART_ORDER = ["torso", "head", "leftArm", "rightArm", "leftLeg", "leftShin", "rightLeg", "rightShin"] as const;
type PartName = (typeof PART_ORDER)[number];
type Side = "left" | "right";
const SIDES: readonly Side[] = ["left", "right"];
/** -Z is the figure's left, +Z its right (facing +X). */
const sideZ = (s: Side): number => (s === "left" ? -1 : 1);

/** The parts' pivots at rest, world coordinates. */
const PIVOTS: Record<PartName, Vec3> = {
  torso: [0, AVATAR.hip, 0],
  head: [0, AVATAR.neckY, 0],
  leftArm: [0, AVATAR.shoulderY, -AVATAR.shoulderZ],
  rightArm: [0, AVATAR.shoulderY, AVATAR.shoulderZ],
  leftLeg: [0, AVATAR.hip, -AVATAR.hipZ],
  leftShin: [0, AVATAR.hip - AVATAR.thigh, -AVATAR.hipZ],
  rightLeg: [0, AVATAR.hip, AVATAR.hipZ],
  rightShin: [0, AVATAR.hip - AVATAR.thigh, AVATAR.hipZ],
};

/** One box of a limb, for the foot contact: its centre across, size and heights. */
interface LimbBox { cx: number; w: number; d: number; y0: number; y1: number }
/** The shin's and shoe's boxes about the shin's own axis (z = 0), world heights at rest. */
const SHIN_BOXES: readonly LimbBox[] = [
  { cx: 0, w: 0.2, d: 0.19, y0: 0.06, y1: 0.41 },
  { cx: 0.025, w: 0.29, d: 0.21, y0: 0, y1: 0.09 },
];
const THIGH_BOX: LimbBox = { cx: 0, w: 0.23, d: 0.21, y0: 0.36, y1: 0.8 };
/** The low detail's shin: one box down to the sole. */
const LOD_SHIN: LimbBox = { cx: 0.02, w: 0.24, d: 0.2, y0: 0, y1: 0.41 };

function drawLimb(m: MeshBuilder, mat: string, b: LimbBox, z: number): void {
  cube(m, mat, b.cx, z, b.w, b.d, b.y0, b.y1);
}

/** The legs' material: trousers, or bare legs under a dress. */
const legMat = (look: Look): string => (look.clothing === "dress" ? "skin" : "trousers");

/** The hair, on the head part. Under headwear the curls lose the bumps the headwear covers. */
function drawHair(m: MeshBuilder, look: Look): void {
  if (look.hair === "bald") return;
  m.scope("hair", () => {
    if (look.hair === "curls") {
      block(m, "hair", chamferedRect(0.43, 0.43, 0.07), 1.72, 1.83);
      cube(m, "hair", -0.17, 0, 0.112, 0.41, 1.46, 1.76);
      for (const z of [-0.195, 0.195]) cube(m, "hair", -0.06, z, 0.2, 0.052, 1.6, 1.755);
      if (look.headwear === "none") {
        for (const [x, z] of [[0.09, -0.1], [0.09, 0.1], [-0.09, -0.1], [-0.09, 0.1]] as const) cube(m, "hair", x, z, 0.13, 0.13, 1.8, 1.875);
      }
      return;
    }
    block(m, "hair", chamferedRect(0.41, 0.41, 0.06, -0.005), 1.73, 1.81);
    cube(m, "hair", -0.165, 0, 0.08, 0.395, 1.5, 1.74);
    if (look.hair === "long") {
      cube(m, "hair", -0.17, 0, 0.09, 0.41, 1.29, 1.745);
      for (const z of [-0.2, 0.2]) cube(m, "hair", -0.07, z, 0.21, 0.042, 1.39, 1.75);
    } else if (look.hair === "ponytail") {
      cube(m, "hair", -0.215, 0, 0.07, 0.07, 1.61, 1.68);
      cube(m, "hair", -0.265, 0, 0.08, 0.1, 1.37, 1.655);
    }
  });
}

/** The headwear over the hair, on the head part. */
function drawHeadwear(m: MeshBuilder, look: Look): void {
  const h = look.headwear;
  if (h === "none") return;
  m.scope(h === "helmet" ? "hardHat" : h, () => {
    if (h === "cap") {
      block(m, "headwear", chamferedRect(0.445, 0.445, 0.07), 1.745, 1.87);
      cube(m, "headwear", 0.3, 0, 0.19, 0.36, 1.75, 1.772);
    } else if (h === "hat") {
      block(m, "headwear", chamferedRect(0.445, 0.445, 0.05), 1.765, 1.95);
      block(m, "headwearTrim", chamferedRect(0.455, 0.455, 0.05), 1.79, 1.84);
      block(m, "headwear", chamferedRect(0.64, 0.64, 0.1), 1.775, 1.797);
    } else if (h === "beanie") {
      block(m, "headwear", chamferedRect(0.435, 0.435, 0.07), 1.71, 1.87);
      block(m, "headwear", chamferedRect(0.455, 0.455, 0.085), 1.695, 1.765);
      cube(m, "headwearTrim", 0, 0, 0.09, 0.09, 1.86, 1.935);
    } else if (h === "helmet") {
      block(m, "headwear", chamferedRect(0.45, 0.45, 0.1), 1.735, 1.895);
      block(m, "headwear", chamferedRect(0.51, 0.51, 0.11), 1.74, 1.763);
      cube(m, "headwear", 0, 0, 0.37, 0.07, 1.885, 1.925);
    } else if (h === "conductor") {
      block(m, "headwear", chamferedRect(0.44, 0.44, 0.06), 1.745, 1.865);
      block(m, "headwear", chamferedRect(0.48, 0.48, 0.07), 1.855, 1.895);
      cube(m, "face", 0.29, 0, 0.15, 0.35, 1.75, 1.77);
      cube(m, "headwearTrim", 0.222, 0, 0.014, 0.07, 1.8, 1.835);
    }
  });
}

/** The clothes over the torso, on the torso part. */
function drawTorso(m: MeshBuilder, look: Look): void {
  const { tw, td } = look;
  m.scope("shirt", () => {
    cube(m, "shirt", 0, 0, tw, td, 0.84, 1.4);
    // the collar, a band of skin at the open neck
    cube(m, "skin", tw / 2 - 0.03, 0, 0.07, 0.14, 1.33, 1.405);
  });
  m.scope("waist", () => cube(m, "trousers", 0, 0, tw + 0.01, td + 0.01, 0.76, 0.86));
  if (look.clothing === "jacket") {
    m.scope("jacket", () => {
      cube(m, "shirt", 0, 0, tw + 0.024, td + 0.022, 0.8, 1.385);
      cube(m, "undershirt", (tw + 0.024) / 2, 0, 0.014, 0.11, 1.06, 1.395);
    });
  } else if (look.clothing === "vest") {
    m.scope("vest", () => {
      cube(m, "vest", 0, 0, tw + 0.026, td + 0.014, 0.9, 1.36);
      for (const y of [1.0, 1.13]) cube(m, "reflector", 0, 0, tw + 0.036, td + 0.024, y, y + 0.04);
    });
  } else if (look.clothing === "dress") {
    m.scope("skirt", () => {
      const top = rect(tw + 0.022, td + 0.022);
      const hem = rect(tw + 0.13, td + 0.1);
      m.loft("shirt", hem, 0.55, top, 0.87);
      m.cap("shirt", hem, 0.55, false);
    });
  }
}

/** The bag, on the torso (a backpack, a shoulder bag) or in the right hand (a suitcase: see drawArm). */
function drawBag(m: MeshBuilder, look: Look): void {
  const { tw, td } = look;
  if (look.bag === "backpack") {
    m.scope("backpack", () => {
      cube(m, "bag", -tw / 2 - 0.085, 0, 0.18, 0.36, 0.915, 1.32);
      cube(m, "bag", -tw / 2 - 0.19, 0, 0.05, 0.28, 0.94, 1.12);
      for (const z of [-0.1, 0.1]) {
        cube(m, "strap", tw / 2 + 0.004, z, 0.022, 0.05, 1.0, 1.395);
        cube(m, "strap", 0, z, tw + 0.03, 0.05, 1.37, 1.41);
      }
    });
  } else if (look.bag === "shoulderBag") {
    m.scope("shoulderBag", () => {
      cube(m, "bag", tw / 2 + 0.045, -td / 4, 0.09, 0.22, 0.815, 1.01);
      // the strap across the chest, from the right shoulder down to the bag
      m.rod("strap", [tw / 2 + 0.012, 1.4, td / 2 - 0.08], [tw / 2 + 0.012, 0.98, -td / 4 + 0.06], 0.018, 4);
      m.rod("strap", [-tw / 2 - 0.012, 1.4, td / 2 - 0.08], [-tw / 2 - 0.012, 0.98, -td / 4 + 0.06], 0.018, 4);
    });
  }
}

function drawArm(m: MeshBuilder, look: Look, s: Side): void {
  const z = sideZ(s) * look.shoulderZ;
  const k = look.limb;
  const long = look.clothing === "jacket";
  m.part(`${s}Arm`, [0, AVATAR.shoulderY, z], () => {
    m.scope("sleeve", () => cube(m, "shirt", 0, z, 0.23 * k, 0.23 * k, long ? 0.865 : 1.06, 1.41));
    if (!long) m.scope("arm", () => cube(m, "skin", 0, z, 0.2 * k, 0.2 * k, 0.84, 1.08));
    m.scope("hand", () => cube(m, "skin", 0.01, z, 0.18 * k, 0.21 * k, 0.78, 0.86));
    if (s === "right" && look.bag === "suitcase") {
      m.scope("suitcase", () => {
        cube(m, "strap", 0.01, z, 0.12, 0.04, 0.74, 0.79);
        cube(m, "bag", 0.01, z + 0.035, 0.44, 0.13, 0.45, 0.745);
      });
    }
  }, "torso");
}

/** The full figure: closed boxes, a few hundred triangles. */
function drawAvatar(m: MeshBuilder, look: Look): void {
  m.part("torso", PIVOTS.torso, () => {
    drawTorso(m, look);
    drawBag(m, look);
  });
  m.part("head", PIVOTS.head, () => {
    m.scope("neck", () => cube(m, "skin", 0, 0, 0.12, 0.12, 1.37, 1.44, false));
    m.scope("head", () => block(m, "skin", chamferedRect(0.38, 0.38, 0.05), 1.42, 1.78));
    drawHair(m, look);
    drawHeadwear(m, look);
    m.scope("face", () => {
      for (const z of [-0.075, 0.075]) {
        cube(m, "face", 0.188, z, 0.016, 0.055, 1.62, 1.685);
        // a brow over each eye
        cube(m, "hair", 0.188, z, 0.016, 0.075, 1.7, 1.715);
      }
      cube(m, "mouth", 0.188, 0, 0.014, 0.12, 1.51, 1.535);
      cube(m, "skin", 0.2, 0, 0.04, 0.05, 1.56, 1.6);
    });
  }, "torso");
  for (const s of SIDES) drawArm(m, look, s);
  for (const s of SIDES) {
    const z = sideZ(s) * AVATAR.hipZ;
    m.part(`${s}Leg`, PIVOTS[`${s}Leg`], () => m.scope("thigh", () => drawLimb(m, legMat(look), THIGH_BOX, z)));
    m.part(`${s}Shin`, PIVOTS[`${s}Shin`], () => {
      m.scope("shin", () => drawLimb(m, legMat(look), SHIN_BOXES[0]!, z));
      m.scope("shoe", () => drawLimb(m, "shoes", SHIN_BOXES[1]!, z));
    }, `${s}Leg`);
  }
}

/** The low detail: eight plain boxes in the rest pose, one static mesh, in the look's colours. */
function drawAvatarLod(m: MeshBuilder, look: Look): void {
  m.scope("torso", () => cube(m, "shirt", 0, 0, look.tw, look.td, 0.76, 1.4, false));
  m.scope("head", () => cube(m, "skin", 0, 0, 0.38, 0.38, 1.4, 1.79, false));
  for (const s of SIDES) m.scope(`${s}Arm`, () => cube(m, "shirt", 0, sideZ(s) * look.shoulderZ, 0.22 * look.limb, 0.22 * look.limb, 0.79, 1.41));
  for (const s of SIDES) {
    const z = sideZ(s) * AVATAR.hipZ;
    m.scope(`${s}Leg`, () => drawLimb(m, legMat(look), THIGH_BOX, z));
    m.scope(`${s}Shin`, () => drawLimb(m, legMat(look), LOD_SHIN, z));
  }
}

// ------------------------------------------------------------------ the pose

/**
 * A pose in joint angles, radians. A swing turns a limb about Z: positive brings
 * an arm's hand or a thigh's knee forward (+X); a knee's negative bend folds the
 * shin back. `out` lifts an arm sideways away from the body. The torso leans
 * forward with a negative `lean` (about Z at the hips) and twists about Y.
 * `lift` raises (or with a negative value lowers) the hips; it is solved for the
 * foot contact where the figure stands (see `solveContact`).
 */
export interface JointPose {
  lean: number;
  twist: number;
  nod: number;
  arm: Record<Side, { swing: number; out: number }>;
  leg: Record<Side, { swing: number; knee: number }>;
  lift: number;
}

const REST: JointPose = {
  lean: 0, twist: 0, nod: 0, lift: 0,
  arm: { left: { swing: 0, out: 0 }, right: { swing: 0, out: 0 } },
  leg: { left: { swing: 0, knee: 0 }, right: { swing: 0, knee: 0 } },
};

/** Each part's local rotation for a pose. */
function rotations(p: JointPose): Record<PartName, Quat> {
  const arm = (s: Side): Quat => qMul(qAxis(2, p.arm[s].swing), qAxis(0, -sideZ(s) * p.arm[s].out));
  return {
    torso: qMul(qAxis(1, p.twist), qAxis(2, p.lean)),
    head: qMul(qAxis(1, -p.twist * 0.6), qAxis(2, -p.nod)),
    leftArm: arm("left"),
    rightArm: arm("right"),
    leftLeg: qAxis(2, p.leg.left.swing),
    leftShin: qAxis(2, p.leg.left.knee),
    rightLeg: qAxis(2, p.leg.right.swing),
    rightShin: qAxis(2, p.leg.right.knee),
  };
}

/** The corners of a limb box about its pivot, rest coordinates relative to `pivotY` (z about the limb's axis). */
function corners(b: LimbBox, pivotY: number): Vec3[] {
  const out: Vec3[] = [];
  for (const x of [b.cx - b.w / 2, b.cx + b.w / 2]) for (const y of [b.y0, b.y1]) for (const z of [-b.d / 2, b.d / 2]) out.push([x, y - pivotY, z]);
  return out;
}
const THIGH_CORNERS = corners(THIGH_BOX, AVATAR.hip);
const SHIN_CORNERS = SHIN_BOXES.flatMap((b) => corners(b, AVATAR.hip - AVATAR.thigh));

/** The lowest point of either leg (thigh, shin or shoe) in a pose, before its `lift`. */
export function lowestLegPoint(p: JointPose): number {
  const q = rotations(p);
  let low = Infinity;
  for (const s of SIDES) {
    const leg = s === "left" ? q.leftLeg : q.rightLeg;
    const shin = qMul(leg, s === "left" ? q.leftShin : q.rightShin);
    const knee = qRotate(leg, [0, -AVATAR.thigh, 0]);
    for (const c of THIGH_CORNERS) low = Math.min(low, AVATAR.hip + qRotate(leg, c)[1]);
    for (const c of SHIN_CORNERS) low = Math.min(low, AVATAR.hip + knee[1] + qRotate(shin, c)[1]);
  }
  return low;
}

/** The pose with its hips lowered or raised so its lowest point touches y = 0: a standing figure's contact. */
function solveContact(p: JointPose, extra = 0): JointPose {
  return { ...p, lift: -lowestLegPoint(p) + extra };
}

/** The tracks of a clip from one pose per sample: every part's rotation, and the hips' height on the torso and both legs. */
function tracksOf(poses: readonly JointPose[]): AnimationTrack[] {
  const rots = poses.map(rotations);
  const r6 = (v: number): number => Math.round(v * 1e6) / 1e6 + 0;
  const out: AnimationTrack[] = PART_ORDER.map((node) => ({ node, path: "rotation", values: rots.flatMap((r) => r[node].map(r6)) }));
  for (const node of ["torso", "leftLeg", "rightLeg"] as const) {
    const [x, y, z] = PIVOTS[node];
    out.push({ node, path: "translation", values: poses.flatMap((p) => [x, r6(y + p.lift), z]) });
  }
  return out;
}

/** A loop of `n` samples over `duration` seconds plus the closing one, which repeats the first exactly. */
function loop(duration: number, n: number, at: (phase: number) => JointPose): { times: number[]; tracks: AnimationTrack[] } {
  const poses = Array.from({ length: n }, (_, k) => at(k / n));
  poses.push(poses[0]!);
  return { times: Array.from({ length: n + 1 }, (_, k) => r9((k * duration) / n)), tracks: tracksOf(poses) };
}

const pose = (p: Partial<Omit<JointPose, "arm" | "leg">> & { arm?: Partial<JointPose["arm"]>; leg?: Partial<JointPose["leg"]> }): JointPose => ({
  ...REST, ...p, arm: { ...REST.arm, ...p.arm }, leg: { ...REST.leg, ...p.leg },
});

/** A gait at `phase` 0..1: each thigh swings `swing` either way, its knee folds `knee` while it swings through. */
function gait(phase: number, o: { swing: number; knee: number; stanceKnee: number; arm: number; lean: number; twist: number; bounce: number; elbowOut: number }): JointPose {
  const a = TAU * phase;
  const leg = (shift: number) => {
    const s = Math.sin(a + shift);
    const c = Math.cos(a + shift);
    // the knee folds while the thigh swings forward (its angle rising), most as it passes under the hip
    const fold = c > 0 ? c * c : 0;
    return { swing: o.swing * s, knee: -o.knee * fold - o.stanceKnee * (1 - fold) };
  };
  const p = pose({
    lean: o.lean, twist: o.twist * Math.sin(a), nod: 0.02 * Math.sin(2 * a),
    arm: { left: { swing: -o.arm * Math.sin(a), out: o.elbowOut }, right: { swing: o.arm * Math.sin(a), out: o.elbowOut } },
    leg: { left: leg(0), right: leg(Math.PI) },
  });
  // a run leaves the ground just after each push-off: the hips rise over the contact
  return solveContact(p, o.bounce * Math.max(0, Math.sin(2 * a - 0.6)) ** 2);
}

/** Keyframed motion: angle values eased (smoothstep) between keys, sampled every 1/30 s. */
interface Key { t: number; pose: JointPose; ground: boolean }
function keyed(keys: readonly Key[]): { times: number[]; tracks: AnimationTrack[] } {
  const end = keys[keys.length - 1]!.t;
  const n = Math.round(end * 30);
  const dyOf = (k: Key) => (k.ground ? solveContact(k.pose).lift : 0);
  const poses: JointPose[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i * end) / n;
    let j = 0;
    while (j < keys.length - 2 && t > keys[j + 1]!.t) j++;
    const [a, b] = [keys[j]!, keys[j + 1]!];
    const u = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
    const e = u * u * (3 - 2 * u);
    const mix = (x: number, y: number) => x + (y - x) * e;
    const p: JointPose = {
      lean: mix(a.pose.lean, b.pose.lean), twist: mix(a.pose.twist, b.pose.twist), nod: mix(a.pose.nod, b.pose.nod), lift: 0,
      arm: Object.fromEntries(SIDES.map((s) => [s, { swing: mix(a.pose.arm[s].swing, b.pose.arm[s].swing), out: mix(a.pose.arm[s].out, b.pose.arm[s].out) }])) as JointPose["arm"],
      leg: Object.fromEntries(SIDES.map((s) => [s, { swing: mix(a.pose.leg[s].swing, b.pose.leg[s].swing), knee: mix(a.pose.leg[s].knee, b.pose.leg[s].knee) }])) as JointPose["leg"],
    };
    // standing between two standing keys: the feet stay planted; in the air the hips follow the keys
    poses.push(a.ground && b.ground ? solveContact(p) : { ...p, lift: mix(dyOf(a), dyOf(b)) });
  }
  return { times: Array.from({ length: n + 1 }, (_, i) => r9((i * end) / n)), tracks: tracksOf(poses) };
}

/** The idle loop: 2 s of breathing, a slight sway of the arms and a nod. */
export const IDLE_SECONDS = 2;
/** The jump: crouch, push off, tuck, open and land, in 0.9 s; it ends near the rest pose, knees a little bent. */
export const JUMP_SECONDS = 0.9;
/** The fall loop: arms up and flailing, legs kicking, 0.8 s. */
export const FALL_SECONDS = 0.8;
/** The sit: from standing to seated in 0.8 s; the clip's end is the seated pose. */
export const SIT_SECONDS = 0.8;

/** The seated pose: thighs level forward, shins straight down, the shoes on the ground. */
const SEATED = solveContact(pose({ arm: { left: { swing: 0.35, out: 0.04 }, right: { swing: 0.35, out: 0.04 } }, leg: { left: { swing: Math.PI / 2, knee: -Math.PI / 2 }, right: { swing: Math.PI / 2, knee: -Math.PI / 2 } } }));
/** The hips' height in the seated pose, metres: where the game puts the hip joints on a seat. */
export const AVATAR_SEAT_HEIGHT = Math.round((AVATAR.hip + SEATED.lift) * 1e4) / 1e4;

function addClips(m: MeshBuilder): void {
  m.animate({
    name: "idle", drive: { drive: "time" },
    ...loop(IDLE_SECONDS, 24, (ph) => {
      const b = Math.sin(TAU * ph);
      return pose({ lean: 0.012 * b, nod: -0.025 * Math.sin(TAU * ph + 0.8), arm: { left: { swing: 0.035 * b, out: 0.05 + 0.025 * b }, right: { swing: -0.035 * b, out: 0.05 + 0.025 * b } } });
    }),
  });
  const walkT = AVATAR.walkStride / AVATAR.walkSpeed;
  m.animate({
    name: "walk", drive: { drive: "distance", speed: AVATAR.walkSpeed },
    // each foot is planted for about half the cycle and moves back half a stride: 2 * thigh * sin(swing) ~ stride / 2
    ...loop(walkT, 32, (ph) => gait(ph, { swing: 0.53, knee: 0.9, stanceKnee: 0.04, arm: 0.45, lean: -0.05, twist: 0.06, bounce: 0, elbowOut: 0.06 })),
  });
  const runT = AVATAR.runStride / AVATAR.runSpeed;
  m.animate({
    name: "run", drive: { drive: "distance", speed: AVATAR.runSpeed },
    ...loop(runT, 32, (ph) => gait(ph, { swing: 0.75, knee: 1.7, stanceKnee: 0.25, arm: 1.0, lean: -0.2, twist: 0.1, bounce: 0.06, elbowOut: 0.1 })),
  });
  m.animate({
    name: "jump", drive: { drive: "motion" },
    ...keyed([
      { t: 0, pose: REST, ground: true },
      { t: 0.2, pose: pose({ lean: -0.45, nod: -0.2, arm: { left: { swing: -0.9, out: 0.1 }, right: { swing: -0.9, out: 0.1 } }, leg: { left: { swing: 0.95, knee: -1.5 }, right: { swing: 0.95, knee: -1.5 } } }), ground: true },
      { t: 0.34, pose: pose({ lean: 0.05, nod: 0.1, arm: { left: { swing: 2.7, out: 0.2 }, right: { swing: 2.7, out: 0.2 } }, leg: { left: { swing: -0.05, knee: 0 }, right: { swing: -0.05, knee: 0 } } }), ground: true },
      { t: 0.55, pose: pose({ lean: -0.2, arm: { left: { swing: 1.2, out: 0.35 }, right: { swing: 1.2, out: 0.35 } }, leg: { left: { swing: 1.2, knee: -1.7 }, right: { swing: 1.2, knee: -1.7 } } }), ground: false },
      { t: 0.75, pose: pose({ lean: -0.1, arm: { left: { swing: 0.5, out: 0.5 }, right: { swing: 0.5, out: 0.5 } }, leg: { left: { swing: 0.35, knee: -0.5 }, right: { swing: 0.35, knee: -0.5 } } }), ground: false },
      { t: JUMP_SECONDS, pose: pose({ lean: -0.06, arm: { left: { swing: 0.15, out: 0.12 }, right: { swing: 0.15, out: 0.12 } }, leg: { left: { swing: 0.12, knee: -0.24 }, right: { swing: 0.12, knee: -0.24 } } }), ground: true },
    ]),
  });
  m.animate({
    name: "fall", drive: { drive: "motion" },
    ...loop(FALL_SECONDS, 24, (ph) => {
      const a = TAU * ph;
      // falling: the hips a little up, so the dangling feet clear the ground the site stands the figure on
      return pose({
        lift: 0.06, lean: 0.12, nod: 0.15 + 0.05 * Math.sin(2 * a),
        arm: { left: { swing: 0.3 * Math.sin(a), out: 2.5 + 0.3 * Math.sin(2 * a) }, right: { swing: -0.3 * Math.sin(a), out: 2.5 + 0.3 * Math.sin(2 * a + Math.PI) } },
        leg: { left: { swing: 0.25 + 0.3 * Math.sin(a), knee: -0.5 - 0.3 * Math.cos(a) }, right: { swing: 0.25 - 0.3 * Math.sin(a), knee: -0.5 + 0.3 * Math.cos(a) } },
      });
    }),
  });
  m.animate({
    name: "sit", drive: { drive: "motion" },
    ...keyed([
      { t: 0, pose: REST, ground: true },
      { t: 0.4, pose: pose({ lean: -0.35, arm: { left: { swing: 0.6, out: 0.05 }, right: { swing: 0.6, out: 0.05 } }, leg: { left: { swing: 0.85, knee: -0.95 }, right: { swing: 0.85, knee: -0.95 } } }), ground: true },
      { t: SIT_SECONDS, pose: SEATED, ground: true },
    ]),
  });
}

/** The avatar at full detail, with its clips, in the look its parameters pick. */
export function avatar(params?: ParamValues): MeshBuilder {
  const { look, palette } = lookOf(params);
  const m = new MeshBuilder(palette);
  drawAvatar(m, look);
  addClips(m);
  return m;
}

/** The avatar's low detail: eight boxes in the rest pose, static, in the look's colours. */
export function avatarLod(params?: ParamValues): MeshBuilder {
  const { look, palette } = lookOf(params);
  const m = new MeshBuilder(palette);
  drawAvatarLod(m, look);
  return m;
}

/** The catalog fields of a character: a category of its own, in metres like a vehicle. */
export const CHARACTER_CATALOG = { category: "Characters", group: "character", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const CHARACTERS: ProceduralDesign[] = [
  {
    id: "proc-char-avatar", title: "Avatar", build: avatar, buildLod: avatarLod,
    params: AVATAR_PARAMS, finishParams: AVATAR_FINISH_PARAMS,
    catalog: { ...CHARACTER_CATALOG },
    character: { seat: AVATAR_SEAT_HEIGHT, facing: AVATAR_FACING, presets: AVATAR_PRESETS },
  },
];
