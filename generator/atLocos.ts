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

import { OBB1189_DESIGN } from "./atObb1189.ts";
export { obb1189, obb1189Lod } from "./atObb1189.ts";

// import:obb-2016

// import:obb-2043

import { OBB1099_DESIGN } from "./atObb1099.ts";
export { obb1099, obb1099Lod } from "./atObb1099.ts";

// import:bbo-214

export const AT_LOCOS: ProceduralDesign[] = [
  OBB1116,

  OBB1144_DESIGN,

  OBB1142_DESIGN,

  // design:obb-1110

  OBB1189_DESIGN,

  // design:obb-2016

  // design:obb-2043

  OBB1099_DESIGN,

  // design:bbo-214
];
