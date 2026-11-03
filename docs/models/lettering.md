# Lettering

**Covers** - the stroke font that paints words on a model (an operator's wordmark): its glyphs, its style, the wordmark of coloured runs, how a builder places one on a side or an end, its triangle cost, and the tests.
**Code** - `generator/letters.ts` (`letters`, `wordWidth`, `wordmarkAt`, `runsWidth`, `Wordmark`, `LetterStyle`), `generator/cd163.ts`, `generator/cd150.ts`, `generator/cd750.ts`, `generator/vectron.ts`, `generator/uicZCoach.ts`, `test/letters.test.ts`, `test/czskCoaches.test.ts`
**See also** - [loco-liveries.md](loco-liveries.md) (the liveries that carry a wordmark), [vectron.md](vectron.md), [vehicles.md](vehicles.md) ("Running numbers": the numerals of the plates)

## The font

`letters(text, u0, v0, h, flipU, style)` returns triangles (u, v), three points a
triangle, for a surface's decal: `h` is the capitals' height, `v0` the baseline,
`u0` the first glyph's left edge as the reader sees it, and `flipU` reads the text
toward -u (a surface seen from its -u side, as the plates' `lettering` in
`cd163.ts` does). It is geometry like any other decal: the game draws it as part
of the model and needs nothing of its own.

- **Glyphs**: the capitals A - Z (lower case is drawn as capitals), the digits,
  `-`, `.`, `|` and the space, and the Czech accented capitals Č Ř Š Ž Ě É Á Í Ý
  (a hacek or an acute over the base letter, up to 0.35 of the height above it).
  A character outside the set throws.
- **Strokes**: each glyph is centre-line polylines in a unit box; a segment is a
  bar `weight` of the height thick (two triangles) with square caps at the free
  ends. Where a line bends by more than 60 degrees, one triangle fills the wedge
  on the outside of the bend (on the inside the bars overlap; a gentler bend
  leaves a notch under 7 % of the stroke). Round and diagonal glyphs overshoot the
  box by a few percent of the height, as type does.
- **Style** (`LetterStyle`): `width` (a glyph box's width over the height for a
  glyph of unit width, 0.62 by default), `weight` (0.16), `gap` (0.16) and `slant`
  (u moves by slant times the height above the baseline; 0.2 for RegioJet's
  italic).

The font lives in its own module so that only the designs that letter a word
bundle it; the plates' numerals stay in `cd163.ts`.

## Wordmarks

A `Wordmark` on a livery is data:

- `runs`: the text in coloured runs, set one glyph gap apart - RegioJet's
  `[["|| REGIO", red], ["JET", navy]]`, CD's `[["České dráhy", "logo"]]`;
- `style`;
- `side`: the cap height `h`, the baseline `v` and the centre `u` on the sides,
  or no `u` to set it after the side emblem (a 0.12 m gap);
- `end`: the cap height, baseline and centre on the ends.

Positions are the reader's: `u` runs to the reader's right from the middle of
the side or the end, so the left side and the front are mirrored and both sides
and both ends read alike. `wordmarkAt(runs, at, v0, h, flipU, style, align)`
returns the triangles per material, from `at` or centred on it.

| design | livery | sides | ends |
|---|---|---|---|
| `veh-cd-163` | `regiojet` (RegioJet 162) | "\|\| REGIO" red, "JET" navy, 0.55 m, from the cab at the reader's left | the same, 0.10 m, right of the middle |
| `veh-cd-163` | `cdBlue` (CD 162 blue) | "České dráhy" 0.14 m after the emblem | - |
| `veh-cd-150` | `cdBlue` (CD 150 blue) | "České dráhy" 0.13 m after the emblem | - |
| `veh-cd-263` | `cd371Blue` (CD 371 blue) | "České dráhy" 0.15 m after the emblem | - |
| `veh-cd-750` | `cd754Blue` (CD 754 blue) | "České dráhy" 0.14 m after the emblem, behind the radiator | - |
| `veh-vectron` | `regiojet` | "\|\| REGIO" red, "JET" navy, 0.50 m, behind the cab door at the reader's left | the same, 0.10 m, left of the middle |
| `veh-uic-z-coach` | `operator=regiojet` | "\|\| REGIO" red, "JET" navy, 0.32 m, on the lower yellow 6 m left of the middle | - |

A wordmark costs about 13 triangles a capital: "České dráhy" 144, "|| REGIOJET"
about 120. A livery without one draws nothing new, so the shipped liveries' GLBs
do not change.

## Tests

`test/letters.test.ts`: every glyph draws and an unknown one throws; lower case
is drawn as capitals; straight glyphs fill their box exactly and the others stay
within a few percent of it; the accents stand over the capital; flipping
mirrors the text and the slant leans it; a wordmark's runs are one gap apart and
centre where asked; no triangle is degenerate. On the models: RegioJet's two
colours on both sides and both ends of the 162 and the Vectron; CD's name after
the emblem on the blue 162 and 150 and on no older livery; the 162's lettering
clear of its side number plate.
