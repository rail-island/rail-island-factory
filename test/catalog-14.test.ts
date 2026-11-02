// A sixteenth of the catalog's per-design checks (test/catalogSweep.ts); the
// sixteen files spread the designs over the test workers, small enough that the
// last of them to finish leaves no core idle for long.

import { shard, warm } from "./catalogCache";
import { sweep } from "./catalogSweep";

const ids = shard(13, 16);
await warm(ids);
sweep(ids);
