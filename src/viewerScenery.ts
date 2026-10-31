// What the viewer draws around a road or rail vehicle (CatalogRecord.scenery,
// docs/site/catalog-site.md): the way it stands on and, over an electric vehicle,
// the game's wire -- so a design's wheels can be checked against the rails and its
// raised collector against the wire it must touch. A rail vehicle stands on a
// ballasted track, a tram on a narrow asphalt road with its track embedded, a road
// vehicle on the game's narrow asphalt road. Every model's y = 0 is its running
// surface (the railhead, the road), so the scenery is laid out from there; it runs
// along x, past both ends of the model.
//
// A character (a walking avatar) stands on a strip of grass with a paved path
// along x, its walking direction, beside a marker pole as tall as the game's
// vehicle doors (2 m), banded every quarter metre with a tick each half metre and
// a crossbar at the top, so its height reads against the scale the game expects.
// The pole is scenery, not model: never picked, highlighted or counted.
//
// The measures are the game's (its narrow road is 8 studs wide at 1.5 studs a
// metre), the track's gauge the models' standard 1.435 m. The wire's height comes
// with the record: generator/collector.ts, the one height every collector reaches.

import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, type Box3 } from "three";
import type { Scenery } from "./catalogQuery";

/** Past each end of the model, metres. */
const MARGIN = 8;
const GAUGE = 1.435;
const RAIL = { width: 0.07, height: 0.15 };
const SLEEPER = { spacing: 0.6, length: 2.6, width: 0.25, height: 0.18 };
/** The ballast bed: its top across, its foot across and its foot's depth below the railhead. */
const BED = { top: 3.4, foot: 5.0, y: -0.75 };
/** The game's narrow road: 8 studs across, of which 1.4 studs of kerb either side. */
const ROAD = { width: 8 / 1.5, kerb: 1.4 / 1.5, depth: 0.3 };
/** The wire: its thickness, the messenger's height over the contact wire (railway), mast spacing and offset. */
const WIRE = { thick: 0.05, messenger: 1.16, spacing: 25, offset: 4 / 1.5 };

/** A character's ground: past each end, its width, the path's width; and the marker pole beside the figure. */
const GROUND = { margin: 3, width: 4, path: 1.4, depth: 0.2 };
const MARKER = { x: 0.6, z: -0.85, thick: 0.05, band: 0.25, tick: 0.5 };

const COLORS = {
  grass: 0x5d8a3a, paving: 0x9a958b, markerRed: 0xc8322d, markerWhite: 0xeeeeea,
  rail: 0x787882, sleeper: 0xb4b0a8, ballast: 0xa8a096, asphalt: 0x3c3c40, kerb: 0x9b9b96, wire: 0x3c3c41, mast: 0x5a692d,
};

/** An axis-aligned box from its two corners. */
function box(group: Group, mat: MeshStandardMaterial, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const mesh = new Mesh(new BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  group.add(mesh);
}

/** A prism along x of the (z, y) section `ring`, from x0 to x1: its sides only (a bed seen from above and the sides). */
function prismX(group: Group, mat: MeshStandardMaterial, ring: ReadonlyArray<readonly [number, number]>, x0: number, x1: number): void {
  const pos: number[] = [];
  for (let i = 0; i < ring.length; i++) {
    const [za, ya] = ring[i]!;
    const [zb, yb] = ring[(i + 1) % ring.length]!;
    pos.push(x0, ya, za, x1, ya, za, x1, yb, zb, x0, ya, za, x1, yb, zb, x0, yb, zb);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  group.add(new Mesh(geo, mat));
}

/** The masts or poles along x0..x1, every WIRE.spacing and at both ends. */
function supports(x0: number, x1: number): number[] {
  const n = Math.max(1, Math.ceil((x1 - x0 - 2) / WIRE.spacing));
  return Array.from({ length: n + 1 }, (_, i) => x0 + 1 + ((x1 - x0 - 2) * i) / n);
}

/**
 * The scenery around a model whose bounding box is `bounds`: a group to add beside
 * it, and a dispose for its geometries and materials.
 */
export function buildScenery(scenery: Scenery, bounds: Box3): { group: Group; dispose: () => void } {
  const group = new Group();
  group.name = "scenery";
  const mats = new Map<string, MeshStandardMaterial>();
  const mat = (name: keyof typeof COLORS): MeshStandardMaterial => {
    let m = mats.get(name);
    if (!m) mats.set(name, (m = new MeshStandardMaterial({ color: COLORS[name], roughness: name === "rail" || name === "wire" ? 0.5 : 0.95, metalness: name === "rail" ? 0.4 : 0 })));
    return m;
  };
  const margin = scenery.way === "ground" ? GROUND.margin : MARGIN;
  const x0 = Math.min(bounds.min.x, 0) - margin;
  const x1 = Math.max(bounds.max.x, 0) + margin;
  const rails = (y0: number) => {
    for (const s of [-1, 1]) box(group, mat("rail"), x0, x1, y0, 0, s * (GAUGE / 2) - (s < 0 ? RAIL.width : 0), s * (GAUGE / 2) + (s > 0 ? RAIL.width : 0));
  };
  if (scenery.way === "ground") {
    // the path's surface at the feet, the grass a centimetre under it, so no two faces share a plane
    const [hw, hp] = [GROUND.width / 2, GROUND.path / 2];
    box(group, mat("paving"), x0, x1, -GROUND.depth, 0, -hp, hp);
    for (const s of [-1, 1]) box(group, mat("grass"), x0, x1, -GROUND.depth, -0.01, s > 0 ? hp : -hw, s > 0 ? hw : -hp);
  } else if (scenery.way === "rail") {
    rails(-RAIL.height);
    const top = -RAIL.height;
    for (let x = x0 + SLEEPER.spacing / 2; x < x1; x += SLEEPER.spacing)
      box(group, mat("sleeper"), x - SLEEPER.width / 2, x + SLEEPER.width / 2, top - SLEEPER.height, top, -SLEEPER.length / 2, SLEEPER.length / 2);
    const bedTop = top - SLEEPER.height * 0.6;
    prismX(group, mat("ballast"), [[BED.foot / 2, BED.y], [BED.top / 2, bedTop], [-BED.top / 2, bedTop], [-BED.foot / 2, BED.y]], x0, x1);
  } else {
    // the road: carriageway and kerbs, its surface at the running plane
    const half = ROAD.width / 2;
    box(group, mat("asphalt"), x0, x1, -ROAD.depth, 0, -half + ROAD.kerb, half - ROAD.kerb);
    for (const s of [-1, 1]) box(group, mat("kerb"), x0, x1, -ROAD.depth, -0.1, s > 0 ? half - ROAD.kerb : -half, s > 0 ? half : -half + ROAD.kerb);
    // a tram's track, embedded flush in the road
    if (scenery.way === "tram") rails(-0.02);
  }
  if (scenery.marker !== undefined) {
    const h = scenery.marker;
    const { x, z, thick: t, band, tick } = MARKER;
    for (let k = 0, y = 0; y < h - 1e-6; k++, y += band) {
      box(group, mat(k % 2 ? "markerWhite" : "markerRed"), x - t / 2, x + t / 2, y, Math.min(h, y + band), z - t / 2, z + t / 2);
    }
    // a tick every half metre (longer each metre), and the crossbar at the door's head
    for (let y = tick; y < h - 1e-6; y += tick) {
      const reach = Math.abs(y - Math.round(y)) < 1e-6 ? 0.16 : 0.1;
      box(group, mat("markerWhite"), x - 0.01, x + 0.01, y - 0.01, y + 0.01, z + t / 2, z + t / 2 + reach);
    }
    box(group, mat("markerRed"), x - 0.03, x + 0.03, h, h + 0.04, z - 0.3, z + 0.3);
  }
  const top = scenery.wireTop;
  if (top !== undefined) {
    const wire = mat("wire");
    const w = WIRE.thick / 2;
    // the contact (or trolley) wire, its underside at the collectors' top
    box(group, wire, x0, x1, top, top + WIRE.thick, -w, w);
    const railway = scenery.way === "rail";
    const messenger = top + WIRE.messenger;
    if (railway) box(group, wire, x0, x1, messenger, messenger + WIRE.thick, -w, w);
    const z = railway ? WIRE.offset : ROAD.width / 2 + 0.3;
    for (const x of supports(x0, x1)) {
      const head = (railway ? messenger : top) + 0.5;
      box(group, mat("mast"), x - 0.1, x + 0.1, railway ? BED.y : -ROAD.depth, head, z - 0.1, z + 0.1);
      // the arm out over the track, and a dropper down to the wire it carries
      const armY = railway ? messenger + 0.25 : top + 0.35;
      box(group, mat("mast"), x - 0.04, x + 0.04, armY - 0.04, armY + 0.04, -0.1, z);
      box(group, wire, x - w, x + w, top + WIRE.thick, armY - 0.04, -w, w);
    }
  }
  return {
    group,
    dispose: () => {
      group.traverse((o) => (o as Mesh).geometry?.dispose());
      for (const m of mats.values()) m.dispose();
    },
  };
}
