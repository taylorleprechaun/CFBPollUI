/**
 * Calculates the appropriate text color (white or black) for a given
 * background hex color using the WCAG relative luminance formula.
 */
export function getContrastTextColor(hexColor: string): 'white' | 'black' {
  const hex = hexColor.replace('#', '');

  if (hex.length !== 6 && hex.length !== 3) {
    return 'white';
  }

  const fullHex = hex.length === 3
    ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    : hex;

  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return 'white';
  }

  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.179 ? 'black' : 'white';
}
