// The Czech and Slovak coaches in their later liveries: three parametric designs
// built by liveryCoach.ts - the CD Y-family coaches (cdYCoach.ts), the ZSR coaches
// (zsrCoach.ts) and the UIC-Z coaches (uicZCoach.ts) - and the vlakosimdb
// vehicles they transfer, for the measured comparison (csdCoachComparison.ts).
// See docs/models/czsk-coaches.md.

import type { GameProperties, ProceduralDesign } from "./design.ts";
import type { CoachTransfer } from "./coachTransfers.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { CD_Y_PARAMS, cdYCoach, cdYCoachLod } from "./cdYCoach.ts";
import { ZSR_PARAMS, zsrCoach, zsrCoachLod } from "./zsrCoach.ts";
import { UIC_Z_PARAMS, uicZCoach, uicZCoachLod } from "./uicZCoach.ts";

// the builders, re-exported: the standalone JS models (jsModel.ts) import them from this family module
export { cdYCoach, zsrCoach, uicZCoach, cdYCoachLod, zsrCoachLod, uicZCoachLod };

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_Y_COACH_GAME: GameProperties = {
  weight: 40,
  power: 0,
  maxspeed: 140,
  accel: null,
  variants: [
    { params: { variant: "beer" }, maxspeed: 160 },
    { params: { variant: "bnb" }, maxspeed: 120 },
  ],
};

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const ZSR_COACH_GAME: GameProperties = {
  weight: 40,
  power: 0,
  maxspeed: 140,
  accel: null,
  variants: [
    { params: { variant: "bdmeer" }, maxspeed: 160 },
  ],
};

export const CZSK_COACHES: readonly ProceduralDesign[] = [
  { id: "proc-vehicle-cd-y-coach", game: CD_Y_COACH_GAME, title: "CD Y Coach", build: cdYCoach, buildLod: cdYCoachLod, params: CD_Y_PARAMS, references: "cd-y-coach", catalog: COACH_CATALOG },
  { id: "proc-vehicle-zsr-coach", game: ZSR_COACH_GAME, title: "ZSR Coach", build: zsrCoach, buildLod: zsrCoachLod, params: ZSR_PARAMS, references: "zsr-coach", catalog: COACH_CATALOG },
  { id: "proc-vehicle-uic-z-coach", game: { weight: 46, power: 0, maxspeed: 200, accel: null }, title: "UIC-Z Coach", build: uicZCoach, buildLod: uicZCoachLod, params: UIC_Z_PARAMS, references: "uic-z-coach", catalog: COACH_CATALOG },
];

const DOC = {
  title: "Czech and Slovak coaches (CD Y, ZSR, UIC-Z)",
  path: "docs/models/czsk-coaches.md",
  code: ["generator/liveryCoach.ts", "generator/cdYCoach.ts", "generator/zsrCoach.ts", "generator/uicZCoach.ts", "generator/czskCoaches.ts"],
};

const t = (key: string, title: string, id: string, folder: string, params: Record<string, string>, centre: number, report: string): CoachTransfer => ({
  key,
  title,
  id,
  params,
  folder,
  native: `native/${key}`,
  centre,
  report,
  doc: DOC,
});

/** Every vlakosimdb vehicle these designs transfer: its design, parameters, native folder and buffer midpoint. */
export const CZSK_TRANSFERS: readonly CoachTransfer[] = [
  t("cd_bcc", "CD Bcc", "proc-vehicle-cd-y-coach", "cd-y-coach", { variant: "bcc" }, 12.25, "COMPARISON-bcc.md"),
  t("cd_beer", "CD Beer", "proc-vehicle-cd-y-coach", "cd-y-coach", { variant: "beer" }, 12.25, "COMPARISON-beer.md"),
  t("cd_bnb", "CD Bnb", "proc-vehicle-cd-y-coach", "cd-y-coach", { variant: "bnb" }, 12.25, "COMPARISON-bnb.md"),
  t("cd_wrrm", "CD WRRm", "proc-vehicle-cd-y-coach", "cd-y-coach", { variant: "wrrm" }, 13.2, "COMPARISON-wrrm.md"),
  t("zsr_a", "ZSR A", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "a" }, 12.25, "COMPARISON-a.md"),
  t("zsr_ab", "ZSR AB", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "ab" }, 12.25, "COMPARISON-ab.md"),
  t("zsr_b", "ZSR B", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "b" }, 12.25, "COMPARISON-b.md"),
  t("zsr_bh", "ZSR Bh", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "bh" }, 12.25, "COMPARISON-bh.md"),
  t("zsr_bds", "ZSR BDs", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "bds" }, 12.25, "COMPARISON-bds.md"),
  t("zsr_bdmeer", "ZSR BDmeer", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "bdmeer" }, 13.2, "COMPARISON-bdmeer.md"),
  t("zsr_wrrm", "ZSR WRRm", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "wrrm" }, 13.2, "COMPARISON-wrrm.md"),
  t("zsr_apee", "ZSR Apee", "proc-vehicle-zsr-coach", "zsr-coach", { variant: "apee" }, 12.25, "COMPARISON-apee.md"),
  t("cd_ampz", "CD Ampz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "firstClass" }, 13.2, "COMPARISON-ampz.md"),
  t("cd_bmz", "CD Bmz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "secondClass" }, 13.2, "COMPARISON-bmz.md"),
  t("cd_wrrmz", "CD WRRmz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "restaurant" }, 13.45, "COMPARISON-wrrmz.md"),
  t("db_ic_ampz", "DB IC Ampz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "firstClass", operator: "db" }, 13.2, "COMPARISON-db-ampz.md"),
  t("db_ic_bmpz", "DB IC Bmpz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "secondClass", operator: "db" }, 13.2, "COMPARISON-db-bmpz.md"),
  t("db_ic_wrmz", "DB IC WRmz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "restaurant", operator: "db" }, 13.45, "COMPARISON-db-wrmz.md"),
  t("obb_ampz", "OBB Ampz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "firstClass", operator: "obb" }, 13.2, "COMPARISON-obb-ampz.md"),
  t("obb_bmpz", "OBB Bmpz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "secondClass", operator: "obb" }, 13.2, "COMPARISON-obb-bmpz.md"),
  t("obb_wrmz", "OBB WRmz", "proc-vehicle-uic-z-coach", "uic-z-coach", { variant: "restaurant", operator: "obb" }, 13.2, "COMPARISON-obb-wrmz.md"),
];
