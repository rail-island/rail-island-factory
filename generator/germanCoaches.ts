// The German passenger coaches transferred from vlakosimdb -- three designs:
//
//   veh-db-n-wagen        db_bnvr, db_bnvriv, db_abnvr, db_abnvriv,     `variant` bn, abn, bdnrf
//                         db_bdnrf, db_bdnrfiv                          `livery` vr, iv
//   veh-db-dosto          db_ds_re1, db_ds_re2, db_ds_re2_s             `variant` firstClass, secondClass, drivingTrailer
//   veh-dr-sbahn-berlin   dr_sds_b, dr_sds_s                            `variant` coach, drivingTrailer
//
// and the measured comparison of each vlakosimdb vehicle whose geometry differs
// (the n-Wagen iv textures paint the vr boxes, so the six n-Wagen folders give
// three comparisons). See docs/models/german-coaches.md.

import type { ProceduralDesign } from "./design.ts";
import type { CoachTransfer } from "./coachTransfers.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { N_WAGEN_PARAMS, nWagen } from "./dbNWagen.ts";
import { DOSTO_PARAMS, dbDosto } from "./dbDoubleDeck.ts";
import { DR_DOUBLE_DECK_PARAMS, drDoubleDeck } from "./drDoubleDeck.ts";

export const GERMAN_COACHES: readonly ProceduralDesign[] = [
  { id: "proc-vehicle-db-n-wagen", title: "DB n-Wagen (Silberling)", build: nWagen, params: N_WAGEN_PARAMS, catalog: COACH_CATALOG, references: "db-n-wagen" },
  { id: "proc-vehicle-db-dosto", title: "DB Regio Double-Deck Coach", build: dbDosto, params: DOSTO_PARAMS, catalog: COACH_CATALOG, references: "db-dosto" },
  { id: "proc-vehicle-dr-sbahn-berlin", title: "DR Double-Deck Coach (Berlin S-Bahn livery)", build: drDoubleDeck, params: DR_DOUBLE_DECK_PARAMS, catalog: COACH_CATALOG, references: "dr-sbahn-berlin" },
];

const GERMAN_DOC = {
  title: "German coaches (n-Wagen, DB Regio and DR double-deck coaches)",
  path: "docs/models/german-coaches.md",
  code: ["generator/germanCoaches.ts", "generator/dbNWagen.ts", "generator/dbDoubleDeck.ts", "generator/drDoubleDeck.ts", "generator/germanCoachParts.ts"],
  residuals:
    "the transfer onto the XML bodies and the deliberate mechanical choices (1.75 m buffer spacing, round lamps, the measured door and window boxes kept to whole pixels)",
};

const t = (key: string, title: string, id: string, folder: string, centre: number, params: Record<string, string>, report: string): CoachTransfer => ({
  key,
  title,
  id,
  params,
  folder,
  native: `native/${key}`,
  centre,
  report,
  doc: GERMAN_DOC,
});

export const GERMAN_TRANSFERS: readonly CoachTransfer[] = [
  t("db_bnvr", "DB Bn vr", "proc-vehicle-db-n-wagen", "db-n-wagen", 13.2, { variant: "bn", livery: "vr" }, "COMPARISON-bn.md"),
  t("db_abnvr", "DB ABn vr", "proc-vehicle-db-n-wagen", "db-n-wagen", 13.2, { variant: "abn", livery: "vr" }, "COMPARISON-abn.md"),
  t("db_bdnrf", "DB Bdnrf vr", "proc-vehicle-db-n-wagen", "db-n-wagen", 13.2, { variant: "bdnrf", livery: "vr" }, "COMPARISON-bdnrf.md"),
  t("db_ds_re1", "DB DS Re 1Kl", "proc-vehicle-db-dosto", "db-dosto", 13.4, { variant: "firstClass" }, "COMPARISON-first-class.md"),
  t("db_ds_re2", "DB DS Re 2Kl", "proc-vehicle-db-dosto", "db-dosto", 13.4, { variant: "secondClass" }, "COMPARISON-second-class.md"),
  t("db_ds_re2_s", "DB DS Re 2Kl S", "proc-vehicle-db-dosto", "db-dosto", 13.4, { variant: "drivingTrailer" }, "COMPARISON-driving-trailer.md"),
  t("dr_sds_b", "DR S-Bahn Berlin", "proc-vehicle-dr-sbahn-berlin", "dr-sbahn-berlin", 13.5, { variant: "coach" }, "COMPARISON-coach.md"),
  t("dr_sds_s", "DR S-Bahn Berlin S", "proc-vehicle-dr-sbahn-berlin", "dr-sbahn-berlin", 13.5, { variant: "drivingTrailer" }, "COMPARISON-driving-trailer.md"),
];

// the builders by name, for the standalone JS models (jsModel.ts imports them from this module)
export { nWagen } from "./dbNWagen.ts";
export { dbDosto } from "./dbDoubleDeck.ts";
export { drDoubleDeck } from "./drDoubleDeck.ts";
