import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Typography } from "@/src/shared/theme/Colors";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";

// CTA "Iniciar partida" com glow vermelho. Mesma receita do hero (shadowColor
// + halo + boxShadow web), em escala menor.
export function HeroPrimaryCTA({
  label,
  icon,
  onPress,
  palette,
}: {
  label: string;
  icon: Parameters<typeof PrimaryButton>[0]["icon"];
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
}) {
  const webCtaGlow =
    Platform.OS === "web"
      ? ({ boxShadow: `0 12px 34px -10px ${palette.glow}` } as object)
      : null;
  return (
    <View
      style={[
        styles.heroCtaShadow,
        { shadowColor: palette.primary },
        webCtaGlow,
      ]}
    >
      {Platform.OS !== "web" ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            palette.primary + "00",
            palette.primary + "70",
            palette.primary + "00",
          ]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroCtaHalo}
        />
      ) : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.heroCta,
          { backgroundColor: palette.primary },
          pressed && styles.heroCtaPressed,
        ]}
        android_ripple={{ color: palette.onPrimary + "22" }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={palette.onPrimary}
        />
        <Text style={[styles.heroCtaText, { color: palette.onPrimary }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // CTA "Iniciar partida" dentro do hero — glow em escala menor
  heroCtaShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  heroCtaHalo: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 14,
    bottom: -4,
    borderRadius: Radius.md,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 54,
    borderRadius: Radius.md,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  heroCtaPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  heroCtaText: { ...Typography.title, fontSize: 16, fontWeight: "800" },
});
