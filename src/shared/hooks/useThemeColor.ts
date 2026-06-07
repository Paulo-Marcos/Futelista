import { useTheme } from "@/src/shared/theme/themeContext";
import type { Palette } from "@/src/shared/theme/themes";

/**
 * Lê uma cor específica do tema corrente, com a possibilidade de override
 * via prop (`light`/`dark`) — padrão herdado do template Expo.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof Palette,
) {
  const { effectiveMode, palette } = useTheme();
  const colorFromProps = props[effectiveMode];

  if (colorFromProps) {
    return colorFromProps;
  }
  return palette[colorName];
}
