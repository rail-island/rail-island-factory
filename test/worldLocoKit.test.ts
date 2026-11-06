// The world locomotive kit (generator/worldLocoKit.ts): the cab door and side
// window lie flat on the side wall, so both must end behind the corner where the
// side wall meets the end at every height they span. A raked, streamlined or
// broken nose leans the end back over the cab, and a bonnet's or a hood's cab
// front stands back from the buffer beam: a window reaching past that corner
// stood out in the air ahead of the cab (the Class 47, the RhB Ge 4/4 III).

import { describe, expect, it } from "vitest";
import { worldLocoSpec, type NoseType, type WorldLoco } from "../generator/worldLocoKit";
import { lerpTable } from "../generator/czElectricKit";
import type { SideItem } from "../generator/boxLocoKit";

const coCo = [[-5.25, [-1.75, 0, 1.75], 0.57], [5.25, [-1.75, 0, 1.75], 0.57]] as const;
const base = { W: 1.36, y0: 1.2, roof: 3.76, bogies: coCo, palette: {}, side: [[1.0, 3.76, "body"]], number: "1" } as const;

// one body per nose type, at the measures of a shipped design of that type
const BODIES: Array<[string, WorldLoco]> = [
  ["raked (Class 47)", { ...base, length: 19.38, nose: "raked" }],
  ["raked (Ge 4/4 III)", { ...base, length: 16.0, W: 1.32, roof: 3.75, nose: "raked" }],
  ["streamlined (WAP-5)", { ...base, length: 18.16, nose: "streamlined" }],
  ["nezCasse (NS 1700)", { ...base, length: 17.48, nose: "nezCasse" }],
  ["bonnets (Class 37)", { ...base, length: 18.75, nose: "bonnets", bonnet: 1.8, hoodTop: 2.8 }],
  ["hoods (Ge 6/6)", { ...base, length: 13.3, W: 1.32, roof: 3.8, nose: "hoods", cabHalf: 2.2, hoodTop: 2.8 }],
  ["hoods (NS 2200)", { ...base, length: 14.1, W: 1.45, y0: 1.35, roof: 4.15, nose: "hoods", cabHalf: 1.3, hoodTop: 3.35 }],
  ["flat (Class 86)", { ...base, length: 17.83, nose: "flat" as NoseType }],
];

/** Where the spec's side wall ends at height y: the end's centre line less its plan's corner setback. */
function wallEnd(spec: ReturnType<typeof worldLocoSpec>, y: number): number {
  const plan = spec.endPlan(y, lerpTable(spec.hw, y));
  return lerpTable(spec.tip, y) - plan[plan.length - 1]![1];
}

const item = (items: readonly SideItem[], name: string) => {
  const it = items.find((i) => i.name === name);
  if (!it) throw new Error(`no side item "${name}"`);
  return it;
};

describe("world locomotive kit: cab door and side window stay on the side wall", () => {
  for (const [label, body] of BODIES)
    it(label, () => {
      const spec = worldLocoSpec(body);
      for (const name of ["cab door", "cab window"]) {
        const it = item(spec.sideItems, name);
        const [y0, y1] = it.y;
        for (let k = 0; k <= 8; k++) {
          const y = y0 + ((y1 - y0) * k) / 8;
          expect(it.x[1], `${name} front at y ${y.toFixed(2)}`).toBeLessThanOrEqual(wallEnd(spec, y) + 1e-6);
        }
        expect(it.x[0], `${name} stays on its half`).toBeGreaterThan(0);
      }
      const win = item(spec.sideItems, "cab window");
      expect(win.x[1] - win.x[0], "the cab window keeps a usable width").toBeGreaterThanOrEqual(0.45);
    });
});
