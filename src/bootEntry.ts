// What vite.config.ts's `inline-boot` plugin compiles into index.html (see boot.ts).

import { installBoot } from "./boot";

installBoot(window);
