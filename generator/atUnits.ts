// Austrian units and coaches, each in its own module (generator/at*.ts) measured on
// photographs and drawings. This file is their registry. See docs/models/austria-trains.md.
import type { ProceduralDesign } from "./design.ts";

// Each vehicle replaces its own `// import:<slot>` and `// design:<slot>` line and keeps
// the blank lines between the slots, so the vehicles' branches merge without conflicts.

import { RAILJET_DESIGN } from "./atRailjet.ts";

import { OBB_4024_DESIGN } from "./atObb4024.ts";

import { OBB4744_DESIGN } from "./atObb4744.ts";

import { OBB4020_DESIGN } from "./atObb4020.ts";

// import:obb-4010

// import:obb-5047

import { OBB5022_DESIGN } from "./atObb5022.ts";

// import:westbahn-kiss

// import:noevog-himmelstreppe

import { CITYSHUTTLE_DESIGN } from "./atCityShuttle.ts";

// import:obb-nightjet

export const AT_UNITS: ProceduralDesign[] = [
  RAILJET_DESIGN,

  OBB_4024_DESIGN,

  OBB4744_DESIGN,

  OBB4020_DESIGN,

  // design:obb-4010

  // design:obb-5047

  OBB5022_DESIGN,

  // design:westbahn-kiss

  // design:noevog-himmelstreppe

  CITYSHUTTLE_DESIGN,

  // design:obb-nightjet
];
