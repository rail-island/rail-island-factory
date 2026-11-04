// `pnpm openttd:ids`: give every new model, preset and formation its OpenTTD ids in
// generator/openttdIds.json (openttdIds.ts), appending only - a new item's block
// sized to twice the parts its built cars measure; mark the ones no longer
// exported retired. Commit the file with the change that needs it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_VEHICLES, catalogFields, DESIGNS, toGlb } from "./generate.ts";
import { glbStats } from "./glbStats.ts";
import { openttdFeatureOf, openttdPartCount } from "./openttd.ts";
import { OPENTTD_ID_TABLE, updateIds, wantedIds, type MeasureParts } from "./openttdIds.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const wanted = ALL_VEHICLES.flatMap((d) => {
  const f = openttdFeatureOf(catalogFields(d));
  return f ? [wantedIds(d, f)] : [];
});
// a new item's parts, measured on its built cars (a ship or aircraft is one part)
const measure: MeasureParts = (w, item) => {
  if (w.feature === "ship" || w.feature === "aircraft") return 1;
  const design = DESIGNS.get(w.model)!;
  let parts = 0;
  for (const car of item.cars) {
    const stats = glbStats(toGlb(design.id, design.build(car.params)));
    parts += openttdPartCount(stats.max[0] - stats.min[0]);
  }
  console.log(`  ${item.key}: ${parts} parts`);
  return parts;
};
const next = updateIds(OPENTTD_ID_TABLE, wanted, measure);
const text = `${JSON.stringify(next, null, 2)}\n`;
const file = path.join(HERE, "openttdIds.json");
if (fs.readFileSync(file, "utf8") === text) {
  console.log("generator/openttdIds.json: nothing to add");
} else {
  fs.writeFileSync(file, text);
  const count = Object.values(next.vehicles).reduce((n, v) => n + Object.keys(v).length, 0);
  console.log(`generator/openttdIds.json: ${Object.keys(next.grf).length} models, ${count} items`);
}
