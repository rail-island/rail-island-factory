// Austrian units and coaches, each in its own module (generator/at*.ts) measured on
// photographs and drawings. This file is their registry. See docs/models/austria-trains.md.
import type { ProceduralDesign } from "./design.ts";

// Each vehicle replaces its own `// import:<slot>` and `// design:<slot>` line and keeps
// the blank lines between the slots, so the vehicles' branches merge without conflicts.

// import:obb-railjet

// import:obb-4024

// import:obb-4744

import { OBB4020_DESIGN } from "./atObb4020.ts";

// import:obb-4010

// import:obb-5047

// import:obb-5022

// import:westbahn-kiss

// import:noevog-himmelstreppe

// import:obb-cityshuttle-dd

// import:obb-nightjet

export const AT_UNITS: ProceduralDesign[] = [
  // design:obb-railjet

  // design:obb-4024

  // design:obb-4744

  OBB4020_DESIGN,

  // design:obb-4010

  // design:obb-5047

  // design:obb-5022

  // design:westbahn-kiss

  // design:noevog-himmelstreppe

  // design:obb-cityshuttle-dd

  // design:obb-nightjet
];
