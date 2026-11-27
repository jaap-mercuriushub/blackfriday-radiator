#!/usr/bin/env bash
# Zet een Higgsfield-video om naar WebP-framereeksen (methode uit de opdracht).
#   tools/frames.sh <map> <video-url> [focusX=0.70]
# desktop: alle frames, 1600 px breed  -> <map>/frames/d/001.webp …
# mobiel:  elk 2e frame, staande uitsnede 720×1080 rond focusX -> <map>/frames/m/001.webp …
set -euo pipefail
dir=$1; url=$2; fx=${3:-0.70}
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
curl -sSfL -o "$tmp/in.mp4" "$url"
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$tmp/in.mp4")
h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$tmp/in.mp4")
cw=$(( h * 2 / 3 )); cx=$(python3 -c "print(max(0,min($w-$cw,round($w*$fx-$cw/2))))")
rm -rf "$dir/frames"; mkdir -p "$dir/frames/d" "$dir/frames/m"
ffmpeg -loglevel error -i "$tmp/in.mp4" -vf "scale=1600:-2" -c:v libwebp -quality 65 -compression_level 6 "$dir/frames/d/%03d.webp"
ffmpeg -loglevel error -i "$tmp/in.mp4" -vf "select='not(mod(n\,2))',crop=$cw:$h:$cx:0" -fps_mode vfr -c:v libwebp -quality 70 -compression_level 6 "$dir/frames/m/%03d.webp"
echo "$dir: desktop $(ls "$dir/frames/d" | wc -l) frames ($(du -sh "$dir/frames/d" | cut -f1)), mobiel $(ls "$dir/frames/m" | wc -l) frames ($(du -sh "$dir/frames/m" | cut -f1))"
