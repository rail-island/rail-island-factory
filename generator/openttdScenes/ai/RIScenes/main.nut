// The scene AI (info.nut): on a flat 64 x 64 map it builds one scene (its "scene"
// setting: railway, road, harbour or airport) round tile (32, 32), where OpenTTD
// opens a loaded game's view, and idles (the prerender saves that game: the scene
// without vehicles); in that game loaded again it buys the marker vehicles of the
// marker GRF (markers.ts) and stops each at its slot. The layout is
// the prerender's (prerender.ts SCENES): the slot numbers here are the markers'.

function T(x, y) { return AIMap.GetTileIndex(x, y); }

class RIScenes extends AIController {
  plain = null;
  electric = null;
  road = null;
  tram = null;
  depots = null;
  // vehicles still running towards their slots: [vehicle, function(tile) -> stop?]
  running = null;

  function Start();
}

function RIScenes::Fail(what) {
  AILog.Error("RIScenes: failed: " + what + ": " + AIError.GetLastErrorString());
}

function RIScenes::Check(ok, what) {
  if (!ok) this.Fail(what);
  return ok;
}

function RIScenes::Level(x0, y0, x1, y1) {
  AITile.LevelTiles(T(x0, y0), T(x1 + 1, y1 + 1));
  for (local x = x0; x <= x1; x++) for (local y = y0; y <= y1; y++) {
    local t = T(x, y);
    if ((AITile.IsRockTile(t) || !AITile.IsBuildable(t)) && !AITile.IsWaterTile(t)) AITile.DemolishTile(t);
  }
}

function RIScenes::Trees(list) {
  foreach (p in list) AITile.PlantTree(T(p[0], p[1]));
}

// --- railway (x 12..44, y 10..44) -------------------------------------------------

function RIScenes::RailAxis(rt, depotX, depotY, frontX, frontY, endX, endY) {
  AIRail.SetCurrentRailType(rt);
  this.Check(AIRail.BuildRailDepot(T(depotX, depotY), T(frontX, frontY)), "rail depot " + depotX + "," + depotY);
  local dx = frontX - depotX, dy = frontY - depotY;
  this.Check(AIRail.BuildRail(T(depotX, depotY), T(frontX, frontY), T(endX + dx, endY + dy)), "rail " + frontX + "," + frontY);
  return T(depotX, depotY);
}

// A diagonal line heading south (x + 1, y + 1), entered from the north-east edge of
// its first tile (RIGHT, then LEFT on the tile beyond its south-east edge).
function RIScenes::RailDiagonalFromNE(rt, x, y, n) {
  AIRail.SetCurrentRailType(rt);
  for (local i = 0; i < n; i++) {
    this.Check(AIRail.BuildRailTrack(T(x + i, y + i), AIRail.RAILTRACK_NE_SE), "diag " + (x + i) + "," + (y + i));
    this.Check(AIRail.BuildRailTrack(T(x + i, y + i + 1), AIRail.RAILTRACK_NW_SW), "diag " + (x + i) + "," + (y + i + 1));
  }
}

// The same, entered from the north-west edge of its first tile (LEFT, then RIGHT on the
// tile beyond its south-west edge).
function RIScenes::RailDiagonalFromNW(rt, x, y, n) {
  AIRail.SetCurrentRailType(rt);
  for (local i = 0; i < n; i++) {
    this.Check(AIRail.BuildRailTrack(T(x + i, y + i), AIRail.RAILTRACK_NW_SW), "diag " + (x + i) + "," + (y + i));
    this.Check(AIRail.BuildRailTrack(T(x + i + 1, y + i), AIRail.RAILTRACK_NE_SE), "diag " + (x + i + 1) + "," + (y + i));
  }
}

function RIScenes::BuildRailway() {
  this.Level(10, 8, 46, 46);
  // slots 0 / 1: heading south-west along x, through a two-platform station
  AIRail.SetCurrentRailType(this.plain);
  this.Check(AIRail.BuildRailStation(T(27, 38), AIRail.RAILTRACK_NE_SW, 1, 6, AIStation.STATION_NEW), "station plain");
  local station = AIStation.GetStationID(T(27, 38));
  AIRail.SetCurrentRailType(this.electric);
  this.Check(AIRail.BuildRailStation(T(27, 39), AIRail.RAILTRACK_NE_SW, 1, 6, station), "station electric");
  this.depots[0] <- this.RailAxis(this.plain, 13, 38, 14, 38, 26, 38);
  AIRail.SetCurrentRailType(this.plain);
  this.Check(AIRail.BuildRail(T(32, 38), T(33, 38), T(41, 38)), "rail plain beyond the station");
  this.depots[1] <- this.RailAxis(this.electric, 13, 39, 14, 39, 26, 39);
  AIRail.SetCurrentRailType(this.electric);
  this.Check(AIRail.BuildRail(T(32, 39), T(33, 39), T(41, 39)), "rail electric beyond the station");
  // slots 2 / 3: heading south-east along y
  this.depots[2] <- this.RailAxis(this.plain, 43, 10, 43, 11, 43, 36);
  this.depots[3] <- this.RailAxis(this.electric, 44, 10, 44, 11, 44, 36);
  // slots 4 / 5: heading south on diagonals, fed by an axis track and a curve
  this.depots[4] <- this.RailAxis(this.plain, 11, 20, 12, 20, 19, 20);
  this.RailDiagonalFromNE(this.plain, 20, 20, 15);
  this.depots[5] <- this.RailAxis(this.electric, 24, 9, 24, 10, 24, 17);
  this.RailDiagonalFromNW(this.electric, 24, 18, 15);
  this.Trees([[18, 30], [19, 31], [17, 32], [30, 44], [31, 45], [36, 24], [37, 25], [36, 26], [40, 30], [14, 42], [15, 43]]);
}

// --- road (x 12..46, y 10..44) ---------------------------------------------------

function RIScenes::RoadAxis(rt, depotX, depotY, frontX, frontY, endX, endY) {
  AIRoad.SetCurrentRoadType(rt);
  this.Check(AIRoad.BuildRoad(T(frontX, frontY), T(endX, endY)), "road " + frontX + "," + frontY);
  this.Check(AIRoad.BuildRoadDepot(T(depotX, depotY), T(frontX, frontY)), "road depot " + depotX + "," + depotY);
  this.Check(AIRoad.BuildRoad(T(depotX, depotY), T(frontX, frontY)), "road into depot " + depotX + "," + depotY);
  return T(depotX, depotY);
}

function RIScenes::BuildRoads() {
  this.Level(10, 8, 48, 46);
  this.depots[10] <- this.RoadAxis(this.road, 15, 38, 16, 38, 36, 38);
  this.depots[11] <- this.RoadAxis(this.road, 43, 10, 43, 11, 43, 36);
  this.depots[12] <- this.RoadAxis(this.tram, 15, 40, 16, 40, 36, 40);
  this.depots[13] <- this.RoadAxis(this.tram, 45, 10, 45, 11, 45, 36);
  AIRoad.SetCurrentRoadType(this.road);
  this.Check(AIRoad.BuildDriveThroughRoadStation(T(24, 38), T(25, 38), AIRoad.ROADVEHTYPE_BUS, AIStation.STATION_NEW), "bus stop");
  this.Trees([[20, 32], [21, 33], [22, 31], [32, 44], [33, 45], [38, 26], [39, 27], [48, 30], [16, 44]]);
}

// --- harbour (x 12..46, y 12..46) ------------------------------------------------

function RIScenes::BuildHarbour() {
  this.Level(10, 8, 48, 48);
  for (local x = 16; x <= 44; x++) for (local y = 16; y <= 42; y++) this.Check(AIMarine.BuildCanal(T(x, y)), "canal " + x + "," + y);
  this.Check(AIMarine.BuildWaterDepot(T(17, 28), T(18, 28)), "ship depot x");
  this.depots[20] <- T(17, 28);
  this.Check(AIMarine.BuildBuoy(T(43, 28)), "buoy x");
  this.Check(AIMarine.BuildWaterDepot(T(32, 17), T(32, 18)), "ship depot y");
  this.depots[21] <- T(32, 17);
  this.Check(AIMarine.BuildBuoy(T(32, 41)), "buoy y");
  this.Trees([[13, 12], [14, 13], [12, 15], [46, 20], [47, 21], [46, 36], [13, 40], [14, 41]]);
}

// --- airport (x 14..46, y 14..46) -----------------------------------------------

function RIScenes::BuildAirport() {
  this.Level(12, 12, 48, 48);
  this.Check(AIAirport.BuildAirport(T(27, 27), AIAirport.AT_LARGE, AIStation.STATION_NEW), "airport");
  this.depots[30] <- AIAirport.GetHangarOfAirport(T(27, 27));
  this.depots[31] <- this.depots[30];
  this.Trees([[22, 24], [23, 25], [22, 34], [35, 22], [36, 23], [36, 35], [24, 37], [25, 38]]);
}

// --- markers --------------------------------------------------------------------

// The depots of a loaded game, where BuildRailway and the others put them.
function RIScenes::FindDepots() {
  local at = [[0, 13, 38], [1, 13, 39], [2, 43, 10], [3, 44, 10], [4, 11, 20], [5, 24, 9],
              [10, 15, 38], [11, 43, 10], [12, 15, 40], [13, 45, 10], [20, 17, 28], [21, 32, 17]];
  foreach (d in at) this.depots[d[0]] <- T(d[1], d[2]);
  this.depots[30] <- AIAirport.GetHangarOfAirport(T(27, 27));
  this.depots[31] <- this.depots[30];
}

function RIScenes::Engine(type, name) {
  local list = AIEngineList(type);
  foreach (e, _ in list) if (AIEngine.GetName(e) == name) return e;
  this.Fail("no engine " + name);
  return null;
}

function RIScenes::Buy(depotKey, type, name) {
  local v = AIVehicle.BuildVehicle(this.depots[depotKey], this.Engine(type, name));
  if (!AIVehicle.IsValidVehicle(v)) this.Fail("buy " + name);
  return v;
}

function RIScenes::Run(v, stop) {
  this.Check(AIVehicle.StartStopVehicle(v), "start " + v);
  this.running.append([v, stop]);
}

function RIScenes::BuyMarkers(scene) {
  local R = AIVehicle.VT_RAIL, D = AIVehicle.VT_ROAD, W = AIVehicle.VT_WATER, A = AIVehicle.VT_AIR;
  if (scene == 0) {
    this.Run(this.Buy(0, R, "RI marker train 0"), function(t) { return AIMap.GetTileX(t) >= 31; });
    this.Run(this.Buy(1, R, "RI marker train 1"), function(t) { return AIMap.GetTileX(t) >= 31; });
    this.Run(this.Buy(2, R, "RI marker train 2"), function(t) { return AIMap.GetTileY(t) >= 30; });
    this.Run(this.Buy(3, R, "RI marker train 3"), function(t) { return AIMap.GetTileY(t) >= 30; });
    this.Run(this.Buy(4, R, "RI marker train 4"), function(t) { return AIMap.GetTileX(t) >= 30; });
    this.Run(this.Buy(5, R, "RI marker train 5"), function(t) { return AIMap.GetTileX(t) >= 33; });
  } else if (scene == 1) {
    this.Run(this.Buy(10, D, "RI marker bus 0"), function(t) { return AIMap.GetTileX(t) >= 31; });
    this.Run(this.Buy(11, D, "RI marker bus 1"), function(t) { return AIMap.GetTileY(t) >= 30; });
    this.Run(this.Buy(12, D, "RI marker tram 2"), function(t) { return AIMap.GetTileX(t) >= 31; });
    this.Run(this.Buy(13, D, "RI marker tram 3"), function(t) { return AIMap.GetTileY(t) >= 30; });
  } else if (scene == 2) {
    local sx = this.Buy(20, W, "RI marker ship 0");
    AIOrder.AppendOrder(sx, T(43, 28), AIOrder.OF_NONE);
    this.Run(sx, function(t) { return AIMap.GetTileX(t) >= 31; });
    local sy = this.Buy(21, W, "RI marker ship 1");
    AIOrder.AppendOrder(sy, T(32, 41), AIOrder.OF_NONE);
    this.Run(sy, function(t) { return AIMap.GetTileY(t) >= 31; });
  } else {
    foreach (slot in [0, 1]) {
      local a = this.Buy(30 + slot, A, "RI marker aircraft " + slot);
      AIOrder.AppendOrder(a, T(27, 27), AIOrder.OF_FULL_LOAD_ANY);
      this.Check(AIVehicle.StartStopVehicle(a), "start aircraft");
      this.Sleep(300);
      AILog.Info("RIScenes: aircraft " + slot + " (state " + AIVehicle.GetState(a) + ") at " + AIMap.GetTileX(AIVehicle.GetLocation(a)) + "," + AIMap.GetTileY(AIVehicle.GetLocation(a)));
    }
    // taxiing to the terminals, where they wait for a full load for ever
    this.Sleep(600);
  }
}

// Whether this company has built its scene already: it owns a depot or station there.
function RIScenes::HasScene() {
  foreach (xy in [[13, 38], [15, 38], [17, 28], [27, 27]]) {
    if (AICompany.IsMine(AITile.GetOwner(T(xy[0], xy[1])))) return true;
  }
  return false;
}

function RIScenes::Start() {
  // the game script (game/RIMoney) pays for everything; give it a moment
  this.Sleep(30);
  this.depots = {};
  this.running = [];
  local rails = AIRailTypeList();
  this.plain = 0;
  this.electric = 1;
  foreach (rt, _ in rails) AILog.Info("RIScenes: rail type " + rt + " " + AIRail.GetName(rt));
  this.road = AIRoadTypeList(AIRoad.ROADTRAMTYPES_ROAD).Begin();
  this.tram = AIRoadTypeList(AIRoad.ROADTRAMTYPES_TRAM).Begin();
  local scene = AIController.GetSetting("scene");
  // the map's one town must stand clear of the scene (the prerender tries another seed)
  foreach (town, _ in AITownList()) {
    local at = AITown.GetLocation(town);
    if (AIMap.DistanceMax(at, T(32, 32)) < 26) {
      AILog.Info("RIScenes: town in the way at " + AIMap.GetTileX(at) + "," + AIMap.GetTileY(at));
      while (true) this.Sleep(100);
    }
  }
  // a loaded game (the prerender's second run) has its scene: park the markers
  if (!this.HasScene()) {
    if (scene == 0) this.BuildRailway();
    else if (scene == 1) this.BuildRoads();
    else if (scene == 2) this.BuildHarbour();
    else this.BuildAirport();
    AILog.Info("RIScenes: scene built on " + AIDate.GetDayOfMonth(AIDate.GetCurrentDate()) + "." + AIDate.GetMonth(AIDate.GetCurrentDate()));
    while (true) this.Sleep(100);
  }
  this.FindDepots();
  this.BuyMarkers(scene);
  while (this.running.len() > 0) {
    local still = [];
    foreach (r in this.running) {
      if (r[1](AIVehicle.GetLocation(r[0]))) {
        this.Check(AIVehicle.StartStopVehicle(r[0]), "stop " + r[0]);
        AILog.Info("RIScenes: stopped " + AIVehicle.GetName(r[0]) + " at " + AIMap.GetTileX(AIVehicle.GetLocation(r[0])) + "," + AIMap.GetTileY(AIVehicle.GetLocation(r[0])));
      } else {
        still.append(r);
      }
    }
    this.running = still;
    this.Sleep(1);
  }
  AILog.Info("RIScenes: markers parked on " + AIDate.GetDayOfMonth(AIDate.GetCurrentDate()) + "." + AIDate.GetMonth(AIDate.GetCurrentDate()));
  while (true) this.Sleep(100);
}
