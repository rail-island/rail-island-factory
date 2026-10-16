// Every coach transferred from vlakosimdb, for the measured comparison
// (csdCoachComparison.ts, csdCoachReport.ts): the CSD coaches (csdCoaches.ts),
// the Bmo double-deck coach in its four liveries (bmoCoach.ts) and the CD green
// and white coaches (cdGreenWhiteCoach.ts); ALL_TRANSFERS adds the freight
// wagons (wagonTransfers.ts, freightTransfers.ts). See docs/models/csd-coaches.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { CSD_COACHES } from "./csdCoaches.ts";
import { BMO_PARAMS, bmoCoach } from "./bmoCoach.ts";
import { GREEN_WHITE_PARAMS, cdGreenWhiteCoach } from "./cdGreenWhiteCoach.ts";
import { WAGON_DESIGNS } from "./wagons.ts";
import { WAGON_TRANSFERS } from "./wagonTransfers.ts";
import { FREIGHT_WAGONS } from "./freightWagons.ts";
import { FREIGHT_TRANSFERS } from "./freightTransfers.ts";

/** A coach design: id, title, builder, parameters and its reference folder (assets/<folder>/). */
export interface CoachDesign {
  id: string;
  title: string;
  folder: string;
  build: (params?: ParamValues) => MeshBuilder;
  params?: readonly ParamSpec[];
}

/** The coach designs beyond the CSD ones: parametric, several vlakosimdb vehicles each. */
export const CD_COACHES: readonly CoachDesign[] = [
  { id: "veh-bmo-double-deck-coach", title: "Bmo Double-Deck Coach", folder: "bmo-double-deck", build: bmoCoach, params: BMO_PARAMS },
  { id: "veh-cd-green-white-coach", title: "CD Green-White Coach", folder: "cd-green-white", build: cdGreenWhiteCoach, params: GREEN_WHITE_PARAMS },
];

/** Every coach design, in catalog order. */
export const COACH_DESIGNS: readonly CoachDesign[] = [...CSD_COACHES, ...CD_COACHES];

/**
 * One transferred vlakosimdb vehicle, for the measured comparison: the design and
 * parameters that build it, where its native files are (assets/<folder>/<native>)
 * and the source x of its buffer midpoint (the model's x = 0).
 */
export interface CoachTransfer {
  /** The vlakosimdb folder name, e.g. "csd_a"; "#" becomes "_" ("cd_bmo_1"). */
  key: string;
  title: string;
  id: string;
  params?: ParamValues;
  folder: string;
  native: string;
  centre: number;
  /** The comparison table, relative to assets/<folder>/. */
  report: string;
  /** The reference the comparison table links and the code it names; the CSD coaches' when absent. */
  doc?: { title: string; path: string; code: string[]; residuals?: string };
}

const greenWhite = (variant: string, title: string, centre = 12.25): CoachTransfer => ({
  key: `cd_${variant}`,
  title,
  id: "veh-cd-green-white-coach",
  params: { variant },
  folder: "cd-green-white",
  native: `native/cd_${variant}`,
  centre,
  report: `COMPARISON-${variant}.md`,
});

const bmo = (key: string, title: string, livery: string): CoachTransfer => ({
  key,
  title,
  id: "veh-bmo-double-deck-coach",
  params: { livery },
  folder: "bmo-double-deck",
  native: `native/${key}`,
  centre: 13.4,
  report: `COMPARISON-${livery}.md`,
});

export const COACH_TRANSFERS: readonly CoachTransfer[] = [
  { key: "csd_a", title: "CSD A", id: "veh-csd-classic-green-coach", params: { variant: "classA" }, folder: "csd-classic-green", native: "native/csd_a", centre: 12.25, report: "COMPARISON-class-a.md" },
  { key: "csd_b", title: "CSD B", id: "veh-csd-classic-green-coach", params: { variant: "classB" }, folder: "csd-classic-green", native: "native/csd_b", centre: 12.25, report: "COMPARISON-class-b.md" },
  { key: "csd_balm", title: "CSD Balm", id: "veh-csd-balm", folder: "csd-balm", native: "native", centre: 9.55, report: "COMPARISON.md" },
  { key: "csd_bam", title: "CSD Bam", id: "veh-csd-bam", folder: "csd-bam", native: "native", centre: 11.15, report: "COMPARISON.md" },
  { key: "csd_bdmtee", title: "CSD Bdmtee", id: "veh-csd-bdmtee", folder: "csd-bdmtee", native: "native", centre: 13.2, report: "COMPARISON.md" },
  { key: "csd_be31", title: "CSD Be31", id: "veh-csd-be31", folder: "csd-be31", native: "native", centre: 7.8, report: "COMPARISON.md" },
  { key: "csd_bi20", title: "CSD Bi20", id: "veh-csd-bi20", folder: "csd-bi20", native: "native", centre: 6.3, report: "COMPARISON.md" },
  bmo("csd_bmo", "CSD Bmo", "csd"),
  bmo("cd_bmo_1", "CD Bmo#1", "cdBlue"),
  bmo("cd_bmo_2", "CD Bmo#2", "cdBlueGrey"),
  bmo("cd_bmo_3", "CD Bmo#3", "cdRedDoors"),
  { key: "csd_dsk", title: "CSD Dsk", id: "veh-csd-dsk", folder: "csd-dsk", native: "native", centre: 5.25, report: "COMPARISON.md" },
  greenWhite("a", "CD A"),
  greenWhite("ab", "CD AB"),
  greenWhite("b", "CD B"),
  greenWhite("bee", "CD Bee"),
  greenWhite("beel", "CD Beel"),
  greenWhite("bds", "CD BDs"),
  greenWhite("ds", "CD Ds"),
  greenWhite("bdmeer", "CD BDmeer", 13.2),
  greenWhite("bdmtee", "CD Bdmtee", 13.2),
];

/** Every transferred vlakosimdb vehicle with a measured comparison: the coaches, then the freight wagons (wagonTransfers.ts). */
export const ALL_TRANSFERS: readonly CoachTransfer[] = [...COACH_TRANSFERS, ...WAGON_TRANSFERS, ...FREIGHT_TRANSFERS];

/** The builder of a transfer's design. */
export function transferBuild(t: CoachTransfer): MeshBuilder {
  return [...COACH_DESIGNS, ...WAGON_DESIGNS, ...FREIGHT_WAGONS].find((c) => c.id === t.id)!.build(t.params);
}
