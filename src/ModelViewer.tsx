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
// A road or rail vehicle stands on its way, an electric one under the game's wire
// (viewerScenery.ts); a Scenery checkbox hides them.
//
// A vehicle with lamps (userData.lamps, docs/models/lamps.md) gets a Lights
// button that shows every tagged lamp lit, indicators blinking, so a design's
// tagging can be checked by eye (viewerLamps.ts).
//
// A rigged vehicle (steered wheels, an articulated body) is posed from the page's
// sliders through its JS module's pose() -- the same code the game is to call.
//
// With a source tree (the model page's Source tab) it also highlights the
// selected node -- its triangles glow, everything else turns into a faint ghost --
// and a click that is not a drag picks the leaf under the cursor. The model has one
// mesh per material and the tree's triangle ranges index into them, so both work
// through draw groups and the face index; nothing is split or re-uploaded.

import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import {
  AmbientLight, AnimationClip, AnimationMixer, type AnimationAction, Box3, Color, DirectionalLight, Mesh, PerspectiveCamera,
  Raycaster, Scene, Vector2, Vector3, WebGLRenderer, type Object3D,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { posePreview, previewKey, type CatalogRecord, type PreviewLod } from "./catalogQuery";
import { jsModule, loadModel } from "./modelModule";
import { leafAt, rangesOf, type TreeIndex } from "./sourceTreeView";
import { applyGlass } from "./viewerGlass";
import { applyHighlight, makeParts, type Part } from "./viewerHighlight";
import { applyLamps, disposeLamps, lampsOf, type Lamp } from "./viewerLamps";
import { applySurfaces } from "./viewerSurfaces";
import { buildScenery } from "./viewerScenery";

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

type DoorSide = "left" | "right";

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

/** Slow at both ends: a door's position (0 shut, 1 open) for how far its move has run. */
const ease = (t: number): number => t * t * (3 - 2 * t);
// Whether the Scenery checkbox shows the way and the wire, kept across models.
const [showScenery, setShowScenery] = createSignal(true);

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
  let mixer: AnimationMixer | null = null;
  let loopActions: AnimationAction[] = [];
  let stateActions: AnimationAction[] = [];
  let animRaf = 0;
  let lastFrame = 0;
  // The way and wire around the current model, when it has them.
  let scenery: { group: Object3D; dispose: () => void } | null = null;
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
    }
    return mixer;
  };
  const doorsMoving = () => doorAt.left !== doorTarget().left || doorAt.right !== doorTarget().right;
  const moving = () => running() || lift !== liftTarget() || doorsMoving();
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
    mixer?.update(dt);
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
    setClips([]);
    setStateClips([]);
    setDoorClips([]);
    lift = 1;
    setLiftTarget(1);
    doorAt.left = doorAt.right = 0;
    setDoorTarget({ left: 0, right: 0 });
  };
  const dropScenery = () => {
    if (!scenery) return;
    scene?.remove(scenery.group);
    scenery.dispose();
    scenery = null;
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

    onCleanup(() => {
      dropAnimation();
      dropScenery();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
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
        let triangles = 0;
        group.traverse((o) => {
          if (o instanceof Mesh) triangles += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
        });
        props.onTriangles?.(triangles);
        current = group;
        currentKey = key;
        setClips(loadedClips.filter((c) => !isStateClip(group, c) && !doorSide(group, c)));
        setStateClips(loadedClips.filter((c) => isStateClip(group, c)));
        setDoorClips(loadedClips.flatMap((clip) => {
          const side = doorSide(group, clip);
          return side ? [{ clip, side }] : [];
        }));
        dropScenery();
        if (record.scenery) {
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
        if (framed === record.id) {
          setLoaded((n) => n + 1);
          render();
          return;
        }
        framed = record.id;
        const box = new Box3().setFromObject(group);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        const dist = maxDim * 1.3 + 10;
        camera.position.set(center.x + dist * 0.8, center.y + dist * 0.7, center.z + dist * 0.9);
        controls.target.copy(center);
        controls.minDistance = maxDim * 0.4 + 2;
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
    const visible = showScenery();
    if (scenery) scenery.group.visible = visible;
    render();
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
      <Show when={clips().length > 0 || stateClips().length > 0 || doorClips().length > 0 || lampCount() > 0 || props.record.scenery}>
        <div class="factory-viewer__controls" role="group" aria-label="Animation, pantographs, doors, lights and scenery">
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
