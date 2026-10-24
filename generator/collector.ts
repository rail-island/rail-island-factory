// The heights every raised pantograph reaches: the top of its collector strips
// over the railhead (y = 0), in metres. The game hangs one contact wire over every
// electrified railway and one trolley wire over every tram track, and a collector
// must touch it, so these are the game's wires and not the prototypes' own
// (docs/models/animation.md, "Collector heights").

/**
 * A railway vehicle's raised collector top: the underside of the game's contact
 * wire, 8.86 studs over the railhead at its centre, 0.08 studs thick, at the
 * game's 1.5 studs a metre -- (8.86 - 0.04) / 1.5 = 5.88 m.
 */
export const RAIL_COLLECTOR_TOP = 5.88;

/** A tram's raised collector top; the game hangs its trolley wire on it. */
export const TRAM_COLLECTOR_TOP = 5.5;
