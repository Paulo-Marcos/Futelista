import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * SegmentedControl — pill segmentado para escolha mutuamente excludente.
 * Portado de `.fl-seg2` em prototype/css/extra.css.
 *
 * Layout: row, bg surfaceContainerHigh, radius 14, padding 3;
 * cada btn flex:1, padding 9/4, radius 12, texto 13/700;
 * ativo → bg primary + onPrimary; inativo → onSurfaceVariant.
 */
export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const palette = usePalette();
  return (
    <View
      style={[styles.row, { backgroundColor: palette.surfaceContainerHigh }]}
    >
      {options.map((opt) => {
        const ativo = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: ativo, disabled: !!disabled }}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: ativo ? palette.primary : "transparent",
                opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: ativo ? palette.onPrimary : palette.onSurfaceVariant,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
    padding: 3,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  btn: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  label: { ...Typography.label, fontSize: 13, fontWeight: "700" },
});
