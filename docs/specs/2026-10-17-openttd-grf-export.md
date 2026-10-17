# OpenTTD GRF export

Status: draft
Date: 2026-10-17
Area: catalog site (`src/`), browser-side rendering and GRF encoding; docs

## Context of the change

The factory builds every model as a standalone JS module (`export/js/<id>.js`,
`build(THREE, params, lod)`, docs/models/js-format.md) and lists them on the
catalog site (`src/App.tsx`, `src/ModelTable.tsx`, `src/ModelCards.tsx`,
`src/catalogQuery.ts`, docs/site/catalog-site.md). The site already loads a
model's module in the browser and builds it with three.js for the preview
(`src/ModelViewer.tsx`, lazily imported). The listing has a search box and up to
three rows of filter chips (fleet, group, traction); all state is in the URL.

Every vehicle carries game properties (`game`: weight t, power kW, maxspeed
km/h, accel m/s2, per-variant overrides; docs/models/game-properties.md), and the
catalog record (`catalog.json`) inherits them, so the browser already has the
running figures an OpenTTD vehicle needs.

OpenTTD cannot load 3D models. Its add-on format is the NewGRF (`.grf`): 2D
sprites in a dimetric projection, 8 view directions per vehicle, plus properties
set by binary "actions". Sets are normally compiled from NML with the Python
`nmlc`, which cannot run in the browser.

Nothing in the repository writes sprites in OpenTTD's projection, encodes a
GRF, or lets the user select several models in the listing. The listing has no
selection state at all.

## User request

Is it possible to export models from Rail Island Factory into a format OpenTTD
accepts? (Analysis given: yes, by rendering sprites and building a NewGRF.)

Then: I want GRF export from the factory UI. It should run on the frontend. Add
checkboxes to models (with the ability to check all filtered); an Export button
creates a GRF for OpenTTD with the checked models.

## Decisions

## High-level plan

## Database and persistent storage

## Architecture decisions

## Weaknesses and risks

## Out of scope
