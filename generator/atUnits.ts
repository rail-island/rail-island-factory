// Austrian units and coaches, each in its own module (generator/at*.ts) measured on
// photographs and drawings. This file is their registry. See docs/models/austria-trains.md.
import type { ProceduralDesign } from "./design.ts";
import { RAILJET_DESIGN } from "./atRailjet.ts";
export { obbRailjet, obbRailjetLod } from "./atRailjet.ts";
import { OBB_4024_DESIGN } from "./atObb4024.ts";
export { obb4024, obb4024Lod } from "./atObb4024.ts";
import { OBB4744_DESIGN } from "./atObb4744.ts";
export { obb4744, obb4744Lod } from "./atObb4744.ts";
import { OBB4020_DESIGN } from "./atObb4020.ts";
export { obb4020, obb4020Lod } from "./atObb4020.ts";
import { OBB4010_DESIGN } from "./atObb4010.ts";
export { obb4010, obb4010Lod } from "./atObb4010.ts";
import { OBB5047_DESIGN } from "./atObb5047.ts";
export { obb5047, obb5047Lod } from "./atObb5047.ts";
import { OBB5022_DESIGN } from "./atObb5022.ts";
export { obb5022, obb5022Lod } from "./atObb5022.ts";
import { WESTBAHN_KISS_DESIGN } from "./atWestbahnKiss.ts";
export { westbahnKiss, westbahnKissLod } from "./atWestbahnKiss.ts";
import { HIMMELSTREPPE_DESIGN } from "./atHimmelstreppe.ts";
export { noevogHimmelstreppe, noevogHimmelstreppeLod } from "./atHimmelstreppe.ts";
import { CITYSHUTTLE_DESIGN } from "./atCityShuttle.ts";
export { obbCityShuttle, obbCityShuttleLod } from "./atCityShuttle.ts";
import { NIGHTJET_DESIGN } from "./atNightjet.ts";
export { obbNightjet, obbNightjetLod } from "./atNightjet.ts";

export const AT_UNITS: ProceduralDesign[] = [
  RAILJET_DESIGN,
  OBB_4024_DESIGN,
  OBB4744_DESIGN,
  OBB4020_DESIGN,
  OBB4010_DESIGN,
  OBB5047_DESIGN,
  OBB5022_DESIGN,
  WESTBAHN_KISS_DESIGN,
  HIMMELSTREPPE_DESIGN,
  CITYSHUTTLE_DESIGN,
  NIGHTJET_DESIGN,
];
