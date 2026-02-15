import { describe, it, expect } from 'vitest';
import { getContrastTextColor } from '../../lib/color-utils';

describe('getContrastTextColor', () => {
  it("returns 'black' for white (#FFFFFF)", () => {
    expect(getContrastTextColor('#FFFFFF')).toBe('black');
  });

  it("returns 'white' for black (#000000)", () => {
    expect(getContrastTextColor('#000000')).toBe('white');
  });

  it("returns 'white' for dark blue (#1a1a2e)", () => {
    expect(getContrastTextColor('#1a1a2e')).toBe('white');
  });

  it("returns 'black' for yellow (#FFFF00)", () => {
    expect(getContrastTextColor('#FFFF00')).toBe('black');
  });

  it("returns 'white' for dark color without hash prefix (000000)", () => {
    expect(getContrastTextColor('000000')).toBe('white');
  });

  it("returns 'white' for invalid hex (returns white as fallback)", () => {
    expect(getContrastTextColor('ZZZZZZ')).toBe('white');
  });

  it("returns 'white' for empty string (returns white as fallback)", () => {
    expect(getContrastTextColor('')).toBe('white');
  });

  it("handles 3-character hex (#FFF returns 'black')", () => {
    expect(getContrastTextColor('#FFF')).toBe('black');
  });

  it("handles 3-character dark hex (#000 returns 'white')", () => {
    expect(getContrastTextColor('#000')).toBe('white');
  });
});
