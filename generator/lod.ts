// Audited family recipes, not polygon decimation. The input's scopes identify
// structural masses; each mass becomes a new closed, uniformly coloured hull.
import type { ProceduralDesign } from './design.ts';
import { envelope, normal, type EnvelopeFace } from './lodHull.ts';
export type LodFace = EnvelopeFace & { path?: string[]; scopeIds?: number[] };
export interface LodRecipe {
  family: string;
  vehicle: boolean;
  /** Include only these structural paths (case insensitive regular expression). */
  include: string;
  /** Number of named scopes defining one mass; 0 merges the chosen body. */
  depth: number;
  exclude?: string;
  /** Collapse several scopes into the same continuous mass. */
  merge?: string;
  allow?: string;
  aircraft?: boolean;
  deckOnly?: boolean;
  layered?: boolean;
}
export function lodBudget(design: ProceduralDesign): number {
  if (design.lodTriangles) return design.lodTriangles;
  if (/^(proc-building-)?sky-/.test(design.id) || /prague-main-station$/.test(design.id)) return 500;
  if (design.catalog?.category === 'Aircraft') return 200;
  if (['Historical', 'Towers'].includes(design.catalog?.category ?? '')) return 500;
  return 100;
}

const DETAIL = /windows?|windscreen|portholes?|glazing|logos?|emblems?|lettering|markings?|numbers?|plates?|signs?|clock faces|handrails?|railings?|rail posts|slats?|louvres?|grilles?|gutters?|seams?|lamps?|lights?|mirrors?|handles?|hinges?|wipers?|horns?|antenna|antennas|benches|planters?|furniture|fittings|shutters|quoins|banners|flag|ornament|balustrad|battlement|ribs|bracing|struts|strakes|bolts|pipes|safety valves|steps|ladder|scanners|insulators/i;
const RUNNING_GEAR = /wheel|bogie|axle|underframe|undercarriage|running gear|chassis|suspension|coupl|buffer|brake|pantograph|frame|equipment|reservoir|fender|mudguard|plough|track clear|rod|crosshead|spindle|lever|gear|bellows|joint|hanger|carriage|yoke|mast|skid|landing|slider|skirt|apron|gangway|beam|guard/i;
const VEHICLE_DETAIL_MATERIAL = /glass|window|rubber|tyre|tire|lamp|chrome|letter|logo|badge|number/i;

export function buildLodGeometry(input: LodFace[], budget: number, recipe: LodRecipe): LodFace[] {
  if (!Number.isInteger(budget) || budget < 12) throw new Error('invalid LOD budget');
  const include = new RegExp(recipe.include,'i'), exclude = recipe.exclude ? new RegExp(recipe.exclude,'i') : null;
  const merge = recipe.merge ? new RegExp(recipe.merge,'i') : null;
  const allow = recipe.allow ? new RegExp(recipe.allow, "i") : null;
  const masses = new Map<string,LodFace[]>();
  for (const f of input) {
    const path = f.path ?? [], text = path.join('/');
    if (!include.test(text) || exclude?.test(text)) continue;
    // Structural scopes such as 'roof and daylight' and 'glass bands' are
    // intentional masses. Only named detail sub-scopes are rejected.
    if (path.some(s => DETAIL.test(s) && !allow?.test(text) && !/^(?:chimney and service ladder|masonry and corner quoins|crossarms and hanging insulators)$/i.test(s))) continue;
    if (recipe.vehicle && (path.some(s => RUNNING_GEAR.test(s) && !/^airframe$/.test(s) && !allow?.test(text)) || VEHICLE_DETAIL_MATERIAL.test(f.material))) continue;
    let key = merge?.test(text) ? 'merged' : (f.scopeIds ?? []).slice(0,recipe.depth).join('/');
    if (recipe.aircraft) {
      const start = path[0] === 'airframe' ? 1 : 0;
      const depth = /^(wings|tail|engines)$/.test(path[start]) ? 2 : 1;
      key = (f.scopeIds ?? []).slice(0,start+depth).join('/');
    }
    if (recipe.layered) {
      const layers = path.slice(1).filter(s => /^(cap|lantern|spire|roof|hall roof|mansard|tent|dome|onion|shell|cupola)$/.test(s));
      key = `${f.scopeIds?.[0]}/${layers.join('/') || 'body'}`;
    }
    const list = masses.get(key) ?? []; list.push(f); masses.set(key,list);
  }
  if (!masses.size) throw new Error(`LOD recipe ${recipe.family} selected no structural geometry`);
  const groups = [...masses.values()];
  if (groups.length * 12 > budget) throw new Error(`LOD recipe ${recipe.family} has too many masses (${groups.length})`);
  const samples = groups.length*48 <= budget ? 26 : groups.length*24 <= budget ? 14 : 8;
  let spare = budget - groups.length*12;
  const allocated = groups.map(faces => {
    if (!recipe.layered) return samples;
    if (groups.length*24 <= budget) return 14;
    if (spare >= 12 && faces.some(f=>f.path?.some(s=>/^(dome|onion|shell|cupola)$/.test(s)))) { spare -= 12; return 14; }
    return 8;
  });
  const out: LodFace[] = [];
  for (const [groupIndex, faces] of groups.entries()) {
    const side = new Map<string,number>(), roof = new Map<string,number>(), roofFinish = new Map<string,number>();
    for (const f of faces) {
      const n = normal(f.points), area = Math.hypot(...n);
      if (n[1] < -area*.55) continue;
      const table = n[1] > area*.55 ? roof : side;
      table.set(f.material,(table.get(f.material)??0)+area);
      if (n[1] > 0 && /roof|tile|slate|copper/i.test(f.material)) roofFinish.set(f.material,(roofFinish.get(f.material)??0)+area);
    }
    const main = (scores:Map<string,number>, fallback:string) => [...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0] ?? fallback;
    const wall = main(side,faces[0].material), top = main(roofFinish,main(roof,wall));
    let points = faces.flatMap(f=>f.points);
    if (recipe.deckOnly && faces.every(f=>f.path?.[0]==='frame')) {
      const top = Math.max(...points.map(p=>p[1]));
      points = points.flatMap(p=>[[p[0],top,p[2]], [p[0],top-.15,p[2]]] as [number,number,number][]);
    }
    const hull = envelope(points,allocated[groupIndex] as 8|14|26,wall,top);
    // A paper-thin decorative plane is never a usable distant volume.
    out.push(...hull);
  }
  if (!out.length) throw new Error(`LOD recipe ${recipe.family} produced no volume`);
  if (out.length > budget) throw new Error(`LOD recipe ${recipe.family} exceeds ${budget} triangles`);
  // Adjacent masses may share a plane (especially their closed undersides).
  // Give that whole plane one finish, so overlapping structural surfaces cannot
  // alternate colours in the depth buffer. No offset or transparent overlay.
  const planes = new Map<string,LodFace[]>();
  for (const f of out) {
    const n = normal(f.points), length = Math.hypot(...n);
    const unit = n.map(x=>x/length);
    const offset = unit.reduce((sum,x,k)=>sum+x*f.points[0][k],0);
    const key = [...unit,offset].map(x=>Math.round(x*1e5)).join(',');
    const list = planes.get(key) ?? []; list.push(f); planes.set(key,list);
  }
  for (const faces of planes.values()) {
    const area = new Map<string,number>();
    for (const f of faces) area.set(f.material,(area.get(f.material)??0)+Math.hypot(...normal(f.points)));
    const material = [...area].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
    for (const f of faces) f.material = material;
  }
  return out;
}

// Explicit coverage: a new catalog family needs an intentional LOD recipe.
const FAMILIES: Record<string, readonly string[]> = {
  "skyscrapers": [
    "sky-glass-office",
    "sky-art-deco",
    "sky-pagoda",
    "sky-brick-residential",
    "sky-twin-towers",
    "sky-twisted",
    "sky-dark-slab",
    "sky-bullet",
    "sky-terraced",
    "sky-pyramid"
  ],
  "commercialStreets": [
    "commercial-modern",
    "commercial-balcony",
    "commercial-annex",
    "commercial-brick",
    "commercial-tenement",
    "commercial-shop",
    "commercial-barrel",
    "commercial-terrace",
    "commercial-gable",
    "commercial-baroque",
    "commercial-classical"
  ],
  "commercial": [
    "comm-corner-shop",
    "comm-balcony-house",
    "comm-market-block",
    "comm-terrace-house",
    "comm-office-house"
  ],
  "legacyBuildings": [
    "castle",
    "hist-colosseum",
    "hist-pagoda",
    "hist-palace",
    "station-hotel"
  ],
  "fountains": [
    "fountain-classical",
    "fountain-modern",
    "fountain-obelisk"
  ],
  "churches": [
    "baroque-church",
    "church-vrchlabi",
    "twin-tower-baroque-church"
  ],
  "cathedrals": [
    "st-basils-cathedral",
    "st-nicholas-church"
  ],
  "gothicCathedrals": [
    "notre-dame",
    "prague-castle-st-vitus"
  ],
  "towers": [
    "tower-bell",
    "tower-bigben",
    "tower-eiffel",
    "tower-radio",
    "tower-stone",
    "tower-kenney",
    "tower-transmission",
    "tower-watch"
  ],
  "landmarks": [
    "brandenburg-gate",
    "louvre-pyramid",
    "white-house"
  ],
  "industry": [
    "ind-building-a",
    "ind-building-h",
    "ind-building-k",
    "ind-building-s",
    "ind-chimney-basic",
    "ind-detail-tank",
    "industry-factory-a",
    "industry-power-plant",
    "chemical-factory",
    "industry-oil-pump",
    "industry-wind-turbine"
  ],
  "stations": [
    "prague-main-station",
    "station-building",
    "station-halt",
    "suburban-station"
  ],
  "village": [
    "village-timber-cottage",
    "village-timber-house",
    "village-cottage",
    "village-l-house",
    "village-family-house",
    "village-modern-house",
    "village-narrow-house"
  ],
  "wagonExtras": [
    "legacy-covered-wagon",
    "legacy-open-wagon",
    "legacy-heavy-wagon"
  ],
  "legacyVehicles": [
    "cabin-classic",
    "boeing-737",
    "ocean-liner"
  ],
  "vehicles": [
    "american-truck",
    "cd-150",
    "cd-163",
    "cd-230",
    "cd-263",
    "csd-classic-green-coach",
    "csd-balm",
    "csd-bam",
    "csd-bdmtee",
    "csd-be31",
    "csd-bi20",
    "csd-dsk",
    "bmo-double-deck-coach",
    "cd-green-white-coach",
    "nas-flat-wagon",
    "ua-open-wagon",
    "eas-open-wagon",
    "raj-hopper-wagon",
    "rah-tank-wagon"
  ],
  "steamLocos": [
    "csd-433-0",
    "csd-456-0",
    "csd-475-1",
    "csd-477-0",
    "csd-498-1",
    "csd-556-0",
    "csd-636",
    "csd-386",
    "csd-m112"
  ],
  "czElectrics": [
    "cd-110",
    "cd-130",
    "cd-140",
    "cd-169"
  ],
  "freightWagons": [
    "sqns-container-wagon",
    "pao-flat-wagon",
    "habis-sliding-wall-wagon",
    "hadgs-hopper-wagon",
    "faccs-hopper-wagon",
    "falls-hopper-wagon",
    "wap-hopper-wagon"
  ],
  "mainlineElectrics": [
    "cd-180",
    "dnt-184-5",
    "db-111",
    "dr-243",
    "obb-1012",
    "obb-1040"
  ],
  "smallDiesels": [
    "cd-704",
    "cd-710",
    "cd-714",
    "cd-742",
    "db-212",
    "muv-69"
  ],
  "trucks": [
    "tatra-815-tipper",
    "praga-rv",
    "mercedes-atego-1224",
    "cistern-semi-truck",
    "mixer-truck",
    "reefer-semi-truck"
  ],
  "karosa": [
    "karosa-short",
    "karosa-long"
  ],
  "cityBuses": [
    "karosa-renault-citybus-12m",
    "karosa-renault-citybus-18m",
    "mb-citaro",
    "mb-citaro-blue",
    "mb-o345-g",
    "solaris-urbino-15",
    "bus-1"
  ],
  "aircraft": [
    "aero-a10",
    "airbus-a380",
    "light-jet"
  ],
  "ships": [
    "cruise-ferry",
    "hydrofoil-ferry",
    "passenger-ferry"
  ],
  "cableCabins": [
    "cablecar-cabin",
    "gondola-cabin"
  ],
  "emu471": [
    "cd-471"
  ],
  "emu680": [
    "cd-680"
  ],
  "dieselLocos": [
    "cd-750",
    "cd-749",
    "cd-781",
    "csd-t679-0",
    "csd-t499",
    "cd-771"
  ],
  "trams": [
    "tatra-t3",
    "tatra-t6",
    "tatra-kt8",
    "tatra-kt4",
    "kvag-gt4"
  ],
  "metro": [
    "metro-81-71"
  ],
  "emu451": [
    "cd-451"
  ],
  "emu460": [
    "cd-460"
  ],
  "emu470": [
    "cd-470"
  ],
  "czDmus": [
    "cd-810",
    "cd-812",
    "cd-843",
    "csd-m131",
    "csd-m240",
    "csd-m296"
  ],
  "db628": [
    "db-628"
  ],
  "mavMdmot": [
    "mav-mdmot"
  ],
  "ice1": [
    "ice-1"
  ],
  "tgv": [
    "tgv"
  ],
  "czskCoaches": [
    "cd-y-coach",
    "zsr-coach",
    "uic-z-coach"
  ],
  "germanCoaches": [
    "db-n-wagen",
    "db-dosto",
    "dr-sbahn-berlin"
  ]
};

/** Recipes describe complete masses, not a quota of surviving source polygons. */
export function lodRecipe(design: ProceduralDesign): LodRecipe {
  const id = design.id.replace(/^proc-(?:building|vehicle)-/,'').replace(/^veh-|^bld-/,'');
  const family = Object.keys(FAMILIES).find(f=>FAMILIES[f].includes(id));
  if (!family) throw new Error(`No reviewed LOD family for ${design.id}`);
  const vehicle = design.id.startsWith('proc-vehicle-') || design.id.startsWith('veh-');
  const recipe = (include:string, depth=1, extra:Partial<LodRecipe>={}):LodRecipe => ({family,vehicle,include,depth,...extra});
  if (vehicle) {
    if (design.catalog?.category === 'Aircraft') return recipe('^(airframe/)?(fuselage|wings|tail|engine)',2,{aircraft:true});
    if (design.catalog?.category === 'Ships') return recipe('^(hull|superstructure|saloon|wheelhouse|upper house|upper deck|decks|funnels?)(/|$)',1);
    if (id === 'csd-m112') return recipe('^body/(boiler|boiler casing|chimney|van body|roof|cab sides|cab front wall)(/|$)',2,{merge:'^body/(van body|roof|cab sides|cab front wall)'});
    if (family === 'steamLocos') return recipe('^body/(body|tank top|boiler|boiler casing|chimney|cab|side tanks|bunker|coal box|van body|tender|water tank|coal)(/|$)',2,{exclude:'cab overhang|cab rear wall'});
    if (id === 'sqns-container-wagon') return recipe('^(frame|cargo)(/|$)',1,{allow:'^frame(/|$)',deckOnly:true});
    if (id === 'pao-flat-wagon') return recipe('^(frame/deck|cargo)(/|$)',1,{allow:'^frame/deck'});
    if (id === 'muv-69') return recipe('^(cab|underframe/deck)(/|$)',1,{allow:'^underframe/deck'});
    if (family === 'trams') return recipe('^(body|section[0-9]+/body)(/|$)',1);
    if (family === 'smallDiesels') return recipe('^body/((long |short )?hood|cab|body|shell)(/|$)',2);
    if (id === 'cd-771') return recipe('^(short hood|long hood|cab)(/|$)',1);
    if (family === 'czElectrics' && id === 'cd-110') return recipe('^(cab|rear hood|front hood)(/|$)',1);
    if (id === 'mixer-truck') return recipe('^body/(cab|mixer/drum/shell)(/|$)',2);
    if (family === 'trucks' || family === 'karosa' || family === 'cityBuses' || (family === 'vehicles' && design.catalog?.category !== 'Rail vehicles' && !/^cd-|^csd-|wagon|coach/.test(id))) {
      return recipe('^(body|truck|trailer|section[0-9]+)(/|$)',1);
    }
    if (family === 'cableCabins' || family === 'legacyVehicles') return recipe('^body(/|$)',0);
    // The 810's and 812's cab ends are their own painted noses (cabNose.ts), not part of the shell.
    if (id === 'cd-810' || id === 'cd-812') return recipe('^(shell|front end/skin|rear end/skin)(/|$)',1);
    if (design.catalog?.group === 'wagon') return recipe('^(body|open body|hoppers?|tank|cargo|load|deck|low deck)(/|$)',1);
    // Coaches, units, trams and box locomotives form one uninterrupted shell.
    // Including the structural cab/nose closes shaped ends without copying glazing.
    return recipe('^(body|shell|cab|rear cab|front cab|nose|roof)(/|$)',0);
  }
  if (id === 'sky-twin-towers') return recipe('^(podium|west tower|east tower|sky bridge)(/|$)',2,{exclude:'struts'});
  if (family === 'skyscrapers') return recipe('^(podium|shaft|crown|plinth|tier [0-9]+|base|segment [0-9]+|roof|west tower|east tower|sky bridge|floors|lobby|plant floor|glass bands|tip|step [0-9]+|spire|west wing|east wing)(/|$)',1,{exclude:'roof/(water tank|stair house)'});
  if (family === 'commercialStreets') return recipe('^(masonry and storey bands|roof and equipment|side shop wing|street gable)(/|$)',1);
  if (family === 'commercial') return recipe('^(bevelled plinth|storey [0-9]+|parapet roof|setback terrace)(/|$)',1,{merge:'^(bevelled plinth|storey [0-9]+)(/|$)'});
  if (family === 'village') return recipe('^(house|main block|wing|garage|ground floor|upper storey|flat roof|carport|plaster and stone shell|sculpted barrel tiles)(/|$)',1);
  if (family === 'industry') return recipe('^(Industrial assembly|tower|rotor)(/|$)',2);
  if (family === 'landmarks') return recipe('^(gate/(piers|columns|entablature|attic)|pyramid/glazing|white house/(residence|north portico|south portico|west wing|east wing))(/|$)',2,{allow:'^pyramid/glazing'});
  if (id === 'prague-main-station') return recipe('^(central hall|west tower|east tower|west wing|east wing|west link|east link)(/|$)',2,{layered:true,exclude:'pilaster|window|clock|lantern|finial|dormer|rib|pinnacle|crest|spandrel|archivolt|tracery|arcade'});
  if (family === 'stations') return recipe('^(central hall|west tower|east tower|west wing|east wing|west link|east link|main block|pavilion|end pavilion|building|roof|wings|hall|plinth|canopy|platform canopy)(/|$)',1);
  if (family === 'towers') return recipe('^(Stone and timber storeys|Open belfry and bell|Steep gabled roof|Stone shaft and plinth|Belfry and Gothic roof|Painted lattice mast|Masonry and corner quoins|Octagonal stone drum|Corbelled crown|Galvanized lattice shaft|Crossarms and hanging insulators)(/|$)',1);
  if (family === 'churches' || family === 'cathedrals') return recipe('^(podium|nave|apse|aisles|facade|tower|cap|spire|west tower|east tower|central tower|.*chapel|bell tower|south tower|north tower|great dome|apse turret)(/|$)',2,{layered:true,exclude:'pilaster|buttress|kokoshnik|finial|cross|orb|statue|niche|portal|clock|urn|volute|obelisk|lucarne|pinnacle|cupola|gallery|side/(?!roof)|columns' + (id === 'twin-tower-baroque-church' ? '' : '|lantern')});
  if (family === 'gothicCathedrals') return recipe('^(nave|apse|aisles|facade|tower|cap|spire|west tower|east tower|central tower|.*chapel|bell tower|south tower|north tower|great dome|apse turret|nave and choir|polygonal apse|transept|west facade|north west tower|south west tower|great south tower|crossing fleche)(/|$)',1);
  if (family === 'legacyBuildings') return recipe('^(courtyard|curtain-walls|tower|keep|arcades|seating|storeys|palace|station)(/|$)',1);
  if (family === 'fountains') return recipe('^(basin|tiers|obelisk)(/|$)',1);
  throw new Error(`No reviewed LOD recipe for ${family}`);
}
