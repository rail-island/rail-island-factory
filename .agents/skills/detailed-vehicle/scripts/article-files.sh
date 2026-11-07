#!/bin/bash
# The Commons files a Wikipedia article shows (detailed-vehicle skill), retrying on HTTP 429:
#   .agents/skills/detailed-vehicle/scripts/article-files.sh "SBB RABe 502" [de|en|fr|it|...]
# Commons' own API is rate-limited for this client; the article's language Wikipedia answers.
# Download each file you choose with `pnpm refs:fetch <name> "File:<title>" --use "<what>"`, one at a time.
UA="RailIslandFactory/0.1 (https://factory.railisland.com; reference photographs)"
for i in 1 2 3 4 5 6 7 8; do
  out=$(curl -sS -A "$UA" --get "https://${2:-de}.wikipedia.org/w/api.php" --data-urlencode "action=query" --data-urlencode "prop=images" --data-urlencode "titles=$1" --data-urlencode "imlimit=200" --data-urlencode "redirects=1" --data-urlencode "format=json")
  if echo "$out" | head -c1 | grep -q '{'; then
    echo "$out" | python3 -I -c "import json,sys; d=json.load(sys.stdin); [print(i['title']) for p in d['query']['pages'].values() for i in p.get('images',[])]" | grep -viE '\.svg$|wappen|logo'
    exit 0
  fi
  echo "retry $i" >&2; timeout 15 tail -f /dev/null
done
exit 1
