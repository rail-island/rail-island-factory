// The animal characters (docs/models/characters.md): a dog, a cat, a pig and an
// elephant the game's walk mode moves like the avatar. Each is a blocky,
// four-legged figure of closed boxes in metres, in the avatar's frame - +X forward
// (its face), +Y up, +Z to its right, feet at y = 0 - and in the avatar's height
// class (about 1.8 m to the top of its head), so the game's motion rules, its
// follow camera and its seat height serve every character alike.
//
// The skeleton, every part turned about its joint:
//
//   body              the root, pivot between the shoulders and the hips at the legs' top
//   head, tail        children of the body
//   <leg>Leg          the upper leg, child of the body, pivot at the shoulder or hip
//   <leg>Shin         the lower leg and paw (or hoof), child of its leg, pivot at the knee
//
// for <leg> in frontLeft, frontRight, backLeft, backRight. The clips carry the six
// names the avatar's do - idle, walk, run (distance-driven, in place), jump, fall,
// sit (motion) - and every clip moves the same tracks: each part's rotation and the
// body's translation (its height). Where the figure stands, the body is lowered or
// raised until the lowest corner of a leg or of the body touches y = 0.

import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { chamferedRect, rect, type AnimationTrack, type Vec3 } from "./meshCore.ts";
import { block, cube, ease, loopTimes, qAxis, qMul, qRotate, r6, r9, TAU, type Quat } from "./characterKit.ts";

/** The pace the clips are made for, m/s: the avatar's (characters.ts AVATAR). */
export const ANIMAL_WALK_SPEED = 1.4;
export const ANIMAL_RUN_SPEED = 4;

const LEGS = ["frontLeft", "frontRight", "backLeft", "backRight"] as const;
type LegName = (typeof LEGS)[number];
const isFront = (l: LegName): boolean => l.startsWith("front");
/** -Z is the figure's left, +Z its right (facing +X). */
const legSideZ = (l: LegName): number => (l.endsWith("Left") ? -1 : 1);

/** The parts in the order the tracks list them. */
export const ANIMAL_PARTS: readonly string[] = ["body", "head", "tail", ...LEGS.flatMap((l) => [`${l}Leg`, `${l}Shin`])];

/** One axis-aligned box in rest (world) coordinates: centre across (cx, cz), size, heights. */
interface Box { cx: number; cz: number; w: number; d: number; y0: number; y1: number }

/** What tells one animal from another. */
interface AnimalSpec {
  id: string;
  title: string;
  /** The coat colours: value, English title, sRGB hex; the first is the default. */
  coats: readonly [string, string, string][];
  /** Further fixed materials. */
  materials: Record<string, MaterialSpec>;
  /** The second coat colour (muzzle, belly) for a coat value, when it has one. */
  coat2?: (coat: string) => string;
  /** The legs: the height of their top joints, their thickness, where they stand. */
  leg: { height: number; w: number; d: number; x: number; z: number; paw: string };
  /** The body box, centred on x and z, from just below the legs' top to `top`. */
  body: { len: number; w: number; top: number };
  /** The head's pivot (the neck) at rest, and its drawing in rest coordinates. */
  neck: Vec3;
  drawHead: (m: MeshBuilder) => void;
  /** The tail's pivot (its root) at rest, and its drawing. */
  tailRoot: Vec3;
  drawTail: (m: MeshBuilder) => void;
  /** The low detail's head box. */
  lodHead: Box;
  /** How far the thighs swing walking and running, radians. */
  walkSwing: number;
  runSwing: number;
  /** How much the idle wags the tail. */
  wag: number;
}

const v = (value: string, title: string) => ({ value, title });

function coatParam(spec: AnimalSpec): ParamSpec {
  return { name: "coat", title: "Coat", default: spec.coats[0]![0], values: spec.coats.map(([value, title]) => v(value, title)) };
}

function paletteOf(spec: AnimalSpec, params?: ParamValues): Record<string, MaterialSpec> {
  const { coat } = resolveParams([coatParam(spec)], params);
  const hex = spec.coats.find((c) => c[0] === coat)![2];
  return {
    coat: { color: hex, roughness: 0.9 },
    coat2: { color: spec.coat2 ? spec.coat2(coat!) : hex, roughness: 0.9 },
    eye: { color: "#1c1c22", roughness: 0.4 },
    ...spec.materials,
  };
}

// ------------------------------------------------------------------ the skeleton

interface Skeleton {
  /** The body's pivot at rest: the legs' top height, centred. */
  bodyPivot: Vec3;
  legPivot: Record<LegName, Vec3>;
  /** The knee's height at rest (half the leg). */
  kneeY: number;
  upper: Box;
  shin: Box;
  paw: Box;
  bodyBox: Box;
}

function skeletonOf(spec: AnimalSpec): Skeleton {
  const h = spec.leg.height;
  const legPivot = Object.fromEntries(LEGS.map((l) => [l, [isFront(l) ? spec.leg.x : -spec.leg.x, h, legSideZ(l) * spec.leg.z] as Vec3])) as Record<LegName, Vec3>;
  const kneeY = h * 0.5;
  return {
    bodyPivot: [0, h, 0],
    legPivot,
    kneeY,
    // boxes about the leg's own axis (cx, cz = 0)
    upper: { cx: 0, cz: 0, w: spec.leg.w, d: spec.leg.d, y0: kneeY - 0.02, y1: h + 0.06 },
    shin: { cx: 0, cz: 0, w: spec.leg.w * 0.9, d: spec.leg.d * 0.9, y0: 0.07, y1: kneeY + 0.03 },
    paw: { cx: spec.leg.w * 0.08, cz: 0, w: spec.leg.w * 1.1, d: spec.leg.d * 1.06, y0: 0, y1: 0.09 },
    bodyBox: { cx: 0, cz: 0, w: spec.body.len, d: spec.body.w, y0: h - 0.06, y1: spec.body.top },
  };
}

const drawBox = (m: MeshBuilder, mat: string, b: Box, dz = 0): void => cube(m, mat, b.cx, b.cz + dz, b.w, b.d, b.y0, b.y1);

function drawAnimal(m: MeshBuilder, spec: AnimalSpec, sk: Skeleton): void {
  m.part("body", sk.bodyPivot, () => {
    m.scope("body", () => block(m, "coat", chamferedRect(spec.body.len, spec.body.w, Math.min(0.08, spec.body.w * 0.15)), sk.bodyBox.y0, sk.bodyBox.y1));
  });
  m.part("head", spec.neck, () => spec.drawHead(m), "body");
  m.part("tail", spec.tailRoot, () => m.scope("tail", () => spec.drawTail(m)), "body");
  for (const l of LEGS) {
    const [x, , z] = sk.legPivot[l];
    m.part(`${l}Leg`, sk.legPivot[l], () => m.scope("leg", () => cube(m, "coat", x, z, sk.upper.w, sk.upper.d, sk.upper.y0, sk.upper.y1)), "body");
    m.part(`${l}Shin`, [x, sk.kneeY, z], () => {
      m.scope("shin", () => cube(m, "coat", x, z, sk.shin.w, sk.shin.d, sk.shin.y0, sk.shin.y1));
      m.scope("paw", () => cube(m, spec.leg.paw, x + sk.paw.cx, z, sk.paw.w, sk.paw.d, sk.paw.y0, sk.paw.y1));
    }, `${l}Leg`);
  }
}

/** The low detail: the body, the head and four whole legs, in the rest pose, one static mesh. */
function drawAnimalLod(m: MeshBuilder, spec: AnimalSpec, sk: Skeleton): void {
  m.scope("body", () => drawBox(m, "coat", sk.bodyBox));
  m.scope("head", () => drawBox(m, "coat", spec.lodHead));
  for (const l of LEGS) {
    const [x, , z] = sk.legPivot[l];
    m.scope(`${l}Leg`, () => cube(m, "coat", x, z, spec.leg.w, spec.leg.d, 0, spec.leg.height + 0.06));
  }
}

// ------------------------------------------------------------------ the pose

/** A pose in joint angles, radians; swings about Z bring a leg's foot forward (+X), a negative knee folds the shin back. */
interface Pose {
  /** The body's pitch: positive lifts the head. */
  pitch: number;
  nod: number;
  turn: number;
  tailWag: number;
  tailUp: number;
  legs: Record<LegName, { swing: number; knee: number; out: number }>;
  /** The body's height over its rest, solved for the contact where the figure stands. */
  lift: number;
}

const REST: Pose = {
  pitch: 0, nod: 0, turn: 0, tailWag: 0, tailUp: 0, lift: 0,
  legs: Object.fromEntries(LEGS.map((l) => [l, { swing: 0, knee: 0, out: 0 }])) as Pose["legs"],
};

type PoseInput = Partial<Omit<Pose, "legs">> & { legs?: Partial<Record<LegName, Partial<Pose["legs"][LegName]>>> };
const pose = (p: PoseInput): Pose => ({
  ...REST, ...p,
  legs: Object.fromEntries(LEGS.map((l) => [l, { ...REST.legs[l], ...p.legs?.[l] }])) as Pose["legs"],
});
/** The same values on all four legs, or on each pair. */
const pairs = (front: Partial<Pose["legs"][LegName]>, back: Partial<Pose["legs"][LegName]> = front): PoseInput["legs"] =>
  Object.fromEntries(LEGS.map((l) => [l, isFront(l) ? front : back]));

function rotations(p: Pose): Record<string, Quat> {
  const out: Record<string, Quat> = {
    body: qAxis(2, p.pitch),
    head: qMul(qAxis(1, p.turn), qAxis(2, p.nod)),
    tail: qMul(qAxis(1, p.tailWag), qAxis(2, p.tailUp)),
  };
  for (const l of LEGS) {
    const g = p.legs[l];
    out[`${l}Leg`] = qMul(qAxis(2, g.swing), qAxis(0, -legSideZ(l) * g.out));
    out[`${l}Shin`] = qAxis(2, g.knee);
  }
  return out;
}

const boxCorners = (b: Box, pivot: Vec3, ox = 0, oz = 0): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [b.cx - b.w / 2, b.cx + b.w / 2]) for (const y of [b.y0, b.y1]) for (const z of [b.cz - b.d / 2, b.cz + b.d / 2]) out.push([x + ox - pivot[0], y - pivot[1], z + oz - pivot[2]]);
  return out;
};

/** The lowest point of the legs and the body in a pose, before its lift. */
function lowestPoint(sk: Skeleton, p: Pose): number {
  const q = rotations(p);
  const at = (local: Vec3): number => sk.bodyPivot[1] + qRotate(q.body!, local)[1];
  let low = Infinity;
  for (const c of boxCorners(sk.bodyBox, sk.bodyPivot)) low = Math.min(low, at(c));
  for (const l of LEGS) {
    const piv = sk.legPivot[l];
    const off: Vec3 = [piv[0] - sk.bodyPivot[0], piv[1] - sk.bodyPivot[1], piv[2] - sk.bodyPivot[2]];
    const qL = q[`${l}Leg`]!;
    const qS = qMul(qL, q[`${l}Shin`]!);
    const knee = qRotate(qL, [0, sk.kneeY - piv[1], 0]);
    for (const c of boxCorners(sk.upper, [0, piv[1], 0])) {
      const r = qRotate(qL, c);
      low = Math.min(low, at([off[0] + r[0], off[1] + r[1], off[2] + r[2]]));
    }
    for (const b of [sk.shin, sk.paw]) {
      for (const c of boxCorners(b, [0, sk.kneeY, 0])) {
        const r = qRotate(qS, c);
        low = Math.min(low, at([off[0] + knee[0] + r[0], off[1] + knee[1] + r[1], off[2] + knee[2] + r[2]]));
      }
    }
  }
  return low;
}

const solveContact = (sk: Skeleton, p: Pose, extra = 0): Pose => ({ ...p, lift: -lowestPoint(sk, p) + extra });

function tracksOf(sk: Skeleton, poses: readonly Pose[]): AnimationTrack[] {
  const rots = poses.map(rotations);
  const out: AnimationTrack[] = ANIMAL_PARTS.map((node) => ({ node, path: "rotation", values: rots.flatMap((r) => r[node]!.map(r6)) }));
  const [x, y, z] = sk.bodyPivot;
  out.push({ node: "body", path: "translation", values: poses.flatMap((p) => [x, r6(y + p.lift), z]) });
  return out;
}

/** A gait at `phase` 0..1: each leg swings `swing` either way at its own phase, its knee folding while it swings forward. */
function gait(sk: Skeleton, phase: number, o: { swing: number; knee: number; phases: Record<LegName, number>; pitch: number; nod: number; bounce: number; tail: number }): Pose {
  const a = TAU * phase;
  const legs: PoseInput["legs"] = {};
  for (const l of LEGS) {
    const t = a + TAU * o.phases[l];
    const c = Math.cos(t);
    const fold = c > 0 ? c * c : 0;
    legs[l] = { swing: o.swing * Math.sin(t), knee: -o.knee * fold };
  }
  const p = pose({ pitch: o.pitch * Math.sin(2 * a), nod: o.nod * Math.sin(2 * a + 1), tailWag: o.tail * Math.sin(a), tailUp: 0.1, legs });
  return solveContact(sk, p, o.bounce * Math.max(0, Math.sin(2 * a - 0.6)) ** 2);
}

interface Key { t: number; pose: Pose; ground: boolean }
function keyed(sk: Skeleton, keys: readonly Key[]): { times: number[]; tracks: AnimationTrack[] } {
  const end = keys[keys.length - 1]!.t;
  const n = Math.round(end * 30);
  const liftOf = (k: Key) => (k.ground ? solveContact(sk, k.pose).lift : k.pose.lift);
  const poses: Pose[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i * end) / n;
    let j = 0;
    while (j < keys.length - 2 && t > keys[j + 1]!.t) j++;
    const [a, b] = [keys[j]!, keys[j + 1]!];
    const e = ease((t - a.t) / (b.t - a.t));
    const mix = (x: number, y: number) => x + (y - x) * e;
    const p: Pose = {
      pitch: mix(a.pose.pitch, b.pose.pitch), nod: mix(a.pose.nod, b.pose.nod), turn: mix(a.pose.turn, b.pose.turn),
      tailWag: mix(a.pose.tailWag, b.pose.tailWag), tailUp: mix(a.pose.tailUp, b.pose.tailUp), lift: 0,
      legs: Object.fromEntries(LEGS.map((l) => [l, {
        swing: mix(a.pose.legs[l].swing, b.pose.legs[l].swing), knee: mix(a.pose.legs[l].knee, b.pose.legs[l].knee), out: mix(a.pose.legs[l].out, b.pose.legs[l].out),
      }])) as Pose["legs"],
    };
    poses.push(a.ground && b.ground ? solveContact(sk, p) : { ...p, lift: Math.max(mix(liftOf(a), liftOf(b)), -lowestPoint(sk, p)) });
  }
  return { times: Array.from({ length: n + 1 }, (_, i) => r9((i * end) / n)), tracks: tracksOf(sk, poses) };
}

function loop(sk: Skeleton, duration: number, n: number, at: (phase: number) => Pose): { times: number[]; tracks: AnimationTrack[] } {
  const poses = Array.from({ length: n }, (_, k) => at(k / n));
  poses.push(poses[0]!);
  return { times: loopTimes(duration, n), tracks: tracksOf(sk, poses) };
}

/** The seated pose: the hind legs folded forward under the body, the front legs straight, the head up. */
function seatedPose(sk: Skeleton): Pose {
  return solveContact(sk, pose({
    pitch: 0.42, nod: -0.3, tailUp: -0.5,
    legs: { frontLeft: { swing: -0.42 }, frontRight: { swing: -0.42 }, backLeft: { swing: 1.15, knee: -0.4 }, backRight: { swing: 1.15, knee: -0.4 } },
  }));
}

/** The body pivot's height in the seated pose, metres: the character's seat. */
export function animalSeat(spec: AnimalSpec): number {
  const sk = skeletonOf(spec);
  return Math.round((sk.bodyPivot[1] + seatedPose(sk).lift) * 1e4) / 1e4;
}

/** The walk's stride: each foot, planted half the cycle, moves back across its swing. */
const strideOf = (sk: Skeleton, swing: number): number => 4 * sk.bodyPivot[1] * Math.sin(swing);

function addClips(m: MeshBuilder, spec: AnimalSpec, sk: Skeleton): void {
  m.animate({
    name: "idle", drive: { drive: "time" },
    ...loop(sk, 2, 24, (ph) => {
      const b = Math.sin(TAU * ph);
      return solveContact(sk, pose({ pitch: 0.01 * b, nod: -0.04 * Math.sin(TAU * ph + 0.8), turn: 0.06 * Math.sin(TAU * ph), tailWag: spec.wag * Math.sin(2 * TAU * ph), tailUp: 0.15 }));
    }),
  });
  const trot: Record<LegName, number> = { frontLeft: 0, backRight: 0, frontRight: 0.5, backLeft: 0.5 };
  const walkStride = strideOf(sk, spec.walkSwing);
  m.animate({
    name: "walk", drive: { drive: "distance", speed: ANIMAL_WALK_SPEED },
    ...loop(sk, walkStride / ANIMAL_WALK_SPEED, 32, (ph) => gait(sk, ph, { swing: spec.walkSwing, knee: 0.9, phases: trot, pitch: 0.01, nod: 0.04, bounce: 0, tail: spec.wag * 0.5 })),
  });
  const gallop: Record<LegName, number> = { frontLeft: 0, frontRight: 0.12, backLeft: 0.5, backRight: 0.62 };
  const runStride = strideOf(sk, spec.runSwing) * 1.3;
  m.animate({
    name: "run", drive: { drive: "distance", speed: ANIMAL_RUN_SPEED },
    ...loop(sk, runStride / ANIMAL_RUN_SPEED, 32, (ph) => gait(sk, ph, { swing: spec.runSwing, knee: 1.5, phases: gallop, pitch: 0.06, nod: 0.08, bounce: 0.08, tail: spec.wag * 0.3 })),
  });
  m.animate({
    name: "jump", drive: { drive: "motion" },
    ...keyed(sk, [
      { t: 0, pose: REST, ground: true },
      { t: 0.2, pose: pose({ pitch: -0.08, nod: 0.1, legs: pairs({ swing: -0.35, knee: -0.7 }, { swing: 0.5, knee: -1.0 }) }), ground: true },
      { t: 0.34, pose: pose({ pitch: 0.22, nod: -0.1, tailUp: 0.4, legs: pairs({ swing: 0.5, knee: -0.2 }, { swing: -0.55, knee: 0 }) }), ground: true },
      { t: 0.55, pose: pose({ pitch: 0.05, tailUp: 0.4, legs: pairs({ swing: 0.7, knee: -1.4 }, { swing: -0.4, knee: -1.2 }), lift: 0.25 }), ground: false },
      { t: 0.75, pose: pose({ pitch: -0.12, legs: pairs({ swing: 0.35, knee: -0.2 }, { swing: 0.1, knee: -0.5 }), lift: 0.12 }), ground: false },
      { t: 0.9, pose: pose({ pitch: -0.03, legs: pairs({ swing: 0.08, knee: -0.15 }, { swing: 0.1, knee: -0.2 }) }), ground: true },
    ]),
  });
  m.animate({
    name: "fall", drive: { drive: "motion" },
    ...loop(sk, 0.8, 24, (ph) => {
      const a = TAU * ph;
      const p = pose({
        pitch: 0.05 * Math.sin(a), nod: -0.25, tailUp: 0.7, tailWag: 0.3 * Math.sin(2 * a),
        legs: Object.fromEntries(LEGS.map((l, i) => [l, { out: 0.55 + 0.15 * Math.sin(a + i), swing: 0.3 * Math.sin(a + i * 1.7), knee: -0.4 - 0.3 * Math.cos(a + i) }])),
      });
      // falling: the dangling feet clear the ground the site stands the figure on
      return solveContact(sk, p, 0.06);
    }),
  });
  m.animate({
    name: "sit", drive: { drive: "motion" },
    ...keyed(sk, [
      { t: 0, pose: REST, ground: true },
      { t: 0.4, pose: pose({ pitch: 0.2, legs: { frontLeft: { swing: -0.2 }, frontRight: { swing: -0.2 }, backLeft: { swing: 0.6, knee: -0.6 }, backRight: { swing: 0.6, knee: -0.6 } } }), ground: true },
      { t: 0.8, pose: seatedPose(sk), ground: true },
    ]),
  });
}

function animalBuilder(spec: AnimalSpec): { build: (params?: ParamValues) => MeshBuilder; buildLod: (params?: ParamValues) => MeshBuilder } {
  const sk = skeletonOf(spec);
  return {
    build: (params) => {
      const m = new MeshBuilder(paletteOf(spec, params));
      drawAnimal(m, spec, sk);
      addClips(m, spec, sk);
      return m;
    },
    buildLod: (params) => {
      const m = new MeshBuilder(paletteOf(spec, params));
      drawAnimalLod(m, spec, sk);
      return m;
    },
  };
}

// ------------------------------------------------------------------ the four animals

const eyes = (m: MeshBuilder, x: number, y0: number, y1: number, z: number, mat = "eye"): void => {
  for (const s of [-1, 1]) cube(m, mat, x, s * z, 0.016, 0.06, y0, y1);
};

export const DOG: AnimalSpec = {
  id: "proc-char-dog", title: "Dog",
  coats: [["brown", "Brown", "#8a5a32"], ["golden", "Golden", "#c9963f"], ["black", "Black", "#2a282b"], ["white", "White", "#e8e4dc"], ["grey", "Grey", "#83868c"]],
  coat2: (c) => (c === "white" ? "#d9cbb4" : "#e6d3b0"),
  materials: { nose: { color: "#1e1b1c", roughness: 0.4 }, tongue: { color: "#d46a73", roughness: 0.6 }, collar: { color: "#c8352e", roughness: 0.6 } },
  leg: { height: 0.75, w: 0.17, d: 0.17, x: 0.44, z: 0.16, paw: "coat2" },
  body: { len: 1.24, w: 0.5, top: 1.26 },
  neck: [0.5, 1.18, 0],
  drawHead: (m) => {
    m.scope("neck", () => {
      cube(m, "coat", 0.6, 0, 0.26, 0.28, 1.12, 1.46);
      cube(m, "collar", 0.6, 0, 0.29, 0.31, 1.24, 1.3);
    });
    m.scope("head", () => block(m, "coat", chamferedRect(0.42, 0.42, 0.05, 0.74), 1.38, 1.76));
    m.scope("muzzle", () => {
      cube(m, "coat2", 1.03, 0, 0.24, 0.24, 1.4, 1.56);
      cube(m, "nose", 1.15, 0, 0.03, 0.1, 1.5, 1.565);
      cube(m, "tongue", 1.06, 0, 0.1, 0.08, 1.37, 1.41);
    });
    m.scope("face", () => eyes(m, 0.952, 1.62, 1.675, 0.1));
    m.scope("ears", () => {
      for (const s of [-1, 1]) cube(m, "coat", 0.7, s * 0.23, 0.12, 0.05, 1.46, 1.74);
    });
  },
  tailRoot: [-0.6, 1.18, 0],
  drawTail: (m) => m.rod("coat", [-0.58, 1.18, 0], [-0.9, 1.5, 0], 0.05, 6),
  lodHead: { cx: 0.78, cz: 0, w: 0.5, d: 0.42, y0: 1.12, y1: 1.76 },
  walkSwing: 0.38, runSwing: 0.62, wag: 0.5,
};

export const CAT: AnimalSpec = {
  id: "proc-char-cat", title: "Cat",
  coats: [["ginger", "Ginger", "#d97a2b"], ["black", "Black", "#232226"], ["grey", "Grey", "#7c8088"], ["white", "White", "#ece9e2"], ["cream", "Cream", "#e3c79a"]],
  coat2: (c) => (c === "white" ? "#dcd6cc" : "#f1e6d2"),
  materials: { nose: { color: "#d98a8a", roughness: 0.5 }, eye: { color: "#3b6b2a", roughness: 0.3 }, pupil: { color: "#141416", roughness: 0.3 }, earInner: { color: "#e7a9a6", roughness: 0.7 } },
  leg: { height: 0.8, w: 0.13, d: 0.13, x: 0.43, z: 0.14, paw: "coat2" },
  body: { len: 1.18, w: 0.42, top: 1.24 },
  neck: [0.5, 1.18, 0],
  drawHead: (m) => {
    m.scope("neck", () => cube(m, "coat", 0.58, 0, 0.22, 0.24, 1.14, 1.42));
    m.scope("head", () => block(m, "coat", chamferedRect(0.44, 0.46, 0.07, 0.7), 1.3, 1.7));
    m.scope("muzzle", () => {
      cube(m, "coat2", 0.935, 0, 0.05, 0.24, 1.33, 1.47);
      cube(m, "nose", 0.962, 0, 0.012, 0.06, 1.44, 1.47);
    });
    m.scope("face", () => {
      eyes(m, 0.921, 1.52, 1.6, 0.1);
      for (const s of [-1, 1]) cube(m, "pupil", 0.927, s * 0.1, 0.008, 0.02, 1.53, 1.59);
    });
    m.scope("ears", () => {
      for (const s of [-1, 1]) {
        m.spire("coat", rect(0.13, 0.12, 0.66, s * 0.14), 1.69, 1.87);
        m.spire("earInner", rect(0.06, 0.06, 0.73, s * 0.14), 1.7, 1.81);
      }
    });
  },
  tailRoot: [-0.57, 1.15, 0],
  drawTail: (m) => {
    m.rod("coat", [-0.55, 1.15, 0], [-0.8, 1.55, 0], 0.045, 6);
    m.rod("coat", [-0.8, 1.55, 0], [-0.76, 1.85, 0], 0.045, 6);
  },
  lodHead: { cx: 0.7, cz: 0, w: 0.46, d: 0.46, y0: 1.14, y1: 1.72 },
  walkSwing: 0.36, runSwing: 0.62, wag: 0.25,
};

export const PIG: AnimalSpec = {
  id: "proc-char-pig", title: "Pig",
  coats: [["pink", "Pink", "#eba5a5"], ["black", "Black", "#2c2a2c"], ["brown", "Brown", "#8a5638"]],
  coat2: (c) => (c === "pink" ? "#e08e95" : "#c98a8a"),
  materials: { hoof: { color: "#4a3a33", roughness: 0.6 }, nostril: { color: "#5a2f33", roughness: 0.6 } },
  leg: { height: 0.7, w: 0.17, d: 0.17, x: 0.5, z: 0.22, paw: "hoof" },
  body: { len: 1.46, w: 0.72, top: 1.46 },
  neck: [0.62, 1.2, 0],
  drawHead: (m) => {
    m.scope("head", () => block(m, "coat", chamferedRect(0.5, 0.52, 0.08, 0.84), 1.12, 1.62));
    m.scope("snout", () => {
      cube(m, "coat2", 1.12, 0, 0.1, 0.27, 1.18, 1.38);
      for (const s of [-1, 1]) cube(m, "nostril", 1.172, s * 0.06, 0.012, 0.045, 1.25, 1.31);
    });
    m.scope("face", () => eyes(m, 1.091, 1.43, 1.48, 0.13));
    m.scope("ears", () => {
      for (const s of [-1, 1]) m.spire("coat", rect(0.14, 0.15, 0.76, s * 0.16), 1.61, 1.78);
    });
  },
  tailRoot: [-0.73, 1.3, 0],
  drawTail: (m) => {
    m.rod("coat", [-0.72, 1.3, 0], [-0.84, 1.36, 0.04], 0.025, 5);
    m.rod("coat", [-0.84, 1.36, 0.04], [-0.86, 1.44, -0.03], 0.025, 5);
  },
  lodHead: { cx: 0.88, cz: 0, w: 0.6, d: 0.52, y0: 1.12, y1: 1.7 },
  walkSwing: 0.36, runSwing: 0.58, wag: 0.3,
};

export const ELEPHANT: AnimalSpec = {
  id: "proc-char-elephant", title: "Elephant",
  coats: [["grey", "Grey", "#8a8f96"], ["lightGrey", "Light grey", "#b3b6ba"], ["pink", "Pink", "#d9a3b0"]],
  materials: { tusk: { color: "#f1ead8", roughness: 0.4 }, nail: { color: "#d8d2c4", roughness: 0.6 } },
  leg: { height: 0.85, w: 0.3, d: 0.3, x: 0.5, z: 0.26, paw: "nail" },
  body: { len: 1.6, w: 0.9, top: 1.66 },
  neck: [0.72, 1.36, 0],
  drawHead: (m) => {
    m.scope("head", () => block(m, "coat", chamferedRect(0.52, 0.62, 0.08, 0.98), 1.16, 1.8));
    m.scope("ears", () => {
      for (const s of [-1, 1]) cube(m, "coat", 0.86, s * 0.52, 0.06, 0.44, 1.02, 1.66);
    });
    m.scope("trunk", () => {
      cube(m, "coat", 1.29, 0, 0.2, 0.24, 0.98, 1.42);
      cube(m, "coat", 1.33, 0, 0.17, 0.2, 0.64, 1.0);
      cube(m, "coat", 1.37, 0, 0.14, 0.17, 0.54, 0.665);
    });
    m.scope("tusks", () => {
      for (const s of [-1, 1]) m.rod("tusk", [1.2, 1.12, s * 0.17], [1.42, 0.98, s * 0.2], 0.035, 6);
    });
    m.scope("face", () => eyes(m, 1.241, 1.5, 1.56, 0.2));
  },
  tailRoot: [-0.8, 1.45, 0],
  drawTail: (m) => {
    m.rod("coat", [-0.79, 1.45, 0], [-0.88, 0.95, 0], 0.03, 5);
    cube(m, "eye", -0.885, 0, 0.06, 0.06, 0.88, 0.97);
  },
  lodHead: { cx: 1.05, cz: 0, w: 0.7, d: 0.62, y0: 0.8, y1: 1.8 },
  walkSwing: 0.3, runSwing: 0.45, wag: 0.25,
};

export const ANIMAL_SPECS: readonly AnimalSpec[] = [DOG, CAT, PIG, ELEPHANT];

const ANIMAL_CATALOG = { category: "Characters", group: "character", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

const builders = new Map(ANIMAL_SPECS.map((spec) => [spec.id, animalBuilder(spec)]));
const builderOf = (spec: AnimalSpec) => builders.get(spec.id)!;

// The JS model imports each design's build functions by name from this module (jsModel.ts).
export function dog(params?: ParamValues): MeshBuilder { return builderOf(DOG).build(params); }
export function dogLod(params?: ParamValues): MeshBuilder { return builderOf(DOG).buildLod(params); }
export function cat(params?: ParamValues): MeshBuilder { return builderOf(CAT).build(params); }
export function catLod(params?: ParamValues): MeshBuilder { return builderOf(CAT).buildLod(params); }
export function pig(params?: ParamValues): MeshBuilder { return builderOf(PIG).build(params); }
export function pigLod(params?: ParamValues): MeshBuilder { return builderOf(PIG).buildLod(params); }
export function elephant(params?: ParamValues): MeshBuilder { return builderOf(ELEPHANT).build(params); }
export function elephantLod(params?: ParamValues): MeshBuilder { return builderOf(ELEPHANT).buildLod(params); }

const BUILDS: Record<string, [(p?: ParamValues) => MeshBuilder, (p?: ParamValues) => MeshBuilder]> = {
  [DOG.id]: [dog, dogLod], [CAT.id]: [cat, catLod], [PIG.id]: [pig, pigLod], [ELEPHANT.id]: [elephant, elephantLod],
};

/** The four animal characters, listed in characters.meta.json after the avatar. */
export const ANIMALS: ProceduralDesign[] = ANIMAL_SPECS.map((spec) => ({
  id: spec.id, title: spec.title, build: BUILDS[spec.id]![0], buildLod: BUILDS[spec.id]![1],
  params: [coatParam(spec)], finishParams: ["coat"],
  catalog: { ...ANIMAL_CATALOG },
  character: { seat: animalSeat(spec), facing: "+x" as const },
}));
