import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

// CtrlButton — barra de controles inferior (Pausar / Trocas / Encerrar).
// Variantes (do design `Partida.tsx`): secondary = sólido suave;
// ghost = só borda; danger = borda vermelha + tinta vermelha.
export function CtrlButton({
  label,
  icon,
  variant,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  variant: "secondary" | "ghost" | "danger";
  onPress?: () => void;
}) {
  const palette = usePalette();
  // "Encerrar" — destrutivo mas reversível na percepção do usuário (fim de
  // partida ≠ fim de sessão), então usa laranja (warning) em vez do vermelho
  // primary. Mantém o tom de alerta sem confundir com o vermelho do placar.
  const tint = variant === "danger" ? palette.warning : palette.onSurface;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.ctrlBtn,
        variant === "secondary" && {
          backgroundColor: palette.surfaceContainerHigh,
        },
        variant === "ghost" && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: palette.outlineVariant,
        },
        variant === "danger" && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: palette.warning + "66",
        },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={tint} />
      <Text style={[styles.ctrlBtnLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ctrlBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderCurve: "continuous",
  },
  ctrlBtnLabel: { ...Typography.title, fontSize: 15 },
});
