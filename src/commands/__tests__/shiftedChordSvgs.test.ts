import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const svgDir = resolve(__dirname, '../../../public/images/svgs');

function svg(code: string): string {
  return readFileSync(resolve(svgDir, `${code}.svg`), 'utf8');
}

function thumbGroup(content: string): string {
  const match = content.match(/<g id="thumb">[\s\S]*?<\/g>/);
  if (match == null) {
    throw new Error('missing thumb group');
  }
  return match[0];
}

describe('shifted chord SVGs', () => {
  it('rebuilds B (517) from b (17) plus the shift start on thumb', () => {
    const unshifted = svg('17');
    const shifted = svg('517');

    expect(unshifted).toMatch(/id="index"[\s\S]*href="#start" x="40"/);
    expect(shifted).toMatch(/id="index"[\s\S]*href="#start" x="40"/);
    expect(thumbGroup(shifted)).toMatch(/href="#start"[^>]*x="10"/);
    expect(shifted).not.toMatch(/id="index"[\s\S]*href="#dot"/);
  });

  it('rebuilds ! (510) from 1 (10) plus the shift start on thumb', () => {
    const shifted = svg('510');
    expect(shifted).toMatch(/id="index"[\s\S]*href="#start" x="40"/);
    expect(thumbGroup(shifted)).toMatch(/href="#start"[^>]*x="10"/);
    expect(thumbGroup(shifted)).toMatch(/href="#stop"[^>]*x="21"/);
  });

  it('draws digit 5 as firmware C0 (start on middle-base, stop on thumb-tip)', () => {
    const five = svg('C0');
    expect(five).toMatch(/id="middle"[\s\S]*href="#start" x="0"/);
    expect(thumbGroup(five)).toMatch(/href="#stop"[^>]*x="21"/);
  });

  it('draws equals as firmware E0 (start on pinky-base, stop on thumb-tip)', () => {
    const equals = svg('E0');
    expect(equals).toMatch(/id="pinky"[\s\S]*href="#start" x="0"/);
    expect(thumbGroup(equals)).toMatch(/href="#stop"[^>]*x="21"/);
  });
});
