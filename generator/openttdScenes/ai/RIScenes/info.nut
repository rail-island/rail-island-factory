// The scene AI of the OpenTTD preview prerender (generator/openttdScenes/prerender.ts,
// docs/site/openttd-export.md): builds the preview scenes of one kind (its "scene"
// setting) and parks the marker vehicles at their slots. Used only by the
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
    AddSetting({ name = "scene", description = "Scene: 0 rail yards, 1 electrified yards, 2 road yards, 3 tram yards, 4 harbour, 5 airport", min_value = 0, max_value = 5,
                 easy_value = 0, medium_value = 0, hard_value = 0, custom_value = 0, flags = AICONFIG_NONE });
  }
}

RegisterAI(RIScenes());
