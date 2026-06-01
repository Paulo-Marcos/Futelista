import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Player, PlayerSituation } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

type PlayerRowProps = {
  player: Player;
  onPress?: () => void;
  onLongPress?: () => void;
  right?: React.ReactNode;
  showSituation?: boolean;
  showGoals?: boolean;
  compact?: boolean;
};

/**
 * Linha de jogador reutilizável (Jogadores, Partida, dentro de TeamCard).
 *
 * Avatar circular com inicial do nome em cor derivada do id, nome principal,
 * badge de situação opcional, contador de gols opcional, slot livre à direita.
 */
export function PlayerRow({
  player,
  onPress,
  onLongPress,
  right,
  showSituation = false,
  showGoals = false,
  compact = false,
}: PlayerRowProps) {
  const palette = usePalette();
  const avatarColor = colorForId(player.id, palette.primary, palette.secondary);
  const inicial = player.name.charAt(0).toUpperCase();
  const interativo = !!(onPress || onLongPress);

  // Pressable funciona perfeitamente como container mesmo sem onPress; usar
  // sempre evita o erro de tipo do style função no View.
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          paddingVertical: compact ? Spacing.sm : Spacing.md,
          opacity: interativo && pressed ? 0.7 : 1,
        },
      ]}
      android_ripple={interativo ? { color: palette.primary + "11" } : undefined}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={[styles.avatarText, { color: "#FFFFFF" }]}>{inicial}</Text>
      </View>
      <View style={styles.center}>
        <Text
          style={[styles.name, { color: palette.onSurface }]}
          numberOfLines={1}
          selectable
        >
          {player.name}
        </Text>
        {showSituation ? (
          <Text style={[styles.subtitle, { color: palette.onSurfaceVariant }]}>
            {labelSituacao(player.situation)}
          </Text>
        ) : null}
      </View>
      {showGoals && player.goals.length > 0 ? (
        <View style={styles.goalsBadge}>
          <MaterialCommunityIcons
            name="soccer"
            size={14}
            color={palette.secondary}
          />
          <Text style={[styles.goalsText, { color: palette.onSurface }]}>
            {player.goals.length}
          </Text>
        </View>
      ) : null}
      {right}
    </Pressable>
  );
}

function labelSituacao(s: PlayerSituation): string {
  switch (s) {
    case PlayerSituation.ACTIVE:
      return "Jogando";
    case PlayerSituation.STOPPED:
      return "Parou";
    case PlayerSituation.NO_TEAM:
      return "Sem time";
  }
}

const AVATAR_COLORS = [
  "#1976D2",
  "#388E3C",
  "#F57C00",
  "#7B1FA2",
  "#C62828",
  "#00838F",
  "#5D4037",
  "#455A64",
];

function colorForId(id: string, _primary: string, _secondary: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 56,
    borderCurve: "continuous",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...Typography.title,
    fontSize: 16,
  },
  center: {
    flex: 1,
  },
  name: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.label,
    marginTop: 2,
  },
  goalsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goalsText: {
    ...Typography.title,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
});
