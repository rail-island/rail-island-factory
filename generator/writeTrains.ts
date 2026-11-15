// Render the train parade (trainParade.ts) into the export: one side PNG per
// distinct car in export/trains/, and export/trains.json, which railisland.com
// reads in the browser (docs/site/train-parade.md). Part of `pnpm build`, after
// build:models; the images are generated on every build and never committed or
// cached in build-cache/.
//
//   pnpm build:trains

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { isSideViewCategory } from "./catalog.ts";
import { DESIGNS, EXPORT_DIR, designGlb } from "./generate.ts";
import type { Tri, Vec3 } from "./glbTriangles.ts";
import { dot, norm, triBounds } from "./glbTriangles.ts";
import { OPENTTD_TABLE } from "./openttdTable.ts";
import { SIDE_BOTTOM_M, SIDE_MARGIN_M, SIDE_PX_PER_M, SIDE_TOP_M, rasterize, readTriangles, sideFrame } from "./renderGlbThumb.ts";
import {
  TRAIN_PARADE, carImageName, carKey, carSections, fleetStats, layOutTrain, resolveTrains,
  type TrainCar, type TrainContext, type TrainSpec, type TrainsFile,
} from "./trainParade.ts";

const CONFIRMED = new Set<string>(
  (JSON.parse(fs.readFileSync(fileURLToPath(new URL("./catalogModels.json", import.meta.url)), "utf8")) as { ids: string[] }).ids,
);

/** The factory as trainParade.ts sees it: the designs, the confirmed list, the OpenTTD table. */
export const FACTORY_TRAIN_CONTEXT: TrainContext = {
  model(id) {
    const d = DESIGNS.get(id);
    if (!d || !d.catalog) return undefined;
    return { category: d.catalog.category, params: d.params, openttd: d.openttd ?? OPENTTD_TABLE[id] };
  },
  confirmed: (id) => CONFIRMED.has(id),
  isSideView: isSideViewCategory,
};

// The side view's supersampling and light, as renderGlbThumb.ts draws its side
// thumbnails (SS, SIDE_AMBIENT, SIDE_KEY, SIDE_KEY_DIR there). They are repeated
// here, not imported, because renderGlbThumb.ts is an input of every design's build
// cache key (buildCache.ts): touching it rebuilds the whole cache. test/trainParade.test.ts
// checks that renderSide draws a car exactly as renderGlbSideThumb does.
const SS = 3;
const SIDE_AMBIENT = 1.2 / Math.PI;
const SIDE_KEY = 1.5 / Math.PI;
const SIDE_KEY_DIR = norm([-0.4, 1, -1.2]);

/**
 * The side view of `tris` (renderGlbSideThumb's, for triangles already read and
 * moved), framed on the stretch `xRange` of the model when given: metres along X,
 * plus the margins. A section of a whole articulated train is drawn so.
 */
export function renderSide(tris: Tri[], xRange?: readonly [number, number]): PNG {
  const { min, max } = triBounds(tris);
  const [x0, x1] = xRange ?? [min[0], max[0]];
  const f = sideFrame(x0, x1);
  const right = x1 + SIDE_MARGIN_M; // the nose's end of the frame, drawn at the left edge
  const k = f.pxPerM * SS;
  const camZ = min[2] - 100;
  const eyeDir: Vec3 = [0, 0, -1];
  return rasterize(
    tris,
    f.width,
    f.height,
    (p) => ({ x: (right - p[0]) * k, y: (SIDE_TOP_M - p[1]) * k, w: p[2] - camZ }),
    false,
    () => eyeDir,
    (n) => SIDE_AMBIENT + SIDE_KEY * Math.max(0, dot(n, SIDE_KEY_DIR)),
  );
}

const turn = (v: Vec3): Vec3 => [-v[0], v[1], -v[2]];

/** A car's triangles turned half round about the vertical axis: seen from the same side, its nose is on the right. */
export function turnedRound(tris: Tri[]): Tri[] {
  return tris.map((t) => ({ ...t, p: t.p.map(turn) as Tri["p"], n: t.n.map(turn) as Tri["n"] }));
}

/** A car's triangles as the parade draws it: built with its values, turned round when it runs backwards. */
export function carTriangles(car: TrainCar): Tri[] {
  const tris = readTriangles(designGlb(car.model, car.params));
  return car.turned ? turnedRound(tris) : tris;
}

/** A car's length along the track: its built extent along X, buffers and couplers included. */
export function carLength(tris: Tri[]): number {
  const { min, max } = triBounds(tris);
  return max[0] - min[0];
}

/**
 * Build and render every distinct car of `list`, write the images into
 * `<dir>/trains/` (that folder is replaced) and `<dir>/trains.json`. Returns the file.
 */
export function writeTrains(list: readonly TrainSpec[] = TRAIN_PARADE, dir = EXPORT_DIR, log: (s: string) => void = () => {}): TrainsFile {
  const trains = resolveTrains(list, FACTORY_TRAIN_CONTEXT);
  const outDir = path.join(dir, "trains");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const lengths = new Map<string, number>();
  for (const car of trains.flatMap((t) => t.cars)) {
    const key = carKey(car);
    if (lengths.has(key)) continue;
    const tris = carTriangles(car);
    const { min, max } = triBounds(tris);
    const sections = carSections(max[0] - min[0]);
    sections.forEach(([s0, s1], i) => {
      // a section from s0 to s1 metres behind the nose, which is at max X
      const range: [number, number] = sections.length > 1 ? [max[0] - s1, max[0] - s0] : [min[0], max[0]];
      if (sideFrame(range[0], range[1]).pxPerM !== SIDE_PX_PER_M) throw new Error(`${key}: too long for the parade's scale`);
      const png = renderSide(tris, range);
      const name = carImageName(car, sections.length > 1 ? i : undefined);
      fs.writeFileSync(path.join(outDir, name), PNG.sync.write(png));
      log(`  ${name} (${png.width}x${png.height})`);
    });
    lengths.set(key, max[0] - min[0]);
  }
  const file: TrainsFile = {
    version: 1,
    pxPerM: SIDE_PX_PER_M,
    heightM: Math.round((SIDE_TOP_M - SIDE_BOTTOM_M) * 1000) / 1000,
    bottomM: SIDE_BOTTOM_M,
    stats: fleetStats(
      [...DESIGNS.values()].map((d) => ({ id: d.id, category: d.catalog?.category ?? "", params: d.params })),
      FACTORY_TRAIN_CONTEXT.confirmed,
    ),
    trains: trains.map((t) => {
      const cars = layOutTrain(t.cars, (c) => lengths.get(carKey(c))!, SIDE_MARGIN_M);
      const last = cars[cars.length - 1]!;
      return { id: t.id, lengthM: Math.round((last.offsetM + last.widthM - SIDE_MARGIN_M) * 1000) / 1000, cars };
    }),
  };
  fs.writeFileSync(path.join(dir, "trains.json"), JSON.stringify(file, null, 1) + "\n");
  return file;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const started = Date.now();
  console.log("train parade:");
  const file = writeTrains(TRAIN_PARADE, EXPORT_DIR, console.log);
  const cars = new Set(file.trains.flatMap((t) => t.cars.map((c) => c.image))).size;
  console.log(`fleet: ${file.stats.models} rail vehicle models, ${file.stats.variants} variants`);
  console.log(`wrote export/trains.json: ${file.trains.length} trains, ${cars} images, ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
