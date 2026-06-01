import { useColorScheme } from "react-native";

import { Colors } from "@/src/shared/theme/Colors";

export type Palette = typeof Colors.light;

/**
 * Retorna a paleta inteira (light ou dark) numa única chamada.
 *
 * Útil para componentes que usam vários tokens de cor e querem evitar
 * múltiplas chamadas a useThemeColor.
 */
export function usePalette(): Palette {
  const scheme = useColorScheme() ?? "light";
  return Colors[scheme] as Palette;
}
