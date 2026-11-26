// The CRH380B (CNR Tangshan / Changchun, the Velaro CN's 380 km/h development, 2010), drawn on the
// series kit (shinkansen.ts). Its photographs (assets/cr-crh380b/, SOURCES.md) show the CRH3C's body
// unchanged: the same snout, canopy and lip, coupler hatch seam, lounge window, doors, roof units and
// pantograph cars, the same white livery with the blue band and its chevron on the nose. What differs is
// the face's lamps: one slanted lens a side (a parallelogram leaning outward at its top, the headlamp in
// its upper outer part, the red lamp in its lower inner part) in place of the CRH3C's broad slatted
// clusters. So the design reuses the CRH3C's measured face, body and livery (cnCrh3c.ts) and draws its
// own lamps. See docs/models/china-units.md.
//
// Heights over the rail, lat across the face (viewer's right positive), d behind the snout's tip.

import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { CRH3C, CRH3C_FACE, COVER, CRH_LIVERY, HEXIE, mirror, seam } from "./cnCrh3c.ts";

/**
 * One headlamp lens (viewer's right, mirrored), measured head-on on photo-crh380b-3632 (about 300 px/m):
 * 1.60 - 1.97 m up, just over the coupler hatch's seam, its top just under the characters, 0.32 m wide,
 * leaning outward by 0.2 m over its height; its corners slightly cut.
 */
const LENS: Pt[] = [[0.38, 1.6], [0.66, 1.6], [0.69, 1.63], [0.88, 1.94], [0.86, 1.97], [0.58, 1.97], [0.55, 1.94], [0.36, 1.63]];
/** The lens's dark rim, 2 cm proud of it all round. */
const RIM: Pt[] = [[0.365, 1.58], [0.675, 1.58], [0.71, 1.625], [0.905, 1.945], [0.875, 1.99], [0.565, 1.99], [0.53, 1.945], [0.335, 1.625]];
/** The "Hexie hao" characters as on the CRH3C's face but larger and closer (photo-crh380b-3632): he over the left lens, xie on the centre, hao over the right lens. */
const CHAR_AT: readonly number[] = [-0.5, 0, 0.5];
const CHAR_Y = 1.98, CHAR_H = 0.2;

const ROWS = [...new Set([...CRH3C_FACE.rows, 1.58, 1.6, 1.63, 1.94, 1.97, 1.99])].sort((a, b) => a - b);

export const CRH380B_FACE: SeriesCabFace = {
  ...CRH3C_FACE,
  rows: ROWS,
  fields: [
    { mat: "rimL", pts: RIM },
    { mat: "rimL", pts: mirror(RIM) },
    { mat: "lens", pts: LENS },
    { mat: "lens", pts: mirror(LENS) },
  ],
  decals: [
    ...seam(COVER, 0.008).flatMap((pts) => [{ mat: "seam", pts, fine: 2 }, { mat: "seam", pts: mirror(pts), fine: 2 }]),
    ...HEXIE.flatMap((glyph, i) => glyph.flatMap((line) => seam(line.map(([x, y]): Pt => [CHAR_AT[i]! + (x - 0.5) * CHAR_H, CHAR_Y + y * CHAR_H]), 0.0075)))
      .map((pts) => ({ mat: "cabMask", pts, fine: 1 })),
  ],
  lamps: [
    [0, 2.3, 0.075, "lampHead"],
    [0.72, 1.87, 0.075, "lampHead"], [0.52, 1.7, 0.075, "lampRed"],
    [-0.72, 1.87, 0.075, "lampHead"], [-0.52, 1.7, 0.075, "lampRed"],
  ],
};

/** The CRH livery as on the CRH3C (the band, its chevron, the lounge window, "CRH"), the lenses' grey rims added; unit CRH380B-3632. */
const CRH380B_LIVERY: ShinkansenLivery = {
  ...CRH_LIVERY,
  number: "CRH380B-3632",
  palette: { ...CRH_LIVERY.palette, rimL: CRH_LIVERY.palette.seam! },
};

export const CRH380B: ShinkansenSeries = {
  ...CRH3C,
  cabFace: CRH380B_FACE,
  liveries: { crh: CRH380B_LIVERY },
  // 9,200 kW over eight cars (four motor cars); 380 km/h design, 350 km/h in service
  weight: { end: 57, middle: 50 }, power: 1150, maxspeed: 350,
};
