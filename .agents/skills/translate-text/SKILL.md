---
name: translate-text
description: Fill the factory's exported text in all 14 game languages - translate every missing English string into text/<code>.json, drop stale phrases, mark proper-noun titles verbatim - so `pnpm test` (test/text.test.ts) and the game's import pass. Use in every change that adds or rewords exported text (a model title, a parameter title or value, a set type name or description, a woods or species name), as the last step of the model skills, and whenever test/text.test.ts reports gaps.
---

# Translate exported text

The factory exports its text in the game's 14 languages (docs/models/text.md). English is
authored where it lives (a design's `title`, its parameters' titles, the set registry, the
woods types); the other 13 languages are phrasebooks in `text/<code>.json` keyed by the
English itself. A change that adds or rewords exported text carries all 13 translations in
the same change.

## Steps

1. List the gaps: `pnpm exec tsx generator/textGaps.ts` prints, per language, the missing
   English strings, the stale phrases and the unused overrides (the same check
   `test/text.test.ts` runs).
2. Decide what is a name. A proper-noun title - a class designation ("CD 043", "Class 471"),
   a brand ("Karosa", "Tatra"), a named building ("Eiffel Tower" is translated, "Petronas
   Towers" is a name) - goes into `text/verbatim.json` once and is copied unchanged into
   every language. Descriptive titles ("Classic Cottage", "Container Wagon"), parameter
   titles and values, type names and descriptions are translated.
3. Translate each missing string into every language and add it to `phrases` in that
   language's file, keyed by the exact English. Keep the game's tone: short, plain UI
   wording; keep numbers, units and placeholders as they are; Czech and Slovak use the
   terminology of Czech and Slovak railways.
4. Where one English string needs different wordings for different keys (a value whose
   grammatical gender follows its parameter), add an entry to `overrides` keyed by the full
   text key (`model.<id>.param.<name>.<value>`) instead.
5. Delete every stale phrase the check lists (its English is no longer exported).
6. Run `pnpm exec tsx generator/textGaps.ts` again: it must print nothing. Then
   `pnpm test test/text.test.ts`.

Keep each file sorted by key (the script `generator/textGaps.ts --sort` rewrites them sorted).
