# Historical buildings

**Covers** - the legacy Historical catalog, detailed Pagoda, Castle and Palace, and building budgets.
**Code** - `generator/legacyBuildings.ts`, `generator/historicalLandmarks.ts`, `generator/palace.ts`, `test/palaceCastleVariants.test.ts`, `test/historicalLandmarks.test.ts`.
**See also** - [reproductions.md](reproductions.md), [parameters.md](parameters.md), [export.md](export.md), [building skill](../../.agents/skills/building/SKILL.md).

## Detailed landmarks

`proc-building-hist-pagoda` keeps three diminishing storeys, with curved tiled roofs,
raised tile seams, corner ridges, open galleries, timber posts and brackets,
lattice windows, a stepped terrace and a ringed finial. Its reference is the
webapp's `db/buildings/glb/hist-pagoda.glb`. The source GLB has arbitrary units
and an offset origin; the procedural version retains a centred, grounded layout.

`proc-building-castle` retains the saved `layout=courtyard|keep|fortress` values
and their footprint. Stone curtain walls enclose a great hall, a roofed service
wing, a well, stairs and inner wall walks. A twin-towered gatehouse has a genuinely
open entrance and raised grille. The fortress remains lower, without a central
tall tower. The reference is the webapp's `hist-castle.glb`; the factory retains
its rectangular layouts rather than copying the source's irregular footprint.
Geometry previously spent on repetitive masonry now also describes courtyard
structures, buttresses, tower finials and gatehouse banners.

| Castle parameter | Values (default first) | Effect |
| --- | --- | --- |
| `layout` | `courtyard`, `keep`, `fortress` | Existing footprint and height choices |
| `walls` | `crenellated`, `machicolated` | Plain battlements or projecting supports and drop slots |
| `roof` | `conical`, `hipped` | Conical or pyramidal tower roofs |
| `towers` | `round`, `square` | Tower bodies, masonry, cornices and battlements |
| `windows` | `slits`, `arched` | Arrow slits or arched tower windows |

`proc-building-hist-palace` preserves its 72 by 58 metre main block, raised central
residence and five roofed towers. Its reference is the webapp's `hist-palace.glb`
and thumbnail: a warm stone, tiered palace with corner pavilions, a ceremonial
colonnade and a gold central crown. The reconstruction adds framed windows,
projecting sills, pilasters, string courses, terrace parapets, dormers, chimneys,
and an open projecting loggia with ten columns and entrance steps. The roof
profiles use visible shape changes, not hidden subdivisions, to spend the
landmark budget. The colonnade and steps extend beyond the retained main block.

| Palace parameter | Values (default first) | Effect |
| --- | --- | --- |
| `walls` | `balustrade`, `crenellated` | Terrace balustrades or battlements |
| `roof` | `onion`, `conical` | Curved domes or straight spires on all five towers |
| `towers` | `square`, `round` | Corner pavilions or cylindrical turrets |
| `windows` | `arched`, `rectangular` | Curved surrounds or dentilled lintels |

IDs, catalog attribution and legacy mappings remain unchanged. Omitted parameters
resolve to defaults; invalid names and enum values are rejected. All choices are
exposed through existing catalog pickers and standalone JS exports. Station Hotel
retains its generator; Colosseum uses its dedicated `colosseum.ts` module.

## Budgets and verification

Row houses have a hard limit of **10,000 triangles** per building. Large landmarks
target **20,000-30,000 triangles**, including all shape combinations. Geometry
must improve silhouette or visible architectural detail rather than inflate counts.

Castle's 48 combinations contain **20,034-25,626 triangles**. Palace's 16
combinations contain **23,927-29,453 triangles**. Tests cover every combination:
budget, deterministic GLB bytes, finite nondegenerate geometry, ground contact,
no coplanar material overlaps, and the open castle gate / palace loggia bays.
The shared parameter suite also compares standalone JS geometry against GLB.

Dedicated LOD models retain tower shapes and roof profiles, the castle service
wing, gatehouse and hall, and the palace's tiered massing and projecting loggia.
Castle uses at most **358** triangles and Palace at most **474**; Pagoda uses 146.
Parapet and window details are deliberately omitted at this distance. Every
builder validates the same parameter schema in full detail and LOD.

After building, inspect `export/thumbs/proc-building-hist-palace.png`,
`export/thumbs/proc-building-castle.png` and `export/thumbs/proc-building-hist-pagoda.png`
headlessly, comparing the originals and representative alternate variants.
