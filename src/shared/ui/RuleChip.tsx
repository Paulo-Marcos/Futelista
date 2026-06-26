import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

type RuleChipProps = {
  label: string;
};

/**
 * Chip pequeno para mostrar uma regra ativa (ex.: "4×4", "10min", "Ordem").
 * Usado em filas/headers de status da pelada.
 */
export const RuleChip = memo(function RuleChip({ label }: RuleChipProps) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: palette.surfaceVariant,
          borderColor: palette.outline,
        },
      ]}
    >
      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: {
    ...Typography.label,
  },
});
