# Props

**Covers** - the fixed props the game places on its structures: a cable car station's shed, a
port's crane, container slots, hut, floodlight, bollard and mooring post, an airport's control
tower and windsock, and the trackside signals the game places itself (a rail signal, a level
crossing's road signal, a buffer stop) with the lamps it switches; the box vocabulary they are drawn in, the material names the game reads,
units, the low detail, the loading gauge, and `props.meta.json`.
**Code** - `generator/props/propKit.ts`, `generator/props/portProps.ts`,
`generator/props/cableCarSheds.ts`, `generator/props/airportProps.ts`, `generator/props/signalProps.ts`,
`generator/catalog.ts`
(`exportPropMeta`), `test/props.test.ts`
**See also** - [previews.md](previews.md) (the cable-car pylon and the catenary supports, drawn
by their set modules and filed with the props on the site), [sets.md](sets.md), [export.md](export.md), [lod.md](lod.md), the game's
`docs/rendering/props.md`

## What a prop is

A prop is an ordinary design (thumbnail, GLB, JS model, LOD, catalog page) that the game never
offers a player: a structure places it. Which props a structure places is the structure's set
module's data (`cableCarStation` `TYPE_META.shed`, `port` `PROPS`, `airport` `TYPE_META`;
[sets.md](sets.md)); where they stand is the game's layout. The two trackside signals are the
exception: no set names them, the game places one beside the track or road for every signal
it derives (`SIGNAL_PROP_IDS`, see [The trackside signals](#the-trackside-signals)). A prop's size never follows the
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
| `proc-prop-rail-signal` | - | mast foot at the origin, the head facing +Z, the track toward +X |
| `proc-prop-crossing-signal` | - | mast foot at the origin, the cross and head facing +Z, the road toward +X |
| `proc-prop-buffer-stop` | - | on the track's centre line 3.2 studs past its end, the beam facing the track at +Z |

A prop of a few boxes (a bollard, a container, a floodlight) is smaller as a GLB than the builder
runtime every JS model carries, so `test/catalogSweep.ts` holds props and set previews to a fixed
24 KB JS limit instead of its "JS smaller than the GLBs" check (a set preview, which carries its
whole set module and is never exported to the game, to 80 KB), or to their GLBs when those are
larger; every other design keeps that check.

`FAR_PROPS` names the props a structure's far level keeps (crane, container, hut, tower, shed);
their low detail is the boxes tagged `lod: "shell"` - the silhouette the game's structure LOD
kept when they were its boxes - except the cable car shed's, which draws its own few boxes
(`shedLodBoxes`, below).

## The cable car sheds

`generator/props/cableCarSheds.ts` draws one station hall per station type, and every type's
roof carries on forward over the game's boarding platform and the back half of the bull wheel,
its underside 2.5 studs above the rope and its front edge half a stud past the wheel axis.
Only the footprint is levelled, so everything that stands on the ground stands inside it;
what reaches over the platform is cantilevered from columns at the footprint's front corners
(a column may pass through the platform's deck). Each hall leaves the game's stairs a door in
its front (and the gantry one in its back), so they climb out of the hall to the platform.

| Type | The shed |
|---|---|
| `open_gantry` | a red steel frame of H columns on plinths, lattice girders cantilevered to the wheel, roof trusses, X bracing; a corrugated roof with a ridge lantern and the machine room over the wheel (the gearbox and motor hung under it); clad back wall, an operator's and a ticket booth on a grating deck, the station board on the front truss |
| `alpine_chalet` | a stone ground floor and two timber storeys with shuttered windows, flower boxes, side balconies and a clock on the inner gable; one 25-degree shingle roof on deep bracketed eaves, carried forward by timber posts, braces, tie beams and king posts to the front truss with its collar and board; barge boards, ridge turret, chimney |
| `glass_modern` | a two-storey curtain-wall box (mullions, sun fins, terraces with glass balustrades, a panorama box cantilevered off the right side, a counter and benches inside) under a flat white wing with a skylight, solar panels and a timber slat soffit, carried by tree columns forked above the platform; a lift core rising through the wing to a glass lantern, glass wind screens |
| `concrete_drive` | a concrete hall with deep fins, ribbon windows, a relief over the control room's bay window and slit windows by the door; portal frames with capitals and haunches, a coffered ceiling, a parapeted roof with roof lights, and the drive room over the wheel (glass ribbon, louvres, plant, railing, the gearbox and motor under the front beam) |

The full detail stays within 5,000 triangles a type and the low detail within 200
(`test/props.test.ts`); the low detail is the hall (open over the stairs), the roof, the
columns and beams that carry it and the machine room or tower - the same silhouette. The
station's preview ([previews.md](previews.md)) draws the same two levels on its deck.

## The trackside signals

`generator/props/signalProps.ts` draws the props the game stands beside its track and
roads: `proc-prop-rail-signal` (one per governed direction of a rail signal, implicit
station signals included), `proc-prop-crossing-signal` (one per road approach of a level
crossing) and `proc-prop-buffer-stop` (one per dead end of track). They are not drawn in the box vocabulary but with the builder's round and slab
primitives: a sunk concrete footing, a round mast with a flared foot and finial, a relay
cabinet at the foot away from the track (-X), and

- the rail signal: a white-bordered black shield with rounded corners on its lamp housing,
  three domed lenses (red over blue over green) each with a bezel and a visor, two clamp
  brackets, a name plate below the head, and a ladder up the back to a railed platform;
- the crossing signal: the red-bordered white St Andrew's cross, a horizontal two-lamp head
  (left and right red lenses with visors), the bell on the mast head and red and white bands
  at the foot of the mast;
- the buffer stop (no cabinet and no lamp): a gravel bed with rail stubs on three sleepers
  reaching back to the end of the track 3.2 studs away (rails 2.7 studs apart, 0.45 square,
  their middle 1.3 studs up - the game's track), a frame of rail on each rail (post and raking
  strut), the buffer beam with hazard stripes and two buffers, and the end-of-track sign, a red
  disk with a white bar, on a post above it.

Every lamp lens is a material of its own whose kind names the lamp the game switches:
`lampred`, `lampblue`, `lampgreen` (`RAIL_SIGNAL_LAMPS`) and `lampleft`, `lampright`
(`CROSSING_SIGNAL_LAMPS`, -X and +X). The game lights a lamp by swapping that one mesh's
material; the body (`steel`, `paint`, `concrete`) it draws as one mesh. The low detail keeps
the mast, the head (and the cross) and flat lamp faces in the same lamp materials, under the
100-triangle budget. `test/props.test.ts` checks each lamp is its own material at both levels
and that the lamps sit red over blue over green, left of right.

## The loading gauge

A cabin rounds the outside of the bull wheel, so what it sweeps is a ring about the wheel axis;
no shed box may stand in it (`intrudesOnCabin`, the game's predicate, with the wheel `headZ =
depth / 2 + 7` in front of the station, on each box's exact extent with its tilts).
`shedFouls` adds what else the game builds round the shed: nothing on the wheel or the grips
riding it (within the ring's outer radius, up to 1.3 studs above the rope), nothing more than
0.6 studs ahead of the wheel axis (where the rope leaves, at any slope), nothing in the
platform's band (7.8 to 12.4 studs from the axis, from 9.4 to 6.9 studs below the rope) but
slender upright columns clear of its railing, and nothing over the stairs' treads
(`stairTreads`, the default cabin's) lower than 2.4 studs of head room. `test/props.test.ts`
asserts both for every station type at both levels, the separated geometry included, and that
the checks would catch a box in each place.

## props.meta.json

`exportPropMeta` writes `export/props.meta.json`: one entry per prop in the buildings' entry
shape (`id`, `title`, `js`, `thumb`, `params`, catalog fields) plus `prop: { far, bounds }` -
whether the far level keeps it and the default variant's extent about its origin. It is apart
from the buildings and vehicles so the game keeps props out of its pickers, rewards, plan limits
and counts; the game's import copies the props' modules (no thumbnails) and its asset build
ships every one, the offline build included.
