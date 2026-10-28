// The coach kit's cabin (csdCoachParts.ts, docs/models/interiors.md): the generic
// interior (interior.ts) fitted into a volume behind its doorways. Apart from
// csdCoachParts.ts, and swapped for a no-op in the bundle of a design that draws
// no interior (jsModel.ts), so only the coaches with doors that open carry it.

import { hiAt, loAt, lerp, halfWidth, sectionHalf, type Coach, type Volume } from "./csdCoachParts.ts";
import { CABIN_INSET, drawCabin, laterWindows } from "./interior.ts";
import type { Box } from "./csdCoachParts.ts";

/**
 * The window glass `b` (source metres) coach `c` lays on side `s`, seen from
 * inside: a pane on the wall of the car's cabin, if one spans it (interior.ts
 * `laterWindows`).
 */
export function coachWindow(c: Coach, s: number, b: Box): void {
  laterWindows(c.m, [{ s, x0: c.X(b.x0), x1: c.X(b.x1), y0: b.y0, y1: b.y1 }]);
}

/** The shell's internal band boundaries of `v`, 2.5 mm above their nominal heights (`Coach.volume`). */
const chordsOf = (v: Volume): number[] => v.bands.slice(1).map(([y]) => y + 0.0025);

/** A height 3 mm (or 6, 9) from `y` toward `dir`, clear of volume `v`'s chords. */
const clearOf = (v: Volume, y: number, dir: number): number => [0.003, 0.006, 0.009].map((d) => y + dir * d).find((c) => chordsOf(v).every((h) => Math.abs(h - c) > 0.0015))!;

/**
 * The floor and ceiling of the cabin behind volume `v`'s doorways: the floor at
 * the lowest sill (or just above the body's bottom at the doors), the ceiling
 * 0.12 m above the highest head, under the roof.
 */
export function cabinHeights(v: Volume): [number, number] {
  const opens = v.openings ?? [];
  const ys = v.section.map((p) => p[1]);
  // a doorway that reaches below the body (a step well) opens onto the floor
  const floor = clearOf(v, Math.max(Math.min(...opens.map((o) => o.y0)), Math.min(...ys) + 0.02, ...opens.map((o) => loAt(v, (o.x0 + o.x1) / 2) + 0.02)), 1);
  const ceiling = clearOf(v, Math.min(Math.max(...opens.map((o) => o.y1)) + 0.12, Math.max(...ys) - 0.08), -1);
  return [floor, ceiling];
}

/**
 * The cabin behind volume `v`'s doorways (`Volume.openings`, interior.ts), drawn
 * by coach `c`: one floor and ceiling (`cabinHeights`), along the volume and
 * fitted into it (`Cabin.shell`, `Cabin.bottom`: its ends drawn in from a tapered
 * nose, its floor raised over a skirt cut away over the wheels), its side walls
 * CABIN_INSET inside the narrowest skin between floor and ceiling where the plan
 * keeps 90 % of the full width, and a reveal at every doorway out to the skin; a
 * seat row stands only where the shell holds it. Floor, ceiling and the reveals'
 * thresholds and heads stand 3 mm (or 6, 9) clear of the shell's chords at the
 * doorways' sills and heads and at the bands' boundaries.
 */
export function coachCabin(c: Coach, v: Volume): void {
  const opens = v.openings ?? [];
  if (!opens.length) return;
  const hw0 = halfWidth(v);
  const k = (x: number) => lerp(v.plan, x) / hw0;
  const clear = (y: number, dir: number) => clearOf(v, y, dir);
  const ys = v.section.map((p) => p[1]);
  const [floor, ceiling] = cabinHeights(v);
  const [x0, x1] = [v.plan[0]![0] + CABIN_INSET, v.plan[v.plan.length - 1]![0] - CABIN_INSET];
  const skin = (x: number, y0: number, y1: number) => k(x) * Math.min(...[y0, y1, ...ys.filter((y) => y > y0 && y < y1)].map((y) => sectionHalf(v.section, y)));
  const wide = [x0, x1, ...v.plan.map((p) => p[0])].filter((x) => x >= x0 && x <= x1 && k(x) >= 0.9);
  const half = Math.min(...(wide.length ? wide : [(x0 + x1) / 2]).map((x) => skin(x, floor, ceiling))) - CABIN_INSET;
  drawCabin(c.m, {
    // the walls stop at the body's bottom edge where it rises above the floor (over the wheels)
    bottom: { at: (x) => loAt(v, x + c.centre), xs: (v.bottom ?? []).map((p) => c.X(p[0])) },
    // the volume: the section scaled by the plan, between the bottom and the top elevations
    shell: (x, y) => {
      const xs = x + c.centre;
      if (xs < v.plan[0]![0] || xs > v.plan[v.plan.length - 1]![0] || y < loAt(v, xs) || y > hiAt(v, xs)) return 0;
      return k(xs) * sectionHalf(v.section, y);
    },
    x0: c.X(x0),
    x1: c.X(x1),
    floor,
    ceiling,
    half,
    // the skin over a doorway follows the plan along it (a door in a tapered nose)
    doors: opens.map((o) => ({ s: o.s, x0: c.X(o.x0), x1: c.X(o.x1), y0: clear(o.y0, 1), y1: clear(o.y1, -1), skin: (y: number, x: number) => sectionHalf(v.section, Math.min(Math.max(...ys) - 1e-6, Math.max(Math.min(...ys) + 1e-6, y))) * k(x + c.centre) })),
    // a row's seats inside the skin and under the roof, standing over the body's bottom
    room: (xa, xb) => {
      const xs = [xa, (xa + xb) / 2, xb].map((xf) => xf + c.centre);
      if (!xs.every((x) => skin(x, floor, ceiling) >= half - 0.01)) return null;
      return { base: Math.max(floor, ...xs.map((x) => loAt(v, x) + 0.01)), top: Math.min(...xs.map((x) => hiAt(v, x))) };
    },
  });
}
