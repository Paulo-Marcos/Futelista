import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  fullWidth?: boolean;
  destructive?: boolean;
  testID?: string;
};

/**
 * Botão secundário — contornado (outlined).
 * Para ação alternativa ou destrutiva (com prop destructive).
 */
export function SecondaryButton({
  label,
  onPress,
  icon,
  disabled,
  fullWidth,
  destructive,
  testID,
}: SecondaryButtonProps) {
  const palette = usePalette();
  const tint = destructive ? palette.error : palette.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          borderColor: disabled ? palette.outline : tint,
          opacity: pressed && !disabled ? 0.7 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
      ]}
      android_ripple={{ color: tint + "22" }}
    >
      <View style={styles.content}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={disabled ? palette.onSurfaceVariant : tint}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            { color: disabled ? palette.onSurfaceVariant : tint },
          ]}
        >
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
    borderWidth: 1.5,
    justifyContent: "center",
    backgroundColor: "transparent",
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
