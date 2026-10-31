// The overlays of a railway station page's passenger view (docs/site/catalog-site.md,
// "Passenger view"): a parked train at a platform and a catenary over every track,
// each behind a checkbox, off by default. They are the viewer's, not the station's:
// the station's JS, thumbnails and pins do not change. Both are laid along the
// tracks the station preview states (userData.passenger.tracks, model units: studs).
//
// The train is a factory vehicle's own exported JS model (TRAIN_ID), built in the
// browser like any page's model, metres with +X forward and the wheels on y = 0
// (docs/models/vehicles.md): scaled to studs (1 m = 1.5 studs), turned along z and
// stood on the rail top. The catenary is drawn here: a mast beside each track every
// MAST_SPACING studs, outside the ballast, with an arm out over the track, and the
// contact and messenger wires at the game's heights above the rail top
// (generator/previews/wayKit.ts CONTACT, MESSENGER).

import { BoxGeometry, Group, Mesh, MeshStandardMaterial, type Object3D } from "three";
import type { Ground, PassengerTrack } from "./viewerPassenger";

/** The parked train: a UIC-Z coach, one to MAX_CARS of them. */
export const TRAIN_ID = "proc-vehicle-uic-z-coach";
export const MAX_CARS = 4;
/** Studs per metre: a vehicle is drawn in metres, a preview in studs. */
export const STUDS_PER_METRE = 1.5;
/** Between two coupled cars, studs. */
const CAR_GAP = 0.6;

/** The game's wire heights above the rail top, its wire's thickness and a light mast's spacing (studs). */
export const CONTACT = 8.86;
export const MESSENGER = 10.6;
const WIRE = 0.08;
export const MAST_SPACING = 15;
/** A mast stands this far from its track's centre: past the ballast's half width (5 studs across). */
export const MAST_OFFSET = 3.1;
/** No mast nearer than this to any track's centre: the ballast and the gauge. */
export const TRACK_CLEAR = 2.8;
const MAST = 0.3;

/** A track's lateral side (+1 or -1) that has a platform beside it, or 0: a floor above the rail top. */
export function platformSide(ground: Ground, track: PassengerTrack, eye: number): number {
  const z = (track.z0 + track.z1) / 2;
  for (const side of [-1, 1]) {
    for (const off of [3, 3.5, 4, 4.5, 5]) {
      const f = ground.floorAt(track.x + side * off, z, track.top + 3, eye);
      if (f && f.y > track.top + 0.2) return side;
    }
  }
  return 0;
}

/** The first track with a platform beside it (the tracks in their stated order), else the first. */
export function trainTrack(ground: Ground | null, tracks: readonly PassengerTrack[], eye: number): PassengerTrack | null {
  if (!tracks.length) return null;
  if (ground) for (const t of tracks) if (platformSide(ground, t, eye)) return t;
  return tracks[0]!;
}

/**
 * Where the parked cars stand along a track: each car's centre z, for cars `carLength`
 * studs long, as many as fit within the track (one at least, MAX_CARS at most), the
 * train centred on the track.
 */
export function carCentres(track: PassengerTrack, carLength: number): number[] {
  const lo = Math.min(track.z0, track.z1), hi = Math.max(track.z0, track.z1);
  const pitch = carLength + CAR_GAP;
  const n = Math.max(1, Math.min(MAX_CARS, Math.floor((hi - lo - 2 + CAR_GAP) / pitch)));
  const mid = (lo + hi) / 2;
  return Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * pitch);
}

/**
 * The lateral position of each track's masts: MAST_OFFSET to one side, the side that
 * keeps TRACK_CLEAR from every track (the -x side first); when neither does, the
 * side farther from the nearest other track.
 */
export function mastXs(tracks: readonly PassengerTrack[]): number[] {
  const clearance = (x: number): number => Math.min(...tracks.map((t) => Math.abs(t.x - x)));
  return tracks.map((t) => {
    const a = t.x - MAST_OFFSET, b = t.x + MAST_OFFSET;
    if (clearance(a) >= TRACK_CLEAR) return a;
    if (clearance(b) >= TRACK_CLEAR) return b;
    return clearance(a) >= clearance(b) ? a : b;
  });
}

/** The masts' z along a track: both ends and every MAST_SPACING or less between. */
export function mastZs(track: PassengerTrack): number[] {
  const lo = Math.min(track.z0, track.z1) + 1, hi = Math.max(track.z0, track.z1) - 1;
  const n = Math.max(1, Math.ceil((hi - lo) / MAST_SPACING));
  return Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
}

export interface Overlay {
  group: Group;
  dispose: () => void;
}

/** The catenary over every track: masts from `foot` (the model's lowest point) up, arms, droppers and the two wires. */
export function buildCatenary(tracks: readonly PassengerTrack[], foot: number): Overlay {
  const group = new Group();
  group.name = "catenary";
  const steel = new MeshStandardMaterial({ color: 0x5a6470, roughness: 0.5, metalness: 0.4 });
  const wire = new MeshStandardMaterial({ color: 0x3c3c41, roughness: 0.5, metalness: 0.6 });
  const box = (mat: MeshStandardMaterial, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    const mesh = new Mesh(new BoxGeometry(Math.max(x1 - x0, 1e-3), Math.max(y1 - y0, 1e-3), Math.max(z1 - z0, 1e-3)), mat);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    group.add(mesh);
  };
  const xs = mastXs(tracks);
  tracks.forEach((t, i) => {
    const contact = t.top + CONTACT, messenger = t.top + MESSENGER;
    const lo = Math.min(t.z0, t.z1), hi = Math.max(t.z0, t.z1);
    const w = WIRE / 2;
    box(wire, t.x - w, t.x + w, contact - w, contact + w, lo, hi);
    box(wire, t.x - w, t.x + w, messenger - w, messenger + w, lo, hi);
    const mx = xs[i]!, m = MAST / 2;
    const near = mx < t.x ? mx + m : mx - m;
    for (const z of mastZs(t)) {
      box(steel, mx - m, mx + m, foot, messenger + 0.8, z - m, z + m);
      // the arm over the messenger, the register arm to the contact wire, a dropper between
      box(steel, Math.min(near, t.x), Math.max(near, t.x), messenger + 0.3, messenger + 0.45, z - 0.07, z + 0.07);
      box(steel, Math.min(near, t.x), Math.max(near, t.x), contact + 0.1, contact + 0.2, z - 0.05, z + 0.05);
      box(wire, t.x - w, t.x + w, contact, messenger + 0.3, z - w, z + w);
    }
  });
  return {
    group,
    dispose: () => {
      group.traverse((o) => (o as Mesh).geometry?.dispose());
      steel.dispose();
      wire.dispose();
    },
  };
}

/**
 * The parked train: `build()` cars (each a fresh build of the vehicle in metres,
 * +X forward, wheels on y = 0) scaled to studs, turned along z and stood on the
 * track's rail top, coupled along it.
 */
export function placeTrain(build: () => Object3D, track: PassengerTrack, bounds: (o: Object3D) => { minX: number; maxX: number }): Overlay {
  const group = new Group();
  group.name = "parked-train";
  const first = build();
  const { minX, maxX } = bounds(first);
  const length = (maxX - minX) * STUDS_PER_METRE;
  const centre = (minX + maxX) / 2;
  const cars: Object3D[] = [];
  carCentres(track, length).forEach((z, i) => {
    const car = i === 0 ? first : build();
    car.scale.setScalar(STUDS_PER_METRE);
    // a quarter turn about +Y takes the vehicle's +X to -Z: its centre lands at z
    car.rotation.set(0, Math.PI / 2, 0);
    car.position.set(track.x, track.top, z + centre * STUDS_PER_METRE);
    group.add(car);
    cars.push(car);
  });
  return {
    group,
    dispose: () => {
      for (const car of cars) {
        car.traverse((o) => {
          const mesh = o as { geometry?: { dispose: () => void }; material?: unknown };
          mesh.geometry?.dispose?.();
          const mat = mesh.material;
          if (Array.isArray(mat)) for (const x of mat) (x as { dispose?: () => void }).dispose?.();
          else (mat as { dispose?: () => void } | undefined)?.dispose?.();
        });
      }
    },
  };
}
