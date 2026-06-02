/**
 * Paleta de cores do FuteLista.
 *
 * Segue Material 3 (Android-first) e mantém compatibilidade com as chaves
 * legadas (text, background, tint, icon, tabIconDefault, tabIconSelected)
 * usadas por ThemedText/ThemedView/useThemeColor.
 *
 * Tokens M3:
 *   primary / primaryContainer    — botão principal, header, tab ativa
 *   secondary / secondaryContainer — destaque (gol, vantagem)
 *   surface                       — superfície de card
 *   background                    — fundo da tela
 *   onSurface / onSurfaceVariant  — texto principal e secundário
 *   error                         — erros e ações destrutivas
 *   outline                       — bordas, divisores
 *   success                       — confirmação, vencedor
 *   warning                       — pausado, alerta
 */
const tintColorLight = "#2E7D32";
const tintColorDark = "#66BB6A";

export const Colors = {
  light: {
    // Compatibilidade com chaves legadas
    text: "#1C1B1F",
    background: "#FAFAFA",
    tint: tintColorLight,
    icon: "#666666",
    tabIconDefault: "#666666",
    tabIconSelected: tintColorLight,

    // Tokens Material 3
    primary: "#2E7D32",
    onPrimary: "#FFFFFF",
    primaryContainer: "#C8E6C9",
    onPrimaryContainer: "#1B5E20",

    secondary: "#F57C00",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#FFE0B2",
    onSecondaryContainer: "#E65100",

    surface: "#FFFFFF",
    surfaceVariant: "#F5F5F5",
    onSurface: "#1C1B1F",
    onSurfaceVariant: "#666666",

    error: "#B3261E",
    onError: "#FFFFFF",
    errorContainer: "#F9DEDC",

    success: "#2E7D32",
    warning: "#F57C00",

    outline: "#E0E0E0",
    outlineVariant: "#EEEEEE",

    shadow: "rgba(0,0,0,0.12)",
  },
  dark: {
    // Compatibilidade
    text: "#E6E1E5",
    background: "#121212",
    tint: tintColorDark,
    icon: "#A0A0A0",
    tabIconDefault: "#A0A0A0",
    tabIconSelected: tintColorDark,

    // Tokens M3
    primary: "#66BB6A",
    onPrimary: "#003908",
    primaryContainer: "#1B5E20",
    onPrimaryContainer: "#C8E6C9",

    secondary: "#FFB74D",
    onSecondary: "#4A2800",
    secondaryContainer: "#5A3A00",
    onSecondaryContainer: "#FFE0B2",

    surface: "#1C1B1F",
    surfaceVariant: "#2A2A2E",
    onSurface: "#E6E1E5",
    onSurfaceVariant: "#A0A0A0",

    error: "#F2B8B5",
    onError: "#601410",
    errorContainer: "#8C1D18",

    success: "#66BB6A",
    warning: "#FFB74D",

    outline: "#3A3A3A",
    outlineVariant: "#2A2A2A",

    shadow: "rgba(0,0,0,0.4)",
  },
} as const;

export type ColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Escalas de espaçamento e raio (múltiplos de 4) e tipografia compartilhada.
 * Centralizado aqui para evitar magic numbers pelos componentes.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Typography = {
  display: { fontSize: 36, fontWeight: "700" },
  headline: { fontSize: 24, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "600" },
  body: { fontSize: 14, fontWeight: "400" },
  label: { fontSize: 12, fontWeight: "500" },
} as const;

/**
 * Paleta determinística usada para colorir avatares de jogador a partir do id.
 *
 * Fica fora de `Colors` (light/dark) porque o avatar usa fundo escuro com
 * texto branco em ambos os temas — uma única tabela basta. Hashing do id em
 * `colorForId` (PlayerRow) escolhe o índice de forma estável.
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
