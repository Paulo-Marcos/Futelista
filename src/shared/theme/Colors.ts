/**
 * Tokens **agnósticos de tema** — escala de espaço, raio, tipografia,
 * elevação e movimento — espelhando o handoff §3 (Espaço & forma) e §2
 * (Tipografia).
 *
 * As **cores** vivem em `themes.ts` (registry de 7 paletas × claro/escuro).
 * Para retro-compatibilidade com código antigo que importa
 * `Colors.light` / `Colors.dark`, expomos aqui um alias do tema padrão
 * (rubro-negro). Código novo deve consumir via `usePalette()`.
 */

import { THEME_REGISTRY, type Palette } from "./themes";

const RUBRO = THEME_REGISTRY.rubro;

/**
 * Atalho do tema padrão para chamadas legadas (ex.: `Colors.dark.icon`).
 *
 * **Não use em código novo** — prefira `usePalette()` para reagir à
 * paleta escolhida pelo usuário. Mantido para evitar revolução em arquivos
 * já estáveis.
 */
export const Colors = {
  light: RUBRO.light,
  dark: RUBRO.dark,
} as const;

export type ColorName = keyof Palette;

/**
 * Escala de espaçamento — base 4.
 * `xs 4 / sm 8 / md 12 / lg 16 / xl 24 / xxl 32`. Handoff §3.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Raios contínuos (direção Premium).
 * `sm 10 / md 14 / lg 20 / xl 28 / pill 999`. Handoff §3.
 *
 * Em RN, `borderCurve: "continuous"` (iOS) complementa em superfícies
 * grandes para o desenho coincidir com o protótipo.
 */
export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/**
 * Tipografia — família única Archivo cobre display, título, corpo e label.
 * Números (placar, cronômetro) usam tabular-nums para não "dançarem".
 * Handoff §2.
 */
// `tabular-nums` precisa ficar fora do `as const` final pra continuar
// sendo `string[]` (compatível com TextStyle.fontVariant) — `as const`
// transformaria em `readonly ["tabular-nums"]` que o spread em styles
// quebra. O literal solto resolve sem precisar tipar manualmente cada
// entrada do Typography como TextStyle.
const TAB_NUM = ["tabular-nums"] as ["tabular-nums"];

export const Typography = {
  // M-15: `display` e `headline` carregam `tabular-nums` por padrão —
  // são as escalas usadas em placar, cronômetro e contadores grandes,
  // onde dígitos de largura variável "dançam" entre frames. O variant
  // não afeta letras, então usar em títulos com texto puro é seguro.
  display: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.72,
    fontVariant: TAB_NUM,
  },
  headline: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.48,
    fontVariant: TAB_NUM,
  },
  title: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 14, fontWeight: "400" },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.48 },
  number: { fontSize: 24, fontWeight: "800", fontVariant: TAB_NUM },
} as const;

/**
 * Sombras consistentes (Premium escuro).
 *
 * Em RN, traduzimos para shadow / elevation (Android). O `glow` da paleta
 * pode entrar como `shadowColor` para CTAs principais. Handoff §3.
 */
export const Elevation = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 3,
  },
  pop: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 26,
    elevation: 8,
  },
} as const;

/**
 * Curvas e durações de animação — handoff §3 (Movimento).
 *
 * - `press`  · feedback toque                 — 120ms linear
 * - `screen` · transição de tela              — 320ms ease
 * - `sheet`  · bottom-sheet / modal           — 300ms swing
 * - `golpop` · pulo de comemoração de gol     — 500ms overshoot
 */
export const Motion = {
  press: { duration: 120, easing: "linear" as const },
  screen: { duration: 320, easing: "ease" as const },
  sheet: { duration: 300, easing: [0.2, 1, 0.4, 1] as const },
  golpop: { duration: 500, easing: [0.2, 1.4, 0.4, 1] as const },
} as const;

/**
 * Paleta determinística usada para colorir avatares de jogador a partir do id.
 * Mantida para uso histórico (PlayerRow legado / fallback).
 */
export const AvatarPalette = [
  "#1976D2",
  "#388E3C",
  "#F57C00",
  "#7B1FA2",
  "#C62828",
  "#00838F",
  "#5D4037",
  "#455A64",
] as const;
