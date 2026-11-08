// Where a jet bridge docks to an aircraft (docs/models/boarding-door.md).
//
// Measured from the built model, not declared: an aeroplane draws its doors in the
// `door` material (the airframe kit's decals and the hand-built airliners' panels), so
// the build finds that material's triangles on the LEFT side of the body, groups them
// into one panel each, drops the panels that lie wide and low (a landing gear's
// doors), keeps the main-deck panels (the lowest sills; an A380's upper
// deck is not where a bridge docks) and takes the front-most of them: the forward
// left passenger door, the one a jet bridge serves.
//
// The search runs in the game's vehicle frame (nose at min X, the model's left side
// at +Z, the yaw the game turns the model by) and the point is handed back in the
// model's own frame, as the rider seat is, so the game carries both the same way.

import type { Tri, Vec3 } from "./glbTriangles.ts";

/** The material the door panels are drawn in. */
export const DOOR_MATERIAL = "door";
/** Two triangles whose boxes come this close (metres) belong to one door panel. */
const JOIN = 0.25;
/**
 * How tall a panel is at least, as a share of its width, to be a door: a passenger
 * door is upright (the airframe kit's decal about square, a hand-built airliner's more
 * than twice as tall as wide), while the landing gear's doors some airliners draw in
 * the same material lie wide and low.
 */
const DOOR_ASPECT = 0.8;
/** The shortest panel that is a door at all, metres. */
const MIN_DOOR_HEIGHT = 0.4;
/** How far above the lowest door's sill a panel's sill may be and still count as main deck, metres. */
const MAIN_DECK = 0.6;

function turn(p: Vec3, deg: number): Vec3 {
  if (deg === 0) return p;
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

interface Panel { x0: number; x1: number; y0: number; y1: number; z: number }

/**
 * The door panels on the left side of a body already turned into the vehicle frame
 * (nose at min X, left at +Z), front-most first. Exported for the tests.
 */
export function leftDoorPanels(tris: readonly (readonly [Vec3, Vec3, Vec3])[]): Panel[] {
  const boxes: Panel[] = [];
  for (const t of tris) {
    const zc = (t[0][2] + t[1][2] + t[2][2]) / 3;
    if (zc <= 0) continue;
    boxes.push({
      x0: Math.min(t[0][0], t[1][0], t[2][0]), x1: Math.max(t[0][0], t[1][0], t[2][0]),
      y0: Math.min(t[0][1], t[1][1], t[2][1]), y1: Math.max(t[0][1], t[1][1], t[2][1]),
      z: Math.max(t[0][2], t[1][2], t[2][2]),
    });
  }
  // union-find over overlapping boxes: one group per panel
  const parent = boxes.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]!]!;
    return i;
  };
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i]!;
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j]!;
      if (a.x0 - JOIN <= b.x1 && b.x0 - JOIN <= a.x1 && a.y0 - JOIN <= b.y1 && b.y0 - JOIN <= a.y1) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, Panel>();
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i]!;
    const r = find(i);
    const g = groups.get(r);
    if (!g) groups.set(r, { ...b });
    else {
      g.x0 = Math.min(g.x0, b.x0); g.x1 = Math.max(g.x1, b.x1);
      g.y0 = Math.min(g.y0, b.y0); g.y1 = Math.max(g.y1, b.y1);
      g.z = Math.max(g.z, b.z);
    }
  }
  return [...groups.values()].sort((p, q) => p.x0 + p.x1 - (q.x0 + q.x1) || p.y0 - q.y0);
}

/**
 * The forward left main-deck door of panels in the vehicle frame: the point at the
 * middle of its sill, on the skin. Null without an upright panel.
 */
export function doorOfPanels(panels: readonly Panel[]): Vec3 | null {
  const doors = panels.filter((p) => p.y1 - p.y0 >= MIN_DOOR_HEIGHT && p.y1 - p.y0 >= DOOR_ASPECT * (p.x1 - p.x0));
  if (doors.length === 0) return null;
  const lowest = Math.min(...doors.map((p) => p.y0));
  const main = doors.filter((p) => p.y0 <= lowest + MAIN_DECK);
  const front = main.reduce((best, p) => (p.x0 + p.x1 < best.x0 + best.x1 ? p : best));
  return [(front.x0 + front.x1) / 2, front.y0, front.z];
}

/**
 * The boarding door of an aircraft model, in the model's own frame (metres): measured
 * in the game's vehicle frame, which the model reaches by turning `yaw` degrees about
 * +Y. Null for a model that draws no door panel (a light aircraft, an airship).
 */
export function boardingDoor(tris: readonly Tri[], yaw: number): Vec3 | null {
  const doors = tris.filter((t) => t.material === DOOR_MATERIAL && !t.interior)
    .map((t) => [turn(t.p[0], yaw), turn(t.p[1], yaw), turn(t.p[2], yaw)] as const);
  const door = doorOfPanels(leftDoorPanels(doors));
  if (!door) return null;
  const back = turn(door, -yaw);
  const r = (v: number): number => Math.round(v * 1e4) / 1e4 + 0;
  return [r(back[0]), r(back[1]), r(back[2])];
}
