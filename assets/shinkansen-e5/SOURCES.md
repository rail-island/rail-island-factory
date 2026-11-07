# Shinkansen E5 / H5 source references

**Covers** - provenance of the Shinkansen E5 / H5 model (`proc-vehicle-shinkansen-e5`): photographs, measurements and published dimensions.
**Code** - `generator/shinkansen.ts` (`E5`, `E5_FACE`, `e5Canopy`)
**See also** - [the reference](../../docs/models/shinkansen.md)

## Photographs

From Wikimedia Commons (`pnpm refs:fetch`). None is a true orthographic side view; the S11
photograph is the nearest (about 37 degrees off the side, mild perspective).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-e5-u2.jpg` | Series-E5-U2 Hayabusa-30.jpg | https://commons.wikimedia.org/wiki/File:Series-E5-U2_Hayabusa-30.jpg | MaedaAkihiko | CC BY-SA 4.0 | set U2, front three-quarter: the hatch seam and its green/white split, the canopy and its four headlights, the middle car's windows standing on the stripe, the stripe's height and thickness |
| `photo-e5-u44.jpg` | Series-E5-U44 Hayabusa-2.jpg | https://commons.wikimedia.org/wiki/File:Series-E5-U44_Hayabusa-2.jpg | MaedaAkihiko | CC BY-SA 4.0 | set U44, front three-quarter: the canopy's width (about half the body's), the nose's plan at the hatch |
| `photo-series-e5-u15-yamabiko-50.jpg` | Series-E5-U15 Yamabiko-50.jpg | https://commons.wikimedia.org/wiki/File:Series-E5-U15_Yamabiko-50.jpg | MaedaAkihiko | CC BY-SA 4.0 | set U15, nearly head-on: the hatch (most of the nose's width), the white lower jaw, the windscreen visor in its green rim, the headlights inside the canopy over the glass |
| `photo-e514-1.jpg` | E514-1.jpg | https://commons.wikimedia.org/wiki/File:E514-1.jpg | Rsa | CC BY-SA 3.0 | end car E514-1 (the modelled unit), rear three-quarter of its nose: the green edge on the nose's side, the white cheek, the stripe dying out on the nose, the crew and passenger doors behind it |
| `photo-h514-1-omiya-20160327.jpg` | H514-1 omiya 20160327.jpg | https://commons.wikimedia.org/wiki/File:H514-1_omiya_20160327.jpg | Rsa | CC BY-SA 3.0 | H5 end car H514-1: the H5's purple stripe, the canopy's side glass, the doors behind the nose |
| `photo-e5-s11-sendai-20090725.jpg` | E5 S11 Sendai 20090725.JPG | https://commons.wikimedia.org/wiki/File:E5_S11_Sendai_20090725.JPG | DAJF | CC BY-SA 3.0 | the pre-series set S11 nearly side-on (shape as the production sets): the nose's profile, the canopy's and windscreen's place along the nose, the green edge's and the stripe's heights along it, the doors' places |

## Measurements (photo-e5-s11-sendai-20090725.jpg)

A 1-D projective fit along the side through the tip (x 1168 px, d 0), the end car's coupling
plane (x 197 px, 26.5 m) and the ratio of the body's height between x 250 and x 600 (1.106) gives
d behind the tip from the image x; heights from the stripe (2.15 m) and the roof (3.65 m), 46 px/m
at 14 m back and about 53 px/m at the tip.

- Nose top on the centre line: 1.15 m at the tip, 1.72 m at 1.0 m, 1.82 m at 1.45 m, 1.94 m at
  2.3 m, 2.03 m at 3.2 m, 2.15 m at 4.1 m, 2.2 m at 5.1 m, 2.27 m at 6.0 m.
- Canopy: rises out of the nose 6.0 - 6.4 m back, its windscreen from about 7 m to 10.1 m, its top
  3.22 m at 10.1 m; the roof's full height about 13.8 m back (the 15 m nose of the published
  figures includes the cab sides' taper behind it).
- Green edge on the nose's side: level at the hatch's middle (about 1.15 m) back to 4.5 m, then
  1.24 m at 6.0 m, 1.68 m at 7.4 m, 1.86 m at 9.0 m, 1.98 m at 11 m; the stripe dies out on it about
  9 m back.
- Doors: a crew door 15.3 - 16.2 m and the passenger door 16.4 - 17.4 m behind the tip.
- Middle car (photo-e5-u2.jpg): the stripe about 0.14 m tall, its top 2.2 m up; the windows stand
  on it, about 0.47 m tall; the door's narrow window high in the leaf.
- Windscreen (photo-series-e5-u15-yamabiko-50.jpg head-on, photo-e5-u2.jpg, photo-h514-1-omiya-20160327.jpg):
  one very dark navy glass on the canopy's front, a wide trapezoid head-on - a level top edge under
  the green crown, a nearly straight foot, the sides slanting outward toward the bottom - wrapping
  round the front corners into side windows whose foot rises to meet their top about 3.5 m back; a
  thin black seal round it; the four headlights in a row inside it under its top edge, together
  about 40 % of the glass's width (u15). Head-on the glass is about 0.42 times as tall as it is wide.
- Colours sampled in diffuse light: tokiwa green about #0f8676 to #228779, the pink about #e2509a.

## Published figures

- **Dimensions** - Wikipedia "E5 Series": end car 26.5 m, intermediate 25.0 m, 3.35 m wide, 3.65 m high, 15 m nose, 320 km/h, from 2011; the H5 (2016) for JR Hokkaido; 17.5 m bogie centres (the Shinkansen standard).
- **Width** - narrowed to 3.24 - 3.28 m (the Shinkansen gauge's 3.3 m; the E6 keeps its own).
