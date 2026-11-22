// The plaza landmarks (docs/models/plaza-landmarks.md): monuments and civic buildings
// for a settlement's main square, one module per landmark so each model's standalone
// JS bundles only its own geometry. This index is for the build and the tests.
import type { ProceduralDesign } from "./design.ts";
import { PLAGUE_COLUMN } from "./plazaPlagueColumn.ts";
import { BANDSTAND } from "./plazaBandstand.ts";
import { ARC_DE_TRIOMPHE } from "./plazaArcDeTriomphe.ts";
import { PRAGUE_OLD_TOWN_HALL } from "./plazaPragueOldTownHall.ts";
import { PARTHENON } from "./plazaParthenon.ts";
import { TEMPLE_OF_HEAVEN } from "./plazaTempleOfHeaven.ts";
import { WAR_MEMORIAL } from "./plazaWarMemorial.ts";
import { EQUESTRIAN_STATUE } from "./plazaEquestrianStatue.ts";
import { LEANING_TOWER_OF_PISA } from "./plazaLeaningTowerOfPisa.ts";
import { CLOTH_HALL } from "./plazaClothHall.ts";
import { NELSONS_COLUMN } from "./plazaNelsonsColumn.ts";
import { ATOMIUM } from "./plazaAtomium.ts";

/** Each landmark's module, as the build registers it (generate.ts RAW_FAMILIES). */
export const PLAZA_FAMILIES: ReadonlyArray<{ designs: ProceduralDesign[]; source: string }> = [
  { designs: PLAGUE_COLUMN, source: "plazaPlagueColumn.ts" },
  { designs: BANDSTAND, source: "plazaBandstand.ts" },
  { designs: ARC_DE_TRIOMPHE, source: "plazaArcDeTriomphe.ts" },
  { designs: PRAGUE_OLD_TOWN_HALL, source: "plazaPragueOldTownHall.ts" },
  { designs: PARTHENON, source: "plazaParthenon.ts" },
  { designs: TEMPLE_OF_HEAVEN, source: "plazaTempleOfHeaven.ts" },
  { designs: WAR_MEMORIAL, source: "plazaWarMemorial.ts" },
  { designs: EQUESTRIAN_STATUE, source: "plazaEquestrianStatue.ts" },
  { designs: LEANING_TOWER_OF_PISA, source: "plazaLeaningTowerOfPisa.ts" },
  { designs: CLOTH_HALL, source: "plazaClothHall.ts" },
  { designs: NELSONS_COLUMN, source: "plazaNelsonsColumn.ts" },
  { designs: ATOMIUM, source: "plazaAtomium.ts" },
];

export const PLAZA_LANDMARKS: ProceduralDesign[] = PLAZA_FAMILIES.flatMap((f) => f.designs);

/** The triangle tier of each landmark, by its id without the "bld-" or "proc-building-" prefix (the building skill): small monuments 4,000-10,000, large landmarks 20,000-30,000. */
export const PLAZA_TIERS: Record<string, [number, number]> = {
  "plague-column": [4000, 10000],
  "bandstand": [4000, 10000],
  "arc-de-triomphe": [20000, 30000],
  "prague-old-town-hall": [20000, 30000],
  "parthenon": [20000, 30000],
  "temple-of-heaven": [20000, 30000],
  "war-memorial": [4000, 10000],
  "equestrian-statue": [4000, 10000],
  "leaning-tower-of-pisa": [20000, 30000],
  "cloth-hall": [20000, 30000],
  "nelsons-column": [4000, 10000],
  "atomium": [20000, 30000],
};

/** A plaza landmark's id without its prefix (the build exports `bld-x` as `proc-building-x`). */
export const plazaName = (id: string): string => id.replace(/^(bld-|proc-building-)/, "");
