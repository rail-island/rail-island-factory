// The Czech and Slovak coaches in their later liveries: three parametric designs
// built by liveryCoach.ts - the CD Y-family coaches (cdYCoach.ts), the ZSR coaches
// (zsrCoach.ts) and the UIC-Z coaches (uicZCoach.ts) - and the vlakosimdb
// vehicles they transfer, for the measured comparison (csdCoachComparison.ts).
// See docs/models/czsk-coaches.md.

import type { ProceduralDesign } from "./design.ts";
import type { CoachTransfer } from "./coachTransfers.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { CD_Y_PARAMS, cdYCoach } from "./cdYCoach.ts";
import { ZSR_PARAMS, zsrCoach } from "./zsrCoach.ts";
import { UIC_Z_PARAMS, uicZCoach } from "./uicZCoach.ts";

// the builders, re-exported: the standalone JS models (jsModel.ts) import them from this family module
export { cdYCoach, zsrCoach, uicZCoach };

export const CZSK_COACHES: readonly ProceduralDesign[] = [
  { id: "veh-cd-y-coach", title: "CD Y Coach", build: cdYCoach, params: CD_Y_PARAMS, references: "cd-y-coach", catalog: COACH_CATALOG },
  { id: "veh-zsr-coach", title: "ZSR Coach", build: zsrCoach, params: ZSR_PARAMS, references: "zsr-coach", catalog: COACH_CATALOG },
  { id: "veh-uic-z-coach", title: "UIC-Z Coach", build: uicZCoach, params: UIC_Z_PARAMS, references: "uic-z-coach", catalog: COACH_CATALOG },
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
  t("cd_bcc", "CD Bcc", "veh-cd-y-coach", "cd-y-coach", { variant: "bcc" }, 12.25, "COMPARISON-bcc.md"),
  t("cd_beer", "CD Beer", "veh-cd-y-coach", "cd-y-coach", { variant: "beer" }, 12.25, "COMPARISON-beer.md"),
  t("cd_bnb", "CD Bnb", "veh-cd-y-coach", "cd-y-coach", { variant: "bnb" }, 12.25, "COMPARISON-bnb.md"),
  t("cd_wrrm", "CD WRRm", "veh-cd-y-coach", "cd-y-coach", { variant: "wrrm" }, 13.2, "COMPARISON-wrrm.md"),
  t("zsr_a", "ZSR A", "veh-zsr-coach", "zsr-coach", { variant: "a" }, 12.25, "COMPARISON-a.md"),
  t("zsr_ab", "ZSR AB", "veh-zsr-coach", "zsr-coach", { variant: "ab" }, 12.25, "COMPARISON-ab.md"),
  t("zsr_b", "ZSR B", "veh-zsr-coach", "zsr-coach", { variant: "b" }, 12.25, "COMPARISON-b.md"),
  t("zsr_bh", "ZSR Bh", "veh-zsr-coach", "zsr-coach", { variant: "bh" }, 12.25, "COMPARISON-bh.md"),
  t("zsr_bds", "ZSR BDs", "veh-zsr-coach", "zsr-coach", { variant: "bds" }, 12.25, "COMPARISON-bds.md"),
  t("zsr_bdmeer", "ZSR BDmeer", "veh-zsr-coach", "zsr-coach", { variant: "bdmeer" }, 13.2, "COMPARISON-bdmeer.md"),
  t("zsr_wrrm", "ZSR WRRm", "veh-zsr-coach", "zsr-coach", { variant: "wrrm" }, 13.2, "COMPARISON-wrrm.md"),
  t("zsr_apee", "ZSR Apee", "veh-zsr-coach", "zsr-coach", { variant: "apee" }, 12.25, "COMPARISON-apee.md"),
  t("cd_ampz", "CD Ampz", "veh-uic-z-coach", "uic-z-coach", { variant: "firstClass" }, 13.2, "COMPARISON-ampz.md"),
  t("cd_bmz", "CD Bmz", "veh-uic-z-coach", "uic-z-coach", { variant: "secondClass" }, 13.2, "COMPARISON-bmz.md"),
  t("cd_wrrmz", "CD WRRmz", "veh-uic-z-coach", "uic-z-coach", { variant: "restaurant" }, 13.45, "COMPARISON-wrrmz.md"),
];
