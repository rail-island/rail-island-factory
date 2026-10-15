// The procedurally authored vehicles: road vehicles built from the same mesh
// builder as the skyscrapers, mostly from sweeps -- a side profile pushed
// across the vehicle, a wheel pushed along its axle. See docs/models/vehicles.md.
//
// Modelled in metres: +X forward, +Y up, +Z to the vehicle's right, wheels
// standing on y = 0, centred on z = 0. The ids are stored in the game's saved
// maps, so a design is never renamed once shipped.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";
import { arc, block, plate, side } from "./vehicleParts.ts";
import { cd150 } from "./cd150.ts";
import { RAIL_CATALOG, cd163 } from "./cd163.ts";
import { COACH_CATALOG, CSD_COACHES } from "./csdCoaches.ts";

// re-exported: a design's JS bundle imports its build function from this module
export { cd163 };
export { cd150 } from "./cd150.ts";
export { csdClassicGreenCoach, csdBalm, csdBam, csdBdmtee, csdBe31, csdBi20, csdBmo, csdDsk } from "./csdCoaches.ts";

// Chrome is only mildly metallic: the game and the site light models without an
// environment map, so a fully metallic surface would render nearly black.
export const VEHICLE_PALETTE: Record<string, MaterialSpec> = {
  paint: { color: "#a31c2b", metallic: 0.2, roughness: 0.35 },
  chrome: { color: "#d9dee4", metallic: 0.45, roughness: 0.25 },
  darkMetal: { color: "#2e3136" },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  grease: { color: "#3a3a3a", roughness: 0.6 },
  glass: { color: "#26323f", metallic: 0.2, roughness: 0.15 },
  lampHead: { color: "#f3f5f6", roughness: 0.2 },
  lampAmber: { color: "#ff9a2e", roughness: 0.3 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  aluminum: { color: "#d9dde2", metallic: 0.25, roughness: 0.45 },
  aluminumDark: { color: "#b3bac2", metallic: 0.25, roughness: 0.45 },
};

const WHEEL_R = 0.52;
/** The axle height: a tyre is a 16-gon with a flat side, not a vertex, on the road. */
const AXLE_Y = WHEEL_R * Math.cos(Math.PI / 16);

/**
 * One wheel at axle position x, its tyre spanning z0..z1. A wheel seen from
 * outside (`face` = the outer side, +1 or -1) gets a chrome rim and hub on that
 * face; the inner wheel of a dual pair shows none.
 */
function wheel(m: MeshBuilder, x: number, z0: number, z1: number, face: number | null): void {
  const tyre = ngon(16, WHEEL_R, Math.PI / 16, x, AXLE_Y);
  m.sweep("rubber", "z", tyre, z0, tyre, z1);
  if (face === null) return;
  const f = face > 0 ? z1 : z0;
  const rim = ngon(12, 0.3, 0, x, AXLE_Y);
  const hub = ngon(8, 0.11, Math.PI / 8, x, AXLE_Y);
  m.sweep("chrome", "z", rim, f - face * 0.02, rim, f + face * 0.015);
  m.sweep("chrome", "z", hub, f, hub, f + face * 0.07);
}

/** An axle beam across the track at x, with a differential housing on a drive axle. */
function axle(m: MeshBuilder, x: number, drive: boolean): void {
  const beam = ngon(8, 0.07, Math.PI / 8, x, AXLE_Y);
  m.sweep("darkMetal", "z", beam, -0.9, beam, 0.9);
  if (drive) {
    const diff = ngon(10, 0.2, 0, x, AXLE_Y);
    m.sweep("darkMetal", "z", diff, -0.18, diff, 0.18);
  }
}

// --- the American truck -----------------------------------------------------------
//
// A long-nose American conventional tractor in the classic Peterbilt 379 mould:
// a long hood ending in an upright chrome grille, arched front fenders, a flat
// split windscreen, a high-rise sleeper behind the cab, twin chrome stacks,
// chrome fuel tanks and a tandem drive axle under a fifth wheel -- pulling a
// 53 ft dry van. 8.5 m of tractor, 16.15 m of trailer, 22.2 m in all.
//
// An articulated vehicle: two parts, "truck" and "trailer", divided at the king
// pin (PIVOT), which the trailer's node turns about (MeshBuilder.part).

const FRONT_AXLE = 7.0;
const DRIVE_AXLES = [0.75, 2.0];
const CAB_X0 = 4.1;
const CAB_X1 = 5.45;
const BODY_Y = 1.05; // the cab's and sleeper's floor
const CAB_TOP = 2.86;
const HOOD_X1 = 7.95;
const FRAME_TOP = 1.0;
/** The rotation point: the king pin, on the fifth wheel's top, on the centre line. */
const PIVOT: [number, number, number] = [1.05, 1.18, 0];

function tractor(m: MeshBuilder): void {
  m.scope("chassis", () => {
    m.scope("frame rails", () => {
      for (const s of [-1, 1]) block(m, "darkMetal", 0, 8.13, 0.72, FRAME_TOP, ...side(s, 0.38, 0.48));
    });
    m.scope("crossmembers", () => {
      for (const x of [0.3, 1.4, 3.2, 5.0, 7.6]) block(m, "darkMetal", x, x + 0.08, 0.78, 0.95, -0.38, 0.38);
    });
    m.scope("fifth wheel", () => {
      const [x, y] = PIVOT;
      block(m, "darkMetal", x - 0.45, x + 0.45, FRAME_TOP, 1.1, -0.46, 0.46);
      m.prism("grease", ngon(14, 0.52, 0, x, 0), 1.1, y);
      block(m, "rubber", x - 0.5, x, y - 0.01, y + 0.01, -0.06, 0.06); // the slot the king pin rides in
    });
    m.scope("rear light bar", () => {
      block(m, "darkMetal", -0.06, 0, 0.75, 0.95, -0.52, 0.52);
      for (const s of [-1, 1]) block(m, "lampRed", -0.075, -0.055, 0.8, 0.9, ...side(s, 0.3, 0.45));
    });
    m.scope("mudflaps", () => {
      for (const s of [-1, 1]) block(m, "rubber", -0.03, 0, 0.18, 0.8, ...side(s, 0.55, 1.18));
    });
  });

  m.scope("front axle", () => {
    axle(m, FRONT_AXLE, false);
    for (const s of [-1, 1]) m.scope(s > 0 ? "right wheel" : "left wheel", () => wheel(m, FRONT_AXLE, ...side(s, 0.86, 1.16), s));
  });
  DRIVE_AXLES.forEach((x, i) => m.scope(`drive axle ${i + 1}`, () => {
    axle(m, x, true);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right duals" : "left duals", () => {
        wheel(m, x, ...side(s, 0.56, 0.84), null);
        wheel(m, x, ...side(s, 0.87, 1.15), s);
      });
    }
  }));

  m.scope("hood", () => {
    // a chamfered section, swept forward to a slightly lower, narrower one
    const section = (hw: number, top: number): Ring => [
      [-hw, FRAME_TOP], [hw, FRAME_TOP], [hw, top - 0.12], [hw - 0.12, top], [-hw + 0.12, top], [-hw, top - 0.12],
    ];
    m.sweep("paint", "x", section(0.62, 2.08), 5.35, section(0.6, 2.0), HOOD_X1);
  });

  m.scope("grille", () => {
    const hw = 0.63;
    block(m, "chrome", 7.93, 8.1, 0.8, 2.06, -hw, hw); // the shell behind
    block(m, "darkMetal", 8.09, 8.13, 0.87, 1.99, -0.56, 0.56); // the mesh
    m.scope("surround", () => {
      block(m, "chrome", 8.1, 8.16, 1.99, 2.06, -hw, hw);
      block(m, "chrome", 8.1, 8.16, 0.8, 0.87, -hw, hw);
      for (const s of [-1, 1]) block(m, "chrome", 8.1, 8.16, 0.87, 1.99, ...side(s, 0.56, hw));
    });
    m.scope("bars", () => {
      const n = 13;
      for (let i = 0; i < n; i++) {
        const z = -0.56 + ((i + 0.5) / n) * 1.12;
        block(m, "chrome", 8.1, 8.145, 0.87, 1.99, z - 0.0125, z + 0.0125);
      }
    });
    m.scope("emblem", () => block(m, "lampRed", 8.15, 8.18, 1.96, 2.04, -0.1, 0.1));
  });

  m.scope("bumper", () => block(m, "chrome", 8.13, 8.45, 0.42, 0.78, -1.22, 1.22));

  for (const s of [-1, 1]) {
    m.scope(s > 0 ? "right front fender" : "left front fender", () => {
      const [z0, z1] = side(s, 0.5, 1.22);
      // an arch over the wheel, then a skirt running back to the step
      const a0 = (5 * Math.PI) / 180;
      const a1 = (150 * Math.PI) / 180;
      const outer = arc(FRONT_AXLE, AXLE_Y, 0.68, a0, a1, 8);
      const inner = arc(FRONT_AXLE, AXLE_Y, 0.6, a0, a1, 8);
      plate(m, "paint", outer, inner, z0, z1);
      const o = outer[outer.length - 1]!;
      const n = inner[inner.length - 1]!;
      plate(m, "paint", [o, [5.3, 0.88]], [n, [5.3, 0.8]], z0, z1);
    });
  }

  m.scope("headlights", () => {
    for (const s of [-1, 1]) {
      block(m, "chrome", 7.62, 7.9, 0.98, 1.22, ...side(s, 0.7, 1.12));
      block(m, "lampHead", 7.9, 7.93, 1.01, 1.19, ...side(s, 0.74, 1.08));
      block(m, "lampAmber", 7.8, 7.92, 0.86, 0.95, ...side(s, 0.8, 1.0));
    }
  });

  m.scope("air cleaners", () => {
    for (const s of [-1, 1]) {
      m.prism("chrome", ngon(12, 0.17, 0, 5.75, s * 0.84), 0.84, 2.0);
      m.prism("chrome", ngon(12, 0.19, 0, 5.75, s * 0.84), 1.98, 2.04);
    }
  });

  m.scope("cab", () => {
    // the side profile: floor, windscreen rake, roof
    const profile: Ring = [
      [CAB_X0, BODY_Y], [CAB_X1, BODY_Y], [CAB_X1, 2.08], [5.28, 2.78], [5.15, CAB_TOP], [CAB_X0, CAB_TOP],
    ];
    m.sweep("paint", "z", profile, -1.0, profile, 1.0);
    m.scope("windscreen", () => {
      // two flat panes just proud of the raked face; the paint between them is the divider
      const p0: [number, number] = [5.45, 2.12];
      const p1: [number, number] = [5.29, 2.74];
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const nx = (p1[1] - p0[1]) / len;
      const ny = -(p1[0] - p0[0]) / len;
      const off = (p: [number, number], d: number): [number, number] => [p[0] + nx * d, p[1] + ny * d];
      const pane: Ring = [off(p0, -0.01), off(p0, 0.015), off(p1, 0.015), off(p1, -0.01)];
      for (const s of [-1, 1]) {
        const [z0, z1] = side(s, 0.05, 0.9);
        m.sweep("glass", "z", pane, z0, pane, z1);
      }
    });
    m.scope("side windows", () => {
      for (const s of [-1, 1]) block(m, "glass", 4.45, 5.15, 2.1, 2.7, ...side(s, 0.99, 1.02));
    });
    m.scope("door handles", () => {
      for (const s of [-1, 1]) block(m, "chrome", 4.5, 4.62, 1.95, 1.99, ...side(s, 0.99, 1.025));
    });
    m.scope("visor", () => {
      const v: Ring = [[5.05, 2.84], [5.42, 2.8], [5.42, 2.86], [5.05, 2.92]];
      m.sweep("darkMetal", "z", v, -0.98, v, 0.98);
    });
    m.scope("roof lights", () => {
      for (let i = 0; i < 5; i++) {
        const z = -0.6 + i * 0.3;
        block(m, "lampAmber", 5.17, 5.23, 2.88, 2.96, z - 0.04, z + 0.04);
      }
    });
    m.scope("air horns", () => {
      for (const s of [-1, 1]) {
        const tube = ngon(8, 0.045, 0, s * 0.35, 2.9);
        m.sweep("chrome", "x", tube, 4.5, tube, 4.98, false);
        m.sweep("chrome", "x", tube, 4.98, ngon(8, 0.08, 0, s * 0.35, 2.9), 5.06);
      }
    });
    m.scope("mirrors", () => {
      for (const s of [-1, 1]) {
        block(m, "chrome", 5.22, 5.26, 2.38, 2.42, ...side(s, 0.99, 1.24));
        block(m, "chrome", 5.2, 5.27, 2.05, 2.75, ...side(s, 1.22, 1.34));
        block(m, "glass", 5.185, 5.205, 2.1, 2.7, ...side(s, 1.235, 1.325));
      }
    });
  });

  m.scope("sleeper", () => {
    const profile: Ring = [
      [2.6, BODY_Y], [4.15, BODY_Y], [4.15, 3.15], [4.07, 3.4], [3.9, 3.55], [3.6, 3.6], [2.6, 3.6],
    ];
    m.sweep("paint", "z", profile, -1.12, profile, 1.12);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right side" : "left side", () => {
        block(m, "glass", 3.2, 3.6, 2.7, 3.0, ...side(s, 1.11, 1.14));
        block(m, "lampAmber", 2.7, 2.76, 3.45, 3.5, ...side(s, 1.11, 1.14));
        block(m, "lampAmber", 3.8, 3.86, 3.45, 3.5, ...side(s, 1.11, 1.14));
      });
    }
  });

  m.scope("exhaust stacks", () => {
    for (const s of [-1, 1]) {
      m.prism("chrome", ngon(10, 0.075, 0, 4.24, s * 1.1), 1.2, 4.05);
      m.prism("chrome", ngon(10, 0.095, 0, 4.24, s * 1.1), 2.0, 3.1);
      block(m, "darkMetal", 4.12, 4.2, 3.3, 3.36, ...side(s, 1.06, 1.14));
    }
  });

  m.scope("fuel tanks", () => {
    for (const s of [-1, 1]) {
      const tank = ngon(12, 0.3, Math.PI / 12, s * 0.82, 0.72);
      m.sweep("chrome", "x", tank, 2.95, tank, 4.4);
      const strap = ngon(12, 0.315, Math.PI / 12, s * 0.82, 0.72);
      for (const x of [3.3, 4.05]) m.sweep("darkMetal", "x", strap, x - 0.025, strap, x + 0.025);
    }
  });

  m.scope("steps", () => {
    for (const s of [-1, 1]) {
      block(m, "chrome", 4.45, 5.25, 0.45, 0.98, ...side(s, 0.5, 1.12));
      block(m, "rubber", 4.5, 5.2, 0.98, 1.0, ...side(s, 0.55, 1.1));
      block(m, "rubber", 4.5, 5.2, 0.68, 0.74, ...side(s, 1.12, 1.15));
    }
  });

  m.scope("rear fenders", () => {
    for (const s of [-1, 1]) {
      const outer: Ring = [[0.0, 0.82], [0.3, 1.16], [2.3, 1.16], [2.55, 0.95]];
      const inner: Ring = outer.map(([x, y]) => [x, y - 0.05]);
      plate(m, "darkMetal", outer, inner, ...side(s, 0.5, 1.22));
    }
  });

}

// --- the trailer: a 53 ft dry van ---------------------------------------------------

const TRAILER_FRONT = PIVOT[0] + 0.6; // the king pin sits 0.6 m behind the front
const TRAILER_REAR = TRAILER_FRONT - 16.15;
const TRAILER_FLOOR = 1.2; // 2 cm above the fifth wheel
const TRAILER_TOP = 4.11; // 13 ft 6 in
const TRAILER_HW = 1.285; // half the body's width; rails and posts stand to 1.3
const TRAILER_AXLES = [TRAILER_REAR + 2.3, TRAILER_REAR + 1.05];

function trailer(m: MeshBuilder): void {
  const back = TRAILER_REAR + 0.08; // the body's rear face, behind the doors
  m.scope("body", () => {
    block(m, "aluminum", back, TRAILER_FRONT, TRAILER_FLOOR, TRAILER_TOP - 0.03, -TRAILER_HW, TRAILER_HW);
    // the rails run from the rear frame to 1 cm short of the front, which the
    // body's front face owns
    const r0 = TRAILER_REAR + 0.12;
    block(m, "darkMetal", r0, TRAILER_FRONT - 0.01, TRAILER_FLOOR - 0.05, 1.32, -1.3, 1.3);
    block(m, "aluminum", r0, TRAILER_FRONT - 0.01, TRAILER_TOP - 0.08, TRAILER_TOP, -1.3, 1.3);
  });
  m.scope("side posts", () => {
    const n = 27;
    for (let i = 0; i < n; i++) {
      const x = back + 0.3 + (i / (n - 1)) * (TRAILER_FRONT - back - 0.6);
      for (const s of [-1, 1]) block(m, "aluminumDark", x - 0.03, x + 0.03, 1.32, TRAILER_TOP - 0.08, ...side(s, TRAILER_HW - 0.01, 1.3));
    }
  });
  m.scope("side markers", () => {
    for (const x of [TRAILER_FRONT - 0.4, (TRAILER_FRONT + TRAILER_REAR) / 2, TRAILER_REAR + 0.4]) {
      for (const s of [-1, 1]) block(m, "lampAmber", x - 0.05, x + 0.05, 1.21, 1.27, ...side(s, 1.295, 1.32));
    }
  });
  m.scope("rear", () => {
    const x0 = TRAILER_REAR;
    const x1 = TRAILER_REAR + 0.12;
    m.scope("frame", () => {
      for (const s of [-1, 1]) block(m, "darkMetal", x0, x1, TRAILER_FLOOR - 0.1, TRAILER_TOP, ...side(s, 1.18, 1.3));
      block(m, "darkMetal", x0, x1, 3.98, TRAILER_TOP, -1.18, 1.18);
      block(m, "darkMetal", x0, x1, TRAILER_FLOOR - 0.1, 1.32, -1.18, 1.18);
    });
    m.scope("doors", () => {
      block(m, "aluminum", x0 + 0.03, back + 0.02, 1.32, 3.98, -1.18, 1.18);
      block(m, "darkMetal", x0 + 0.02, x0 + 0.05, 1.32, 3.98, -0.01, 0.01); // the seam
    });
    m.scope("lock bars", () => {
      for (const z of [-0.9, -0.3, 0.3, 0.9]) block(m, "chrome", x0 + 0.01, x0 + 0.04, 1.4, 3.9, z - 0.015, z + 0.015);
    });
    m.scope("tail lights", () => {
      for (const s of [-1, 1]) block(m, "lampRed", x0 - 0.02, x0 + 0.01, 1.15, 1.27, ...side(s, 0.85, 1.12));
    });
    m.scope("underride guard", () => {
      block(m, "darkMetal", x0 + 0.08, x0 + 0.2, 0.45, 0.6, -1.2, 1.2);
      for (const s of [-1, 1]) block(m, "darkMetal", x0 + 0.1, x0 + 0.18, 0.6, TRAILER_FLOOR, ...side(s, 0.55, 0.63));
    });
  });
  m.scope("landing gear", () => {
    const x = -0.6;
    for (const s of [-1, 1]) {
      block(m, "darkMetal", x - 0.06, x + 0.06, 0.3, TRAILER_FLOOR, ...side(s, 0.95, 1.07));
      block(m, "darkMetal", x - 0.15, x + 0.15, 0.25, 0.3, ...side(s, 0.88, 1.14));
    }
    block(m, "darkMetal", x - 0.02, x + 0.02, 0.7, 0.76, -0.95, 0.95);
    block(m, "chrome", x - 0.02, x + 0.02, 0.9, 0.94, ...side(1, 1.07, 1.25)); // the crank
  });
  m.scope("slider", () => {
    for (const s of [-1, 1]) {
      block(m, "darkMetal", TRAILER_AXLES[1]! - 0.7, TRAILER_AXLES[0]! + 0.7, 0.95, TRAILER_FLOOR, ...side(s, 0.42, 0.52));
    }
  });
  TRAILER_AXLES.forEach((x, i) => m.scope(`axle ${i + 1}`, () => {
    axle(m, x, false);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right duals" : "left duals", () => {
        wheel(m, x, ...side(s, 0.56, 0.84), null);
        wheel(m, x, ...side(s, 0.87, 1.15), s);
      });
    }
  }));
  m.scope("mudflaps", () => {
    const x = TRAILER_AXLES[1]! - 0.75;
    for (const s of [-1, 1]) block(m, "rubber", x - 0.03, x, 0.2, TRAILER_FLOOR, ...side(s, 0.55, 1.18));
  });
}

export function americanTruck(): MeshBuilder {
  const m = new MeshBuilder(VEHICLE_PALETTE);
  m.part("truck", [0, 0, 0], () => tractor(m));
  m.part("trailer", PIVOT, () => trailer(m));
  return m;
}

/**
 * The game-catalog fields every procedural vehicle shares, written into each
 * one's entry of vehicles.meta.json (catalog.ts).
 */
export const VEHICLE_CATALOG: CatalogFields = {
  category: "Road vehicles",
  group: "truck",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every procedural vehicle, by catalog id. The ids are stored in saved maps. */
export const VEHICLES: ProceduralDesign[] = [
  { id: "veh-american-truck", title: "American Truck", build: americanTruck, references: "american-truck" },
  { id: "veh-cd-150", title: "CD 150", build: cd150, catalog: RAIL_CATALOG, references: "cd-150" },
  { id: "veh-cd-163", title: "CD 163", build: cd163, catalog: RAIL_CATALOG, references: "cd-163" },
  ...CSD_COACHES.map((c): ProceduralDesign => ({ id: c.id, title: c.title, build: c.build, catalog: COACH_CATALOG, references: c.folder, ...("params" in c ? { params: c.params } : {}) })),
];
