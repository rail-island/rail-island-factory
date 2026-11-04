// The scene AI (info.nut) of the OpenTTD preview prerender (prerender.ts): it builds
// the yards of one kind (its "scene" setting) on a flat map and idles - the
// prerender saves that game, the yards without vehicles - and, in that game loaded
// again, buys the marker vehicles of the marker GRF (markers.ts) and stops each at
// its slot.
//
//   scene 0..3  plain rail, electrified rail, road, tram: ten yards of 1..10
//               parallel straight tracks along x, the vehicles heading south-west
//   scene 4     a harbour: ten ship lanes on a canal basin, heading south-west
//   scene 5     an airport: ten small airports, an aircraft at each one's terminal
//
// The geometry is the prerender's (prerender.ts yardOrigin, YARD): change both.

function T(x, y) { return AIMap.GetTileIndex(x, y); }

/** Yard k's (1..10) north corner: five yards a row, far enough apart that no screenshot sees two. */
function YardX(k) { return 20 + 50 * ((k - 1) % 5); }
function YardY(k) { return 20 + 40 * ((k - 1) / 5); }

/** A yard's depots stand at x + 0, its track runs x + 1 .. x + 20, a vehicle stops with its front at x + 17. */
const TRACK_END = 20;
const STOP_AT = 17;

class RIScenes extends AIController {
  plain = null;
  electric = null;
  road = null;
  tram = null;
  // vehicles still running towards their slots: [vehicle, the x to stop at]
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

/** The track of slot `slot` of yard k: the front slot, 0, on the yard's last row (nearest the viewer). */
function SlotY(k, slot) { return YardY(k) + (k - 1 - slot); }

/** The area the scene covers, levelled before building and kept clear of the map's town. */
function RIScenes::Area(scene) {
  if (scene >= 4) return [8, 8, 60, 60];
  return [10, 10, 20 + 50 * 4 + TRACK_END + 10, 20 + 40 + 10 + 10];
}

// --- the yards ----------------------------------------------------------------------

function RIScenes::BuildYards(scene) {
  for (local k = 1; k <= 10; k++) {
    local x = YardX(k);
    for (local slot = 0; slot < k; slot++) {
      local y = SlotY(k, slot);
      if (scene <= 1) {
        AIRail.SetCurrentRailType(scene == 0 ? this.plain : this.electric);
        this.Check(AIRail.BuildRailDepot(T(x, y), T(x + 1, y)), "rail depot " + x + "," + y);
        this.Check(AIRail.BuildRail(T(x, y), T(x + 1, y), T(x + TRACK_END + 1, y)), "rail " + x + "," + y);
      } else {
        AIRoad.SetCurrentRoadType(scene == 2 ? this.road : this.tram);
        this.Check(AIRoad.BuildRoad(T(x + 1, y), T(x + TRACK_END, y)), "road " + x + "," + y);
        this.Check(AIRoad.BuildRoadDepot(T(x, y), T(x + 1, y)), "road depot " + x + "," + y);
        this.Check(AIRoad.BuildRoad(T(x, y), T(x + 1, y)), "road into depot " + x + "," + y);
      }
    }
  }
}

function RIScenes::ParkYards(scene) {
  local type = scene <= 1 ? AIVehicle.VT_RAIL : AIVehicle.VT_ROAD;
  local kind = scene <= 1 ? "train" : scene == 2 ? "bus" : "tram";
  for (local k = 1; k <= 10; k++) {
    local x = YardX(k);
    for (local slot = 0; slot < k; slot++) {
      local v = this.Buy(T(x, SlotY(k, slot)), type, "RI marker " + kind + " " + slot);
      this.Run(v, x + STOP_AT);
    }
  }
}

// --- the harbour --------------------------------------------------------------------

/** Ship lane `slot`: two tiles apart, the front slot, 0, nearest the viewer. */
function LaneY(slot) { return 22 + 2 * (9 - slot); }

function RIScenes::BuildHarbour() {
  for (local x = 16; x <= 44; x++) for (local y = 18; y <= 44; y++) this.Check(AIMarine.BuildCanal(T(x, y)), "canal " + x + "," + y);
  for (local slot = 0; slot < 10; slot++) {
    this.Check(AIMarine.BuildWaterDepot(T(17, LaneY(slot)), T(18, LaneY(slot))), "ship depot " + slot);
    this.Check(AIMarine.BuildBuoy(T(43, LaneY(slot))), "buoy " + slot);
  }
}

function RIScenes::ParkHarbour() {
  for (local slot = 0; slot < 10; slot++) {
    local v = this.Buy(T(17, LaneY(slot)), AIVehicle.VT_WATER, "RI marker ship " + slot);
    AIOrder.AppendOrder(v, T(43, LaneY(slot)), AIOrder.OF_NONE);
    this.Run(v, 30);
  }
}

// --- the airport --------------------------------------------------------------------

/**
 * The north corner of aircraft slot `slot`'s own small airport: two columns of five
 * along y, the front slot, 0, nearest the viewer - so no aircraft stands in another's way.
 */
function AirportX(slot) { return 22 + 6 * (1 - slot % 2); }
function AirportY(slot) { return 20 + 4 * (4 - slot / 2); }

function RIScenes::BuildAirport() {
  for (local slot = 0; slot < 10; slot++) {
    this.Check(AIAirport.BuildAirport(T(AirportX(slot), AirportY(slot)), AIAirport.AT_SMALL, AIStation.STATION_NEW), "airport " + slot);
  }
}

function RIScenes::ParkAirport() {
  for (local slot = 0; slot < 10; slot++) {
    local at = T(AirportX(slot), AirportY(slot));
    local v = this.Buy(AIAirport.GetHangarOfAirport(at), AIVehicle.VT_AIR, "RI marker aircraft " + slot);
    AIOrder.AppendOrder(v, at, AIOrder.OF_FULL_LOAD_ANY);
    this.Check(AIVehicle.StartStopVehicle(v), "start aircraft " + slot);
  }
  // they taxi to their terminals and wait there for a full load for ever
  this.Sleep(1500);
}

// --- markers ------------------------------------------------------------------------

function RIScenes::Engine(type, name) {
  foreach (e, _ in AIEngineList(type)) {
    local n = AIEngine.GetName(e);
    if (n != null && n == name) return e;
  }
  this.Fail("no engine " + name);
  return null;
}

function RIScenes::Buy(depot, type, name) {
  local v = AIVehicle.BuildVehicle(depot, this.Engine(type, name));
  if (!AIVehicle.IsValidVehicle(v)) this.Fail("buy " + name);
  return v;
}

/** Start a marker; it is stopped once its front reaches x = `stopX`. */
function RIScenes::Run(v, stopX) {
  this.Check(AIVehicle.StartStopVehicle(v), "start " + v);
  this.running.append([v, stopX]);
}

/** Whether this company has built its scene already: it owns the first depot or airport. */
function RIScenes::HasScene(scene) {
  local at = scene <= 3 ? T(YardX(1), SlotY(1, 0)) : scene == 4 ? T(17, LaneY(0)) : T(AirportX(0), AirportY(0));
  return AICompany.IsMine(AITile.GetOwner(at));
}

function RIScenes::Start() {
  // the game script (game/RIMoney) pays for everything; give it a moment
  this.Sleep(30);
  this.running = [];
  this.plain = 0;
  this.electric = 1;
  this.road = AIRoadTypeList(AIRoad.ROADTRAMTYPES_ROAD).Begin();
  this.tram = AIRoadTypeList(AIRoad.ROADTRAMTYPES_TRAM).Begin();
  local scene = AIController.GetSetting("scene");
  local area = this.Area(scene);
  // the map's one town must stand clear of the scene (the prerender tries another seed)
  foreach (town, _ in AITownList()) {
    local at = AITown.GetLocation(town);
    local x = AIMap.GetTileX(at), y = AIMap.GetTileY(at);
    if (x >= area[0] - 12 && x <= area[2] + 12 && y >= area[1] - 12 && y <= area[3] + 12) {
      AILog.Info("RIScenes: town in the way at " + x + "," + y);
      while (true) this.Sleep(100);
    }
  }
  // the prerender's first run builds; its second, in that game loaded again, parks
  if (!this.HasScene(scene)) {
    this.Level(area[0], area[1], area[2], area[3]);
    if (scene <= 3) this.BuildYards(scene);
    else if (scene == 4) this.BuildHarbour();
    else this.BuildAirport();
    AILog.Info("RIScenes: scene built on " + AIDate.GetDayOfMonth(AIDate.GetCurrentDate()) + "." + AIDate.GetMonth(AIDate.GetCurrentDate()));
    while (true) this.Sleep(100);
  }
  if (scene <= 3) this.ParkYards(scene);
  else if (scene == 4) this.ParkHarbour();
  else this.ParkAirport();
  while (this.running.len() > 0) {
    local still = [];
    foreach (r in this.running) {
      if (AIMap.GetTileX(AIVehicle.GetLocation(r[0])) >= r[1]) this.Check(AIVehicle.StartStopVehicle(r[0]), "stop " + r[0]);
      else still.append(r);
    }
    this.running = still;
    this.Sleep(1);
  }
  AILog.Info("RIScenes: markers parked on " + AIDate.GetDayOfMonth(AIDate.GetCurrentDate()) + "." + AIDate.GetMonth(AIDate.GetCurrentDate()));
  while (true) this.Sleep(100);
}
