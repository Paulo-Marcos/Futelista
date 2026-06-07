/**
 * Helpers de cor — equivalente "pré-computado" do `color-mix(in srgb …)`
 * que o protótipo usa, mas em RN não existe.
 *
 * Roda **uma vez** no carregamento do módulo: as paletas claras são
 * congeladas como hex absolutos no `themes.ts`, conforme determina o
 * handoff "RN não tem color-mix … pré-computar em build".
 */

export type RGB = readonly [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Mistura linear em sRGB: `mix(a, b, percent)` retorna `percent%` de `a`
 * sobre `(100 − percent)%` de `b`. Equivalente a
 * `color-mix(in srgb, a percent%, b)` do CSS.
 */
export function mixHex(a: string, b: string, percent: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const t = percent / 100;
  return rgbToHex(
    ar * t + br * (1 - t),
    ag * t + bg * (1 - t),
    ab * t + bb * (1 - t),
  );
}

/** `rgba(r, g, b, alpha)` a partir de um hex. */
export function alphaHex(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
