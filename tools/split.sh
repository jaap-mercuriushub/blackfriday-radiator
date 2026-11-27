#!/usr/bin/env bash
# Maakt van een shopmap een zelfstandige statische site (voor een eigen repo / Vercel-project).
#   tools/split.sh <shop> <doelmap>
# Kopieert <shop>/ en shared/ naar <doelmap> en zet de paden ../shared/ om naar ./shared/.
# Bestaande bestanden in <doelmap> (bv. .git) blijven staan; shopbestanden worden overschreven.
set -euo pipefail
shop=$1; out=$2
root=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$out"
cp -r "$root/$shop/." "$out/"
mkdir -p "$out/shared" && cp "$root/shared/"* "$out/shared/"
sed -i 's#\.\./shared/#./shared/#g' "$out/index.html"
cp "$root/tools/vercel.json" "$out/vercel.json"
echo "$shop -> $out ($(du -sh "$out" --exclude=.git | cut -f1))"
