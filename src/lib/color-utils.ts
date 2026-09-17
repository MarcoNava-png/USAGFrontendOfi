export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return null;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lighter = Math.max(relativeLuminance(hexA), relativeLuminance(hexB));
  const darker = Math.min(relativeLuminance(hexA), relativeLuminance(hexB));
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableInk(hex: string): string {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#0f172a") ? "#ffffff" : "#0f172a";
}

export function ensureReadableSurface(hex: string, minContrastWithWhite = 4.5): string {
  let current = hex;
  let guard = 0;
  while (contrastRatio(current, "#ffffff") < minContrastWithWhite && guard < 24) {
    current = shadeColor(current, -8);
    guard += 1;
  }
  return current;
}

export function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return hex;

  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  const target = percent < 0 ? 0 : 255;
  const ratio = Math.min(Math.abs(percent), 100) / 100;

  r = Math.round((target - r) * ratio) + r;
  g = Math.round((target - g) * ratio) + g;
  b = Math.round((target - b) * ratio) + b;

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
