// The prerender's game script (generator/openttdScenes/prerender.ts): keeps every
// company in money, so the scene AI (ai/RIScenes) can build all four scenes. Used
// only by the prerender, never shipped.

class RIMoney extends GSInfo {
  function GetAuthor()      { return "Rail Island Factory"; }
  function GetName()        { return "RIMoney"; }
  function GetShortName()   { return "RIMO"; }
  function GetDescription() { return "Keeps the Rail Island Factory prerender's companies in money"; }
  function GetVersion()     { return 1; }
  function GetDate()        { return "2026-11-04"; }
  function CreateInstance() { return "RIMoney"; }
  function GetAPIVersion()  { return "13"; }
}

RegisterGS(RIMoney());
