// The Czech electric locomotives transferred from vlakosimdb in one package
// (docs/models/cz-electrics.md): the CD 110 / 111 / 210 centre-cab shunter, the
// CD 123 / 130, the CD 140 "bobina" and the CD 169 prototype. Registered as one
// family in generate.ts; a design's JS bundle imports its build function from
// this module. (The CD 242 is a livery of veh-cd-230, cd230.ts.)

import type { GameProperties, ProceduralDesign } from "./design.ts";
import { ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { CD110_PARAMS, cd110, cd110Lod } from "./cd110.ts";
import { CD130_PARAMS, cd130, cd130Lod } from "./cd130.ts";
import { cd140, cd140Lod } from "./cd140.ts";
import { cd169, cd169Lod } from "./cd169.ts";

export { cd110, cd110Lod, cd130, cd130Lod, cd140, cd140Lod, cd169, cd169Lod };

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_130_GAME: GameProperties = {
  weight: 85,
  power: 2040,
  maxspeed: 100,
  accel: null,
  variants: [
    { params: { livery: "cd123No019" }, maxspeed: 90 },
    { params: { livery: "cd123" }, power: 2472, maxspeed: 90 },
  ],
};

export const CZ_ELECTRICS: readonly ProceduralDesign[] = [
  { id: "proc-vehicle-cd-110", game: { weight: 72, power: 800, maxspeed: 80, accel: null, variants: [{ params: { livery: "cd111" }, power: 500 }] }, title: "CD 110 / 111 / 210", build: cd110, buildLod: cd110Lod, params: CD110_PARAMS, catalog: ELECTRIC_LOCO_CATALOG, references: "cd-110" },
  { id: "proc-vehicle-cd-130", game: CD_130_GAME, title: "CD 123 / 130", build: cd130, buildLod: cd130Lod, params: CD130_PARAMS, catalog: ELECTRIC_LOCO_CATALOG, references: "cd-130" },
  { id: "proc-vehicle-cd-140", game: { weight: 82, power: 2032, maxspeed: 120, accel: null }, title: "CD 140 bobina", build: cd140, buildLod: cd140Lod, catalog: ELECTRIC_LOCO_CATALOG, references: "cd-140" },
  { id: "proc-vehicle-cd-169", game: { weight: 85, power: 4000, maxspeed: 160, accel: null }, title: "CD 169", build: cd169, buildLod: cd169Lod, catalog: ELECTRIC_LOCO_CATALOG, references: "cd-169" },
];
