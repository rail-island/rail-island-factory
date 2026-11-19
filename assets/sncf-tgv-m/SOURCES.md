# TGV M source references

**Covers** - provenance of the TGV M model (`proc-vehicle-sncf-tgv-m`): six photographs and the published figures.
**Code** - `generator/frTgvM.ts`
**See also** - [the reference](../../docs/models/france-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). The running number of each
photographed set is in the `use` column. Scales: Plouaret 39 px/m vertically at the nose, 28.7 px/m at
the power car's rear end (a 1-D projective fit along the car, the power car taken as 18.25 m);
Poitiers 29.8 px/m along the trailers (a trailer 185 px joint to joint = 17.7 m).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-tgm-m-gare-de-lyon-3-cropped.jpg` | TGM M à gare de Lyon (3) (cropped).jpg | https://commons.wikimedia.org/wiki/File:TGM_M_%C3%A0_gare_de_Lyon_(3)_(cropped).jpg | Rémi Simonnin | CC BY-SA 4.0 | set 997 (white): the nose three-quarter - the snout, the windscreen's trapezoid, the oval lamps, the roof fairings and the raised single-arm pantograph in their gap |
| `photo-tgv-m-1402-in-tournai-power-car-profile-55145071456.jpg` | TGV-M 1402 in Tournai - power car profile (55145071456).jpg | https://commons.wikimedia.org/wiki/File:TGV-M_1402_in_Tournai_-_power_car_profile_(55145071456).jpg | Jon Worth from Germany | CC BY-SA 4.0 | set 1402 (power car 42003): the black mask's outline, the snout's black lip, the lamp slots, the cab side window, the grey skirt line |
| `photo-2026-10-05-tgv-m-rame-1021-acheminee-a-la-gare-de-nancy-02.jpg` | 2026-10-05 TGV-M rame 1021 acheminée à la gare de Nancy 02.jpg | https://commons.wikimedia.org/wiki/File:2026-10-05_TGV-M_rame_1021_achemin%C3%A9e_%C3%A0_la_gare_de_Nancy_02.jpg | Florian Cuny | CC BY-SA 4.0 | set 1021: the series inOui scheme - pale silver, the carmine inOui name and doors |
| `photo-2025-08-01-tgv-m-1005-near-la-rochelle.jpg` | 2025-08-01, TGV M 1005 near La Rochelle.jpg | https://commons.wikimedia.org/wiki/File:2025-08-01,_TGV_M_1005_near_La_Rochelle.jpg | Patrycja Rosa (ptrcnull) | CC BY 4.0 | set 1005 (the modelled inOui number): the logo's place behind the cab door, the trailers' carmine doors, the grey skirt |
| `photo-tgv-m-998-en-gare-de-poitiers.jpg` | TGV M 998 en gare de Poitiers.jpg | https://commons.wikimedia.org/wiki/File:TGV_M_998_en_gare_de_Poitiers.jpg | AFooz | CC0 | set 998 (trial scheme): the trailers side-on - five upper and four lower windows, the frosted panel, the door at the rear end and the small upper window behind it; the power car's bogie positions |
| `photo-tgv-m-plouaret.jpg` | TGV M Plouaret.jpg | https://commons.wikimedia.org/wiki/File:TGV_M_Plouaret.jpg | Spendeau | CC BY-SA 4.0 | set 997, nearly side-on: the nose's profile and rake, the snout, windscreen, lamp, side window and cab door positions; the end trailer's layout |

The Ouigo scheme follows the Ouigo Duplex sets (`generator/tgvDuplex.ts`): no TGV M has run in Ouigo
colours yet (set 1403, planned for 2027, is the modelled number).

## Published figures

- **Figures** - fr.wikipedia, [Avelia Horizon](https://fr.wikipedia.org/wiki/Avelia_Horizon): 2.904 m wide, 4.318 m high, 11 bodies 202 m (power cars of about 18 m, trailers 1 m shorter than the Duplex's 18.7 m), Bo'Bo' power cars, 8 x 1,000 kW motors, 7,760 kW under 25 kV, 320 km/h, 413.5 t, 600 - 740 seats (`generator/frTgvM.ts`, `generator/openttdTable.ts`).
