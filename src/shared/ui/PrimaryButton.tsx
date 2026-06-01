import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
};

/**
 * Botão principal — color primary, texto onPrimary.
 * Para ação principal de uma tela.
 */
export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  fullWidth,
  testID,
}: PrimaryButtonProps) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: disabled ? palette.outline : palette.primary,
          opacity: pressed && !disabled ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
      ]}
      android_ripple={{ color: palette.onPrimary + "22" }}
    >
      <View style={styles.content}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={palette.onPrimary}
          />
        ) : null}
        <Text style={[styles.label, { color: palette.onPrimary }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    justifyContent: "center",
    borderCurve: "continuous",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  label: {
    ...Typography.title,
    fontSize: 16,
  },
});
