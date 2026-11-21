# C# transpiler pilot

Status: draft
Date: 2026-11-21
Area: rail-island-factory (a new pilot tool beside `generator/`, no change to the export or the game)

## Context of the change

A Godot (C#) consumer of the factory's models is being considered. Today a model ships
only as `export/js/<id>.js`: the design's TypeScript, bundled by esbuild with the
geometry kernel and minified, whose `build(THREE, params, lod)` returns a three.js
Group (docs/models/js-format.md). The bundle touches three.js only through
`generator/threeBuilder.ts`, and only these classes: `Group`, `Mesh`, `BufferGeometry`,
`BufferAttribute`, `MeshStandardMaterial`, `DoubleSide`, `AnimationClip`,
`QuaternionKeyframeTrack`, `VectorKeyframeTrack`.

Two ways to reach C# were weighed in the conversation that led here:

- **Run the JS in C#** (Jint or ClearScript): no factory change, but an interpreter's
  speed is unknown and nothing in the factory checks the bundles against Jint.
- **Transpile the TypeScript to C#**: native speed and a typed API, but the factory is
  about 200,000 lines of TypeScript and changes daily, so only an automated transpiler
  run by the build can stay in sync. Its cost is in typing and in JS semantics, not
  in syntax.

The code is regular (no generators, async, `eval` or reflection), but idiomatic. A
count over `generator/*.ts` and `generator/sets/*.ts`: about 6,500 spreads, 2,600
array destructurings, 4,700 `map`/`filter`/`reduce` calls, 1,800 `??`/`?.`, 1,350
`as const`, 800 `Record<...>` and 1,400 arrow functions returning object literals.

This pilot finds out, on a small closure of modules, whether such a transpiler is
practical: how much of the typing can be automatic, how often JS semantics bite, and
whether the C# output can be proved to give the same triangles as the JS.

## User request

"I don't want to implement it now, just thinking. If I create my own transpiler, with
support of only constructs that are really used, that should be not so complicated?"
followed by "write a spec for the transpiler pilot".

## Decisions

These were not asked one by one; they are proposed here for the user's review.

### What does the pilot transpile?

| Option | What it means |
|---|---|
| Kernel and three designs (Proposed) | `meshCore.ts`, `threeBuilder.ts`'s group assembly, and the modules three designs reach. |
| The kernel only | Proves the primitives, says nothing about how designs are written. |
| A whole family | `vehicles.ts` alone reaches 56 modules and 21,000 lines; too large to learn from quickly. |

**Proposed: kernel and three designs**, in order of difficulty:

1. `proc-prop-airport-windsock` - fixed, no parameters; `generator/props/airportProps.ts`
   plus `propKit.ts` (about 360 lines with the kit).
2. `sky-pyramid` - parametric (`SKYSCRAPER_PARAMS`), `generator/skyscrapers.ts` and
   its imports (8 modules, about 3,600 lines before tree-shaking): enum params, party
   walls, the landmark LOD kit.
3. Stretch: `proc-vehicle-american-truck` - parts (steered wheels), a rig; only the
   modules its esbuild bundle actually keeps, not all of `vehicles.ts`.

### Which modules count as "reached"?

**Proposed: esbuild's metafile of the design's bundle** (`bundleDesign` in
`generator/jsModel.ts`, which already bundles with `metafile: true`): exactly the
inputs it keeps after tree-shaking, with the same plugin substitutions (the lean
mesh builder, the surface and interior stubs). A plain import graph overstates the
work (registries pull whole families).

### How are TypeScript's structural types given C# names?

| Option | What it means |
|---|---|
| Named where declared, interned by shape elsewhere (Proposed) | An `interface`/`type` alias becomes a class of that name; an anonymous object type gets a generated name from its sorted field list, shared by every literal of that shape. |
| Everything `dynamic` / dictionaries | Trivial transpiler, no faster than Jint; defeats the purpose. |

**Proposed: named where declared, interned by shape elsewhere.** Further rules:

- `number` is `double`; a value used as an index or length is cast at that use.
- A string literal union (`"electric" \| "diesel"`) is `string`; enums come later if
  the API needs them.
- `Record<string, T>` is `Dictionary<string, T>` with insertion order kept (JS keeps it;
  material order depends on it).
- A fixed-length numeric tuple (`[number, number, number]`) is a `double[]`; a
  heterogeneous tuple is a `ValueTuple`.
- `undefined` and `null` both become `null`; an optional field is nullable.
- A spread into a literal becomes a generated copy-with on the target shape.
- A default parameter that reads other parameters becomes a `null` default and an
  assignment at the top of the body.
- A function value is `Func<>`/`Action<>`.

### What runtime does the C# lean on?

**Proposed: one small hand-written library, `JsRt`**, that copies JS behaviour where
.NET differs:

- arrays with `map`, `filter`, `reduce`, `flatMap`, `slice`, `at`, `some`, `every`,
  `find`, `includes`, `concat`, `fill`, `Array.from({ length })`;
- a **stable** `sort` (JS's is stable; `Array.Sort`/`List.Sort` are not);
- `Math.round` (JS rounds .5 towards +infinity; .NET to even);
- number to string as JS prints it (`toString()`, `toString(16)`, `toFixed`), since
  names and `<kind>#<rrggbb>` materials carry numbers;
- bitwise operators on int32 (`x | 0`, `>>>`);
- JS truthiness where a non-boolean is tested;
- `Object.entries`/`keys` in insertion order.

### How is equality with the JS proved?

**Proposed: a triangle dump on both sides, compared by a Node script.** The JS bundle
is run with a recording `THREE` stub; the C# build writes the same JSON (node tree,
materials in order, positions, normals, colours, UVs, clips, `userData`). The compare
is exact first; where it is not, the report names the first differing triangle, and a
tolerance of 1e-9 m is allowed only with the cause written down (a `Math.sin` last
bit, not an algorithm difference). Every parameter combination the factory's tests
use (`coverageCombinations`) and the LOD level are compared.

### Where does the C# go?

**Proposed: the generator writes to `export/cs/` (gitignored, like all of `export/`),
the transpiler lives in `tools/cs-transpile/`**, Node-only, run with `tsx`. Nothing of
it reaches `src/`, `generator/` behaviour, the export the game imports or `pnpm test`.

### What does the generated API look like?

**Proposed: one static class per design, one enum per parameter, and a neutral
mesh result**, so the pilot does not depend on Godot:

```csharp
public enum SkyPyramidFinish { ... }            // from the design's params
public static class SkyPyramid {
    public const string Id = "sky-pyramid";
    public static ModelNode Build(SkyPyramidFinish finish = ..., bool lod = false);
}
// ModelNode: name, position, children, meshes (material spec, float[] positions,
// float[] normals, float[]? colors, float[]? uvs), clips, userData as JSON
```

A Godot adapter (`ModelNode` to `Node3D`/`ArrayMesh`, swapping each triangle's
winding, since Godot's front faces are clockwise and three.js's counter-clockwise)
is a small follow-up outside this pilot.

## High-level plan

1. **Toolchain.** Install the .NET 8 SDK in the session; add `typescript` (already a
   dependency) or `ts-morph` as a dev dependency of the pilot tool only.
2. **Inventory.** A script lists, per pilot design, the metafile inputs and counts
   each syntax kind used in them (by TypeScript `SyntaxKind`). This becomes the
   **supported subset**; anything else is a transpile error naming file and line.
3. **Kernel.** Transpile `meshCore.ts` and write `JsRt`; a hand-written C# smoke test
   builds a box and a loft and matches the JS dump.
4. **Group assembly.** Transpile the part of `threeBuilder.ts`'s `toGroup` that
   produces meshes per material and part, retargeted at `ModelNode` instead of
   `THREE` (the one hand-written seam).
5. **Windsock.** Transpile, build, dump, compare.
6. **Pyramid.** Add the shape interning, spreads, `Record`, params; generate the
   enum API from `params`; compare every combination and the LOD.
7. **Truck (stretch).** Parts, rig as `userData`; `pose`/`renderJoint` stay out.
8. **Measure and report** (`docs/impl/`): lines of transpiler and runtime, the count of
   constructs handled automatically against those needing a rule, every semantic
   difference met, build time of each model in C# against Node and against Jint
   running the same bundle, and an estimate for the whole catalog.

## Database and persistent storage

None. No saved-map id, OpenTTD id, set id, meta file or `build-cache/` entry changes.
The pilot writes only to the gitignored `export/cs/` and its scratch dumps.

## Architecture decisions

- **Transpile TypeScript, not the minified bundle.** The bundle has lost the types,
  and types are what C# needs.
- **The `THREE` seam is replaced, not emulated.** `threeBuilder.ts` is the one place
  that knows three.js; the C# side gets a neutral `ModelNode`, so the same output can
  feed Godot, a test or a GLB writer.
- **The subset is enforced by the transpiler failing loudly.** If the pilot leads to
  a real tool, a factory test running the transpiler over every bundle keeps new code
  inside the subset; the pilot does not add that test.
- **Verification is by dump comparison against the JS**, the same principle as
  `test/catalogSweep.ts` comparing the JS with the GLB.

## Weaknesses and risks

- **Shape interning may explode**: many slightly different literals give many
  classes. The pilot counts them; if they are unmanageable, a nominal annotation in
  the factory (named types for config tables) would be needed - a factory change.
- **Generic and higher-order code** (kits taking builders and callbacks) may need
  inference the checker does not expose simply; each workaround is logged.
- **Floating point**: .NET's `Math` may differ from V8's in the last bit, and a
  threshold or a point merge can turn that into a different mesh. The compare will
  show it; a fix may need a ported `sin`/`cos` in `JsRt`.
- **Three designs are not the catalog.** The heavy families (cab-nose scans, lettering,
  lofted slice bodies) are not in the pilot; the estimate for them stays an estimate.
- **The pilot's tool can drift** from the factory if it is not continued; it is a
  spike and is meant to be judged, not maintained, until a decision is taken.
- **.NET in the cloud container** may need a host the environment's network does not
  allow; if so the session is blocked until the user allows it.

## Out of scope

- The Godot adapter, Godot project and any engine code.
- Rig functions (`pose`, `renderJoint`, `steerAngles`), animation playback, interiors,
  surfaces' textures, `woods.js` and the sets' modules.
- Any change to `generator/`, the export the game imports, the site or `pnpm test`.
- Jint integration beyond the one timing comparison in step 8.
- Committing generated C#.
