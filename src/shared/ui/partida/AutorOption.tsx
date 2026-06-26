import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/** Linha de jogador escolhível na lista de "corrigir autor". */
export function AutorOption({
  player,
  tone,
  eAtual,
  onPress,
}: {
  player: Player;
  tone: "A" | "B";
  eAtual: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={eAtual}
      accessibilityRole="button"
      accessibilityLabel={
        eAtual
          ? `${player.name} (autor atual)`
          : `Trocar autor para ${player.name}`
      }
      style={({ pressed }) => [
        styles.fpi,
        {
          backgroundColor: palette.surfaceContainerHigh,
          borderColor: tone === "A" ? palette.primary : palette.secondary,
          opacity: eAtual ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <PlayerAvatar player={player} size={28} tone={tone} />
      <Text
        style={[styles.fpiName, { color: palette.onSurface }]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      {eAtual ? (
        <MaterialCommunityIcons
          name="account-check"
          size={14}
          color={palette.onSurfaceVariant}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Mesma "linha de jogador" do FieldPlayerItem — chave trivial duplicada
  // localmente (sem dependência cruzada entre folhas).
  fpi: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  fpiName: { ...Typography.body, fontSize: 13, flex: 1 },
});
