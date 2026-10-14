// The CD (Ceske drahy) emblem: the outlines of Wikimedia Commons'
// "Ceske_drahy-logo.svg" (its emblem only, not the wordmark), the curves
// flattened and simplified to within 0.4 percent of the emblem's height. Three
// simple polygons, no holes: the outer C-and-D band, the inner one and the bar
// over them (the hacek). Units: the emblem's height is 1, u runs right, v up,
// both from its lower left corner; counter-clockwise. See assets/cd-163/SOURCES.md.

/** The emblem's width when its height is 1. */
export const CD_EMBLEM_ASPECT = 1.5385;

export const CD_EMBLEM: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  // the outer band
  [
    [1.5012, 0.846], [1.4695, 0.8959], [1.4307, 0.9346], [1.3823, 0.9651], [1.3164, 0.9882],
    [1.2144, 0.9996], [0.8135, 0.9998], [0.6738, 0.3431], [0.7929, 0.3431], [0.9078, 0.8834],
    [1.2098, 0.8832], [1.2764, 0.8776], [1.3192, 0.8658], [1.3534, 0.8472], [1.3772, 0.8248],
    [1.3976, 0.793], [1.4171, 0.7286], [1.4221, 0.6436], [1.4104, 0.5322], [1.3822, 0.4035],
    [1.3548, 0.318], [1.3125, 0.2301], [1.2623, 0.169], [1.2153, 0.1384], [1.1638, 0.1229],
    [1.0892, 0.1167], [0.2921, 0.117], [0.2383, 0.1265], [0.2056, 0.1395], [0.1534, 0.1827],
    [0.1306, 0.2247], [0.1193, 0.2708], [0.1166, 0.3243], [0.1239, 0.394], [0.1434, 0.4773],
    [0.1627, 0.5292], [0.1902, 0.5835], [0.2289, 0.6357], [0.2826, 0.6766], [0.3536, 0.6984],
    [0.684, 0.7012], [0.7088, 0.8177], [0.3856, 0.8175], [0.3308, 0.8128], [0.2433, 0.787],
    [0.1997, 0.7625], [0.1579, 0.7291], [0.1192, 0.6861], [0.0702, 0.6096], [0.0438, 0.5485],
    [0.0217, 0.4735], [0.0047, 0.384], [0.0, 0.314], [0.0071, 0.236], [0.0278, 0.1685],
    [0.0656, 0.1059], [0.1152, 0.0588], [0.1916, 0.0193], [0.2713, 0.002], [1.1032, 0.0005],
    [1.1867, 0.0087], [1.2653, 0.0333], [1.3292, 0.073], [1.3978, 0.1479], [1.4551, 0.2552],
    [1.491, 0.36], [1.5252, 0.5128], [1.5385, 0.6404], [1.5292, 0.7626]
  ],
  // the inner band
  [
    [1.0346, 0.7223], [1.2302, 0.7212], [1.2492, 0.7127], [1.2575, 0.6969], [1.2547, 0.6],
    [1.2235, 0.4444], [1.1854, 0.3358], [1.148, 0.2862], [1.1033, 0.2775], [0.332, 0.2775],
    [0.2959, 0.2824], [0.2842, 0.2921], [0.2794, 0.3083], [0.2904, 0.4061], [0.3151, 0.4778],
    [0.3479, 0.5232], [0.3954, 0.5394], [0.6498, 0.54], [0.6745, 0.6565], [0.3954, 0.6561],
    [0.3334, 0.6454], [0.2843, 0.621], [0.2468, 0.5863], [0.2094, 0.5272], [0.1848, 0.4649],
    [0.1646, 0.3569], [0.1653, 0.2811], [0.1833, 0.2276], [0.2038, 0.201], [0.2351, 0.1788],
    [0.2683, 0.1671], [0.3163, 0.1613], [1.1113, 0.1612], [1.166, 0.1683], [1.2043, 0.1842],
    [1.237, 0.2089], [1.2744, 0.2562], [1.2984, 0.3027], [1.327, 0.3826], [1.3534, 0.4878],
    [1.3728, 0.6062], [1.3751, 0.6862], [1.3665, 0.739], [1.3513, 0.7751], [1.3268, 0.8053],
    [1.3022, 0.8223], [1.269, 0.8342], [0.9403, 0.8388], [0.8349, 0.3431], [0.9539, 0.3431]
  ],
  // the hacek
  [
    [0.757, 0.9998], [0.2445, 0.9998], [0.2198, 0.8834], [0.6186, 0.8834], [0.6597, 0.8884],
    [0.6919, 0.9016], [0.7162, 0.9202], [0.7455, 0.963]
  ],
];

type P = readonly [number, number];

function cross(o: P, a: P, b: P): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/**
 * Ear-clipping triangulation of a simple counter-clockwise polygon: the
 * triangles as index triples into `poly`. Deterministic; O(n^2), fine for the
 * few dozen points of an outline.
 */
export function triangulate(poly: ReadonlyArray<P>): number[] {
  const idx = poly.map((_, i) => i);
  const out: number[] = [];
  while (idx.length > 3) {
    let clipped = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length]!;
      const i1 = idx[k]!;
      const i2 = idx[(k + 1) % idx.length]!;
      const [a, b, c] = [poly[i0]!, poly[i1]!, poly[i2]!];
      if (cross(a, b, c) <= 1e-12) continue; // reflex or flat
      let inside = false;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        const p = poly[j]!;
        if (cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0) {
          inside = true;
          break;
        }
      }
      if (inside) continue;
      out.push(i0, i1, i2);
      idx.splice(k, 1);
      clipped = true;
      break;
    }
    if (!clipped) throw new Error("triangulate: not a simple counter-clockwise polygon");
  }
  out.push(idx[0]!, idx[1]!, idx[2]!);
  return out;
}
