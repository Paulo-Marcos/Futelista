import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  /** Id do jogador atualmente selecionado (modo "trocar"). */
  selectedPlayerId?: string;
  onPlayerPress?: (playerId: string) => void;
  onPlayerLongPress?: (playerId: string) => void;
  /**
   * Quando definido, exibe um botão de menu (3-pontinhos) à direita do título
   * e dispara essa callback no toque. A tela hospedeira decide o que abrir
   * (geralmente um `escolherOpcao`).
   */
  onActionsPress?: () => void;
};

/**
 * Card de time. Mostra título, badge de estado, contador "X/Y jogadores",
 * lista de jogadores e (opcional) badge de "Vantagem" quando o time tem
 * prioridade na próxima partida.
 *
 * Quando `actions` é fornecido junto com `onActionsPress`, exibe um botão de
 * menu (3-pontinhos) à direita do título — a tela hospedeira é quem decide
 * o que fazer no toque (geralmente abrir um `escolherOpcao`).
 */
export function TeamCard({
  team,
  title,
  state,
  showAdvantage,
  selectedPlayerId,
  onPlayerPress,
  onPlayerLongPress,
  onActionsPress,
}: TeamCardProps) {
  const palette = usePalette();
  return (
    <Card variant={state === "playing" ? "primary" : "surface"}>
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: palette.onSurface }]}>
            {title}
          </Text>
          <Text
            style={[styles.subtitle, { color: palette.onSurfaceVariant }]}
            accessibilityLabel={`${team.players.length} de ${team.limit} jogadores`}
          >
            {team.players.length}/{team.limit} jogadores
          </Text>
        </View>
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
          {onActionsPress ? (
            <Pressable
              onPress={onActionsPress}
              accessibilityRole="button"
              accessibilityLabel={`Ações do ${title}`}
              style={styles.menuButton}
              android_ripple={{ color: palette.primary + "22" }}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color={palette.onSurfaceVariant}
              />
            </Pressable>
          ) : null}
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
              selected={selectedPlayerId === player.id}
              onPress={
                onPlayerPress ? () => onPlayerPress(player.id) : undefined
              }
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    fontSize: 20,
  },
  subtitle: {
    ...Typography.label,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
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
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: Spacing.xs,
  },
  empty: {
    ...Typography.body,
    fontStyle: "italic",
  },
});
