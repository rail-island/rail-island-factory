// Indian units on the series kit (shinkansen.ts): the Vande Bharat, the Namo
// Bharat (RRTS), the Mumbai suburban EMU, the MEMU and the Delhi Metro RS1, each
// specified by its own module (in*.ts), at the broad gauge's width narrowed to
// the 3.3 m gauge ("us"). See docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { seriesDesign, seriesParams } from "./shinkansen.ts";
// every unit is drawn by its own module from photographs; the design rows stay here
import { irVandeBharat, irVandeBharatLod, VANDE_BHARAT } from "./inVandeBharat.ts";
import { NAMO_BHARAT, ncrtcNamoBharat, ncrtcNamoBharatLod } from "./inNamoBharat.ts";
import { MUMBAI_EMU, buildMumbaiEmu, buildMumbaiEmuLod } from "./inMumbaiEmu.ts";
import { MEMU, irMemu, irMemuLod } from "./inMemu.ts";
import { DELHI_METRO, dmrcRs1, dmrcRs1Lod } from "./inDelhiMetro.ts";

// the bundle of a design imports its build functions from the module that lists it (jsModel.ts)
export { irVandeBharat, irVandeBharatLod, VANDE_BHARAT, NAMO_BHARAT, ncrtcNamoBharat, ncrtcNamoBharatLod, MUMBAI_EMU, MEMU, irMemu, irMemuLod, DELHI_METRO, dmrcRs1, dmrcRs1Lod };

const P = { vb: seriesParams(VANDE_BHARAT), nb: seriesParams(NAMO_BHARAT), mumbai: seriesParams(MUMBAI_EMU), memu: seriesParams(MEMU), dmrc: seriesParams(DELHI_METRO) };

export function irMumbaiEmu(v?: ParamValues): MeshBuilder { return buildMumbaiEmu(v); }
export function irMumbaiEmuLod(v?: ParamValues): MeshBuilder { return buildMumbaiEmuLod(v); }

export const IN_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-ir-vande-bharat", "Vande Bharat", VANDE_BHARAT, P.vb, irVandeBharat, irVandeBharatLod, "ir-vande-bharat", "us"),
  seriesDesign("proc-vehicle-ncrtc-namo-bharat", "Namo Bharat", NAMO_BHARAT, P.nb, ncrtcNamoBharat, ncrtcNamoBharatLod, "ncrtc-namo-bharat", "us"),
  seriesDesign("proc-vehicle-ir-mumbai-emu", "Mumbai suburban EMU", MUMBAI_EMU, P.mumbai, irMumbaiEmu, irMumbaiEmuLod, "ir-mumbai-emu", "us"),
  seriesDesign("proc-vehicle-ir-memu", "IR MEMU", MEMU, P.memu, irMemu, irMemuLod, "ir-memu", "us"),
  seriesDesign("proc-vehicle-dmrc-rs1", "Delhi Metro RS1", DELHI_METRO, P.dmrc, dmrcRs1, dmrcRs1Lod, "dmrc-rs1", "us"),
];
