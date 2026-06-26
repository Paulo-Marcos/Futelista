import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing } from "@/src/shared/theme/Colors";

// CTA grande "Iniciar partida" / "Voltar à partida" com glow vermelho.
// Receita do README_Times.md, mesma do PrimaryCTA da Nova pelada:
//   iOS:     shadowColor=primary HEX opaco + offset/opacity/radius.
//   Android: <GlowHalo/> (View vermelha translúcida atrás) — elevation só
//            gera relevo cinza.
//   Web:     `boxShadow` CSS via Platform.select — RN Web não traduz
//            `shadowColor` para sombra colorida.
// Desabilitado vira `primaryDim` (vermelho queimado) sem glow — mais
// próximo do CSS do handoff (`background: var(--primary)` sempre) que do
// `T.surface2` cinza do hand-off TSX. Pattern já usado em Nova pelada e
// Jogadores nesta árvore.
export function PrimaryCTA({
  label,
  icon,
  disabled,
  onPress,
  palette,
  accessibilityLabel,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
  accessibilityLabel: string;
}) {
  const webGlow =
    !disabled && Platform.OS === "web"
      ? ({
          boxShadow: `0 12px 30px -8px ${palette.glow}, 0 2px 4px rgba(0,0,0,0.4)`,
        } as object)
      : null;
  return (
    <View
      style={[
        styles.ctaShadow,
        { shadowColor: palette.primary },
        disabled && styles.ctaShadowOff,
        webGlow,
      ]}
    >
      {!disabled && Platform.OS === "android" ? (
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
          style={styles.glowHalo}
        />
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: disabled ? palette.primaryDim : palette.primary,
            opacity: disabled ? 0.6 : 1,
          },
          pressed && !disabled && styles.pressedSoft,
        ]}
        android_ripple={{ color: palette.onPrimary + "22" }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={palette.onPrimary}
        />
        <Text style={[styles.ctaText, { color: palette.onPrimary }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressedSoft: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  // CTA com glow vermelho — receita do `Times.html` linha 99:
  //   box-shadow: 0 12px 30px -8px var(--glow), 0 2px 4px rgba(0,0,0,.4)
  // shadowColor é injetado em runtime no PrimaryCTA (precisa de HEX opaco; o
  // alpha vem do shadowOpacity). elevation é só reforço Android — o brilho
  // colorido vem do <GlowHalo/>.
  ctaShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaShadowOff: { shadowOpacity: 0, elevation: 0 },
  glowHalo: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 14,
    bottom: -6,
    borderRadius: Radius.md,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignSelf: "stretch",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
});
