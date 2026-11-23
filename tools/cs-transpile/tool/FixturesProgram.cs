// The fixtures console (tools/cs-transpile/fixtures.ts): one line per case, its name, a
// tab and the JSON of what the transpiled C# returned (or the exception).

using System;
using RailIsland.Factory.Generated;
using RailIsland.Factory.Runtime;

public static class FixturesProgram
{
    public static int Main()
    {
        foreach (var (name, run) in FixtureTable.All)
        {
            string json;
            try { json = JsJson.Stringify(run()); }
            catch (Exception e) { json = "{\"error\":" + JsJson.Stringify(e.GetType().Name + ": " + e.Message) + "}"; }
            Console.WriteLine(name + "\t" + json);
        }
        return 0;
    }
}
