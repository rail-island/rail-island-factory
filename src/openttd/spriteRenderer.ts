// The export's sprite renderer: draws a model, built by its JS module, into one
// OpenTTD sprite with WebGL. Everything about where the model goes comes from a
// SpriteView (projection.ts); this only draws it and reads the pixels back.
//
// The model is lit flat-diffuse (Lambert, no view-dependent shine) by an ambient
// and a directional light at the game's side-thumbnail strengths, the light
// coming from the upper left of the screen as OpenTTD's own sprites are lit. The
// canvas is antialiased and premultiplied, rendered at `supersample` times the
// 4x size; pixels.ts filters it down.

import {
  AmbientLight, DirectionalLight, DoubleSide, Group, Mesh, MeshLambertMaterial, OrthographicCamera, Plane, Scene,
  SRGBColorSpace, Vector3, WebGLRenderer, type Material, type MeshStandardMaterial, type Object3D,
} from "three";
import { flipRows } from "./pixels";
import type { SpriteView } from "./projection";

/** Towards the light, in tile units: up and to the screen's upper left (x lit, y in shade). */
const LIGHT_DIR = new Vector3(1, -0.5, 1.5).normalize();

export class SpriteRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly holder = new Group();
  private readonly camera = new OrthographicCamera();

  constructor() {
    const canvas = document.createElement("canvas");
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.scene.add(new AmbientLight(0xffffff, 1.2));
    const sun = new DirectionalLight(0xffffff, 1.5);
    sun.position.copy(LIGHT_DIR);
    this.scene.add(sun);
    this.holder.matrixAutoUpdate = false;
    this.scene.add(this.holder);
  }

  /**
   * Swap a model's materials for flat-diffuse ones of the same colour, once
   * before its sprites are drawn; the model is the export's own build.
   */
  static prepare(model: Object3D): void {
    const swap = (m: Material): Material => {
      const src = m as MeshStandardMaterial;
      const out = new MeshLambertMaterial({ color: src.color, side: DoubleSide, transparent: src.transparent, opacity: src.opacity });
      out.name = src.name;
      m.dispose();
      return out;
    };
    model.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });
  }

  /** Draw `model` into `view`'s frame at `supersample` times its 4x size: premultiplied RGBA, top row first. */
  render(model: Object3D, view: SpriteView, supersample: number): Uint8Array {
    const w = view.width * supersample;
    const h = view.height * supersample;
    this.renderer.setSize(w, h, false);
    this.holder.clear();
    this.holder.add(model);
    this.holder.matrix.fromArray(view.model);
    this.holder.matrixWorldNeedsUpdate = true;
    this.camera.projectionMatrix.fromArray(view.projection);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    this.renderer.clippingPlanes = view.clip.map((c) => new Plane(new Vector3(...c.normal), c.constant));
    this.renderer.render(this.scene, this.camera);
    const gl = this.renderer.getContext();
    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    this.holder.remove(model);
    return flipRows(pixels, w, h);
  }

  dispose(): void {
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
