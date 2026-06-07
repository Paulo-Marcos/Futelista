import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerRow } from "@/src/shared/ui/PlayerRow";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

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
   * Borda do card. Tone "A" usa primary, tone "B" usa secondary —
   * dá identidade visual aos times em campo na Home / tela Times.
   */
  tone?: "A" | "B";
  onActionsPress?: () => void;
};

/**
 * Card de time. Escudo procedural + título, badge de estado,
 * contador X/Y, lista de jogadores com avatar e (opcional) badge "Vantagem".
 *
 * `tone="A"|"B"` aplica borda colorida (primary/secondary) e tinge os
 * avatares dos jogadores; `state="playing"` mantém o fundo `primaryContainer`.
 */
export function TeamCard({
  team,
  title,
  state,
  showAdvantage,
  selectedPlayerId,
  onPlayerPress,
  onPlayerLongPress,
  tone,
  onActionsPress,
}: TeamCardProps) {
  const palette = usePalette();
  const borderColor =
    tone === "A"
      ? palette.primary
      : tone === "B"
        ? palette.secondary
        : palette.outlineVariant;
  const bg =
    state === "playing" ? palette.primaryContainer : palette.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: tone ? 2 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <TeamCrest seed={team.id} size={28} style={{ flexShrink: 0 }} />
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
                { backgroundColor: palette.tertiary + "22" },
              ]}
            >
              <MaterialCommunityIcons
                name="star"
                size={12}
                color={palette.tertiary}
              />
              <Text style={[styles.badgeText, { color: palette.tertiary }]}>
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
              tone={tone}
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
    </View>
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
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderCurve: "continuous",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    fontSize: 18,
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
