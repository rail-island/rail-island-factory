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

import type { ProceduralDesign } from "./design.ts";
import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { chamferedRect, rect, type AnimationTrack, type Ring, type Vec3 } from "./meshCore.ts";

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

const PALETTE: Record<string, MaterialSpec> = {
  skin: { color: "#eac086", roughness: 0.7 },
  shirt: { color: "#2f6fd0", roughness: 0.85 },
  trousers: { color: "#3b4a63", roughness: 0.9 },
  shoes: { color: "#2a2a2e", roughness: 0.6 },
  hair: { color: "#3d2817", roughness: 0.9 },
  face: { color: "#1c1c22", roughness: 0.5 },
  mouth: { color: "#8a3a34", roughness: 0.6 },
};

/** A closed prism over `ring` from y0 to y1: sides, top and bottom (a limb turns its ends into view). */
function block(m: MeshBuilder, mat: string, ring: Ring, y0: number, y1: number, bottom = true): void {
  m.prism(mat, ring, y0, y1);
  if (bottom) m.cap(mat, ring, y0, false);
}

/** A closed axis-aligned box from its centre across (cx, cz) and size (w along x, d along z). */
function cube(m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, bottom = true): void {
  block(m, mat, rect(w, d, cx, cz), y0, y1, bottom);
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

/** The full figure: two dozen closed boxes, a few hundred triangles. */
function drawAvatar(m: MeshBuilder): void {
  m.part("torso", PIVOTS.torso, () => {
    m.scope("shirt", () => {
      cube(m, "shirt", 0, 0, 0.26, 0.48, 0.84, 1.4);
      // the collar, a band of skin at the open neck
      cube(m, "skin", 0.1, 0, 0.07, 0.14, 1.33, 1.405);
    });
    m.scope("waist", () => cube(m, "trousers", 0, 0, 0.27, 0.49, 0.76, 0.86));
  });
  m.part("head", PIVOTS.head, () => {
    m.scope("neck", () => cube(m, "skin", 0, 0, 0.12, 0.12, 1.37, 1.44, false));
    m.scope("head", () => block(m, "skin", chamferedRect(0.38, 0.38, 0.05), 1.42, 1.78));
    m.scope("hair", () => {
      block(m, "hair", chamferedRect(0.41, 0.41, 0.06, -0.005), 1.73, 1.81);
      cube(m, "hair", -0.165, 0, 0.08, 0.395, 1.5, 1.74);
    });
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
  for (const s of SIDES) {
    const z = sideZ(s) * AVATAR.shoulderZ;
    m.part(`${s}Arm`, PIVOTS[`${s}Arm`], () => {
      m.scope("sleeve", () => cube(m, "shirt", 0, z, 0.23, 0.23, 1.06, 1.41));
      m.scope("arm", () => cube(m, "skin", 0, z, 0.2, 0.2, 0.84, 1.08));
      m.scope("hand", () => cube(m, "skin", 0.01, z, 0.18, 0.21, 0.78, 0.86));
    }, "torso");
  }
  for (const s of SIDES) {
    const z = sideZ(s) * AVATAR.hipZ;
    m.part(`${s}Leg`, PIVOTS[`${s}Leg`], () => m.scope("thigh", () => drawLimb(m, "trousers", THIGH_BOX, z)));
    m.part(`${s}Shin`, PIVOTS[`${s}Shin`], () => {
      m.scope("shin", () => drawLimb(m, "trousers", SHIN_BOXES[0]!, z));
      m.scope("shoe", () => drawLimb(m, "shoes", SHIN_BOXES[1]!, z));
    }, `${s}Leg`);
  }
}

/** The low detail: eight plain boxes in the rest pose, one static mesh. */
function drawAvatarLod(m: MeshBuilder): void {
  m.scope("torso", () => cube(m, "shirt", 0, 0, 0.26, 0.48, 0.76, 1.4, false));
  m.scope("head", () => cube(m, "skin", 0, 0, 0.38, 0.38, 1.4, 1.79, false));
  for (const s of SIDES) m.scope(`${s}Arm`, () => cube(m, "shirt", 0, sideZ(s) * AVATAR.shoulderZ, 0.22, 0.22, 0.79, 1.41));
  for (const s of SIDES) {
    const z = sideZ(s) * AVATAR.hipZ;
    m.scope(`${s}Leg`, () => drawLimb(m, "trousers", THIGH_BOX, z));
    m.scope(`${s}Shin`, () => drawLimb(m, "trousers", LOD_SHIN, z));
  }
}

// ------------------------------------------------------------------ the pose

type Quat = [number, number, number, number];
const qAxis = (axis: 0 | 1 | 2, a: number): Quat => {
  const q: Quat = [0, 0, 0, Math.cos(a / 2)];
  q[axis] = Math.sin(a / 2);
  return q;
};
const qMul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qRotate = (q: Quat, v: Vec3): Vec3 => {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
};

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
const r9 = (v: number): number => Math.round(v * 1e9) / 1e9;

const TAU = Math.PI * 2;
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

/** The avatar at full detail, with its clips. */
export function avatar(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  drawAvatar(m);
  addClips(m);
  return m;
}

/** The avatar's low detail: eight boxes in the rest pose, static. */
export function avatarLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  drawAvatarLod(m);
  return m;
}

/** The catalog fields of a character: a category of its own, in metres like a vehicle. */
export const CHARACTER_CATALOG = { category: "Characters", group: "character", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const CHARACTERS: ProceduralDesign[] = [
  {
    id: "proc-char-avatar", title: "Avatar", build: avatar, buildLod: avatarLod,
    catalog: { ...CHARACTER_CATALOG },
    character: { seat: AVATAR_SEAT_HEIGHT, facing: AVATAR_FACING },
  },
];
