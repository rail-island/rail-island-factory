// The scene AI of the OpenTTD preview prerender (generator/openttdScenes/prerender.ts,
// docs/site/openttd-export.md): builds one preview scene (its "scene" setting) round
// tile (32, 32) and parks the marker vehicles at their slots. Used only by the
// prerender, never shipped.

class RIScenes extends AIInfo {
  function GetAuthor()      { return "Rail Island Factory"; }
  function GetName()        { return "RIScenes"; }
  function GetShortName()   { return "RISC"; }
  function GetDescription() { return "Builds the Rail Island Factory OpenTTD preview scenes"; }
  function GetVersion()     { return 1; }
  function GetDate()        { return "2026-11-04"; }
  function CreateInstance() { return "RIScenes"; }
  function GetAPIVersion()  { return "13"; }
  function UseAsRandomAI()  { return false; }
  function GetSettings() {
    AddSetting({ name = "scene", description = "Scene: 0 railway, 1 road, 2 harbour, 3 airport", min_value = 0, max_value = 3,
                 easy_value = 0, medium_value = 0, hard_value = 0, custom_value = 0, flags = AICONFIG_NONE });
  }
}

RegisterAI(RIScenes());
