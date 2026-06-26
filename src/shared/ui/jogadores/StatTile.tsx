import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Tile de uma estatística — ícone + valor grande + label.
 *
 * `accent` colore o ícone com um token específico da paleta — usado para
 * dar destaque visual a "Gols" (goal/verde) e "Vitórias" (tertiary/dourado),
 * mantendo o resto neutro.
 */
export function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number | string;
  accent?: "goal" | "tertiary";
}) {
  const palette = usePalette();
  const iconColor =
    accent === "goal"
      ? palette.goal
      : accent === "tertiary"
        ? palette.tertiary
        : palette.onSurfaceVariant;
  return (
    <View
      style={[
        styles.sheetTile,
        {
          backgroundColor: palette.surfaceContainerHigh,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      <Text style={[styles.sheetTileValue, { color: palette.onSurface }]}>
        {value}
      </Text>
      <Text
        style={[styles.sheetTileLabel, { color: palette.onSurfaceVariant }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetTile: {
    // 3 colunas no card largo, ~1 coluna num device estreito. Calculo flex
    // base ~30% para garantir 3 por linha em qualquer largura comum.
    flexBasis: "30%",
    flexGrow: 1,
    minHeight: 80,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderCurve: "continuous",
  },
  // `Typography.number` é `as const` (readonly fontVariant) — copiamos os
  // campos manualmente para satisfazer o tipo mutável esperado por `TextStyle`.
  sheetTileValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    fontVariant: ["tabular-nums" as const],
  },
  sheetTileLabel: {
    ...Typography.label,
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
