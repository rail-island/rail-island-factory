// An eighth of the catalog's per-design checks (test/catalogSweep.ts); the eight
// files spread the designs over the test workers.

import { shard, warm } from "./catalogCache";
import { sweep } from "./catalogSweep";

const ids = shard(6, 8);
await warm(ids);
sweep(ids);
