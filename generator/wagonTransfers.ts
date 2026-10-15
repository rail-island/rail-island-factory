// Every freight wagon transferred from vlakosimdb (wagons.ts), one row per
// vlakosimdb vehicle, for the measured comparison (csdCoachComparison.ts,
// csdCoachReport.ts): the design and cargo that build it, its native folder
// (assets/<folder>/native/<key>/) and the source x of its buffer midpoint.
// See docs/models/wagons.md.

import type { CoachTransfer } from "./coachTransfers.ts";

const WAGONS_DOC = {
  title: "Freight wagons",
  path: "docs/models/wagons.md",
  code: ["generator/wagons.ts", "generator/wagonParts.ts", "generator/wagonTransfers.ts"],
  residuals:
    "the transfer onto the XML clip shapes (0.1 m posts the BMPs paint up to 0.2 m wide, polygonal hoppers and tank, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels)",
};

const wagon = (key: string, title: string, id: string, folder: string, centre: number, cargo?: string): CoachTransfer => ({
  key,
  title,
  id,
  ...(cargo ? { params: { cargo } } : {}),
  folder,
  native: `native/${key}`,
  centre,
  report: cargo ? `COMPARISON-${cargo}.md` : "COMPARISON.md",
  doc: WAGONS_DOC,
});

export const WAGON_TRANSFERS: readonly CoachTransfer[] = [
  wagon("n_nas", "Nas", "veh-nas-flat-wagon", "wagon-nas", 10.45, "empty"),
  wagon("n_nas-full_1", "Nas + Wood", "veh-nas-flat-wagon", "wagon-nas", 10.45, "wood"),
  wagon("n_nas-full_2", "Nas + Tubes", "veh-nas-flat-wagon", "wagon-nas", 10.45, "tubes"),
  wagon("n_nas-full_3", "Nas + Reels", "veh-nas-flat-wagon", "wagon-nas", 10.45, "reels"),
  wagon("n_ua-empty", "Ua Empty", "veh-ua-open-wagon", "wagon-ua", 6.85, "empty"),
  wagon("n_ua_1", "Ua Coal", "veh-ua-open-wagon", "wagon-ua", 6.85, "coal"),
  wagon("n_ua_2", "Ua Wood", "veh-ua-open-wagon", "wagon-ua", 6.85, "wood"),
  wagon("n_ua_3", "Ua + Sand", "veh-ua-open-wagon", "wagon-ua", 6.85, "sand"),
  wagon("n_eas", "Eas", "veh-eas-open-wagon", "wagon-eas", 6.95, "empty"),
  wagon("n_eas-drevo", "Eas-drevo", "veh-eas-open-wagon", "wagon-eas", 6.95, "wood"),
  wagon("n_eas-uhlo", "Eas-uhli", "veh-eas-open-wagon", "wagon-eas", 6.95, "coal"),
  wagon("n_raj", "Raj", "veh-raj-hopper-wagon", "wagon-raj", 7.2),
  wagon("n_rah_1", "Rah#1", "veh-rah-tank-wagon", "wagon-rah", 6.35),
];
