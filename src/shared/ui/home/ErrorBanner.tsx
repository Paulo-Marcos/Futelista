import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function ErrorBanner({ mensagem }: { mensagem: string }) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.errorBanner,
        {
          backgroundColor: palette.errorContainer,
          borderColor: palette.error,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <MaterialCommunityIcons
        name="alert-circle"
        size={16}
        color={palette.error}
      />
      <Text style={[styles.errorText, { color: palette.error }]} selectable>
        {mensagem}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: { ...Typography.label, flex: 1 },
});
