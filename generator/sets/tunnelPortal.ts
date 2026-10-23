// The tunnel portal styles (docs/models/sets.md): the masonry face a tunnel shows at
// each mouth, as a function of the bore's half-width. The game keeps the bore -- its
// oval, the lining, the ribs, the floor along the path, the cover that closes the
// hill over it -- and places the portal at each end; the bore's cross-section comes
// in as `bore`, so a portal always meets the tube it fronts.
//
// Pure data and functions, no imports: bundled into export/sets/tunnelPortal.js.

export type PortalMaterial = "floor" | "portal" | "trim" | "shadow" | "lining" | "rib";

/** One box of a portal in the mouth's frame: x across, y up from the rail, z into the hill. */
export interface PortalBox {
  ox: number; oy: number; oz: number;
  /** Turn about the box's own Z (radians). */
  roll: number;
  sx: number; sy: number; sz: number;
  material: PortalMaterial;
}

/** The bore the portal fronts, in the mouth's frame. */
export interface PortalBore {
  /** The oval's centre height and vertical radius. */
  centerY: number;
  verticalRadius: number;
  /** How far the bore's floor lies below the rail. */
  floorDrop: number;
  /** The clear height a train needs. */
  clearHeight: number;
  /** The track bed's centre height and thickness. */
  bedY: number;
  bedThickness: number;
  /** How many chords the oval is drawn with. */
  segments: number;
  /** How far past the bore wall the masonry must reach to seal the cut. */
  wingReach: number;
}

/** Per style: how deep the portal runs into the hill (the game reads it to place the bore behind it). */
export const TYPE_META: Record<string, { length: number }> = {
  stone: { length: 12 },
};

const FACE_WIDTH = 16;
const ARCH_THICKNESS = 1.2;
const SPANDREL_STRIPS = 10;

function ovalPoint(theta: number, halfWidth: number, bore: PortalBore): { x: number; y: number } {
  return { x: Math.cos(theta) * halfWidth, y: bore.centerY + Math.sin(theta) * bore.verticalRadius };
}

/** The masonry ring round the mouth: one box per chord of the bore's oval. */
function ovalRing(out: PortalBox[], z: number, thickness: number, depth: number, material: PortalMaterial, halfWidth: number, bore: PortalBore): void {
  for (let i = 1; i <= bore.segments; i++) {
    const a = (Math.PI * 2 * (i - 1)) / bore.segments;
    const b = (Math.PI * 2 * i) / bore.segments;
    const p0 = ovalPoint(a, halfWidth, bore);
    const p1 = ovalPoint(b, halfWidth, bore);
    const chord = Math.hypot(p1.x - p0.x, p1.y - p0.y) + 0.08;
    out.push({ ox: (p0.x + p1.x) / 2, oy: (p0.y + p1.y) / 2, oz: z, roll: Math.atan2(p1.y - p0.y, p1.x - p0.x), sx: chord, sy: thickness, sz: depth, material });
  }
}

/**
 * Every box of a `style` portal fronting a bore `halfWidth` wide: the floor under
 * the mouth, the face either side and over the arch, the spandrel strips filling the
 * arch's shoulders, the coping and quoins, the shadow lines inside the mouth and the
 * arch ring. An unknown style builds as stone.
 */
export function buildPortal(style: string, halfWidth: number, bore: PortalBore): PortalBox[] {
  const out: PortalBox[] = [];
  const pl = (TYPE_META[style] ?? TYPE_META.stone!).length;
  const faceHeight = bore.clearHeight + bore.floorDrop + 3;
  const faceY = faceHeight / 2 - bore.floorDrop;
  const ovalTop = bore.centerY + bore.verticalRadius;
  const faceTop = faceHeight - bore.floorDrop;
  const headerHeight = Math.max(0.2, faceTop - ovalTop);
  // wide enough to stand behind every cell the cut opens at the mouth, so the
  // masonry seals the portal opening
  const faceWidth = Math.max(FACE_WIDTH, (halfWidth + bore.wingReach) * 2);
  const sideWidth = Math.max(0.2, (faceWidth - halfWidth * 2) / 2);
  const box = (ox: number, oy: number, oz: number, sx: number, sy: number, sz: number, material: PortalMaterial): void => {
    out.push({ ox, oy, oz, roll: 0, sx, sy, sz, material });
  };
  box(0, bore.bedY, pl / 2, halfWidth * 1.55, bore.bedThickness, pl, "floor");
  box(-(faceWidth + halfWidth * 2) / 4, faceY, pl / 2, sideWidth, faceHeight, pl, "portal");
  box((faceWidth + halfWidth * 2) / 4, faceY, pl / 2, sideWidth, faceHeight, pl, "portal");
  box(0, ovalTop + headerHeight / 2, pl / 2, halfWidth * 2, headerHeight, pl, "portal");
  const stripWidth = (halfWidth * 2) / SPANDREL_STRIPS;
  for (let i = 1; i <= SPANDREL_STRIPS; i++) {
    const x = -halfWidth + (i - 0.5) * stripWidth;
    const nx = Math.min(Math.max(Math.abs(x) / Math.max(halfWidth, 0.001), 0), 1);
    const archY = bore.centerY + bore.verticalRadius * Math.sqrt(Math.max(0, 1 - nx * nx));
    const fillHeight = ovalTop - archY;
    if (fillHeight > 0.08) box(x, archY + fillHeight / 2, pl / 2, stripWidth + 0.08, fillHeight, pl, "portal");
  }
  box(0, faceTop + 0.25, pl / 2, faceWidth + 0.6, 0.5, pl + 0.4, "trim");
  box(-faceWidth / 2 - 0.25, faceY, pl / 2, 0.5, faceHeight + 0.5, pl + 0.25, "trim");
  box(faceWidth / 2 + 0.25, faceY, pl / 2, 0.5, faceHeight + 0.5, pl + 0.25, "trim");
  box(-halfWidth + 0.22, bore.clearHeight / 2 - 0.8, pl + 0.05, 0.22, bore.clearHeight + 1, 0.18, "shadow");
  box(halfWidth - 0.22, bore.clearHeight / 2 - 0.8, pl + 0.05, 0.22, bore.clearHeight + 1, 0.18, "shadow");
  box(0, ovalTop - 0.15, pl + 0.05, halfWidth * 2 - 1, 0.22, 0.18, "shadow");
  ovalRing(out, pl / 2 + 0.1, ARCH_THICKNESS, pl + 0.25, "trim", halfWidth, bore);
  return out;
}
