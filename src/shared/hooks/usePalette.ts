import { useTheme } from "@/src/shared/theme/themeContext";
import type { Palette } from "@/src/shared/theme/themes";

export type { Palette };

/**
 * Retorna a paleta inteira (resolvida por tema do clube × modo claro/escuro)
 * numa única chamada.
 *
 * Funciona **sem** `ThemeProvider` (cai no tema padrão), o que mantém os
 * componentes testáveis isoladamente sem precisar embrulhar com provider.
 */
export function usePalette(): Palette {
  return useTheme().palette;
}
