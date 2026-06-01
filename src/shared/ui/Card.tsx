import { StyleSheet, View, ViewProps } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing } from "@/src/shared/theme/Colors";

type CardProps = ViewProps & {
  variant?: "surface" | "primary" | "outlined";
  padding?: keyof typeof Spacing | "none";
};

/**
 * Card material 3 simples.
 *
 * Variants:
 *  - surface (default): fundo neutro com sombra suave
 *  - primary: fundo primaryContainer (destaque)
 *  - outlined: sem fundo, só borda (para sumir em listas densas)
 */
export function Card({
  variant = "surface",
  padding = "lg",
  style,
  children,
  ...rest
}: CardProps) {
  const palette = usePalette();
  const backgroundByVariant = {
    surface: palette.surface,
    primary: palette.primaryContainer,
    outlined: "transparent",
  };
  const borderByVariant = {
    surface: "transparent",
    primary: "transparent",
    outlined: palette.outline,
  };
  const elevationStyle =
    variant === "surface"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 3,
          elevation: 2,
        }
      : null;
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: backgroundByVariant[variant],
          borderColor: borderByVariant[variant],
          borderWidth: variant === "outlined" ? 1 : 0,
          padding: padding === "none" ? 0 : Spacing[padding],
        },
        elevationStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderCurve: "continuous",
  },
});
