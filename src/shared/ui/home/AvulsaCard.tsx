import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { AvulsaGlow } from "./AvulsaGlow";
import { AvulsaPitch } from "./AvulsaPitch";

export function AvulsaCard({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading: boolean;
}) {
  const palette = usePalette();
  // RN Web não traduz shadowColor pra box-shadow vermelho; injetamos o CSS
  // diretamente. RadialGradient SVG do AvulsaGlow também fica subdimensionado
  // no web — o boxShadow é quem garante o glow visível no navegador.
  // Reproduz o box-shadow do protótipo HTML (`extra.css` / `.fl-avulsa`):
  // `0 14px 36px -12px var(--glow)` onde --glow = palette.glow.
  const webGlow =
    Platform.OS === "web"
      ? ({ boxShadow: `0 14px 36px -12px ${palette.glow}` } as object)
      : null;
  return (
    <View style={styles.avulsaShell}>
      <AvulsaGlow color={palette.primary} />
      <Pressable
        onPress={onPress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Iniciar pelada avulsa"
        style={({ pressed }) => [
          styles.avulsaCard,
          {
            backgroundColor: palette.primary,
            shadowColor: palette.glow,
            opacity: pressed ? 0.92 : 1,
          },
          webGlow,
        ]}
      >
        <LinearGradient
          colors={[palette.primary, palette.primaryDim, palette.primaryDim]}
          locations={[0, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <AvulsaPitch />
        <View style={styles.avulsaContent}>
          <View
            style={[styles.avulsaIcon, { backgroundColor: "rgba(0,0,0,0.22)" }]}
          >
            <MaterialCommunityIcons
              name="whistle"
              size={26}
              color={palette.onPrimary}
            />
          </View>
          <View style={styles.avulsaText}>
            <Text style={[styles.avulsaTitle, { color: palette.onPrimary }]}>
              Pelada avulsa
            </Text>
            <Text
              style={[
                styles.avulsaSub,
                { color: palette.onPrimary, opacity: 0.85 },
              ]}
            >
              Comece a jogar agora, sem cadastro
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={palette.onPrimary} />
          ) : (
            <MaterialCommunityIcons
              name="play"
              size={22}
              color={palette.onPrimary}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Glow vai por baixo via SVG (AvulsaGlow) — RN não tem filter:blur, então o
  // padrão do Splash (RadialGradient empilhado) é o que produz a sombra
  // avermelhada cross-platform. O shell não pode clipar (sem overflow:hidden).
  avulsaShell: {
    position: "relative",
  },
  avulsaCard: {
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 18,
    // Sombra nativa adicional pro iOS — soma com o glow SVG sem competir.
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
    borderCurve: "continuous",
  },
  avulsaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avulsaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avulsaText: { flex: 1 },
  avulsaTitle: { ...Typography.headline, fontSize: 18, fontWeight: "800" },
  avulsaSub: { ...Typography.body, fontSize: 12.5, marginTop: 2 },
});
