// The line decoration kinds (docs/models/sets.md): what runs along a stretch of
// railway or road -- a tree alley, a noise wall, a fence, a guardrail, an alpine
// gallery. Each kind is an ENVELOPE (`TYPE_META`: how far apart its modules stand,
// how far from the way, how tall, which ways and sides it takes, what it stands on)
// and a function that draws one module of it (`buildPiece`). The game decides where
// a decoration may stand -- the corridor, the clearance against everything near it,
// the terrain -- and batches what the function draws; a tree alley's trees are the
// game's woods.
//
// Pure data and functions, no imports: bundled into export/sets/decoration.js.

export type DecorationMaterial = "concrete" | "wall" | "metal";
export type DecorationSide = "left" | "right" | "both" | "none";

/** One kind's envelope: what the game's placement reserves room for. */
export interface DecorationEnvelope {
  /** Studs between the modules a stretch is cut into. */
  spacing: number;
  /**
   * What the decoration stands on: "ground" beside the way, "shoulder" -- bolted to a
   * road's shoulder strip, riding the deck -- or "corridor", spanning the whole way.
   */
  anchor: "ground" | "shoulder" | "corridor";
  /** Clearance from the way's edge (a tree alley: its crown's radius plus `margin`, at least `minMargin`). */
  margin: number;
  minMargin?: number;
  /** Height above what it stands on; a tree alley's is its crown's, from its woods. */
  top: number | "tree";
  /** The most the ground beside the way may step from the way before the module is left out. */
  maxStep: number;
  /** The one way domain the kind may go on, or null for either. */
  domain: "rail" | "road" | null;
  /** The side states the toolbar steps through. */
  sides: DecorationSide[];
  /**
   * The cross-section numbers the game's placement shares with the drawing, so the
   * room a placement reserves is what gets built: a gallery's roof (clearance over
   * the open edge, rise toward the walled side, slab), a guardrail's beam (height,
   * beam depth, post spacing).
   */
  section?: Record<string, number>;
}

export const TYPE_META: Record<string, DecorationEnvelope> = {
  trees: { spacing: 10, anchor: "ground", margin: 3, minMargin: 6, top: "tree", maxStep: 8, domain: null, sides: ["left", "right", "both"] },
  wall: { spacing: 4, anchor: "ground", margin: 3, top: 5, maxStep: 5, domain: null, sides: ["left", "right", "both"] },
  fence: { spacing: 4, anchor: "ground", margin: 3, top: 3.2, maxStep: 5, domain: null, sides: ["left", "right", "both"] },
  guardrail: { spacing: 4, anchor: "shoulder", margin: 0, top: 1.6, maxStep: 5, domain: "road", sides: ["left", "right", "both"],
    section: { height: 1.6, beam: 0.7, postStep: 2 } },
  // the roof's CLEARANCE is its underside above the OPEN edge -- the lowest point over
  // the way, what keeps the catenary clear -- and it climbs by RISE to the walled side
  gallery: { spacing: 4, anchor: "corridor", margin: 3, top: 14 + 2.4 + 0.8, maxStep: 5, domain: null, sides: ["both", "none", "left", "right"],
    section: { clearance: 14, rise: 2.4, slab: 0.8 } },
};

const GALLERY_CLEARANCE: number = TYPE_META.gallery!.section!.clearance!;
const GALLERY_RISE: number = TYPE_META.gallery!.section!.rise!;
const GALLERY_SLAB: number = TYPE_META.gallery!.section!.slab!;
const GALLERY_PLINTH = 3;     // top of the solid side's battered base course
const GALLERY_KERB = 2.2;     // low wall the open side's pillars stand on
const GALLERY_BEAM = 1.3;     // depth of the head beam / the cornice facing it
const GALLERY_EAVE = 1.1;     // how far the slab oversails the open side
const GALLERY_EAVE_SOLID = 0.9; // ...and the solid one, clear of its cornice
const GALLERY_LIP = 0.45;     // upstand along the open eave
const GALLERY_FASCIA = 0.5;   // how far the open eave's fascia hangs below the slab
const GALLERY_HAUNCH = 1.1;   // how far the inside haunch reaches from the wall under the roof
const GALLERY_TROUGH = 0.9;   // width of the cable trough along the wall's inside foot

// the noise wall's cross-section, in studs above the ground it stands on (its top is TYPE_META.wall.top)
const WALL_PLINTH = 1.0;      // top of the concrete plinth
const WALL_PLINTH_HALF = 0.32;
const WALL_PANEL_HALF = 0.22; // the absorber cassettes' half thickness
const WALL_PANEL_TOP = 4.8;   // top of the highest cassette, under the coping
const WALL_CASSETTES = 4;     // cassettes stacked between plinth and coping
const WALL_SEAM = 0.1;        // the gap between two cassettes, showing the steel behind
const WALL_POST_TOP = 5;      // the H-posts' tops

// the guardrail's cross-section, in studs above the shoulder it is bolted to
const GUARDRAIL_HEIGHT: number = TYPE_META.guardrail!.section!.height!;
const GUARDRAIL_BEAM: number = TYPE_META.guardrail!.section!.beam!;
const GUARDRAIL_POST_STEP: number = TYPE_META.guardrail!.section!.postStep!;

/** One end of a module: a point on the way, its height and its unit tangent. */
export interface Cross { x: number; y: number; z: number; tx: number; tz: number }

/** One module as the game placed it: its two end cross-sections, how far out each side stands, and what survived the clearance test. */
export interface DecorationPiece {
  a: Cross;
  b: Cross;
  left: number;
  right: number;
  leftVisible: boolean;
  rightVisible: boolean;
  side: DecorationSide;
}

export interface DecorationContext {
  heightAt(x: number, z: number): number;
  /** "high" in the near tile (posts, members, slats); anything else is the far tile. */
  detail: string;
  /** The shoulder a guardrail is bolted to, above the way. */
  shoulderY: number;
}

/** What a module is drawn as, which the game batches. */
export interface DecorationOut {
  /**
   * A swept slab between the module's two ends, `left`..`right` across the way (a
   * lateral offset: + is left), from `bottom` to `top` at each end, each lateral
   * edge lifted by its rise.
   */
  sweep(material: DecorationMaterial, a: Cross, b: Cross, left: number, right: number,
    bottomA: number, topA: number, bottomB: number, topB: number, leftRise?: number, rightRise?: number): void;
  /** A box turned `angle` about +Y (+Z toward the way's tangent), its top sheared by `grade` along its depth. */
  box(material: DecorationMaterial, x: number, y: number, z: number, w: number, h: number, d: number, angle: number, grade?: number): void;
  /** A tree of the alley's woods, standing on the ground at (x, z). */
  tree(side: "left" | "right", x: number, z: number, ground: number): void;
}

/** Draws one module of `kind` (an unknown kind draws nothing). */
export function buildPiece(kind: string, p: DecorationPiece, ctx: DecorationContext, out: DecorationOut): void {
  const dx = p.b.x - p.a.x, dz = p.b.z - p.a.z, length = Math.hypot(dx, dz);
  if (length < 0.001) return;
  const tx = dx / length, tz = dz / length, x = (p.a.x + p.b.x) / 2, z = (p.a.z + p.b.z) / 2;
  const angle = Math.atan2(tx, tz), wayY = (p.a.y + p.b.y) / 2;
  const grade = (p.b.y - p.a.y) / length;
  const high = ctx.detail === "high";
  // One upright member of a gallery -- a pillar course, a pilaster -- as a short
  // slice of the same swept shell, so it is lit like the slabs it carries.
  const member = (at: Cross, along: number, lateral: number, half: number, bottom: number, top: number): void => {
    const a = { ...at, x: at.x - at.tx * along / 2, z: at.z - at.tz * along / 2 };
    const b = { ...at, x: at.x + at.tx * along / 2, z: at.z + at.tz * along / 2 };
    out.sweep("concrete", a, b, lateral + half, lateral - half, bottom, top, bottom, top);
  };
  for (const side of ["left", "right"] as const) {
    const distance = p[side], sx = x - tz * distance, sz = z + tx * distance;
    const visible = side === "left" ? p.leftVisible : p.rightVisible;
    const ground = ctx.heightAt(sx, sz);
    if (kind !== "gallery" && !visible) continue;
    if (kind === "trees") {
      out.tree(side, sx, sz, ground);
    } else if (kind === "wall") {
      // a highway noise barrier: a concrete plinth, absorber cassettes stacked on it
      // with a seam between each, a steel coping and an H-post at every joint
      const ga = ctx.heightAt(p.a.x - p.a.tz * distance, p.a.z + p.a.tx * distance);
      const gb = ctx.heightAt(p.b.x - p.b.tz * distance, p.b.z + p.b.tx * distance);
      const layer = (material: DecorationMaterial, half: number, bottom: number, top: number): void =>
        out.sweep(material, p.a, p.b, distance + half, distance - half, ga + bottom, ga + top, gb + bottom, gb + top);
      layer("concrete", WALL_PLINTH_HALF, -0.2, WALL_PLINTH);
      if (high) {
        // each seam is a thinner steel strip abutting the cassettes above and below,
        // so no two faces of different materials share a plane
        const step = (WALL_PANEL_TOP - WALL_PLINTH) / WALL_CASSETTES;
        for (let i = 0; i < WALL_CASSETTES; i++) {
          const bottom = WALL_PLINTH + i * step + (i ? WALL_SEAM / 2 : 0);
          const top = WALL_PLINTH + (i + 1) * step - (i < WALL_CASSETTES - 1 ? WALL_SEAM / 2 : 0);
          layer("wall", WALL_PANEL_HALF, bottom, top);
          if (i < WALL_CASSETTES - 1) layer("metal", WALL_PANEL_HALF - 0.08, top, top + WALL_SEAM);
        }
        layer("metal", WALL_PANEL_HALF + 0.06, WALL_PANEL_TOP, WALL_PANEL_TOP + 0.18);
        // the post at the module's start, stood on the ground there, its flanges proud of both faces
        const px = p.a.x - p.a.tz * distance, pz = p.a.z + p.a.tx * distance;
        out.box("metal", px, (ga - 0.2 + ga + WALL_POST_TOP) / 2, pz, WALL_PANEL_HALF * 2 + 0.24, WALL_POST_TOP + 0.2, 0.32, Math.atan2(p.a.tx, p.a.tz));
      } else layer("wall", WALL_PANEL_HALF, WALL_PLINTH, WALL_PANEL_TOP + 0.18);
    } else if (kind === "gallery") {
      // The uphill side is a wall; the valley side is a colonnade on a low kerb.
      const solid = p.side === side || p.side === "both";
      const ga = ctx.heightAt(p.a.x - p.a.tz * distance, p.a.z + p.a.tx * distance);
      const gb = ctx.heightAt(p.b.x - p.b.tz * distance, p.b.z + p.b.tx * distance);
      const rise = solid ? GALLERY_RISE : 0;
      const soffitA = p.a.y + GALLERY_CLEARANCE + rise, soffitB = p.b.y + GALLERY_CLEARANCE + rise;
      const sign = side === "left" ? 1 : -1;
      if (solid) {
        // flush on the inside, articulated outside: a battered base course, a
        // cornice under the slab and a stepped counterfort every module
        const inner = distance - sign * 0.35;
        const course = (outward: number, bottomA: number, topA: number, bottomB: number, topB: number): void => {
          const outer = distance + sign * outward;
          out.sweep("concrete", p.a, p.b, Math.max(outer, inner), Math.min(outer, inner), bottomA, topA, bottomB, topB);
        };
        course(0.8, ga - 0.2, p.a.y + GALLERY_PLINTH, gb - 0.2, p.b.y + GALLERY_PLINTH);
        course(0.35, p.a.y + GALLERY_PLINTH, soffitA, p.b.y + GALLERY_PLINTH, soffitB);
        course(0.7, soffitA - GALLERY_BEAM, soffitA, soffitB - GALLERY_BEAM, soffitB);
        if (high) {
          const top = wayY + GALLERY_CLEARANCE + rise, here = { x, y: wayY, z, tx, tz };
          const third = (top - GALLERY_BEAM - wayY - GALLERY_PLINTH) / 3;
          const foot = wayY + GALLERY_PLINTH;
          // the counterfort steps in as it climbs: wide at the foot, slender under the cornice
          member(here, 1.4, distance + sign * 1.0, 0.65, ground - 0.2, foot + third);
          member(here, 1.2, distance + sign * 0.8, 0.45, foot + third, foot + 2 * third);
          member(here, 1.0, distance + sign * 0.6, 0.25, foot + 2 * third, top - GALLERY_BEAM);
          // inside: a haunch where the wall meets the roof, and a cable trough at its foot
          const face = distance - sign * 0.35, haunchIn = face - sign * GALLERY_HAUNCH;
          // a sheared course, low at the wall and lifted to the roof's underside toward the way
          const roadRise = GALLERY_HAUNCH * 0.9;
          out.sweep("concrete", p.a, p.b, Math.max(face, haunchIn), Math.min(face, haunchIn),
            soffitA - roadRise - 0.1, soffitA - roadRise + 0.45, soffitB - roadRise - 0.1, soffitB - roadRise + 0.45,
            sign > 0 ? 0 : roadRise, sign > 0 ? roadRise : 0);
          const trough = face - sign * GALLERY_TROUGH;
          out.sweep("concrete", p.a, p.b, Math.max(face, trough), Math.min(face, trough),
            Math.min(ga, p.a.y) - 0.2, p.a.y + 0.7, Math.min(gb, p.b.y) - 0.2, p.b.y + 0.7);
        }
      } else {
        out.sweep("concrete", p.a, p.b, distance + 0.35, distance - 0.35, ga - 0.2, p.a.y + GALLERY_KERB, gb - 0.2, p.b.y + GALLERY_KERB);
        out.sweep("concrete", p.a, p.b, distance + 0.5, distance - 0.5, soffitA - GALLERY_BEAM, soffitA, soffitB - GALLERY_BEAM, soffitB);
        const foot = wayY + GALLERY_KERB, head = wayY + GALLERY_CLEARANCE - GALLERY_BEAM, here = { x, y: wayY, z, tx, tz };
        if (high) {
          member(here, 1.7, distance, 0.6, foot, foot + 0.5);  // splayed base
          member(here, 1.2, distance, 0.45, foot, head);       // shaft
          // the haunches step out under the head beam, so every bay reads as an arched opening
          member(here, 1.9, distance, 0.42, head - 1.6, head - 0.9);
          member(here, 2.6, distance, 0.42, head - 0.9, head - 0.4);
          member(here, 3.2, distance, 0.42, head - 0.4, head);
        } else member(here, 1.2, distance, 0.45, foot, head); // the far level keeps its pillars: no floating roof
      }
    } else if (kind === "guardrail") {
      // a steel W-beam on posts, bolted to the road's shoulder, never the ground
      const footA = p.a.y + ctx.shoulderY, footB = p.b.y + ctx.shoulderY;
      const beam = (half: number, bottom: number, top: number): void =>
        out.sweep("metal", p.a, p.b, distance + half, distance - half, footA + bottom, footA + top, footB + bottom, footB + top);
      beam(0.14, GUARDRAIL_HEIGHT - GUARDRAIL_BEAM, GUARDRAIL_HEIGHT);
      // the rib down the middle of the face: what makes it read as a W-beam
      beam(0.24, GUARDRAIL_HEIGHT - GUARDRAIL_BEAM * 0.65, GUARDRAIL_HEIGHT - GUARDRAIL_BEAM * 0.35);
      if (high) {
        const post = GUARDRAIL_HEIGHT - GUARDRAIL_BEAM + 0.3;
        // stationed along the very line the beam is swept along, so every post meets it
        const ax = p.a.x - p.a.tz * distance, az = p.a.z + p.a.tx * distance;
        const bx = p.b.x - p.b.tz * distance, bz = p.b.z + p.b.tx * distance;
        const steps = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / GUARDRAIL_POST_STEP));
        for (let i = 0; i < steps; i++) {
          const f = (i + 0.5) / steps;
          out.box("metal", ax + (bx - ax) * f, footA + (footB - footA) * f + post / 2, az + (bz - az) * f, 0.3, post, 0.3, angle);
        }
      }
    } else if (kind === "fence") {
      if (high) {
        out.box("metal", sx, ground + 1.6, sz, 0.18, 3.2, 0.18, angle);
        for (let y = 0.5; y <= 3; y += 0.5) out.box("metal", sx, ground + y, sz, 0.045, 0.045, length + 0.05, angle, grade);
        for (let u = -length / 2; u < length / 2; u += 0.5) out.box("metal", sx + tx * u, ground + 1.7 + grade * u, sz + tz * u, 0.045, 2.6, 0.045, angle);
      } else out.box("metal", sx, ground + 2.9, sz, 0.1, 0.15, length, angle, grade);
    }
  }
  if (kind === "gallery") {
    // one slab across the corridor, tilted up towards the walled side so a slide
    // runs off the open edge, which it oversails as an eave with a lip
    const walled = (side: "left" | "right"): boolean => p.side === side || p.side === "both";
    const leftRise = walled("left") ? GALLERY_RISE : 0;
    const rightRise = walled("right") ? GALLERY_RISE : 0;
    const outerLeft = p.left + (leftRise ? GALLERY_EAVE_SOLID : GALLERY_EAVE);
    const outerRight = p.right - (rightRise ? GALLERY_EAVE_SOLID : GALLERY_EAVE);
    const soffitA = p.a.y + GALLERY_CLEARANCE, soffitB = p.b.y + GALLERY_CLEARANCE;
    out.sweep("concrete", p.a, p.b, outerLeft, outerRight, soffitA, soffitA + GALLERY_SLAB, soffitB, soffitB + GALLERY_SLAB, leftRise, rightRise);
    // the open eave's fascia hangs below the slab, giving the roof its thick edge
    if (!leftRise) out.sweep("concrete", p.a, p.b, outerLeft, outerLeft - 0.35,
      soffitA - GALLERY_FASCIA, soffitA + 0.01, soffitB - GALLERY_FASCIA, soffitB + 0.01);
    if (!rightRise) out.sweep("concrete", p.a, p.b, outerRight + 0.35, outerRight,
      soffitA - GALLERY_FASCIA, soffitA + 0.01, soffitB - GALLERY_FASCIA, soffitB + 0.01);
    if (!leftRise) out.sweep("concrete", p.a, p.b, outerLeft, outerLeft - 0.5,
      soffitA + GALLERY_SLAB, soffitA + GALLERY_SLAB + GALLERY_LIP, soffitB + GALLERY_SLAB, soffitB + GALLERY_SLAB + GALLERY_LIP);
    if (!rightRise) out.sweep("concrete", p.a, p.b, outerRight + 0.5, outerRight,
      soffitA + GALLERY_SLAB, soffitA + GALLERY_SLAB + GALLERY_LIP, soffitB + GALLERY_SLAB, soffitB + GALLERY_SLAB + GALLERY_LIP);
  }
}
