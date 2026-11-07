// The Animals category (docs/models/draft-animals.md): each draft animal of the
// kit (draftAnimals.ts) as a design of its own, in its harness and walking its gait,
// for the factory site to browse. The game never places one: the animals reach it
// only drawn by the animal-drawn vehicles, so no game meta file lists them.

import { MeshBuilder } from "./meshBuilder.ts";
import type { CatalogFields, ParamValues, ProceduralDesign } from "./design.ts";
import { addGait, animalPalette, drawAnimal, FULL, SPECIES_SPECS, teamLod, type Species } from "./draftAnimals.ts";

/** The catalog fields every animal shares: a category of its own, in metres. */
export const ANIMAL_CATALOG: CatalogFields = {
  category: "Animals",
  group: "animal",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** One animal standing in its harness, walking its gait in place. */
function animal(species: Species): MeshBuilder {
  const m = new MeshBuilder(animalPalette([species]));
  m.scope(species, () => drawAnimal(m, species, "animal-1", 0, 0, FULL));
  addGait(m, species, [{ prefix: "animal-1", x: 0, z: 0, phase: 0 }], [0, 0, 0]);
  return m;
}

/** Its distant model: the team's two side boxes. */
function animalLod(species: Species): MeshBuilder {
  const m = new MeshBuilder(animalPalette([species]));
  const s = SPECIES_SPECS[species];
  // teamLod places the animal ahead of a hitch: put the hitch where the animal stands at x 0
  const gap = -s.barrel[0]![0] + 1.1 * (s.legs.top / 1.08);
  teamLod(m, species, 1, -gap);
  return m;
}

export const animalHorse = (_p?: ParamValues) => animal("horse");
export const animalHorseLod = (_p?: ParamValues) => animalLod("horse");
export const animalDonkey = (_p?: ParamValues) => animal("donkey");
export const animalDonkeyLod = (_p?: ParamValues) => animalLod("donkey");
export const animalMule = (_p?: ParamValues) => animal("mule");
export const animalMuleLod = (_p?: ParamValues) => animalLod("mule");
export const animalCow = (_p?: ParamValues) => animal("cow");
export const animalCowLod = (_p?: ParamValues) => animalLod("cow");
export const animalCamel = (_p?: ParamValues) => animal("camel");
export const animalCamelLod = (_p?: ParamValues) => animalLod("camel");
export const animalElephant = (_p?: ParamValues) => animal("elephant");
export const animalElephantLod = (_p?: ParamValues) => animalLod("elephant");

const TABLE: ReadonlyArray<[Species, (p?: ParamValues) => MeshBuilder, (p?: ParamValues) => MeshBuilder]> = [
  ["horse", animalHorse, animalHorseLod],
  ["donkey", animalDonkey, animalDonkeyLod],
  ["mule", animalMule, animalMuleLod],
  ["cow", animalCow, animalCowLod],
  ["camel", animalCamel, animalCamelLod],
  ["elephant", animalElephant, animalElephantLod],
];

/** The six draft animals, `proc-animal-<species>`. */
export const DRAFT_ANIMALS: readonly ProceduralDesign[] = TABLE.map(([species, build, buildLod]) => ({
  id: `proc-animal-${species}`,
  title: SPECIES_SPECS[species].title,
  build,
  buildLod,
  lodTriangles: 100,
  references: "draft-animals",
  catalog: ANIMAL_CATALOG,
}));
