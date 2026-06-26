import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Toast curto no topo da tela, anunciando que faltam 2 minutos ou 30
 * segundos para o fim do tempo (F-08). Visual mais sóbrio que o
 * `SubstitutionToast` — alerta, não evento de jogo.
 */
export function CheckpointToast({
  texto,
  topOffset,
}: {
  texto: string;
  topOffset: number;
}) {
  const palette = usePalette();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.checkpointToast,
        {
          top: topOffset + Spacing.sm,
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons name="alarm" size={16} color={palette.warning} />
      <Text style={[styles.checkpointToastText, { color: palette.onSurface }]}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  checkpointToast: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 60,
    borderCurve: "continuous",
  },
  checkpointToastText: { ...Typography.title, fontSize: 13 },
});
