import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { PlayerRow } from "@/src/shared/ui/PlayerRow";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

export type TeamState = "playing" | "next" | "queue";

type TeamCardProps = {
  team: Team;
  title: string;
  state: TeamState;
  showAdvantage?: boolean;
  onPlayerLongPress?: (playerId: string) => void;
};

/**
 * Card de time. Mostra título, badge de estado, lista de jogadores e
 * (opcional) badge de "Vantagem" quando o time tem prioridade na próxima partida.
 */
export function TeamCard({
  team,
  title,
  state,
  showAdvantage,
  onPlayerLongPress,
}: TeamCardProps) {
  const palette = usePalette();
  return (
    <Card variant={state === "playing" ? "primary" : "surface"}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          {title}
        </Text>
        <View style={styles.badges}>
          {showAdvantage ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: palette.secondaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="star"
                size={12}
                color={palette.onSecondaryContainer}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: palette.onSecondaryContainer },
                ]}
              >
                Vantagem
              </Text>
            </View>
          ) : null}
          <StateBadge state={state} />
        </View>
      </View>
      <View style={styles.list}>
        {team.players.length === 0 ? (
          <Text style={[styles.empty, { color: palette.onSurfaceVariant }]}>
            Sem jogadores
          </Text>
        ) : (
          team.players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              compact
              onLongPress={
                onPlayerLongPress
                  ? () => onPlayerLongPress(player.id)
                  : undefined
              }
            />
          ))
        )}
      </View>
    </Card>
  );
}

function StateBadge({ state }: { state: TeamState }) {
  const palette = usePalette();
  const mapping = {
    playing: { label: "Jogando", color: palette.primary },
    next: { label: "Próximo", color: palette.secondary },
    queue: { label: "Fila", color: palette.onSurfaceVariant },
  } as const;
  const { label, color } = mapping[state];
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
  },
  badges: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    ...Typography.label,
  },
  list: {
    gap: Spacing.xs,
  },
  empty: {
    ...Typography.body,
    fontStyle: "italic",
  },
});
