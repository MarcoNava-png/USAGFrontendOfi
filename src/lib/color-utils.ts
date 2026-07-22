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
