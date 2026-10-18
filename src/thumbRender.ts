// Rendering a model variant's thumbnail in the browser: the variant is built
// from the model's JS module (modelModule.ts) and drawn by one shared, offscreen
// WebGLRenderer into a PNG or WebP blob. Reached only through a dynamic import
// from variantThumbs.ts, so three arrives when the first variant thumbnail is
// needed, not with the list.
//
// The two views follow the build's thumbnails (generator/renderGlbThumb.ts):
//  - a road or rail vehicle (a record with `thumbSide`): an orthographic side
//    view, nose on the left, at a fixed SIDE_PX_PER_M over the fixed height
//    window SIDE_BOTTOM_M..SIDE_TOP_M, so every vehicle's image shares one scale;
//  - everything else: a perspective three-quarter view from above a corner,
//    fitted to a THREEQUARTER_SIZE square.
// Changing any of this means bumping VARIANT_THUMB_VERSION (catalogQuery.ts).

import { AmbientLight, Box3, DirectionalLight, OrthographicCamera, PerspectiveCamera, Scene, Vector3, WebGLRenderer, type Camera, type Object3D } from "three";
import type { CatalogRecord } from "./catalogQuery";
import { loadModel } from "./modelModule";

/** Edge of the square three-quarter thumbnail, in pixels. */
const THREEQUARTER_SIZE = 256;
/** Pixels per metre of a side view (the build's is 32, the game's 16). */
const SIDE_PX_PER_M = 24;
/** The side view's height window and margins, metres: the build's and the game's. */
const SIDE_BOTTOM_M = -0.3;
const SIDE_TOP_M = 5.7;
const SIDE_MARGIN_M = 0.3;
/** The widest side image, in pixels; a longer vehicle is drawn at a smaller scale. */
const SIDE_MAX_PX = 2048;
/** The camera's direction from the model in the three-quarter view: the build's VIEW_DIR. */
const VIEW_DIR = new Vector3(0.8, 0.7, 0.9).normalize();
const FOV_DEG = 30;

let renderer: WebGLRenderer | null = null;

function shared(): WebGLRenderer {
  if (!renderer) {
    const canvas = document.createElement("canvas");
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    canvas.addEventListener("webglcontextlost", () => {
      renderer = null;
    });
  }
  return renderer;
}

function dispose(root: Object3D): void {
  root.traverse((o) => {
    const mesh = o as { geometry?: { dispose(): void }; material?: { dispose(): void } | Array<{ dispose(): void }> };
    mesh.geometry?.dispose();
    const m = mesh.material;
    if (Array.isArray(m)) m.forEach((x) => x.dispose());
    else m?.dispose();
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // a browser that cannot write WebP writes PNG instead
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The thumbnail could not be encoded."))), "image/webp", 0.9);
  });
}

/** Build the variant and draw its thumbnail. */
export async function renderVariantThumb(record: CatalogRecord, params: Record<string, string>): Promise<Blob> {
  const { object } = await loadModel(record, params);
  const r = shared();
  const scene = new Scene();
  scene.add(object);
  try {
    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object);
    if (box.isEmpty()) throw new Error("The variant has no geometry.");
    let camera: Camera;
    let width: number;
    let height: number;
    if (record.thumbSide) {
      const widthM = box.max.x - box.min.x + 2 * SIDE_MARGIN_M;
      const ppm = Math.min(SIDE_PX_PER_M, SIDE_MAX_PX / widthM);
      width = Math.max(1, Math.round(widthM * ppm));
      height = Math.max(1, Math.round((SIDE_TOP_M - SIDE_BOTTOM_M) * ppm));
      // From the -Z flank looking +Z, the camera's right is world -X: the nose (max X) lands on the left.
      const cam = new OrthographicCamera(-(box.max.x + SIDE_MARGIN_M), -(box.min.x - SIDE_MARGIN_M), SIDE_TOP_M, SIDE_BOTTOM_M, 0.1, box.max.z - box.min.z + 200);
      cam.position.set(0, 0, box.min.z - 100);
      cam.lookAt(0, 0, box.min.z);
      cam.updateProjectionMatrix();
      scene.add(new AmbientLight(0xffffff, 1.2));
      const key = new DirectionalLight(0xffffff, 1.5);
      key.position.set(-0.4, 1, -1.2);
      scene.add(key);
      camera = cam;
    } else {
      width = height = THREEQUARTER_SIZE;
      const center = box.getCenter(new Vector3());
      const radius = Math.max(0.5, box.getSize(new Vector3()).length() / 2);
      const cam = new PerspectiveCamera(FOV_DEG, 1, radius / 50, radius * 20);
      cam.position.copy(center).addScaledVector(VIEW_DIR, radius / Math.sin(((FOV_DEG / 2) * Math.PI) / 180));
      cam.lookAt(center);
      scene.add(new AmbientLight(0xffffff, 1.1));
      const key = new DirectionalLight(0xffffff, 1.6);
      key.position.set(40, 80, 30);
      scene.add(key);
      const fill = new DirectionalLight(0xffffff, 0.5);
      fill.position.set(-30, 20, -40);
      scene.add(fill);
      camera = cam;
    }
    r.setSize(width, height, false);
    r.render(scene, camera);
    return await toBlob(r.domElement);
  } finally {
    dispose(object);
  }
}
