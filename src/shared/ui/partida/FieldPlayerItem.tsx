import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function FieldPlayerItem({
  player,
  tone,
  selected,
  onPress,
}: {
  player: Player;
  tone: "A" | "B";
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Selecionar ${player.name} para sair`}
      style={({ pressed }) => [
        styles.fpi,
        {
          backgroundColor: selected
            ? palette.goal + "22"
            : palette.surfaceContainerHigh,
          borderColor: selected
            ? palette.goal
            : tone === "A"
              ? palette.primary
              : palette.secondary,
          opacity: pressed ? 0.85 : 1,
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
      <MaterialCommunityIcons
        name={selected ? "check-circle" : "arrow-up"}
        size={14}
        color={selected ? palette.goal : palette.onSurfaceVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
