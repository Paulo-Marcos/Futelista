/**
 * THEME_REGISTRY — as 7 paletas do FuteLista, em claro e escuro,
 * pré-computadas no carregamento do módulo (uma vez só) seguindo o
 * handoff de Fundações §1 (Temas & cores).
 *
 * Cada clube vira uma `Palette` no formato Material 3 estendido + chaves
 * legadas (`text`, `background`, `tint`, `icon`, …) para back-compat.
 *
 * - Modo escuro: hex absolutos do protótipo (`themes.js`).
 * - Modo claro: neutros derivados da primária via `mixHex` (substitui
 *   `color-mix(in srgb …)`, que não existe em RN). O resultado já é hex.
 *
 * Nenhum cálculo de mistura ocorre por render: tudo é constante de módulo.
 */

import { alphaHex, mixHex } from "./mix";

// ---------------------------------------------------------------------------
// Constantes "vivas" do protótipo (espelham handoff_v2/_prototype/js/themes.js)
// ---------------------------------------------------------------------------

export const THEME_IDS = [
  "rubro",
  "verde",
  "azulpb",
  "grena",
  "pb",
  "azul",
  "amareloverde",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "rubro";

/** Spec bruto dos modos escuros, espelhando `THEMES` do protótipo. */
type DarkSpec = {
  primary: string;
  primaryDim: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  bg: string;
  bg2: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  textDim: string;
  goal: string;
  warn: string;
  glow: string;
};

/** Spec bruto das cores de marca para o modo claro (`LIGHT_BRAND`). */
type LightBrandSpec = {
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
};

const DARK_SPEC: Record<ThemeId, DarkSpec> = {
  rubro: {
    primary: "#EE2737",
    primaryDim: "#B3141F",
    onPrimary: "#FFFFFF",
    secondary: "#F4F4F5",
    onSecondary: "#0C0C0E",
    accent: "#FFC23C",
    bg: "#0C0C0E",
    bg2: "#101013",
    surface: "#18181B",
    surface2: "#212126",
    line: "#2C2C31",
    text: "#F6F6F7",
    textDim: "#A1A1AA",
    goal: "#2BD17E",
    warn: "#F5A524",
    glow: "rgba(238, 39, 55, 0.55)",
  },
  verde: {
    primary: "#15B25A",
    primaryDim: "#0C7A3C",
    onPrimary: "#04140B",
    secondary: "#FFFFFF",
    onSecondary: "#0A1110",
    accent: "#9DF6BE",
    bg: "#0A1110",
    bg2: "#0D1715",
    surface: "#121C18",
    surface2: "#1B2620",
    line: "#26332C",
    text: "#F1F8F4",
    textDim: "#9DB2A8",
    goal: "#3BE584",
    warn: "#F5A524",
    glow: "rgba(21, 178, 90, 0.50)",
  },
  azulpb: {
    primary: "#3B7BFF",
    primaryDim: "#2453C4",
    onPrimary: "#FFFFFF",
    secondary: "#F4F6FB",
    onSecondary: "#0A0D12",
    accent: "#8FB6FF",
    bg: "#0A0D12",
    bg2: "#0E121A",
    surface: "#141A24",
    surface2: "#1D2533",
    line: "#2A3442",
    text: "#EFF3F9",
    textDim: "#94A2B6",
    goal: "#2BD17E",
    warn: "#F5A524",
    glow: "rgba(59, 123, 255, 0.50)",
  },
  grena: {
    primary: "#A8243F",
    primaryDim: "#6E1627",
    onPrimary: "#FFF1F3",
    secondary: "#13A862",
    onSecondary: "#06140D",
    accent: "#F2D8B0",
    bg: "#120A0D",
    bg2: "#170E11",
    surface: "#1E1318",
    surface2: "#291B22",
    line: "#37242C",
    text: "#F6ECEF",
    textDim: "#BC9BA5",
    goal: "#2FD884",
    warn: "#F5A524",
    glow: "rgba(168, 36, 63, 0.55)",
  },
  pb: {
    primary: "#FAFAFA",
    primaryDim: "#D4D4D8",
    onPrimary: "#0A0A0B",
    secondary: "#A1A1AA",
    onSecondary: "#0A0A0B",
    accent: "#FAFAFA",
    bg: "#09090B",
    bg2: "#0D0D0F",
    surface: "#161618",
    surface2: "#202023",
    line: "#2E2E34",
    text: "#FAFAFA",
    textDim: "#9A9AA3",
    goal: "#2BD17E",
    warn: "#F5A524",
    glow: "rgba(255, 255, 255, 0.35)",
  },
  azul: {
    primary: "#2E8AE6",
    primaryDim: "#1C5FA6",
    onPrimary: "#FFFFFF",
    secondary: "#FFFFFF",
    onSecondary: "#0A0F16",
    accent: "#93CBFF",
    bg: "#0A0F16",
    bg2: "#0D131C",
    surface: "#121A24",
    surface2: "#1A2533",
    line: "#273343",
    text: "#EEF4FB",
    textDim: "#90A2B6",
    goal: "#2BD17E",
    warn: "#F5A524",
    glow: "rgba(46, 138, 230, 0.50)",
  },
  amareloverde: {
    primary: "#F5C518",
    primaryDim: "#C99A00",
    onPrimary: "#11150A",
    secondary: "#12A857",
    onSecondary: "#04140B",
    accent: "#FFE680",
    bg: "#0B100A",
    bg2: "#0E140C",
    surface: "#141B11",
    surface2: "#1E2719",
    line: "#2C3724",
    text: "#F5F8EE",
    textDim: "#A9B69A",
    goal: "#3BE584",
    warn: "#F59E0B",
    glow: "rgba(245, 197, 24, 0.50)",
  },
};

const LIGHT_BRAND: Record<ThemeId, LightBrandSpec> = {
  rubro: {
    primary: "#D11A27",
    onPrimary: "#FFFFFF",
    secondary: "#1E1E22",
    onSecondary: "#FFFFFF",
    accent: "#A6781A",
  },
  verde: {
    primary: "#0E8A45",
    onPrimary: "#FFFFFF",
    secondary: "#334155",
    onSecondary: "#FFFFFF",
    accent: "#0E8A45",
  },
  azulpb: {
    primary: "#2A62D6",
    onPrimary: "#FFFFFF",
    secondary: "#1E1E22",
    onSecondary: "#FFFFFF",
    accent: "#2A62D6",
  },
  grena: {
    primary: "#8A1F35",
    onPrimary: "#FFFFFF",
    secondary: "#0E8A4F",
    onSecondary: "#FFFFFF",
    accent: "#9C6B26",
  },
  pb: {
    primary: "#1C1C1F",
    onPrimary: "#FFFFFF",
    secondary: "#6B7280",
    onSecondary: "#FFFFFF",
    accent: "#1C1C1F",
  },
  azul: {
    primary: "#1C66B3",
    onPrimary: "#FFFFFF",
    secondary: "#334155",
    onSecondary: "#FFFFFF",
    accent: "#1C66B3",
  },
  amareloverde: {
    primary: "#B98A00",
    onPrimary: "#FFFFFF",
    secondary: "#0E9A4F",
    onSecondary: "#FFFFFF",
    accent: "#B98A00",
  },
};

/** Constantes neutras do modo claro, vindas do `LIGHT_NEUTRALS` do handoff. */
const LIGHT_BASE = {
  bg: "#F4F5F8",
  bg2: "#EDEEF2",
  surface2: "#F2F4F8",
  line: "#DDE1E8",
  text: "#17191E",
  textDim: "#5D6470",
  goal: "#12924F",
  warn: "#C2410C",
} as const;

// ---------------------------------------------------------------------------
// Tipo Palette (M3 estendido + chaves legadas para back-compat com Colors.ts)
// ---------------------------------------------------------------------------

export type Palette = {
  // Compatibilidade com chaves legadas
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;

  // Material 3 — marca
  primary: string;
  primaryDim: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;

  // Material 3 — superfícies
  surface: string;
  surfaceVariant: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  onSurface: string;
  onSurfaceVariant: string;

  // Material 3 — semânticas
  error: string;
  onError: string;
  errorContainer: string;
  success: string;
  goal: string;
  warning: string;

  // Material 3 — linhas
  outline: string;
  outlineVariant: string;

  // Sombras & halos
  shadow: string;
  glow: string;

  // Tokens do gramado (independem do clube; só do modo)
  fieldA: string;
  fieldB: string;
  fieldLine: string;
};

// ---------------------------------------------------------------------------
// Tokens "agnósticos" do gramado, por modo
// ---------------------------------------------------------------------------

const FIELD_DARK = {
  fieldA: "#163A24",
  fieldB: "#13321F",
  fieldLine: "rgba(255, 255, 255, 0.10)",
};
const FIELD_LIGHT = {
  fieldA: "#43A64F",
  fieldB: "#3A9446",
  fieldLine: "rgba(255, 255, 255, 0.62)",
};

// ---------------------------------------------------------------------------
// Construção das paletas claras (cálculo só ocorre no boot do módulo)
// ---------------------------------------------------------------------------

function buildLightPalette(themeId: ThemeId): Palette {
  const brand = LIGHT_BRAND[themeId];
  const { primary, onPrimary, secondary, onSecondary, accent } = brand;

  const bg = mixHex(primary, LIGHT_BASE.bg, 3.5);
  const bg2 = mixHex(primary, LIGHT_BASE.bg2, 5);
  const surface = "#FFFFFF";
  const surface2 = mixHex(primary, LIGHT_BASE.surface2, 4);
  const line = mixHex(primary, LIGHT_BASE.line, 9);

  const primaryContainer = mixHex(primary, "#FFFFFF", 14);
  const onPrimaryContainer = mixHex(primary, "#000000", 80);
  const errorContainer = mixHex("#B3261E", "#FFFFFF", 18);

  return {
    text: LIGHT_BASE.text,
    background: bg,
    tint: primary,
    icon: LIGHT_BASE.textDim,
    tabIconDefault: LIGHT_BASE.textDim,
    tabIconSelected: primary,

    primary,
    primaryDim: mixHex(primary, "#000000", 85),
    onPrimary,
    primaryContainer,
    onPrimaryContainer,
    secondary,
    onSecondary,
    secondaryContainer: surface2,
    onSecondaryContainer: LIGHT_BASE.text,
    tertiary: accent,

    surface,
    surfaceVariant: surface2,
    surfaceContainerLow: bg2,
    surfaceContainerHigh: surface2,
    onSurface: LIGHT_BASE.text,
    onSurfaceVariant: LIGHT_BASE.textDim,

    error: "#B3261E",
    onError: "#FFFFFF",
    errorContainer,
    success: LIGHT_BASE.goal,
    goal: LIGHT_BASE.goal,
    warning: LIGHT_BASE.warn,

    outline: mixHex(primary, "#CDD0D6", 12),
    outlineVariant: line,

    shadow: "rgba(0, 0, 0, 0.12)",
    glow: alphaHex(primary, 0.3),

    ...FIELD_LIGHT,
  };
}

function buildDarkPalette(themeId: ThemeId): Palette {
  const s = DARK_SPEC[themeId];

  const primaryContainer = mixHex(s.primary, s.bg, 20);
  const onPrimaryContainer = mixHex(s.primary, "#FFFFFF", 70);

  return {
    text: s.text,
    background: s.bg,
    tint: s.primary,
    icon: s.textDim,
    tabIconDefault: s.textDim,
    tabIconSelected: s.primary,

    primary: s.primary,
    primaryDim: s.primaryDim,
    onPrimary: s.onPrimary,
    primaryContainer,
    onPrimaryContainer,
    secondary: s.secondary,
    onSecondary: s.onSecondary,
    secondaryContainer: s.surface2,
    onSecondaryContainer: s.secondary,
    tertiary: s.accent,

    surface: s.surface,
    surfaceVariant: s.surface2,
    surfaceContainerLow: s.bg2,
    surfaceContainerHigh: s.surface2,
    onSurface: s.text,
    onSurfaceVariant: s.textDim,

    error: "#F2B8B5",
    onError: "#601410",
    errorContainer: "#8C1D18",
    success: s.goal,
    goal: s.goal,
    warning: s.warn,

    outline: mixHex(s.primary, s.line, 25),
    outlineVariant: s.line,

    shadow: "rgba(0, 0, 0, 0.4)",
    glow: s.glow,

    ...FIELD_DARK,
  };
}

// ---------------------------------------------------------------------------
// Registry final
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark";

export type ThemeDescriptor = {
  id: ThemeId;
  label: string;
  /** Trio de cores para preview / chips (primária + duas auxiliares). */
  swatch: readonly [string, string, string];
  light: Palette;
  dark: Palette;
};

export const THEME_REGISTRY: Readonly<Record<ThemeId, ThemeDescriptor>> = {
  rubro: {
    id: "rubro",
    label: "Rubro-negro",
    swatch: ["#E11D2A", "#0C0C0E", "#F4F4F5"],
    light: buildLightPalette("rubro"),
    dark: buildDarkPalette("rubro"),
  },
  verde: {
    id: "verde",
    label: "Verde & branco",
    swatch: ["#12A150", "#FFFFFF", "#0A1110"],
    light: buildLightPalette("verde"),
    dark: buildDarkPalette("verde"),
  },
  azulpb: {
    id: "azulpb",
    label: "Azul, preto & branco",
    swatch: ["#2E6BE6", "#0A0D12", "#FFFFFF"],
    light: buildLightPalette("azulpb"),
    dark: buildDarkPalette("azulpb"),
  },
  grena: {
    id: "grena",
    label: "Grená & verde",
    swatch: ["#8A1F35", "#0E9A57", "#F2E2C4"],
    light: buildLightPalette("grena"),
    dark: buildDarkPalette("grena"),
  },
  pb: {
    id: "pb",
    label: "Preto & branco",
    swatch: ["#FAFAFA", "#09090B", "#A1A1AA"],
    light: buildLightPalette("pb"),
    dark: buildDarkPalette("pb"),
  },
  azul: {
    id: "azul",
    label: "Azul & branco",
    swatch: ["#1E78D2", "#FFFFFF", "#0A0F16"],
    light: buildLightPalette("azul"),
    dark: buildDarkPalette("azul"),
  },
  amareloverde: {
    id: "amareloverde",
    label: "Amarelo & verde",
    swatch: ["#F4C20D", "#0E9A4F", "#0B100A"],
    light: buildLightPalette("amareloverde"),
    dark: buildDarkPalette("amareloverde"),
  },
} as const;

/** Lista ordenada de descritores — útil para pickers de tema. */
export const THEMES: readonly ThemeDescriptor[] = THEME_IDS.map(
  (id) => THEME_REGISTRY[id],
);

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as readonly string[]).includes(value)
  );
}

/** Resolve a paleta efetiva por (tema, modo). Sem alocação por chamada. */
export function getPalette(themeId: ThemeId, mode: ThemeMode): Palette {
  return THEME_REGISTRY[themeId][mode];
}
