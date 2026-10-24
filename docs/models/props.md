# Props

**Covers** - the fixed props the game places on its structures: a cable car station's shed, a
port's crane, container slots, hut, floodlight, bollard and mooring post, an airport's control
tower and windsock; the box vocabulary they are drawn in, the material names the game reads,
units, the low detail, the loading gauge, and `props.meta.json`.
**Code** - `generator/props/propKit.ts`, `generator/props/portProps.ts`,
`generator/props/cableCarSheds.ts`, `generator/props/airportProps.ts`, `generator/catalog.ts`
(`exportPropMeta`), `test/props.test.ts`
**See also** - [previews.md](previews.md) (the cable-car pylon and the catenary supports, drawn
by their set modules and filed with the props on the site), [sets.md](sets.md), [export.md](export.md), [lod.md](lod.md), the game's
`docs/rendering/props.md`

## What a prop is

A prop is an ordinary design (thumbnail, GLB, JS model, LOD, catalog page) that the game never
offers a player: a structure places it. Which props a structure places is the structure's set
module's data (`cableCarStation` `TYPE_META.shed`, `port` `PROPS`, `airport` `TYPE_META`;
[sets.md](sets.md)); where they stand is the game's layout. A prop's size never follows the
world - a part that does (a pylon's height, an airport terminal on its pad, a bus stop on its
road) is a function in its set module instead.

Ids are `proc-prop-<name>`; they are stored nowhere in a map, but the set modules name them, so
renaming one is a change to both. Props carry no game text: the game never names one.

## The box vocabulary

Every prop is drawn from the box vocabulary of the game's structures (`propKit.ts`, `PropBox`):
a box at a centre with a size, tilted about Z then X (three.js's Euler order with no Y), or a
gable prism with its ridge along Z. The props were moved out of the game's own box lists, so
they land looking as the game drew them. A bottom resting on the ground or deck the prop stands
on is not drawn. `separateCoplanar` pulls apart flush faces of different materials (each
material inset 0.0137 studs more than the one before, a thin box proportionally less) for the
props whose source geometry let two materials share a face: the cable car sheds and the bus
stop preview.

Units are **studs**, the game's own, and props are placed at scale 1 - an airport's tower and
windsock are drawn full size and placed at the airport's furniture scale (0.45..1).

## Material names

A prop's materials are named `<kind>#<rrggbb>` (`propMaterial`): the game's box material kind
and the colour. The game parses the name and gives the mesh the material its own boxes of that
kind get - `light` glows, `glass` is see-through, `steel` is metallic - so the factory material
(roughness and metalness by kind) is only what the site, the thumbnail and the GLB show. The
kinds: the station vocabulary (`steel`, `glass`, `light`, `wood`, `roof`, `column`, `sign`,
...) for port and airport props, the cable car's (`steel`, `timber`, `glass`, `concrete`,
`stone`, `deck`) for the sheds, and `fabric` for the windsock.

## The props

| Prop | Parameters | Frame |
|---|---|---|
| `proc-prop-port-crane` | `deck`: `sea` (a 12-stud mole) or `river` (a 16-stud wharf), the leg span | boom over +X, the back reach over -X; y = 0 the deck |
| `proc-prop-port-container` | `livery` 0..5, `stack` one / two | length along X; the upper box two liveries on |
| `proc-prop-port-hut` | - | door toward +Z (the water), the crates 8 studs along |
| `proc-prop-port-floodlight` | - | crossbar along X |
| `proc-prop-port-bollard` | - | plate, stem and cap |
| `proc-prop-port-mooring-post` | - | sunk half a stud into the deck |
| `proc-prop-cablecar-shed` | `type`: the four station types | station frame: +Z toward the head, y = 0 the station's terrain level, at the type's footprint and head height |
| `proc-prop-airport-tower` | `kind`: regional (28-stud shaft) / international (48) | full size, standing at its origin |
| `proc-prop-airport-windsock` | - | five open cones tapering along +X from the mast head |

A prop of a few boxes (a bollard, a container, a floodlight) is smaller as a GLB than the builder
runtime every JS model carries, so `test/catalogSweep.ts` holds props and set previews to a fixed
24 KB JS limit instead of its "JS smaller than the GLBs" check (a set preview, which carries its
whole set module and is never exported to the game, to 80 KB), or to their GLBs when those are
larger; every other design keeps that check.

`FAR_PROPS` names the props a structure's far level keeps (crane, container, hut, tower, shed);
their low detail is the boxes tagged `lod: "shell"` - the silhouette the game's structure LOD
kept when they were its boxes.

## The loading gauge

A cabin rounds the outside of the bull wheel, so what it sweeps is a ring about the wheel axis;
no shed box may stand in it (`intrudesOnCabin`, the game's predicate, with the wheel `headZ =
depth / 2 + 7` in front of the station). `test/props.test.ts` asserts it for every station type,
the separated geometry included, and that the check would catch a box across the cabin's path.

## props.meta.json

`exportPropMeta` writes `export/props.meta.json`: one entry per prop in the buildings' entry
shape (`id`, `title`, `js`, `thumb`, `params`, catalog fields) plus `prop: { far, bounds }` -
whether the far level keeps it and the default variant's extent about its origin. It is apart
from the buildings and vehicles so the game keeps props out of its pickers, rewards, plan limits
and counts; the game's import copies the props' modules (no thumbnails) and its asset build
ships every one, the offline build included.
