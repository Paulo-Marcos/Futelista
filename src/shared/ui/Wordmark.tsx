import { Image, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Wordmark — logo "FuteLista".
 *
 * Ícone oficial do app (arte do hand-off) num tile arredondado (squircle) +
 * "Fute" (onSurface) + "Lista" (primary). `size` controla o tamanho do texto
 * em px; o tile escala proporcionalmente.
 */
export function Wordmark({ size = 28 }: { size?: number }) {
  const palette = usePalette();
  const markSize = Math.round(size * 1.5);
  return (
    <View style={styles.row}>
      <Image
        source={require("../../../assets/images/icon.png")}
        style={{
          width: markSize,
          height: markSize,
          borderRadius: Math.round(markSize * 0.28),
        }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
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
  text: {
    ...Typography.headline,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
});
