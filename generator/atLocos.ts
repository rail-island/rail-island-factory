// Austrian electric, diesel and steam locomotives, each in its own module
// (generator/at*.ts) measured on photographs and drawings. This file is their registry.
// See docs/models/austria-trains.md.
import type { ProceduralDesign } from "./design.ts";

// Each vehicle replaces its own `// import:<slot>` and `// design:<slot>` line and keeps
// the blank lines between the slots, so the vehicles' branches merge without conflicts.

import { OBB1116 } from "./atObb1116.ts";

import { OBB1144_DESIGN } from "./atObb1144.ts";

import { OBB1142_DESIGN } from "./atObb1142.ts";

// import:obb-1110

// import:obb-1189

// import:obb-2016

import { OBB2043_DESIGN } from "./atObb2043.ts";
export { obb2043, obb2043Lod } from "./atObb2043.ts";

// import:obb-1099

// import:bbo-214

export const AT_LOCOS: ProceduralDesign[] = [
  OBB1116,

  OBB1144_DESIGN,

  OBB1142_DESIGN,

  // design:obb-1110

  // design:obb-1189

  // design:obb-2016

  OBB2043_DESIGN,

  // design:obb-1099

  // design:bbo-214
];
