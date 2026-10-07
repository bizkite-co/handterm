#!/usr/bin/env bash
# Assemble Lucia's individually-authored frames (lucia-<action>-NN.png) into the
# horizontal strip PNGs the game's Sprite class loads.
#
# Authoring:  public/images/Lucia/Individual Sprites/lucia-<action>-NN.png
# Runtime:    public/images/Lucia/Sprites/<Action>.png
#
set -euo pipefail

INDIR="public/images/Lucia/Individual Sprites"
OUTDIR="public/images/Lucia/Sprites"

mkdir -p "$OUTDIR"
mapfile -t actions < <(ls "$INDIR" | sed -E 's/^lucia-([a-z]+)-[0-9]+\.png$/\1/' | sort -u)

for a in "${actions[@]}"; do
  case "$a" in
    idle)        Name="Idle" ;;
    walk)        Name="Walk" ;;
    run)         Name="Run" ;;
    jump)        Name="Jump" ;;
    attack)      Name="Attack" ;;
    hurt)        Name="Hurt" ;;
    death)       Name="Death" ;;
    summersault) Name="Summersault" ;;
    *)           Name="${a^}" ;;
  esac

  mapfile -t frames < <(ls "$INDIR"/lucia-${a}-*.png | sort -V)
  if [ "${#frames[@]}" -eq 0 ]; then
    echo "WARN: no frames for action '$a'" >&2
    continue
  fi

  convert "${frames[@]}" +append "$OUTDIR/$Name.png"
  echo "$Name: ${#frames[@]} frames -> $OUTDIR/$Name.png"
done