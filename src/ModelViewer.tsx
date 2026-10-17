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
// A model with animation clips (a steam locomotive's running gear: wheelsets,
// rods and valve gear, docs/models/animation.md) gets Start and Stop buttons.
// Start plays every clip in a loop through an AnimationMixer and runs a render
// loop only while it plays; Stop halts it where it is. A new model or parameter
// choice stops the animation.
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
  AmbientLight, AnimationClip, AnimationMixer, Box3, QuaternionKeyframeTrack, VectorKeyframeTrack, BufferAttribute, BufferGeometry, Color, DirectionalLight, Group, Mesh, MeshStandardMaterial, PerspectiveCamera,
  Raycaster, Scene, Vector2, Vector3, WebGLRenderer, type Object3D,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { posePreview, previewKey, type CatalogRecord } from "./catalogQuery";
import { leafAt, rangesOf, type TreeIndex } from "./sourceTreeView";
import { applyHighlight, makeParts, type Part } from "./viewerHighlight";

type JsBuild = (three: object, params?: Record<string, string>, lod?: boolean) => Object3D;
/** A model's JS module: build(), and for a rigged model pose() (generator/rig.ts). */
interface JsModule {
  default: JsBuild;
  pose?: (root: Object3D, pose: { steer: number; bend: number[] }) => void;
}
/** The classes a model's JS module uses: all it needs of three. */
const THREE_SUBSET = { Group, Mesh, BufferGeometry, BufferAttribute, MeshStandardMaterial, AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack };
const modules = new Map<string, Promise<JsModule>>();

/** A model's standalone JS module, loaded once: fetched as text and imported from a blob URL. */
function jsModule(url: string): Promise<JsModule> {
  let p = modules.get(url);
  if (!p) {
    p = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const blob = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
      try {
        return (await import(/* @vite-ignore */ blob)) as JsModule;
      } finally {
        URL.revokeObjectURL(blob);
      }
    })();
    p.catch(() => modules.delete(url));
    modules.set(url, p);
  }
  return p;
}

/**
 * The model as the page should show it: a JS build of the chosen values, with its
 * animation clips (none for most models).
 */
async function loadModel(record: CatalogRecord, params: Record<string, string>, lod = false): Promise<{ object: Object3D; clips: AnimationClip[] }> {
  const object = (await jsModule(`/${record.jsUrl}`)).default(THREE_SUBSET, params, lod);
  return { object, clips: object.animations };
}

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

export function ModelViewer(props: {
  record: CatalogRecord;
  lod?: boolean;
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
  // The current model's animation clips, and whether they are playing.
  const [clips, setClips] = createSignal<AnimationClip[]>([]);
  const [running, setRunning] = createSignal(false);
  let mixer: AnimationMixer | null = null;
  let animRaf = 0;
  let lastFrame = 0;

  const tick = (now: number) => {
    animRaf = requestAnimationFrame(tick);
    mixer?.update(Math.min(0.1, (now - lastFrame) / 1000));
    lastFrame = now;
    render();
  };
  const start = () => {
    if (!current || running() || clips().length === 0) return;
    if (!mixer) {
      mixer = new AnimationMixer(current);
      for (const clip of clips()) mixer.clipAction(clip).play();
    }
    setRunning(true);
    lastFrame = performance.now();
    animRaf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (animRaf) cancelAnimationFrame(animRaf);
    animRaf = 0;
    setRunning(false);
  };
  /** Stops and forgets the animation of the model being replaced. */
  const dropAnimation = () => {
    stop();
    mixer?.stopAllAction();
    mixer = null;
    setClips([]);
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
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      controls?.removeEventListener("change", render);
      controls?.dispose();
      if (current) applyHighlight(parts, null);
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
        setClips(loadedClips);
        parts = makeParts(group);
        scene.add(group);
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
    const index = props.tree;
    const id = props.selected;
    // a tree for another model (one still loading after a step) highlights nothing
    const live = index && index.tree.id === props.record.id && id != null && index.byId.has(id);
    applyHighlight(parts, live ? rangesOf(index, id) : null);
    render();
  });

  return (
    <div class="factory-viewer" ref={pane}>
      <canvas ref={canvas} class="factory-viewer__canvas" />
      <Show when={clips().length > 0}>
        <div class="factory-viewer__controls" role="group" aria-label="Animation">
          <button type="button" class="factory-btn" onClick={start} disabled={running()}>
            Start
          </button>
          <button type="button" class="factory-btn" onClick={stop} disabled={!running()}>
            Stop
          </button>
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
