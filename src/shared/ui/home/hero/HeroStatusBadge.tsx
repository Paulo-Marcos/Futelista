import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/** Badge de estado (PRÓXIMA PARTIDA / PELADA ATIVA) no canto superior direito. */
export function HeroStatusBadge({
  label,
  palette,
}: {
  label: string;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <View
      style={[
        styles.heroBadge,
        {
          backgroundColor: palette.surfaceContainerHigh,
          borderColor: palette.primary + "55",
        },
      ]}
    >
      <Text style={[styles.heroLabel, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Badge de modo (PRÓXIMA PARTIDA / PELADA ATIVA) — pílula à direita do header.
  heroBadge: {
    flexShrink: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  heroLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    opacity: 0.7,
  },
});
