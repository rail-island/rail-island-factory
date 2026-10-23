# Lamps: what a vehicle lights

**Covers** - the lamps of the vehicles: how a palette entry marks a material as a lamp lens with a role (head, tail, brake, indicator), its lit colour and intensity, the `lamps` table the export carries (`userData.lamps`, the GLB's `extras.lamps`), how a consumer tells the front end from the rear and the left indicator from the right, the marker materials that look like lamps but never light, the site's Lights button and the tests.
**Code** - `generator/meshCore.ts` (`LampSpec`, `LampRole`, `LAMP_LIT`, `Lamps`, `lamps`), `generator/threeBuilder.ts`, `generator/meshBuilder.ts`, the vehicle palettes (`busKit.ts`, `vehicles.ts`, `trucks.ts`, `photoTrucks.ts`, `tramKit.ts`, `cd163.ts`, `csdCoachParts.ts`, `dieselParts.ts`, `steamParts.ts`, `dmuKit.ts`, `dmu812.ts`, `drVt1816.ts`, `db628.ts`, `emu471.ts`, `emu680.ts`, `emuClassicKit.ts`, `ice1.ts`, `mavMdmot.ts`, `obb1040.ts`, `shinkansen0.ts`, `tgv.ts`, `tgvDuplex.ts`), `src/viewerLamps.ts`, `src/ModelViewer.tsx`, `test/liftable.test.ts`, `test/pantographs.test.ts`, `test/viewerLamps.test.ts`, `test/trams.test.ts`, `test/lod.test.ts`
**See also** - [animation.md](animation.md), [js-format.md](js-format.md), [emitters.md](emitters.md), [vehicles.md](vehicles.md), [../site/catalog-site.md](../site/catalog-site.md)

## A lamp is a material

A vehicle already draws its lamps: a lens slab or disc in a lamp material
(`lampHead`, `lampRed`, `lampAmber`, ...). The factory states what each does on the
palette entry, so the game can switch it on without knowing the design:

```ts
lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
lampHead: { color: "#f6e7a8", roughness: 0.2, lamp: { role: "head", lit: "#ffe9a0" } },
```

| Role | What it is | Default lit colour, intensity |
|---|---|---|
| `head` | a head or marker lamp, white or yellow | `#fff6e0`, 1.6 |
| `tail` | a red tail lamp | `#ff2a1c`, 1.2 |
| `brake` | a red brake lamp | `#ff1a10`, 2.2 |
| `indicator` | an amber direction indicator | `#ffa21c`, 2 |

`lit` and `intensity` override the role's defaults (`LAMP_LIT`) - a steam
locomotive's oil lamps glow warmer, the CD 460's top lamp yellow. Tagging changes
nothing that is drawn: the material's own colour is the unlit lamp.

Which vehicles draw `indicator` lenses: the buses (`cityBuses.ts`, `karosa.ts`),
the road vehicles (`vehicles.ts`, `trucks.ts`, `photoTrucks.ts`) and the five trams (`tramKit.ts`: the
Tatra T3, T6A5, KT8D5 and KT4 and the GT4, at both ends and on both sides, placed
from photographs - [trams.md](trams.md)). Trains draw none.

No design draws a separate brake lamp yet: the game brightens a tail lamp when a
vehicle brakes (the webapp's `docs/rendering/vehicle-lights.md`). A design with no
indicator material has none to blink, and a train ending in a wagon that draws no
lamp has no red light; the factory adds no lamp geometry to make up for it.

## What the export carries

`MeshCore.lamps()` gathers the tagged materials the model actually draws:

```ts
interface Lamps {
  midX: number; // the middle of the model's x extent, to the millimetre
  materials: Record<string, { role: LampRole; lit: string; intensity: number }>;
}
```

The JS model sets it as the group's `userData.lamps` and the GLB as the scene's
`extras.lamps`; a model without a lamp material has neither.

A lamp material is used at both ends of a vehicle (the same white head lamps at
each cab), so a consumer splits it by **triangle**: a lamp triangle whose centroid
lies at x >= `midX` is at the **front** end (+X, the factory's forward), else at the
**rear**; an indicator at z < 0 is on the **left** (the factory's -Z), else on the
right. `midX` rather than 0 because a bus is drawn from its rear at x = 0. So a
design keeps every indicator lens clearly on its own side and at its own end: no
lens across z = 0, none near the middle of the length (a side repeater counts for
the end of the section it sits on).

Lamps belong to the full detail only: a low-detail build (`buildLod`) uses no lamp
material, so it has no `lamps` table, and carries no animation clips ([lod.md](lod.md)).

## Looks like a lamp, never lit

Amber is also the colour of a cab-roof beacon, roof clearance lamps and the side
markers along a trailer. Those use a `marker` material with the same colour and no
`lamp`, so they never blink (`trucks.ts`, `vehicles.ts`, `photoTrucks.ts`). The
photo trucks' lettering, drawn in the head lamps' cream, is `letter`. A body paint
called `light` or `red` (the CD 680, the UIC-Z coach) is not a lamp.

## The site

A model with lamps gets a **Lights on / Lights off** button over the preview
(`viewerLamps.ts`): every lamp mesh swaps to a lit twin - its lit colour as the
emissive, at its intensity - and indicators blink every 0.8 s, so a design's
tagging can be checked by eye. The preview lights both ends at once; it does not
split them as the game does. A source-tree highlight shows the built materials.

## Tests

`test/liftable.test.ts`: the table in the JS model and the GLB, defaults and
overrides, absent without a lamp material. `test/pantographs.test.ts`: every
vehicle's roles are known, colours valid, intensities positive, and every road
vehicle has head lamps. `test/viewerLamps.test.ts`: the lit twins, the swap and the
blinking. The catalog sweep checks the JS model's `lamps` equals the GLB's.
`test/trams.test.ts`: every tram's indicators on both sides at both ends.
`test/lod.test.ts`: no vehicle's low detail has a lamp material, a `lamps` table or a clip.
