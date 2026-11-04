// `pnpm openttd:ids`: give every new model, preset and formation its OpenTTD ids in
// generator/openttdIds.json (openttdIds.ts), appending only; mark the ones no
// longer exported retired. Commit the file with the change that needs it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_VEHICLES, catalogFields } from "./generate.ts";
import { openttdFeatureOf } from "./openttd.ts";
import { OPENTTD_ID_TABLE, updateIds, wantedIds } from "./openttdIds.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const wanted = ALL_VEHICLES.flatMap((d) => {
  const f = openttdFeatureOf(catalogFields(d));
  return f ? [wantedIds(d, f)] : [];
});
const next = updateIds(OPENTTD_ID_TABLE, wanted);
const text = `${JSON.stringify(next, null, 2)}\n`;
const file = path.join(HERE, "openttdIds.json");
if (fs.readFileSync(file, "utf8") === text) {
  console.log("generator/openttdIds.json: nothing to add");
} else {
  fs.writeFileSync(file, text);
  const count = Object.values(next.vehicles).reduce((n, v) => n + Object.keys(v).length, 0);
  console.log(`generator/openttdIds.json: ${Object.keys(next.grf).length} models, ${count} items`);
}
