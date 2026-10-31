// What the site's passenger view takes from a structure preview (docs/models/previews.md,
// "Passenger view hints"): the passenger's eye height and, on a railway station page,
// its tracks. A preview sets them on the MeshBuilder it returns (setPassenger); the
// design's JS model then carries them as the group's userData.passenger (jsModel.ts
// adds the line to the bundle of a design that sets them, so no other bundle grows).
// The GLB and the thumbnails do not carry them.
//
// No imports: bundled into the JS model of a preview that uses it.

/** One track of a railway station preview, in the model's own (lifted) coordinates. */
export interface PassengerTrack {
  /** The track's centreline. */
  x: number;
  /** Where the track starts and ends along z. */
  z0: number;
  z1: number;
  /** The rail top's height. */
  top: number;
}

/**
 * The passenger's eye above the walkable surface (model units; a preview is drawn in
 * studs, where a passenger's eye is 2.55 up), and a railway station's tracks, along
 * which the viewer lays its parked-train and catenary overlays.
 */
export interface PassengerHints {
  eye: number;
  tracks?: PassengerTrack[];
}

const hints = new WeakMap<object, PassengerHints>();

/** Sets a builder's passenger hints: a copy, so the caller's object may change after. */
export function setPassenger(builder: object, h: PassengerHints): void {
  if (!(h.eye > 0) || (h.tracks ?? []).some((t) => ![t.x, t.z0, t.z1, t.top].every(Number.isFinite))) throw new Error("setPassenger(): bad hints");
  hints.set(builder, { eye: h.eye, ...(h.tracks ? { tracks: h.tracks.map((t) => ({ x: t.x, z0: t.z0, z1: t.z1, top: t.top })) } : {}) });
}

/** A builder's passenger hints, or null when the design set none. */
export function passengerOf(builder: object): PassengerHints | null {
  return hints.get(builder) ?? null;
}
