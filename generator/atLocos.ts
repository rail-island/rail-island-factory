// Austrian electric, diesel and steam locomotives, each in its own module
// (generator/at*.ts) measured on photographs and drawings. This file is their registry.
// See docs/models/austria-trains.md.
import type { ProceduralDesign } from "./design.ts";

// Each vehicle replaces its own `// import:<slot>` and `// design:<slot>` line and keeps
// the blank lines between the slots, so the vehicles' branches merge without conflicts.

import { OBB1116 } from "./atObb1116.ts";
export { obb1116, obb1116Lod } from "./atObb1116.ts";

import { OBB1144_DESIGN } from "./atObb1144.ts";
export { obb1144, obb1144Lod } from "./atObb1144.ts";

import { OBB1142_DESIGN } from "./atObb1142.ts";
export { obb1142, obb1142Lod } from "./atObb1142.ts";

import { OBB1110_DESIGN } from "./atObb1110.ts";
export { obb1110, obb1110Lod } from "./atObb1110.ts";

import { OBB1189_DESIGN } from "./atObb1189.ts";
export { obb1189, obb1189Lod } from "./atObb1189.ts";

import { OBB2016_DESIGN } from "./atObb2016.ts";
export { obb2016, obb2016Lod } from "./atObb2016.ts";

import { OBB2043_DESIGN } from "./atObb2043.ts";
export { obb2043, obb2043Lod } from "./atObb2043.ts";

import { OBB1099_DESIGN } from "./atObb1099.ts";
export { obb1099, obb1099Lod } from "./atObb1099.ts";

import { BBO214_DESIGN } from "./atBbo214.ts";
export { bbo214, bbo214Lod } from "./atBbo214.ts";

export const AT_LOCOS: ProceduralDesign[] = [
  OBB1116,

  OBB1144_DESIGN,

  OBB1142_DESIGN,

  OBB1110_DESIGN,

  OBB1189_DESIGN,

  OBB2016_DESIGN,

  OBB2043_DESIGN,

  OBB1099_DESIGN,

  BBO214_DESIGN,
];
