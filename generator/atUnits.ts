// Austrian units and coaches, each in its own module (generator/at*.ts) measured on
// photographs and drawings. This file is their registry. See docs/models/austria-trains.md.
import type { ProceduralDesign } from "./design.ts";

// Each vehicle replaces its own `// import:<slot>` and `// design:<slot>` line and keeps
// the blank lines between the slots, so the vehicles' branches merge without conflicts.

import { RAILJET_DESIGN } from "./atRailjet.ts";

import { OBB_4024_DESIGN } from "./atObb4024.ts";

import { OBB4744_DESIGN } from "./atObb4744.ts";

// import:obb-4020

// import:obb-4010

// import:obb-5047

// import:obb-5022

// import:westbahn-kiss

// import:noevog-himmelstreppe

// import:obb-cityshuttle-dd

// import:obb-nightjet

export const AT_UNITS: ProceduralDesign[] = [
  RAILJET_DESIGN,

  OBB_4024_DESIGN,

  OBB4744_DESIGN,

  // design:obb-4020

  // design:obb-4010

  // design:obb-5047

  // design:obb-5022

  // design:westbahn-kiss

  // design:noevog-himmelstreppe

  // design:obb-cityshuttle-dd

  // design:obb-nightjet
];
