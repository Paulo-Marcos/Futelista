import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

/**
 * Glow avermelhado por baixo do AvulsaCard.
 *
 * RN não suporta `filter:blur`. Antes simulávamos com RadialGradients SVG,
 * mas no Android o gradiente radial saía como retângulo sólido. Trocado por
 * `expo-linear-gradient` (nativo, confiável no Android): um fade vertical
 * transparente→cor→transparente cria o vazamento de luz ao redor do card.
 */
export function AvulsaGlow({ color }: { color: string }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[color + "00", color + "55", color + "00"]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.avulsaGlow, { borderRadius: 28 }]}
    />
  );
}

const styles = StyleSheet.create({
  avulsaGlow: {
    position: "absolute",
    left: -16,
    right: -16,
    top: -8,
    bottom: -28,
  },
});
