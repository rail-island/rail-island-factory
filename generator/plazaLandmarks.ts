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
import { MARKET_CROSS } from "./plazaMarketCross.ts";
import { HALF_TIMBERED_TOWN_HALL } from "./plazaHalfTimberedTownHall.ts";
import { STATUE_OF_LIBERTY } from "./plazaStatueOfLiberty.ts";
import { PANTHEON } from "./plazaPantheon.ts";
import { TAJ_MAHAL } from "./plazaTajMahal.ts";
import { GATEWAY_OF_INDIA } from "./plazaGatewayOfIndia.ts";
import { VILLAGE_CHAPEL } from "./plazaVillageChapel.ts";
import { BELFRY_OF_BRUGES } from "./plazaBelfryOfBruges.ts";
import { BRUSSELS_TOWN_HALL } from "./plazaBrusselsTownHall.ts";
import { MARKET_HALL } from "./plazaMarketHall.ts";
import { US_CAPITOL } from "./plazaUsCapitol.ts";
import { REICHSTAG } from "./plazaReichstag.ts";
import { HAGIA_SOPHIA } from "./plazaHagiaSophia.ts";
import { GATE_OF_HEAVENLY_PEACE } from "./plazaGateOfHeavenlyPeace.ts";

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
  { designs: MARKET_CROSS, source: "plazaMarketCross.ts" },
  { designs: HALF_TIMBERED_TOWN_HALL, source: "plazaHalfTimberedTownHall.ts" },
  { designs: STATUE_OF_LIBERTY, source: "plazaStatueOfLiberty.ts" },
  { designs: PANTHEON, source: "plazaPantheon.ts" },
  { designs: TAJ_MAHAL, source: "plazaTajMahal.ts" },
  { designs: GATEWAY_OF_INDIA, source: "plazaGatewayOfIndia.ts" },
  { designs: VILLAGE_CHAPEL, source: "plazaVillageChapel.ts" },
  { designs: BELFRY_OF_BRUGES, source: "plazaBelfryOfBruges.ts" },
  { designs: BRUSSELS_TOWN_HALL, source: "plazaBrusselsTownHall.ts" },
  { designs: MARKET_HALL, source: "plazaMarketHall.ts" },
  { designs: US_CAPITOL, source: "plazaUsCapitol.ts" },
  { designs: REICHSTAG, source: "plazaReichstag.ts" },
  { designs: HAGIA_SOPHIA, source: "plazaHagiaSophia.ts" },
  { designs: GATE_OF_HEAVENLY_PEACE, source: "plazaGateOfHeavenlyPeace.ts" },
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
  "market-cross": [4000, 10000],
  "half-timbered-town-hall": [20000, 30000],
  "statue-of-liberty": [20000, 30000],
  "pantheon": [20000, 30000],
  "taj-mahal": [20000, 30000],
  "gateway-of-india": [20000, 30000],
  "village-chapel": [4000, 10000],
  "belfry-of-bruges": [20000, 30000],
  "brussels-town-hall": [20000, 30000],
  "market-hall": [20000, 30000],
  "us-capitol": [20000, 30000],
  "reichstag": [20000, 30000],
  "hagia-sophia": [20000, 30000],
  "gate-of-heavenly-peace": [20000, 30000],
};

/** A plaza landmark's id without its prefix (the build exports `bld-x` as `proc-building-x`). */
export const plazaName = (id: string): string => id.replace(/^(bld-|proc-building-)/, "");
