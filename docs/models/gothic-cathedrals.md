# Gothic cathedrals

**Covers** - procedural Notre-Dame and Prague Castle's St Vitus Cathedral, their references, axes, geometry budget and deliberate simplifications.
**Code** - `generator/gothicCathedrals.ts`, `generator/gothicParts.ts`, `test/gothicCathedrals.test.ts`, `test/referenceModels.test.ts`
**See also** - [reproductions.md](reproductions.md), [cathedrals.md](cathedrals.md), [export.md](export.md), [source-tree.md](source-tree.md)

## Catalog and references

| Factory id | Title | Reference GLB in webapp `db/buildings/glb/` | Photo folder |
|---|---|---|---|
| `bld-notre-dame` | Notre-Dame | `notre-dame.glb` | `assets/notre-dame/` |
| `bld-prague-castle-st-vitus` | Prague Castle (St Vitus) | `prague-castle-st-vitus.glb` | `assets/prague-castle-st-vitus/` |

The photos are the user-provided `assets/_tmp/notre-dame.png` and
`assets/_tmp/prague-castle.png`, copied into each design's reference folder for the
catalog Images tab. The originals remain intact. No downloaded mesh or image is
needed to build either model. The existing webapp GLBs supply orientation, bounds
and approximate massing; the photographs guide the west facade and southern tower.

`GOTHIC_CATHEDRALS` is registered in `generate.ts`, so the normal build produces
GLBs, standalone JS models, source trees, thumbnails, reference images and
building catalog entries. Both use `Historical` / `hist_center`, `defaultScale`
1 and CC0 / Rail Island. The ids are stable.

## Coordinates and budget

Models use metres, +Y up and ground at y = 0. Notre-Dame's west front faces +Z;
St Vitus's west front faces -X and its Great South Tower is on +Z. The latter
uses the same local Gothic toolkit rotated -90 degrees about Y, then translated
by -4.5 m on X. The dimensions retain the reference footprint within the shared
10 percent tolerance; heights are 94.2 m and 91.6 m respectively. These are the
game references' stylized dimensions, not survey measurements of the buildings.

Each model has a hard **30,000-triangle ceiling**, aiming at 20,000-30,000.
Notre-Dame has **24,340 triangles** and St Vitus has **26,640 triangles**.
Materials are merged into ten (Notre-Dame) or eleven (St Vitus) draw calls.
Window frames have a front and reveal with the hidden back omitted; glass and
tracery ribbons sit at distinct depths. Roses are polygonal annular ribbons,
radial mullions, twelve smaller eyes and alternating blue/red glass. There are
no textures, booleans, decimation steps, random numbers or runtime asset loads.

## Notre-Dame

- Three layered west portals, central rose, paired side lancets, the 28 figures
  of the Gallery of Kings, cornices and an upper arcade.
- Two square towers with genuinely open paired belfry arches on four sides,
  bells and timber yokes, flat roofs and open parapets, as in the supplied photo.
- A nave, side aisles and polygonal choir with two levels of traceried windows,
  stepped piers and double flying buttresses along the nave.
- Transept portals and roses, gables, pinnacles, lead roof seams and an octagonal
  crossing fleche with a small ring of statues and a gilt cross.

## Prague Castle (St Vitus)

- Twin western spires with ribs, crockets, corner pinnacles and open belfries;
  three portals, a large rose, a statue gallery and the central pointed gable.
- Long nave and polygonal choir, aisle roofs, clerestory lights, flying
  buttresses and a repeating ridge crest.
- The asymmetric Great South Tower, paired upper windows, three clock faces
  with gilt markers and hands, a shaped copper helmet, corner cupolas, lantern,
  steeple and cross.

The title follows the existing game entry: this is **St Vitus Cathedral**, not
the entire Prague Castle precinct. The surrounding palace ranges, courtyards,
obelisk and adjoining houses visible in the photograph are outside its footprint.

## Simplifications and verification

These are exterior game models. Windows and portals use layered opaque surfaces;
only the belfry lights are actual through-openings. Sculptures are small faceted
figures; masonry carving, gargoyles, interiors and individual roof tiles are
omitted. Bay spacing and chapel plans follow the game-scale envelope rather than
an archaeological plan. The goal is a recognizable silhouette and architectural
rhythm at the requested triangle budget.

The tests check reference bounds, budgets, deterministic bytes, finite and
nondegenerate geometry, winding versus exported normals, absence of coplanar
material conflicts, facade directions and actual openings between the belfry
piers. The shared JS-model suite also checks exported JS/GLB geometry parity.
Review `export/thumbs/bld-notre-dame.png` and
`export/thumbs/bld-prague-castle-st-vitus.png` after `pnpm build:models`.

## Procedural export contract

All current export IDs use `proc-building-` or `proc-vehicle-`; source/reference
names in older tables identify the original models. See [legacy-mapping.md](legacy-mapping.md)
for the authoritative ID, scale and runtime conversion contract. Ground vehicles
have no exported `defaultScale`; buildings, aircraft and ships use 1 except the
Eiffel Tower placement exception.
