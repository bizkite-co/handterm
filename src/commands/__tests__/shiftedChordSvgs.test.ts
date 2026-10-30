import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const svgDir = resolve(__dirname, '../../../public/images/svgs');

function svg(code: string): string {
  return readFileSync(resolve(svgDir, `${code}.svg`), 'utf8');
}

function thumbGroup(content: string): string {
  const match = content.match(/<g id="thumb"[^>]*>[\s\S]*?<\/g>/);
  if (match == null) {
    throw new Error('missing thumb group');
  }
  return match[0];
}

describe('shifted chord SVGs', () => {
  it('rebuilds B (517) with thumb start, index two-dot, and middle stop', () => {
    const unshifted = svg('17');
    const shifted = svg('517');

    expect(unshifted).toMatch(/id="index"[\s\S]*href="#start" x="40"/);
    expect(thumbGroup(shifted)).toMatch(/href="#start"[^>]*x="10"/);
    expect(shifted).toMatch(/id="index"[\s\S]*href="#dot"[^>]*x="44"/);
    expect(shifted).toMatch(/id="index"[\s\S]*href="#dot"[^>]*x="40"/);
    expect(shifted).not.toMatch(/id="index"[\s\S]*href="#start"/);
    expect(shifted).toMatch(/id="middle"[\s\S]*href="#stop" x="21"/);
  });

  it('rebuilds ! (510) with thumb start, index two-dot, and thumb stop', () => {
    const shifted = svg('510');
    expect(thumbGroup(shifted)).toMatch(/href="#start"[^>]*x="10"/);
    expect(shifted).toMatch(/id="index"[\s\S]*href="#dot"[^>]*x="44"/);
    expect(shifted).toMatch(/id="index"[\s\S]*href="#dot"[^>]*x="40"/);
    expect(shifted).not.toMatch(/id="index"[\s\S]*href="#start"/);
    expect(thumbGroup(shifted)).toMatch(/href="#stop"[^>]*x="21"/);
  });

  it('rebuilds ? (596) with thumb start, pinky two-dot, and index stop', () => {
    const shifted = svg('596');
    expect(thumbGroup(shifted)).toMatch(/href="#start"[^>]*x="10"/);
    expect(shifted).toMatch(/id="pinky"[\s\S]*href="#dot"[^>]*x="19"/);
    expect(shifted).toMatch(/id="pinky"[\s\S]*href="#dot"[^>]*x="15"/);
    expect(shifted).not.toMatch(/id="pinky"[\s\S]*href="#start"/);
    expect(shifted).toMatch(/id="index"[\s\S]*href="#stop" x="21"/);
  });

  it('rebuilds + (5E0) with thumb start, pinky two-dot, and thumb stop', () => {
    const shifted = svg('5E0');
    expect(thumbGroup(shifted)).toMatch(/href="#start"[^>]*x="10"/);
    expect(shifted).toMatch(/id="pinky"[\s\S]*href="#dot"[^>]*x="4"/);
    expect(shifted).toMatch(/id="pinky"[\s\S]*href="#dot"[^>]*x="0"/);
    expect(shifted).not.toMatch(/id="pinky"[\s\S]*href="#start"/);
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
