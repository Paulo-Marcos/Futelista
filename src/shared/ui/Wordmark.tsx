import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Wordmark — logo "FuteLista".
 *
 * Disco primário com ícone de bola + "Fute" (onSurface) + "Lista" (primary),
 * espelhando o `fl-wordmark` do protótipo. `size` controla o tamanho do
 * texto em px; o disco escala proporcionalmente.
 */
export function Wordmark({ size = 28 }: { size?: number }) {
  const palette = usePalette();
  const discSize = Math.round(size * 1.5);
  const ballSize = Math.round(size * 1.05);
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.disc,
          {
            backgroundColor: palette.primary,
            width: discSize,
            height: discSize,
            borderRadius: discSize / 2,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="soccer"
          size={ballSize}
          color={palette.onPrimary}
        />
      </View>
      <Text style={[styles.text, { fontSize: size }]}>
        <Text style={{ color: palette.onSurface }}>Fute</Text>
        <Text style={{ color: palette.primary }}>Lista</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  disc: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
  },
  text: {
    ...Typography.headline,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
});
