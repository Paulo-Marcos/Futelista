import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet } from "react-native";

import { Radius } from "@/src/shared/theme/Colors";

// Halo vermelho atrás do hero — vazamento colorido que o elevation Android
// não dá. Web NÃO renderiza: lá o boxShadow CSS já faz o blur de verdade.
// No nativo, usa expo-linear-gradient (fade vertical) em vez de uma View
// vermelha sólida — a View chapada virava um retângulo no Android.
export function HeroGlowHalo({ color }: { color: string }) {
  if (Platform.OS === "web") return null;
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[color + "00", color + "70", color + "00"]}
      locations={[0, 0.6, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.heroGlowHalo}
    />
  );
}

const styles = StyleSheet.create({
  // Halo vermelho atrás do hero (vaza ~6px por baixo do card)
  heroGlowHalo: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 16,
    bottom: -6,
    borderRadius: Radius.xl,
  },
});
