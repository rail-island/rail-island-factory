// The loading gauges a rail vehicle is drawn to: the largest body a design may
// have, across and above the rail. Most of the factory's vehicles are European
// and keep the repository's 3.1 m by 4.7 m ("uic"); North American stock is
// drawn at its real, larger size ("us") and the Shinkansen at 3.3 m, narrowed
// from its real 3.35 - 3.38 m so it clears the game's platform edge
// ("shinkansen"). No `node:` imports. See docs/models/loading-gauge.md.

/** The loading gauge a design names (`ProceduralDesign.loadingGauge`). */
export type LoadingGauge = "uic" | "us" | "shinkansen";

export interface LoadingGaugeLimits {
  /** Body width, metres: the widest fixed part, centred on the track. */
  width: number;
  /** Height above the rail of the body and its fixed roof equipment, metres (a raised collector is checked on its own). */
  height: number;
}

export const LOADING_GAUGES: Readonly<Record<LoadingGauge, LoadingGaugeLimits>> = {
  uic: { width: 3.1, height: 4.7 },
  // AAR Plate F (3.25 m, 4.80 m) with the taller Plate H of the newest hood units
  // and the Superliner; 3.3 m is what the platform edge leaves room for
  us: { width: 3.3, height: 4.95 },
  shinkansen: { width: 3.3, height: 4.7 },
};

/** The limits a design is held to: its own gauge, the UIC one when it names none. */
export function loadingGaugeOf(d: { loadingGauge?: LoadingGauge }): LoadingGaugeLimits {
  return LOADING_GAUGES[d.loadingGauge ?? "uic"];
}
