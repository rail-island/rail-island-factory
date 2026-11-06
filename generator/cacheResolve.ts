// pnpm cache:resolve -- settles a merge's conflicts in build-cache/ (docs/guide/build-cache.md).
//
// The cache holds a file per design, so a merge conflicts there only where both
// branches changed the same design. Either side's file will do: this takes the
// incoming one (or drops a file the incoming side deleted), then runs the build,
// which rebuilds exactly the designs whose key no longer matches their file -- the
// merged code's -- and stages build-cache/. The merge is then committed as usual.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args: string[]): string => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });

const conflicted = git("diff", "--name-only", "--diff-filter=U", "--", "build-cache").split("\n").filter(Boolean);
const outside = git("diff", "--name-only", "--diff-filter=U").split("\n").filter((f) => f && !f.startsWith("build-cache/"));
for (const file of conflicted) {
  // stage 3 is the incoming side; a file it deleted has none
  let incoming = true;
  try {
    git("cat-file", "-e", `:3:${file}`);
  } catch {
    incoming = false;
  }
  if (incoming) {
    git("checkout", "--theirs", "--", file);
    git("add", "--", file);
  } else git("rm", "--quiet", "--", file);
}
console.log(`build-cache/: ${conflicted.length} conflicted file(s) settled; rebuilding the designs whose key moved`);
execFileSync("pnpm", ["build:models"], { cwd: ROOT, stdio: "inherit" });
git("add", "--all", "--", "build-cache");
console.log(outside.length ? `build-cache/ is staged; still conflicted outside it: ${outside.join(", ")}` : "build-cache/ is staged; commit the merge");
