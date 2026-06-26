import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function StatCard({
  icon,
  value,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      android_ripple={{ color: palette.primary + "22" }}
    >
      <View style={[styles.statIcoGlow, { shadowColor: palette.primary }]}>
        <MaterialCommunityIcons name={icon} size={28} color={palette.primary} />
      </View>
      <Text style={[styles.statValue, { color: palette.onSurface }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
    borderCurve: "continuous",
  },
  // Glow sutil no ícone vermelho do StatCard — shadowColor injetado em runtime
  statIcoGlow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  statValue: {
    ...Typography.display,
    fontSize: 32,
  },
  statLabel: { ...Typography.label },
});
