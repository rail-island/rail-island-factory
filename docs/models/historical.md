# Historical buildings

**Covers** - the legacy Historical catalog, detailed Pagoda and Castle, and building budgets.
**Code** - `generator/legacyBuildings.ts`, `generator/historicalLandmarks.ts`, `test/historicalLandmarks.test.ts`.
**See also** - [reproductions.md](reproductions.md), [export.md](export.md), [building skill](../../.agents/skills/building/SKILL.md).

## Detailed landmarks

`proc-building-hist-pagoda` keeps three diminishing storeys, now with curved tiled roofs,
raised tile seams, corner ridges, open galleries, timber posts and brackets,
lattice windows, a stepped terrace and a ringed finial. Its reference is the
webapp's `db/buildings/glb/hist-pagoda.glb`. The source GLB has arbitrary units
and an offset origin; the procedural version retains a centred, grounded layout.

`proc-building-castle` retains `layout=courtyard|keep|fortress`. It has stone courses,
corbelled round towers, crenellations, arrow slits, a twin-towered gatehouse with
an open entrance, a great hall with arched windows and chimneys, and (except for
the low fortress) a tall roofed tower. The reference is `hist-castle.glb` in the
webapp. Its articulated towers and gate inspired the reconstruction; the factory's
existing rectangular layout parameters and dimensions are retained rather than
copying the source mesh's irregular footprint. The fortress remains lower and
has no central tall tower.

IDs and catalog metadata remain unchanged. Palace and Station Hotel retain their existing
generators; Colosseum uses its dedicated `colosseum.ts` module.

## Budgets and verification

Row houses have a hard limit of **10,000 triangles** per building. Large landmarks
target **20,000-30,000 triangles**, including all shape variants. Geometry should
improve silhouette or visible architectural detail, not merely inflate counts.
The building skill provides the reusable authoring checklist.

Tests enforce the landmark budget for Pagoda and every Castle layout, deterministic
bytes, finite nondegenerate triangles, ground contact, no coplanar overlaps, and
an actual passable gate. Inspect `export/thumbs/proc-building-hist-pagoda.png` and
`export/thumbs/proc-building-castle.png` after building.

Dedicated LOD silhouettes retain the new tiered roof profiles, gatehouse and hall.
Pagoda uses 146 LOD triangles; Castle uses 334 (courtyard/keep) or 292
(fortress), below the Historical limit of 500.
