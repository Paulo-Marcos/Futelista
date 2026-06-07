import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Field — input com ícone à esquerda. Portado de `.fl-field2`.
 *
 * row gap9, padding H 13, minHeight 50, bg surface, border 1 outlineVariant,
 * radius 14. Foco → borderColor primary.
 */
type FieldProps = Omit<TextInputProps, "style"> & {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

export function Field({ icon, ...input }: FieldProps) {
  const palette = usePalette();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.surface,
          borderColor: focused ? palette.primary : palette.outlineVariant,
        },
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={palette.onSurfaceVariant}
        />
      ) : null}
      <TextInput
        {...input}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        placeholderTextColor={palette.onSurfaceVariant}
        style={[styles.input, { color: palette.onSurface }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    minWidth: 0,
    paddingVertical: Spacing.xs,
  },
});
