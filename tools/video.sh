#!/bin/sh
# Rebuilds the trailhead video loops from the Gemini originals.
# 8 s seamless loops: the last 2 s crossfade into the first 2 s. No audio, H.264, faststart.
# The originals carry no color tags. Decoded plainly (BT.709 matrix, TV range) they match the painting.
# Tag the transfer as sRGB so Chrome's <video> path doesn't apply a BT.709 transfer conversion that
# brightens the midtones; that keeps the <video>, WebGL (arrival.js) and the still painting in agreement.
set -e
cd "$(dirname "$0")/.."
SRC=../barkley-v4-art-studies/living-painting
for n in wide tall; do
  ffmpeg -v error -y -i "$SRC/trailhead-$n-raw.mp4" -filter_complex \
    "[0:v]split[a][b];[a]trim=start=2,setpts=PTS-STARTPTS[main];[b]trim=0:2,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=2:offset=6,format=yuv420p[v]" \
    -map "[v]" -an -c:v libx264 -preset slow -crf 25 -profile:v high \
    -colorspace bt709 -color_primaries bt709 -color_trc iec61966-2-1 -color_range tv \
    -x264-params "colorprim=bt709:transfer=iec61966-2-1:colormatrix=bt709:range=tv" \
    -movflags +faststart "assets/world/trailhead-$n.mp4"
  echo "assets/world/trailhead-$n.mp4 $(du -k assets/world/trailhead-$n.mp4 | cut -f1) KB"
done
