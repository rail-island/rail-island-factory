// The 3D half of a model's detail page: the model exactly as built, drag to orbit,
// wheel or pinch to zoom. The ONLY module that imports three, reached through a
// dynamic import from ModelDetail, so a visitor who only reads the list never
// downloads a renderer.
//
// OrbitControls runs WITHOUT damping, so there is no idle animation loop: each
// drag or zoom emits "change" and the scene renders once. A ResizeObserver keeps
// the canvas matched to its pane. The model is framed on every selection change.
//
// Every model is built in the browser by its standalone JS module (js/<id>.js,
// build(THREE, params, lod)), fetched once per model -- the same file the game
// draws; there is no GLB. The camera keeps its place while only the parameters
// change.
//
// A model with animation clips (docs/models/animation.md) gets buttons for them,
// by what plays each clip (userData.clipDrives). The looping clips (a steam
// locomotive's running gear: wheelsets, rods and valve gear; the rolling wheels
// of a vehicle whose wheels carry spokes or nuts) get Start and Stop:
// Start plays them in a loop through an AnimationMixer, Stop halts them where they
// are. The `state` clips (the pantographs) get Up and Down, which raise or lower
// every collector the way the game does, from where it stands now. The `door`
// clips (a tram's, coach's or unit's passenger doors, one per side and car) get
// Open left, Open right (each only where the model has doors on that side) and
// Close, which move each side's doors between shut and open, eased, from where
// they stand. A render loop runs only while something moves. A new model or
// parameter choice drops the animation, and the model comes back at rest: its
// pantographs raised, its doors shut.
//
// A character (a model with a `motion` clip: the avatar) gets one button per clip
// instead of Start and Stop -- Idle, Walk, Run, Jump, Fall, Sit -- and Stop, derived
// from the clips' drives and shapes (viewerMotions.ts): a loop plays until another
// button or Stop, a one-shot (jump) plays once and hands over to the idle loop, a
// clip that ends in another pose (sit) eases into its end and holds it. Each change
// cross-fades from the motion before; Stop fades back to the rest pose. Walk and
// run play in place at the pace their drive states.
//
// A road or rail vehicle stands on its way, an electric one under the game's wire,
// a character on a strip of ground beside a door-high marker pole
// (viewerScenery.ts); a Scenery checkbox hides them.
//
// A vehicle with an interior (userData.interiors, docs/models/interiors.md) shows
// each car's cabin only while a door of that car opens or stands open, as the
// game is to; an Interior toggle shows every cabin with the doors shut and cuts
// the model away above the ceilings, so the seat layout shows from above
// (viewerInteriors.ts).
//
// A vehicle with lamps (userData.lamps, docs/models/lamps.md) gets a Lights
// button that shows every tagged lamp lit, indicators blinking, so a design's
// tagging can be checked by eye (viewerLamps.ts).
//
// A rigged vehicle (steered wheels, an articulated body) is posed from the page's
// sliders through its JS module's pose() -- the same code the game is to call.
//
// A Structures page (a station, a port, an airport, a dam...) gets a Passenger view
// toggle: the camera stands at eye height on a walkable surface found from the
// drawn triangles (viewerPassenger.ts), jumps between named viewpoints and walks --
// W A S D or the arrows, Q and E turn, drag looks, two fingers walk -- with
// OrbitControls off; Esc or the toggle brings the orbit camera back where it was.
// A render loop runs only while a key is held. A railway station page (its group
// carries userData.passenger.tracks) also gets Parked train and Catenary
// checkboxes, overlays laid along its tracks (viewerOverlays.ts).
//
// With a source tree (the model page's Source tab) it also highlights the
// selected node -- its triangles glow, everything else turns into a faint ghost --
// and a click that is not a drag picks the leaf under the cursor. The model has one
// mesh per material and the tree's triangle ranges index into them, so both work
// through draw groups and the face index; nothing is split or re-uploaded.

import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import {
  AmbientLight, AnimationClip, AnimationMixer, type AnimationAction, Box3, LoopOnce, LoopRepeat, Color, DirectionalLight, Mesh, PerspectiveCamera, Plane,
  Raycaster, Scene, Vector2, Vector3, WebGLRenderer, type Object3D,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { posePreview, previewKey, type CatalogRecord, type PreviewLod } from "./catalogQuery";
import { buildPreview, jsModule, loadModel } from "./modelModule";
import { leafAt, rangesOf, type TreeIndex } from "./sourceTreeView";
import { applyGlass } from "./viewerGlass";
import { applyHighlight, makeParts, type Part } from "./viewerHighlight";
import { applyLamps, disposeLamps, lampsOf, type Lamp } from "./viewerLamps";
import { applySurfaces } from "./viewerSurfaces";
import { applyInteriors, cutHeight, interiorsOf, type DoorSide, type Interior } from "./viewerInteriors";
import { buildScenery } from "./viewerScenery";
import { lineParams, loadLine, type Line } from "./viewerLine";
import { motionButtons, motionTitle, restingMotion, type MotionButton } from "./viewerMotions";
import { eyeOf, findPresets, forwardOf, Ground, hintsOf, MAX_STEP, PITCH_LIMIT, trianglesOf, walk, type Preset, type Stance } from "./viewerPassenger";
import { buildCatenary, placeTrain, TRAIN_ID, trainTrack, type Overlay } from "./viewerOverlays";

function disposeModel(obj: Object3D): void {
  obj.traverse((o) => {
    const mesh = o as { geometry?: { dispose: () => void }; material?: unknown };
    mesh.geometry?.dispose?.();
    const mat = mesh.material;
    if (Array.isArray(mat)) for (const m of mat) (m as { dispose?: () => void }).dispose?.();
    else if (mat) (mat as { dispose?: () => void }).dispose?.();
  });
}

/** A pointer that moved less than this (px) between down and up clicked rather than dragged. */
const CLICK_SLOP = 5;
/** Seconds a pantograph takes from folded to raised. */
const LIFT_SECONDS = 1.5;
/** Seconds a door takes from shut to open. */
const DOOR_SECONDS = 2;
/** Seconds an aircraft's flaps or drooping nose take from one setting to the other. */
const CONFIG_SECONDS = 3;
/** The aircraft's configuration clips: their drives in userData.clipDrives. */
type ConfigKind = "flaps" | "droop";
/** Seconds a character's cross-fade from one motion to the next (or to rest) takes. */
const MOTION_FADE = 0.25;

/** Whether the clip is a `state` clip of the model (a pantograph): its drive in userData.clipDrives. */
function isStateClip(model: Object3D, clip: AnimationClip): boolean {
  const drives = model.userData.clipDrives as Record<string, { drive?: string }> | undefined;
  return drives?.[clip.name]?.drive === "state";
}

/** The side a `door` clip of the model opens (its drive in userData.clipDrives), or null for another clip. */
function doorSide(model: Object3D, clip: AnimationClip): DoorSide | null {
  const drive = (model.userData.clipDrives as Record<string, { drive?: string; side?: string }> | undefined)?.[clip.name];
  return drive?.drive === "door" && (drive.side === "left" || drive.side === "right") ? drive.side : null;
}

/** The configuration a clip of the model sets (an aircraft's flaps, its drooping nose), or null for another clip. */
function configKind(model: Object3D, clip: AnimationClip): ConfigKind | null {
  const drive = (model.userData.clipDrives as Record<string, { drive?: string }> | undefined)?.[clip.name]?.drive;
  return drive === "flaps" || drive === "droop" ? drive : null;
}

/** Slow at both ends: a door's position (0 shut, 1 open) for how far its move has run. */
const ease = (t: number): number => t * t * (3 - 2 * t);
// Whether the Scenery checkbox shows the way and the wire, kept across models.
const [showScenery, setShowScenery] = createSignal(true);
// A cable car cabin's line (viewerLine.ts): the station type and the cabin count, kept across cabins.
const [lineStation, setLineStation] = createSignal("openGantry");
const [lineCount, setLineCount] = createSignal("6");
// Whether the Interior toggle shows every cabin, the model cut away above them, kept across models.
const [showInterior, setShowInterior] = createSignal(false);
// Whether a railway station page shows the parked train and the catenary, kept across pages.
const [showTrain, setShowTrain] = createSignal(false);
const [showCatenary, setShowCatenary] = createSignal(false);

/** The keys the passenger view walks and turns with (KeyboardEvent.code). */
const WALK_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyQ", "KeyE"]);
/** Radians of look per pixel dragged. */
const LOOK = 0.005;
/** A passenger's walking speed in eye heights a second, and how much faster with Shift. */
const WALK_SPEED = 1.6;
const RUN = 2.5;
/** Radians a second that Q and E turn. */
const TURN = 1.6;

/** A field the keys type into: the passenger view leaves its keys alone. */
const typing = (t: EventTarget | null): boolean =>
  t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && t.type !== "checkbox" && t.type !== "button");

export function ModelViewer(props: {
  record: CatalogRecord;
  /** Which level to build: the full model, its low LOD (true), coarse detail or optional Max detail. */
  lod?: PreviewLod;
  onTriangles?: (count: number) => void;
  /** A parametric model's chosen values (effectiveParams); {} for the defaults. */
  params?: Record<string, string>;
  /** The model's source tree, when the page shows it; null turns highlight and picking off. */
  tree?: TreeIndex | null;
  /** The selected node's id, or null. */
  selected?: string | null;
  /** A click on the model: the leaf under the cursor, or null for a click on nothing. */
  onPick?: (id: string | null) => void;
  /** A rigged model's pose (poseOf): its steering and hinge bends, radians. */
  pose?: { steer: number; bend: number[] } | null;
}) {
  let canvas!: HTMLCanvasElement;
  let pane!: HTMLDivElement;
  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let current: Object3D | null = null;
  // The model and parameter values `current` was built for (previewKey).
  let currentKey: string | null = null;
  let parts: Part[] = [];
  // The model the pose sliders last moved (it is no longer at rest).
  let posedTarget: Object3D | null = null;
  // A slow load that resolves after the selection changed again is discarded.
  let token = 0;
  // The camera is framed when another model lands, not when a parameter changes.
  let framed: string | null = null;
  let resizeRaf = 0;
  const [busy, setBusy] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  // Bumped when a model lands, so the highlight effect re-runs on the new parts.
  const [loaded, setLoaded] = createSignal(0);
  // The current model's looping clips, and whether they are playing.
  const [clips, setClips] = createSignal<AnimationClip[]>([]);
  const [running, setRunning] = createSignal(false);
  // Its state clips (the pantographs): where they stand (0 folded, 1 raised) and where they go.
  const [stateClips, setStateClips] = createSignal<AnimationClip[]>([]);
  const [liftTarget, setLiftTarget] = createSignal(1);
  let lift = 1;
  // Its door clips, by side: where each side stands (0 shut, 1 open, before easing) and where it goes.
  const [doorClips, setDoorClips] = createSignal<Array<{ clip: AnimationClip; side: DoorSide }>>([]);
  const [doorTarget, setDoorTarget] = createSignal<Record<DoorSide, number>>({ left: 0, right: 0 });
  const doorAt: Record<DoorSide, number> = { left: 0, right: 0 };
  let doorActions: Array<{ action: AnimationAction; side: DoorSide }> = [];
  // An aircraft's flaps and drooping nose: where each stands (0 flight, 1 extended, before easing) and where it goes.
  const [configClips, setConfigClips] = createSignal<Array<{ clip: AnimationClip; kind: ConfigKind }>>([]);
  const [configTarget, setConfigTarget] = createSignal<Record<ConfigKind, number>>({ flaps: 0, droop: 0 });
  const configAt: Record<ConfigKind, number> = { flaps: 0, droop: 0 };
  let configActions: Array<{ action: AnimationAction; kind: ConfigKind }> = [];
  // An aircraft's retractable gear: the node the game hides in flight, and whether it is shown.
  let gearNode: Object3D | null = null;
  const [hasGear, setHasGear] = createSignal(false);
  const [gearDown, setGearDown] = createSignal(true);
  // Its interiors, hidden but while their doors open (or with the Interior toggle), and the toggle's cut.
  let interiors: Interior[] = [];
  const [interiorCount, setInteriorCount] = createSignal(0);
  let cut = new Plane(new Vector3(0, -1, 0), Infinity);
  // A character's motions (viewerMotions.ts): its buttons, the one playing and its action.
  const [motions, setMotions] = createSignal<MotionButton[]>([]);
  const [motion, setMotion] = createSignal<string | null>(null);
  let motionClips = new Map<string, AnimationClip>();
  let motionAction: AnimationAction | null = null;
  // true once a held motion (sit) reached its end; the deadline (performance.now()) of a fade to rest
  let motionHeld = false;
  let restAt = 0;
  let mixer: AnimationMixer | null = null;
  let loopActions: AnimationAction[] = [];
  let stateActions: AnimationAction[] = [];
  let animRaf = 0;
  let lastFrame = 0;
  // The way and wire around the current model, when it has them.
  let scenery: { group: Object3D; dispose: () => void } | null = null;
  // A cable car cabin's line (viewerLine.ts), the parameters it was built for, its clip's loop.
  let line: Line | null = null;
  let lineKey: string | null = null;
  let lineToken = 0;
  let lineRaf = 0;
  // The cabin the camera was last framed on its line for.
  let lineFramed: string | null = null;
  // The current model's lamps, and whether the Lights button has them lit.
  let lamps: Lamp[] = [];
  const [lampCount, setLampCount] = createSignal(0);
  const [lightsOn, setLightsOn] = createSignal(false);
  let blinkRaf = 0;
  let blinkStart = 0;
  // Only indicators change while lit, so the loop runs only for a model that has one.
  const blink = (now: number) => {
    blinkRaf = requestAnimationFrame(blink);
    if (!props.selected) applyLamps(lamps, true, (now - blinkStart) / 1000);
    render();
  };
  const stopBlink = () => {
    if (blinkRaf) cancelAnimationFrame(blinkRaf);
    blinkRaf = 0;
  };
  const showLamps = () => {
    stopBlink();
    if (!props.selected) applyLamps(lamps, lightsOn());
    if (lightsOn() && lamps.some((l) => l.role === "indicator")) {
      blinkStart = performance.now();
      blinkRaf = requestAnimationFrame(blink);
    }
    render();
  };
  const toggleLights = () => {
    setLightsOn(!lightsOn());
    showLamps();
  };

  /** The mixer of the current model: its looping actions (paused until Start) and its state actions (posed by `lift`). */
  const ensureMixer = (): AnimationMixer | null => {
    if (!current) return null;
    if (!mixer) {
      mixer = new AnimationMixer(current);
      loopActions = clips().map((clip) => {
        const a = mixer!.clipAction(clip);
        a.paused = true;
        return a.play();
      });
      // a state action never runs on its own: its time is set from `lift` every frame
      stateActions = stateClips().map((clip) => {
        const a = mixer!.clipAction(clip);
        a.paused = true;
        a.time = lift * clip.duration;
        return a.play();
      });
      // so does a door action: its time is set from its side's opening
      doorActions = doorClips().map(({ clip, side }) => {
        const a = mixer!.clipAction(clip);
        a.paused = true;
        a.time = ease(doorAt[side]) * clip.duration;
        return { action: a.play(), side };
      });
      // and a flap or nose action: its time is set from its configuration
      configActions = configClips().map(({ clip, kind }) => {
        const a = mixer!.clipAction(clip);
        a.paused = true;
        a.time = ease(configAt[kind]) * clip.duration;
        return { action: a.play(), kind };
      });
      mixer.addEventListener("finished", (e) => onMotionFinished((e as unknown as { action: AnimationAction }).action));
    }
    return mixer;
  };
  /** Plays one of a character's motions, cross-fading from the one before. */
  const playMotion = (b: MotionButton) => {
    const clip = motionClips.get(b.name);
    const mx = ensureMixer();
    if (!clip || !mx) return;
    // a loop already playing, or a pose already held or being reached, stays; a one-shot plays again
    if (motion() === b.name && b.play !== "once") return;
    const next = mx.clipAction(clip);
    const prev = motionAction;
    next.reset();
    next.setLoop(b.play === "loop" ? LoopRepeat : LoopOnce, Infinity);
    next.clampWhenFinished = b.play !== "loop";
    next.play();
    if (prev && prev !== next) next.crossFadeFrom(prev, MOTION_FADE, false);
    else if (!prev) next.fadeIn(MOTION_FADE);
    motionAction = next;
    motionHeld = false;
    restAt = 0;
    setMotion(b.name);
    animate();
  };
  /** Fades a character back to its rest pose. */
  const stopMotion = () => {
    if (!motionAction) return;
    motionAction.fadeOut(MOTION_FADE);
    motionAction = null;
    motionHeld = false;
    restAt = performance.now() + MOTION_FADE * 1000;
    setMotion(null);
    animate();
  };
  /** A one-shot motion hands over to the idle loop (or the rest pose); a held one stays at its end. */
  const onMotionFinished = (action: AnimationAction) => {
    if (action !== motionAction) return;
    const b = motions().find((m) => m.name === action.getClip().name);
    if (b?.play === "hold") {
      motionHeld = true;
      return;
    }
    const idle = restingMotion(motions());
    if (idle) playMotion(idle);
    else stopMotion();
  };
  const motionMoving = () => (motionAction !== null && !motionHeld) || restAt > 0;
  const doorsMoving = () => doorAt.left !== doorTarget().left || doorAt.right !== doorTarget().right;
  const configMoving = () => configAt.flaps !== configTarget().flaps || configAt.droop !== configTarget().droop;
  const moving = () => running() || lift !== liftTarget() || doorsMoving() || configMoving() || motionMoving();
  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    const target = liftTarget();
    if (lift !== target) lift = target > lift ? Math.min(target, lift + dt / LIFT_SECONDS) : Math.max(target, lift - dt / LIFT_SECONDS);
    for (const a of stateActions) a.time = lift * a.getClip().duration;
    const doors = doorTarget();
    for (const side of ["left", "right"] as const) {
      const [at, to] = [doorAt[side], doors[side]];
      if (at !== to) doorAt[side] = to > at ? Math.min(to, at + dt / DOOR_SECONDS) : Math.max(to, at - dt / DOOR_SECONDS);
    }
    for (const { action, side } of doorActions) action.time = ease(doorAt[side]) * action.getClip().duration;
    const config = configTarget();
    for (const kind of ["flaps", "droop"] as const) {
      const [at, to] = [configAt[kind], config[kind]];
      if (at !== to) configAt[kind] = to > at ? Math.min(to, at + dt / CONFIG_SECONDS) : Math.max(to, at - dt / CONFIG_SECONDS);
    }
    for (const { action, kind } of configActions) action.time = ease(configAt[kind]) * action.getClip().duration;
    applyInteriors(interiors, doorAt, showInterior());
    mixer?.update(dt);
    // a fade to rest is over: the stopped actions hand every part back its rest pose
    if (restAt && now >= restAt && !motionAction) {
      restAt = 0;
      mixer?.stopAllAction();
    }
    render();
    animRaf = moving() ? requestAnimationFrame(tick) : 0;
  };
  /** Runs the render loop while anything moves. */
  const animate = () => {
    if (animRaf || !moving()) return;
    lastFrame = performance.now();
    animRaf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running() || clips().length === 0 || !ensureMixer()) return;
    for (const a of loopActions) a.paused = false;
    setRunning(true);
    animate();
  };
  const stop = () => {
    for (const a of loopActions) a.paused = true;
    setRunning(false);
  };
  /** Raises (1) or lowers (0) every pantograph from where it stands. */
  const liftTo = (target: number) => {
    if (stateClips().length === 0 || !ensureMixer()) return;
    setLiftTarget(target);
    animate();
  };
  /** Opens the doors of one side (the other keeps where it is going), or with null shuts both. */
  const doorsTo = (side: DoorSide | null) => {
    if (doorClips().length === 0 || !ensureMixer()) return;
    setDoorTarget(side ? { ...doorTarget(), [side]: 1 } : { left: 0, right: 0 });
    animate();
  };
  const hasDoors = (side: DoorSide) => doorClips().some((d) => d.side === side);
  /** Extends (1) or retracts (0) an aircraft's flaps, or lowers (1) or raises (0) its nose, from where they stand. */
  const configTo = (kind: ConfigKind, target: number) => {
    if (!configClips().some((c) => c.kind === kind) || !ensureMixer()) return;
    setConfigTarget({ ...configTarget(), [kind]: target });
    animate();
  };
  const hasConfig = (kind: ConfigKind) => configClips().some((c) => c.kind === kind);
  /** Shows (down) or hides (up) the retractable gear, as the game does in flight. */
  const gearTo = (down: boolean) => {
    if (!gearNode) return;
    gearNode.visible = down;
    setGearDown(down);
    render();
  };
  /** Shows the interiors as the doors and the Interior toggle say, the model cut away above them with the toggle on. */
  const showInteriors = () => {
    applyInteriors(interiors, doorAt, showInterior());
    if (renderer) renderer.clippingPlanes = showInterior() && interiors.length ? [cut] : [];
    render();
  };

  /** Stops and forgets the animation of the model being replaced. */
  const dropAnimation = () => {
    if (animRaf) cancelAnimationFrame(animRaf);
    animRaf = 0;
    setRunning(false);
    mixer?.stopAllAction();
    mixer = null;
    loopActions = [];
    stateActions = [];
    doorActions = [];
    configActions = [];
    setConfigClips([]);
    configAt.flaps = configAt.droop = 0;
    setConfigTarget({ flaps: 0, droop: 0 });
    gearNode = null;
    setHasGear(false);
    setGearDown(true);
    setClips([]);
    setStateClips([]);
    setDoorClips([]);
    setMotions([]);
    setMotion(null);
    motionClips = new Map();
    motionAction = null;
    motionHeld = false;
    restAt = 0;
    lift = 1;
    setLiftTarget(1);
    doorAt.left = doorAt.right = 0;
    setDoorTarget({ left: 0, right: 0 });
    interiors = [];
    setInteriorCount(0);
  };
  const dropScenery = () => {
    if (!scenery) return;
    scene?.remove(scenery.group);
    scenery.dispose();
    scenery = null;
  };
  const dropLine = () => {
    if (lineRaf) cancelAnimationFrame(lineRaf);
    lineRaf = 0;
    lineToken++;
    lineKey = null;
    if (!line) return;
    scene?.remove(line.group);
    line.dispose();
    line = null;
  };
  /** Runs the line's cabins while it is shown. */
  const lineLoop = () => {
    if (lineRaf) return;
    let last = performance.now();
    const step = (now: number) => {
      if (!line || !line.group.visible) {
        lineRaf = 0;
        return;
      }
      line.tick(Math.min(0.1, (now - last) / 1000));
      last = now;
      render();
      lineRaf = requestAnimationFrame(step);
    };
    lineRaf = requestAnimationFrame(step);
  };
  /** Frames the camera on a box: from above a corner, the depth range fitted to it. */
  const frameOn = (box: Box3, near: number, far: number) => {
    if (!camera || !controls) return;
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const dist = maxDim * near;
    camera.position.set(center.x + dist * 0.8, center.y + dist * 0.7, center.z + dist * 0.9);
    controls.target.copy(center);
    controls.minDistance = Math.max(1, maxDim * 0.02);
    controls.maxDistance = maxDim * far;
    camera.near = controls.minDistance * 0.05;
    camera.far = controls.maxDistance + maxDim * 2;
    camera.updateProjectionMatrix();
    controls.update();
  };
  /** Shows the line (and hides the lone cabin, which the line draws itself) as the Scenery checkbox says. */
  const showLine = () => {
    const on = showScenery() && line !== null;
    if (line) line.group.visible = showScenery();
    if (current) current.visible = !on;
    if (on && line && lineFramed !== props.record.id) {
      lineFramed = props.record.id;
      frameOn(line.box, 0.7, 3);
    } else if (!on && current && lineFramed === props.record.id) {
      // back to the cabin alone, framed as it was
      lineFramed = null;
      frameOn(new Box3().setFromObject(current), 1.3, 4);
    }
    if (on) lineLoop();
    render();
  };

  // --- the passenger view (viewerPassenger.ts) and a station's overlays (viewerOverlays.ts) ---
  const isStructure = () => props.record.category === "Structures";
  const [walking, setWalking] = createSignal(false);
  const [presets, setPresets] = createSignal<Preset[]>([]);
  const [presetAt, setPresetAt] = createSignal(0);
  const [noFloor, setNoFloor] = createSignal(false);
  const [trackCount, setTrackCount] = createSignal(0);
  // the current build's triangles indexed for the walk, made when first needed
  let ground: Ground | null = null;
  let stance: Stance | null = null;
  // the orbit camera to come back to
  let orbit: { position: Vector3; target: Vector3; near: number; far: number } | null = null;
  const held = new Set<string>();
  let walkRaf = 0;
  let walkFrame = 0;
  const eye = () => eyeOf(hintsOf(current));
  const groundOf = (): Ground | null => {
    if (!ground && current) ground = new Ground(trianglesOf(current));
    return ground;
  };
  const placeCamera = () => {
    if (!camera || !stance) return;
    camera.position.set(stance.x, stance.y + eye(), stance.z);
    camera.rotation.set(stance.pitch, stance.yaw, 0, "YXZ");
    render();
  };
  const goPreset = (i: number) => {
    const p = presets()[i];
    if (!p) return;
    setPresetAt(i);
    stance = { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch };
    placeCamera();
  };
  const stopWalkLoop = () => {
    if (walkRaf) cancelAnimationFrame(walkRaf);
    walkRaf = 0;
  };
  /** Walks by (forward, right) in model units, from where the passenger looks. */
  const stepBy = (forward: number, right: number) => {
    const g = groundOf();
    if (!g || !stance) return;
    const [fx, fz] = forwardOf(stance.yaw);
    // the camera's right is its forward turned a quarter clockwise seen from above
    stance = walk(g, stance, fx * forward - fz * right, fz * forward + fx * right, eye());
  };
  const walkTick = (now: number) => {
    const dt = Math.min(0.1, (now - walkFrame) / 1000);
    walkFrame = now;
    if (stance) {
      const k = (code: string) => (held.has(code) ? 1 : 0);
      stance.yaw += (k("KeyQ") - k("KeyE")) * TURN * dt;
      const speed = eye() * WALK_SPEED * (held.has("Shift") ? RUN : 1) * dt;
      stepBy((k("KeyW") + k("ArrowUp") - k("KeyS") - k("ArrowDown")) * speed, (k("KeyD") + k("ArrowRight") - k("KeyA") - k("ArrowLeft")) * speed);
      placeCamera();
    }
    walkRaf = [...held].some((c) => WALK_KEYS.has(c)) ? requestAnimationFrame(walkTick) : 0;
  };
  const startWalkLoop = () => {
    if (walkRaf) return;
    walkFrame = performance.now();
    walkRaf = requestAnimationFrame(walkTick);
  };
  const enterWalk = () => {
    const g = groundOf();
    if (!g || !camera || !controls) return;
    const list = findPresets(g, eye(), hintsOf(current)?.tracks ?? []);
    setPresets(list);
    setNoFloor(list.length === 0);
    if (!list.length) return;
    orbit = { position: camera.position.clone(), target: controls.target.clone(), near: camera.near, far: camera.far };
    controls.enabled = false;
    // a passenger's eye is close to the things around it; the model stays in reach
    camera.near = eye() * 0.02;
    camera.far = Math.hypot(g.max[0] - g.min[0], g.max[1] - g.min[1], g.max[2] - g.min[2]) * 1.5 + eye() * 20;
    camera.updateProjectionMatrix();
    setWalking(true);
    goPreset(0);
  };
  const exitWalk = () => {
    stopWalkLoop();
    held.clear();
    setWalking(false);
    stance = null;
    if (camera && controls && orbit) {
      camera.position.copy(orbit.position);
      controls.target.copy(orbit.target);
      camera.near = orbit.near;
      camera.far = orbit.far;
      camera.updateProjectionMatrix();
      controls.enabled = true;
      controls.update();
    }
    orbit = null;
    render();
  };
  /** After a parameter change while walking: stay where the passenger stands if the floor is still there, else the same preset. */
  const rewalk = () => {
    const g = groundOf();
    const list = g ? findPresets(g, eye(), hintsOf(current)?.tracks ?? []) : [];
    setPresets(list);
    if (!g || !list.length) {
      exitWalk();
      setNoFloor(true);
      return;
    }
    const f = stance ? g.floorAt(stance.x, stance.z, stance.y + MAX_STEP, eye()) : null;
    if (stance && f && f.y >= stance.y - MAX_STEP) {
      stance = { ...stance, y: f.y };
      placeCamera();
    } else goPreset(Math.min(presetAt(), list.length - 1));
  };
  const onWalkKey = (e: KeyboardEvent) => {
    if (!walking() || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    // the page's own keys (Esc closes it, the arrows step) wait while the passenger walks
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      exitWalk();
      return;
    }
    if (e.key === "Shift") held.add("Shift");
    if (!WALK_KEYS.has(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    held.add(e.code);
    startWalkLoop();
  };
  const onWalkKeyUp = (e: KeyboardEvent) => {
    held.delete(e.code);
    if (e.key === "Shift") held.delete("Shift");
  };
  const onWalkBlur = () => held.clear();

  let catenary: Overlay | null = null;
  let train: Overlay | null = null;
  // the station build the train was laid (or is loading) for
  let trainFor: Object3D | null = null;
  const dropOverlays = () => {
    for (const o of [catenary, train]) {
      if (!o) continue;
      scene?.remove(o.group);
      o.dispose();
    }
    catenary = train = null;
    trainFor = null;
  };
  /** Builds the overlays the checkboxes ask for over the current station, and shows or hides them. */
  const syncOverlays = () => {
    const tracks = hintsOf(current)?.tracks ?? [];
    const station = current;
    if (!scene || !station || !tracks.length) return;
    if (showCatenary() && !catenary) {
      catenary = buildCatenary(tracks, new Box3().setFromObject(station).min.y);
      scene.add(catenary.group);
    }
    if (catenary) catenary.group.visible = showCatenary();
    if (showTrain() && trainFor !== station) {
      trainFor = station;
      void jsModule(`/js/${TRAIN_ID}.js`).then((mod) => {
        if (current !== station || trainFor !== station || !scene) return;
        const track = trainTrack(groundOf(), tracks, eye());
        if (!track) return;
        train = placeTrain(() => buildPreview(mod, {}, false), track, (o) => {
          const b = new Box3().setFromObject(o);
          return { minX: b.min.x, maxX: b.max.x };
        });
        train.group.visible = showTrain();
        scene.add(train.group);
        render();
      }, () => {
        if (trainFor === station) trainFor = null;
        setFailed(true);
      });
    }
    if (train) train.group.visible = showTrain();
  };

  const disposeParts = () => {
    for (const p of parts) {
      p.glow.dispose();
      p.ghost.dispose();
    }
    parts = [];
  };

  const render = () => {
    if (renderer && scene && camera) renderer.render(scene, camera);
  };

  const resize = () => {
    if (!renderer || !camera) return;
    const w = Math.max(1, pane.clientWidth);
    const h = Math.max(1, pane.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };

  onMount(() => {
    renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new Scene();
    scene.background = new Color(30 / 255, 30 / 255, 35 / 255);
    scene.add(new AmbientLight(0xffffff, 0.85));
    const key = new DirectionalLight(0xffffff, 1.0);
    key.position.set(40, 80, 30);
    scene.add(key);
    const fill = new DirectionalLight(0xffffff, 0.4);
    fill.position.set(-30, 20, -40);
    scene.add(fill);
    camera = new PerspectiveCamera(45, 1, 0.1, 5000);
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.addEventListener("change", render);

    // Coalesce resizes into the next frame: resizing inside the observer can
    // re-trigger it ("ResizeObserver loop").
    const ro = new ResizeObserver(() => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    });
    ro.observe(pane);
    resize();

    // Picking: a press and release in (nearly) one place is a click, not an orbit.
    const raycaster = new Raycaster();
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = e.isPrimary ? { x: e.clientX, y: e.clientY } : null;
    };
    const onUp = (e: PointerEvent) => {
      const from = down;
      down = null;
      const index = props.tree;
      if (!from || !e.isPrimary || !index || !props.onPick || !current || !camera) return;
      if (Math.hypot(e.clientX - from.x, e.clientY - from.y) > CLICK_SLOP) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      for (const hit of raycaster.intersectObject(current, true)) {
        // a hidden interior is not there to click (the raycaster ignores visibility)
        let shown = true;
        for (let o: Object3D | null = hit.object; o; o = o.parent) shown &&= o.visible;
        if (!shown) continue;
        const part = parts.find((p) => p.mesh === hit.object);
        if (!part || hit.faceIndex == null) continue;
        const leaf = leafAt(index, part.name, part.offset + hit.faceIndex);
        if (leaf) {
          props.onPick(leaf.id);
          return;
        }
      }
      props.onPick(null);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);

    // The passenger view's pointers: one drags the look, two walk (their midpoint's drag).
    const pointers = new Map<number, { x: number; y: number }>();
    const onWalkDown = (e: PointerEvent) => {
      if (!walking()) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onWalkMove = (e: PointerEvent) => {
      const last = pointers.get(e.pointerId);
      if (!walking() || !stance || !last) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        // the scene follows the pointer, as when it is grabbed
        stance.yaw += dx * LOOK;
        stance.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, stance.pitch + dy * LOOK));
      } else {
        // one of two pointers moving moves their midpoint half as far: up walks forward
        const k = (eye() * 0.03) / pointers.size;
        stepBy(-dy * k, dx * k);
      }
      placeCamera();
    };
    const onWalkUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
    };
    canvas.addEventListener("pointerdown", onWalkDown);
    canvas.addEventListener("pointermove", onWalkMove);
    canvas.addEventListener("pointerup", onWalkUp);
    canvas.addEventListener("pointercancel", onWalkUp);
    window.addEventListener("keydown", onWalkKey, true);
    window.addEventListener("keyup", onWalkKeyUp, true);
    window.addEventListener("blur", onWalkBlur);

    onCleanup(() => {
      dropAnimation();
      dropScenery();
      dropLine();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerdown", onWalkDown);
      canvas.removeEventListener("pointermove", onWalkMove);
      canvas.removeEventListener("pointerup", onWalkUp);
      canvas.removeEventListener("pointercancel", onWalkUp);
      window.removeEventListener("keydown", onWalkKey, true);
      window.removeEventListener("keyup", onWalkKeyUp, true);
      window.removeEventListener("blur", onWalkBlur);
      stopWalkLoop();
      dropOverlays();
      controls?.removeEventListener("change", render);
      controls?.dispose();
      if (current) applyHighlight(parts, null);
      stopBlink();
      applyLamps(lamps, false);
      disposeLamps(lamps);
      lamps = [];
      disposeParts();
      if (current) disposeModel(current);
      renderer?.dispose();
      renderer = scene = camera = controls = current = null;
      currentKey = null;
    });
  });

  createEffect(() => {
    const record = props.record;
    const params = { ...(props.params ?? {}) };
    const lod = props.lod ?? false;
    const key = previewKey(record.id, params, lod);
    const mine = ++token;
    setBusy(true);
    setFailed(false);
    loadModel(record, params, lod).then(
      ({ object: group, clips: loadedClips }) => {
        if (mine !== token || !scene || !camera || !controls) {
          disposeModel(group);
          return;
        }
        setBusy(false);
        dropAnimation();
        if (current) {
          scene.remove(current);
          applyHighlight(parts, null); // hand the built materials back, so dispose finds them
          stopBlink();
          applyLamps(lamps, false);
          disposeLamps(lamps);
          disposeParts();
          disposeModel(current);
        }
        // the exterior's triangles, the catalog's count: an interior has a budget of its own
        let triangles = 0;
        const inner = new Set(interiorsOf(group).map((it) => it.group));
        group.traverse((o) => {
          let up: Object3D | null = o;
          while (up && !inner.has(up)) up = up.parent;
          if (o instanceof Mesh && !up) triangles += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
        });
        props.onTriangles?.(triangles);
        current = group;
        currentKey = key;
        // a character's clips are its motion buttons, not Start and Stop
        const buttons = motionButtons(loadedClips, group.userData.clipDrives as Record<string, { drive?: string; speed?: number }> | undefined);
        setMotions(buttons);
        motionClips = new Map(loadedClips.filter((c) => buttons.some((b) => b.name === c.name)).map((c) => [c.name, c]));
        setClips(loadedClips.filter((c) => !isStateClip(group, c) && !doorSide(group, c) && !configKind(group, c) && !motionClips.has(c.name)));
        setConfigClips(loadedClips.flatMap((clip) => {
          const kind = configKind(group, clip);
          return kind ? [{ clip, kind }] : [];
        }));
        // an aircraft's retractable gear is the node named exactly `gear` (the game hides it in flight)
        gearNode = record.category === "Aircraft" ? group.getObjectByName("gear") ?? null : null;
        setHasGear(gearNode !== null);
        setGearDown(true);
        setStateClips(loadedClips.filter((c) => isStateClip(group, c)));
        setDoorClips(loadedClips.flatMap((clip) => {
          const side = doorSide(group, clip);
          return side ? [{ clip, side }] : [];
        }));
        interiors = interiorsOf(group);
        setInteriorCount(interiors.length);
        if (interiors.length) cut = new Plane(new Vector3(0, -1, 0), cutHeight(interiors));
        showInteriors();
        dropScenery();
        if (record.scenery && record.scenery.way !== "ropeway") {
          scenery = buildScenery(record.scenery, new Box3().setFromObject(group));
          scenery.group.visible = showScenery();
          scene.add(scenery.group);
        }
        // glazing see-through as the game draws it, before the highlight clones the materials
        applyGlass(group);
        parts = makeParts(group);
        lamps = lampsOf(group);
        setLampCount(lamps.length);
        // the photos of its named surfaces, tinted as the game tints them (viewerSurfaces.ts)
        void applySurfaces(group).then(render);
        scene.add(group);
        showLamps();
        // a new build: its own walkable surfaces, and the overlays laid along its tracks
        ground = null;
        dropOverlays();
        setTrackCount(hintsOf(group)?.tracks?.length ?? 0);
        setNoFloor(false);
        if (walking()) {
          // another model brings the orbit back; a parameter change keeps the passenger in place
          if (framed === record.id && isStructure()) rewalk();
          else exitWalk();
        }
        if (framed === record.id) {
          setLoaded((n) => n + 1);
          render();
          return;
        }
        framed = record.id;
        // framed on the cabin alone: its line, when shown, frames itself again
        lineFramed = null;
        const box = new Box3().setFromObject(group);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        // a person-sized character is framed close; anything else from further out
        const dist = maxDim * 1.3 + (buttons.length ? 1.5 : 10);
        camera.position.set(center.x + dist * 0.8, center.y + dist * 0.7, center.z + dist * 0.9);
        controls.target.copy(center);
        controls.minDistance = maxDim * 0.4 + (buttons.length ? 0.5 : 2);
        controls.maxDistance = maxDim * 4 + 40;
        // Fit the depth range to the model: depth precision goes with far/near,
        // and a fixed 0.1..5000 spends it on space the camera can never see,
        // which shows as flicker between surfaces a few centimetres apart.
        // `near` stays inside the closest zoom; `far` reaches past the farthest.
        camera.near = controls.minDistance * 0.05;
        camera.far = controls.maxDistance + maxDim * 2;
        camera.updateProjectionMatrix();
        controls.update();
        setLoaded((n) => n + 1);
        render();
      },
      () => {
        if (mine !== token) return;
        setBusy(false);
        setFailed(true);
      },
    );
  });

  // A rigged model is posed by its own JS module's pose(): the code the game calls,
  // with the preview's own rig -- each JS build carries the one of its parameters
  // (posePreview). Only the model the page shows
  // now is posed: after a step or a parameter change the previous one stays on
  // screen until the next lands, and must not be posed with the next one's rig.
  createEffect(() => {
    loaded();
    const pose = props.pose;
    const record = props.record;
    const key = previewKey(record.id, props.params ?? {}, props.lod);
    const target = current;
    if (props.lod || !pose || !record.rig || !target || currentKey !== key) return;
    // a model that was never moved is at rest already: no need to fetch the module
    if (posedTarget !== target && pose.steer === 0 && pose.bend.every((b) => b === 0)) return;
    posedTarget = target;
    void jsModule(`/${record.jsUrl}`).then((mod) => {
      if (current !== target) return;
      try {
        if (posePreview(mod, target, pose)) setFailed(false);
      } catch {
        setFailed(true);
      }
      render();
    }, () => {
      if (current === target) setFailed(true);
    });
  });

  createEffect(() => {
    loaded();
    showTrain();
    showCatenary();
    syncOverlays();
    render();
  });

  createEffect(() => {
    loaded();
    const visible = showScenery();
    if (scenery) scenery.group.visible = visible;
    showLine();
    render();
  });

  // a cable car cabin's line: built for the chosen station and count, rebuilt when they change
  createEffect(() => {
    loaded();
    const ropeway = props.record.scenery?.ropeway;
    const params = ropeway ? lineParams(ropeway, lineStation(), lineCount()) : null;
    const key = params ? `${props.record.id}:${JSON.stringify(params)}` : null;
    if (key === lineKey) {
      showLine();
      return;
    }
    dropLine();
    if (!ropeway || !params) {
      if (current) current.visible = true;
      return;
    }
    lineKey = key;
    const mine = ++lineToken;
    loadLine(ropeway, params).then(
      (l) => {
        if (mine !== lineToken || !scene) {
          l.dispose();
          return;
        }
        line = l;
        scene.add(l.group);
        showLine();
      },
      // no line to show (a build without the preview): the cabin stays on its own
      () => undefined,
    );
  });

  createEffect(() => {
    loaded();
    const index = props.tree;
    const id = props.selected;
    // a tree for another model (one still loading after a step) highlights nothing
    const live = index && index.tree.id === props.record.id && id != null && index.byId.has(id);
    applyHighlight(parts, live ? rangesOf(index, id) : null);
    // a highlight shows the built materials; without one the lamps are as the button says
    if (!live && lightsOn()) applyLamps(lamps, true, blinkRaf ? (performance.now() - blinkStart) / 1000 : 0);
    render();
  });

  return (
    <div class="factory-viewer" ref={pane}>
      <canvas ref={canvas} class="factory-viewer__canvas" />
      <Show when={walking()}>
        <p class="factory-viewer__hint">W A S D or arrows walk, Q E turn, Shift runs, drag looks, two fingers walk, Esc returns</p>
      </Show>
      <Show when={clips().length > 0 || motions().length > 0 || stateClips().length > 0 || doorClips().length > 0 || configClips().length > 0 || hasGear() || lampCount() > 0 || props.record.scenery || isStructure()}>
        <div class="factory-viewer__controls" role="group" aria-label="Animation, motions, pantographs, doors, gear, flaps, nose, interior, lights, scenery and passenger view">
          <Show when={motions().length > 0}>
            <For each={motions()}>
              {(b) => (
                <button type="button" class="factory-btn" onClick={() => playMotion(b)} aria-pressed={motion() === b.name} title={motionTitle(b)}>
                  {b.label}
                </button>
              )}
            </For>
            <button type="button" class="factory-btn" onClick={stopMotion} disabled={motion() === null} title="Back to the rest pose">
              Stop
            </button>
          </Show>
          <Show when={clips().length > 0}>
            <button type="button" class="factory-btn" onClick={start} disabled={running()}>
              Start
            </button>
            <button type="button" class="factory-btn" onClick={stop} disabled={!running()}>
              Stop
            </button>
          </Show>
          <Show when={stateClips().length > 0}>
            <button type="button" class="factory-btn" onClick={() => liftTo(1)} disabled={liftTarget() === 1} title="Raise the pantographs">
              Up
            </button>
            <button type="button" class="factory-btn" onClick={() => liftTo(0)} disabled={liftTarget() === 0} title="Lower the pantographs">
              Down
            </button>
          </Show>
          <Show when={hasGear()}>
            <button type="button" class="factory-btn" onClick={() => gearTo(false)} disabled={!gearDown()} title="Retract the landing gear (hidden in flight, as the game does)">
              Gear up
            </button>
            <button type="button" class="factory-btn" onClick={() => gearTo(true)} disabled={gearDown()} title="Lower the landing gear">
              Gear down
            </button>
          </Show>
          <Show when={hasConfig("flaps")}>
            <button type="button" class="factory-btn" onClick={() => configTo("flaps", 1)} disabled={configTarget().flaps === 1} title="Extend the flaps to the landing setting">
              Flaps out
            </button>
            <button type="button" class="factory-btn" onClick={() => configTo("flaps", 0)} disabled={configTarget().flaps === 0} title="Retract the flaps for cruise">
              Flaps in
            </button>
          </Show>
          <Show when={hasConfig("droop")}>
            <button type="button" class="factory-btn" onClick={() => configTo("droop", 1)} disabled={configTarget().droop === 1} title="Droop the nose for the airport">
              Nose down
            </button>
            <button type="button" class="factory-btn" onClick={() => configTo("droop", 0)} disabled={configTarget().droop === 0} title="Raise the nose for flight">
              Nose up
            </button>
          </Show>
          <Show when={doorClips().length > 0}>
            <Show when={hasDoors("left")}>
              <button type="button" class="factory-btn" onClick={() => doorsTo("left")} disabled={doorTarget().left === 1} title="Open the doors on the left side">
                Open left
              </button>
            </Show>
            <Show when={hasDoors("right")}>
              <button type="button" class="factory-btn" onClick={() => doorsTo("right")} disabled={doorTarget().right === 1} title="Open the doors on the right side">
                Open right
              </button>
            </Show>
            <button
              type="button"
              class="factory-btn"
              onClick={() => doorsTo(null)}
              disabled={doorTarget().left === 0 && doorTarget().right === 0}
              title="Close the doors on both sides"
            >
              Close
            </button>
          </Show>
          <Show when={interiorCount() > 0}>
            <button
              type="button"
              class="factory-btn"
              onClick={() => {
                setShowInterior(!showInterior());
                showInteriors();
              }}
              aria-pressed={showInterior()}
              title="Show the interior with the doors shut, the model cut away above it"
            >
              {showInterior() ? "Interior off" : "Interior on"}
            </button>
          </Show>
          <Show when={lampCount() > 0}>
            <button type="button" class="factory-btn" onClick={toggleLights} aria-pressed={lightsOn()}>
              {lightsOn() ? "Lights off" : "Lights on"}
            </button>
          </Show>
          <Show when={props.record.scenery}>
            <label class="factory-viewer__check">
              <input type="checkbox" checked={showScenery()} onChange={(e) => setShowScenery(e.currentTarget.checked)} />
              Scenery
            </label>
          </Show>
          <Show when={showScenery() && props.record.scenery?.ropeway}>
            {(ropeway) => (
              <>
                <select
                  class="factory-viewer__select"
                  aria-label="Station"
                  title="The station type the line runs between"
                  value={lineParams(ropeway(), lineStation(), lineCount()).station}
                  onChange={(e) => setLineStation(e.currentTarget.value)}
                >
                  <For each={ropeway().stations}>{(s) => <option value={s.value}>{s.title}</option>}</For>
                </select>
                <select
                  class="factory-viewer__select"
                  aria-label="Cabins"
                  title="How many cabins run: one shuttles, two run a jig-back, six circulate"
                  value={lineParams(ropeway(), lineStation(), lineCount()).cabins}
                  onChange={(e) => setLineCount(e.currentTarget.value)}
                >
                  <For each={ropeway().counts}>{(c) => <option value={c.value}>{c.title}</option>}</For>
                </select>
              </>
            )}
          </Show>
          <Show when={isStructure()}>
            <button
              type="button"
              class="factory-btn"
              onClick={() => (walking() ? exitWalk() : enterWalk())}
              aria-pressed={walking()}
              title="Stand at a passenger's eye height on the model and walk around"
            >
              {walking() ? "Orbit view" : "Passenger view"}
            </button>
            <Show when={walking() && presets().length > 1}>
              <select
                class="factory-viewer__select"
                aria-label="Viewpoint"
                value={String(presetAt())}
                onChange={(e) => {
                  goPreset(Number(e.currentTarget.value));
                  // the keys walk again, rather than change the viewpoint
                  e.currentTarget.blur();
                }}
              >
                <For each={presets()}>{(p, i) => <option value={String(i())}>{p.name}</option>}</For>
              </select>
            </Show>
            <Show when={noFloor()}>
              <span class="factory-viewer__note">No place to stand</span>
            </Show>
          </Show>
          <Show when={trackCount() > 0}>
            <label class="factory-viewer__check">
              <input type="checkbox" checked={showTrain()} onChange={(e) => setShowTrain(e.currentTarget.checked)} />
              Parked train
            </label>
            <label class="factory-viewer__check">
              <input type="checkbox" checked={showCatenary()} onChange={(e) => setShowCatenary(e.currentTarget.checked)} />
              Catenary
            </label>
          </Show>
        </div>
      </Show>
      <Show when={busy()}>
        <div class="factory-viewer__overlay">Loading...</div>
      </Show>
      <Show when={failed()}>
        <div class="factory-viewer__overlay factory-error">The model could not be loaded.</div>
      </Show>
    </div>
  );
}
