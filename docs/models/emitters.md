# Emitters: where models smoke, steam and flare

**Covers** - the emitters a model carries: the mouth of every chimney, cooling tower, gas flare,
locomotive exhaust and ship funnel, as points the game starts its smoke, steam and flames from;
how a design records one, where the export carries them, and the checks.
**Code** - `generator/meshCore.ts` (`Emitter`, `emit`, `emitters`), `generator/threeBuilder.ts`,
`generator/meshBuilder.ts`, `generator/industry.ts`, `generator/steamParts.ts`,
`generator/dieselParts.ts`, `generator/dmuKit.ts`, `generator/ships.ts`,
`generator/legacyVehicles.ts`, `test/emitters.test.ts`
**See also** - [js-format.md](js-format.md), [industry.md](industry.md),
[steam-locomotives.md](steam-locomotives.md), [ships.md](ships.md), [legacy-mapping.md](legacy-mapping.md)

## What an emitter is

The factory is the source of WHERE a model gives off smoke; the game only draws it. An emitter is
one point in the model's own frame (metres, +Y up, the same coordinates as its triangles):

```ts
interface Emitter {
  kind: "smoke" | "steam" | "flame";
  at: [x, y, z];          // the centre of the mouth, at its height
  radius: number;         // the mouth's radius
  dir?: [x, y, z];        // a flame: the direction it burns ([0, 1, 0])
  height?: number;        // a flame: its length
  color?: string;         // a flame: its sRGB colour
  part?: string;          // the part it was placed in, for a model with parts
}
```

A design records one with `m.emit(kind, at, radius, flame?)` **where it draws the stack**, so a
parameter that moves or heightens the stack moves its smoke with it (the chimney's `height`, a power
plant's `type`). Nothing is derived from an old model's coordinates.

## Who emits

| Source | Emitter |
|---|---|
| `industry.ts` `stack()` | smoke at the chimney mouth; with `flare`, a gas-flare flame instead (the refinery) |
| `industry.ts` `coolingTower()` | steam at the tower's top |
| `industry.ts` `industrialProcess` | the chemical plant's steam from its two tallest columns |
| `steamParts.ts` `chimney()` | every steam locomotive's chimney smoke |
| `dieselParts.ts` / `dmuKit.ts` `exhaust()`, and each diesel's own exhaust | diesel exhaust smoke |
| `ships.ts`, `legacyVehicles.ts` | ship funnels and exhaust stacks |

Diesel exhausts are `smoke` with a small radius; whether and how a consumer draws them is the
consumer's call. A tender, a coach or an electric gives none.

## Where it is exported

- **JS module** - `build(THREE, params)` returns a group whose `userData.emitters` lists them, for
  exactly the parameters it was built with ([js-format.md](js-format.md)).
- **GLB** - the scene's `extras.emitters` (three's GLTFLoader: `scene.userData.emitters`), for the
  default parameters.

The low-detail build carries none; a consumer reads them from the full build.

## Checks

`test/emitters.test.ts` builds every design at every parameter combination and requires each
emitter to sit on a mouth: geometry at its height within twice its radius, and nothing covering it.
It also requires the chimneys, power plants, foundry, mill, process plant, ships with funnels and
every steam locomotive to emit, the refinery to flare, and the chimney's smoke to rise with its
`height`.
