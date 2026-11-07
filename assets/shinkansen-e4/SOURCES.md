# Shinkansen E4 Max source references

**Covers** - provenance of the Shinkansen E4 Max model (`proc-vehicle-shinkansen-e4`): photographs, measurements and published dimensions.
**Code** - `generator/shinkansen.ts` (`E4`, `E4_FACE`)
**See also** - [the reference](../../docs/models/shinkansen.md)

## Photographs

From Wikimedia Commons (`pnpm refs:fetch`). Sets P13, P20 (toki livery), set P3 (Max livery) and set P13's
end car E453-113 and intermediate cars E455-113 / E456-113 on their last run (Kumagaya, 2021).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-e4-p20.jpg` | Series-E4-P20.jpg | https://commons.wikimedia.org/wiki/File:Series-E4-P20.jpg | MaedaAkihiko | CC BY-SA 4.0 | front three-quarter: the beak, the eye windscreen, the lamps' housings, the line on the beak's rim |
| `photo-e4-p13.jpg` | Series-E4-P13.jpg | https://commons.wikimedia.org/wiki/File:Series-E4-P13.jpg | MaedaAkihiko | CC BY-SA 4.0 | front three-quarter: the line falling along the nose's side, the head's dome, colours |
| `photo-e453-113-kumagaya-20210918.jpg` | E453-113 Kumagaya 20210918.JPG | https://commons.wikimedia.org/wiki/File:E453-113_Kumagaya_20210918.JPG | Rsa | CC BY-SA 3.0 | end car side-on: the nose's profile, windows and doors of both decks, the nose's two doors, the line's heights, bogie |
| `photo-e4-frontview.jpg` | E4 FrontView.jpg | https://commons.wikimedia.org/wiki/File:E4_FrontView.jpg | The original uploader was あごちくわ at Japanese Wikipedia. | CC BY-SA 3.0 | head-on (Max livery): the beak's outline and width, the eye windscreen's shape, lamp positions, wiper |
| `photo-shinkansene4newcolorandoldcolor.jpg` | ShinkansenE4NewColorAndOldColor.jpg | https://commons.wikimedia.org/wiki/File:ShinkansenE4NewColorAndOldColor.jpg | Ippukucho | CC BY 3.0 | both liveries: the Max yellow line has the toki pink line's place; the nose's right side (its tall-window door first), the side hollow under the head |
| `photo-e455-113-kumagaya-20210918.jpg` | E455-113 Kumagaya 20210918.JPG | https://commons.wikimedia.org/wiki/File:E455-113_Kumagaya_20210918.JPG | Rsa | CC BY-SA 3.0 | the modelled intermediate car side-on: toilet windows, two doors, six windows a deck, the rear two-leaf hatch, bogies |
| `photo-e456-113-kumagaya-20210918.jpg` | E456-113 Kumagaya 20210918.JPG | https://commons.wikimedia.org/wiki/File:E456-113_Kumagaya_20210918.JPG | Rsa | CC BY-SA 3.0 | a second intermediate car: confirms the window rows, door and hatch positions |

## Measurements

The side photographs are oblique: the car's length was fitted by a 1-D projective map from the window
rows' height in px (the vertical scale grows linearly along the car, the horizontal with its square),
anchored at the tip and the car's end and checked against equal window widths (1.52 - 1.57 m each) and
the door's 1.05 m; the centre line (the nose's silhouette) corrected for its 1.6 m further from the camera.

- Nose (E453-113): tip 1.18 m high; beak top 1.9 - 2.2 m at 1 - 2.6 m behind the tip; the windscreen's
  foot 2.65 m at 4.0 m, its head 3.06 m at 5.1 m; the roof's full height at 11.3 - 11.6 m (published 11.5 m).
- Head on (E4 FrontView, about 135 px/m): beak 2.1 m wide; windscreen 1.9 m wide, an eye 0.5 m tall;
  lamps at +-1.2 m in 0.45 x 0.27 m housings.
- Line: 2.08 - 2.37 m along the cars, falling from 9.5 m behind the tip to 1.15 - 1.30 m at the tip.
- Windows: lower deck 1.10 - 1.69 m, upper deck 3.03 - 3.72 m; doors 1.15 - 3.14 m, a 0.34 m window
  2.19 - 2.93 m. End car: crew doors 8.07 - 8.69 and 9.32 - 9.98 m behind the tip, four windows a deck
  from 12.0 m, the door 20.4 - 21.4 m, the rear bogie 22.4 m. Intermediate car (from its front end): toilet
  windows 0.6 - 3.1 m, doors 4.0 - 5.1 and 19.5 - 20.6 m, six windows a deck 7.1 - 17.5 m, the hatch
  22.15 - 24.43 m, bogies 3.95 and 21.45 m.
- Colours sampled: blue #1f3080 in sun, toki line #f08f86 - #fea5b5.

## Published figures

- **Dimensions** - ja.wikipedia "新幹線E4系電車": end car 25.7 m (nose 11.5 m), intermediate 25.0 m, 3.38 m wide, 4.485 m high, bogie centres 17.5 m, 240 km/h, 1997 - 2021.
- **Width** - narrowed to 3.24 m (the Shinkansen gauge's 3.3 m).
