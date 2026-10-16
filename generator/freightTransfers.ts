// The container, flat, sliding-wall and hopper wagons of freightWagons.ts with a
// measured comparison against their native BMPs (csdCoachComparison.ts,
// csdCoachReport.ts): one row per compared vlakosimdb vehicle -- the default of
// every design and each load variant -- with the design and parameters that
// build it, its native folder (assets/<folder>/native/<key>/) and the source x of
// its buffer midpoint. The other liveries share their default's geometry and are
// not measured apart. See docs/models/freight-wagons.md.

import type { CoachTransfer } from "./coachTransfers.ts";

const FREIGHT_DOC = {
  title: "Freight wagons (container, flat, sliding-wall, hopper)",
  path: "docs/models/freight-wagons.md",
  code: ["generator/freightWagons.ts", "generator/hopperWagons.ts", "generator/freightWagonParts.ts", "generator/freightTransfers.ts"],
  residuals:
    "the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width)",
};

const freight = (key: string, title: string, id: string, folder: string, centre: number, params?: Record<string, string>, report = "COMPARISON.md"): CoachTransfer => ({
  key,
  title,
  id,
  ...(params ? { params } : {}),
  folder,
  native: `native/${key}`,
  centre,
  report,
  doc: FREIGHT_DOC,
});

export const FREIGHT_TRANSFERS: readonly CoachTransfer[] = [
  freight("n_sqns", "Sqns", "proc-vehicle-sqns-container-wagon", "wagon-sqns", 9.9, { cargo: "empty" }, "COMPARISON-empty.md"),
  freight("n_sqns-full_1", "Sqns + Maersk", "proc-vehicle-sqns-container-wagon", "wagon-sqns", 9.9, { cargo: "maersk" }, "COMPARISON-maersk.md"),
  freight("n_pao-full_1", "Pao + Tubes", "proc-vehicle-pao-flat-wagon", "wagon-pao", 7.65, { cargo: "tubes" }, "COMPARISON-tubes.md"),
  freight("n_habis_tw1", "Habis Transwaggon 1", "proc-vehicle-habis-sliding-wall-wagon", "wagon-habis", 11.6, { livery: "tw1" }),
  freight("n_hadgs", "Hadgs", "proc-vehicle-hadgs-hopper-wagon", "wagon-hadgs", 8.4),
  freight("n_faccs", "N_Faccs", "proc-vehicle-faccs-hopper-wagon", "wagon-faccs", 6.4, { livery: "cd" }),
  freight("n_falls", "N_Falls", "proc-vehicle-falls-hopper-wagon", "wagon-falls", 6.75, { livery: "cd" }),
  freight("n_wap-full_2", "Wap - full#2", "proc-vehicle-wap-hopper-wagon", "wagon-wap", 6.75, { cargo: "coal" }),
];
