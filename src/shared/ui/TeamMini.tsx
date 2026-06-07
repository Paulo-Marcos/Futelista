import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * TeamMini — card de time em campo (próxima partida).
 * Portado de `.fl-teamcard` em prototype/css/app.css.
 *
 * flex:1, radius 20, padding 12; **borderTopWidth 3** (A=primary / B=secondary);
 * header: TeamCrest 26 + título 15/800; lista compacta: PlayerAvatar 26 +
 * nome 13/600 + gols (goal num 800 à direita).
 */
export function TeamMini({
  team,
  idx,
  tone,
  selectedPlayerId,
  onPlayerPress,
  onActionsPress,
}: {
  team: Team;
  idx: number;
  tone: "A" | "B";
  selectedPlayerId?: string;
  onPlayerPress?: (playerId: string) => void;
  onActionsPress?: () => void;
}) {
  const palette = usePalette();
  const borderTopColor =
    tone === "A" ? palette.primary : palette.secondary;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          borderTopColor,
        },
      ]}
    >
      <View style={styles.header}>
        <TeamCrest seed={team.id} size={26} />
        <Text style={[styles.title, { color: palette.onSurface }]}>
          Time {idx + 1}
        </Text>
        {onActionsPress ? (
          <Pressable
            onPress={onActionsPress}
            accessibilityRole="button"
            accessibilityLabel={`Ações do Time ${idx + 1}`}
            style={styles.menuBtn}
            android_ripple={{ color: palette.primary + "22" }}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={18}
              color={palette.onSurfaceVariant}
            />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.players}>
        {team.players.length === 0 ? (
          <Text style={[styles.empty, { color: palette.onSurfaceVariant }]}>
            Sem jogadores
          </Text>
        ) : (
          team.players.map((p) => (
            <PlayerLine
              key={p.id}
              player={p}
              tone={tone}
              selected={selectedPlayerId === p.id}
              onPress={onPlayerPress ? () => onPlayerPress(p.id) : undefined}
            />
          ))
        )}
      </View>
    </View>
  );
}

function PlayerLine({
  player,
  tone,
  selected,
  onPress,
}: {
  player: Player;
  tone: "A" | "B";
  selected: boolean;
  onPress?: () => void;
}) {
  const palette = usePalette();
  const goals = player.goals.length;
  const selBorder = selected
    ? {
        backgroundColor: palette.primary + "29",
        borderColor: palette.primary,
      }
    : { borderColor: "transparent" };

  const content = (
    <>
      <PlayerAvatar player={player} size={26} tone={tone} />
      <Text
        style={[styles.name, { color: palette.onSurface }]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      {goals > 0 ? (
        <Text style={[styles.goals, { color: palette.goal }]}>{goals}</Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Selecionar ${player.name}`}
        style={({ pressed }) => [
          styles.playerLine,
          selBorder,
          pressed ? { opacity: 0.7 } : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.playerLine, selBorder]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderTopWidth: 3,
    gap: Spacing.sm,
    borderCurve: "continuous",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  title: {
    ...Typography.title,
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  players: { gap: 6 },
  playerLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderCurve: "continuous",
  },
  name: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  goals: {
    ...Typography.label,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  empty: {
    ...Typography.body,
    fontSize: 13,
    fontStyle: "italic",
  },
});
