import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius } from "@/src/shared/theme/Colors";

/**
 * Botão "+" para adicionar jogador.
 *
 * **Sem glow vermelho**: é uma ação corriqueira (qualquer linha de
 * jogador adicionada usa esse botão) e tem 48×48 — competir
 * visualmente com o CTA principal da pelada ("Iniciar partida") deixa
 * a tela confusa. Estilo: fundo primary sólido + ripple, sem sombra
 * colorida. Convenção do app: glow só em CTA principal da tela.
 */
export function AddButton({
  enabled,
  onPress,
  palette,
  accessibilityLabel,
}: {
  enabled: boolean;
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.addButton,
        {
          backgroundColor: enabled ? palette.primary : palette.primaryDim,
          opacity: pressed && enabled ? 0.85 : enabled ? 1 : 0.6,
        },
      ]}
      android_ripple={{ color: palette.onPrimary + "33" }}
    >
      <MaterialCommunityIcons name="plus" size={24} color={palette.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderCurve: "continuous",
  },
});
