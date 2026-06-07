import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * MiniStepper — controlo vertical compacto. Portado de `.fl-ministep`.
 *
 * col, gap7, padding 12/6, radius 20, border 1;
 * ícone primary 16 em cima · controles (− valor +) · label dim.
 */
export function MiniStepper({
  icon,
  label,
  value,
  onChange,
  min,
  max,
}: {
  icon: keyof typeof import("@expo/vector-icons").MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const palette = usePalette();
  const canMinus = value > min;
  const canPlus = value < max;
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={palette.primary} />
      <View style={styles.ctrl}>
        <Pressable
          onPress={() => canMinus && onChange(value - 1)}
          disabled={!canMinus}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label}`}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: palette.surfaceContainerHigh,
              borderColor: palette.outlineVariant,
              opacity: !canMinus ? 0.35 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="minus"
            size={14}
            color={palette.onSurface}
          />
        </Pressable>
        <Text
          style={[styles.value, { color: palette.onSurface }]}
          accessibilityLabel={`${label}: ${value}`}
        >
          {value}
        </Text>
        <Pressable
          onPress={() => canPlus && onChange(value + 1)}
          disabled={!canPlus}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: palette.surfaceContainerHigh,
              borderColor: palette.outlineVariant,
              opacity: !canPlus ? 0.35 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="plus"
            size={14}
            color={palette.onSurface}
          />
        </Pressable>
      </View>
      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    gap: 7,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  ctrl: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  value: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: "800",
    minWidth: 22,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  label: { ...Typography.label, fontSize: 11, fontWeight: "600" },
});
