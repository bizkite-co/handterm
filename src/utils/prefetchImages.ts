import { allChords } from '../allChords';

const EXTRA_GLYPHS = ['enter-key', 'backspace-key'];

function prefetch(src: string): void {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
}

export function prefetchChordGlyphs(): void {
  const baseUrl = import.meta.env.BASE_URL;
  const seen = new Set<string>();
  for (const chord of allChords) {
    if (chord.chordCode == null || seen.has(chord.chordCode)) continue;
    seen.add(chord.chordCode);
    prefetch(`${baseUrl}images/svgs/${chord.chordCode}.svg`);
  }
  for (const name of EXTRA_GLYPHS) {
    prefetch(`${baseUrl}images/svgs/${name}.svg`);
  }
}