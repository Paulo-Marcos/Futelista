import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Match, ResultMatch } from "@/src/domain/Match";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * MatchHistoryCard — card de partida no histórico (handoff v2, tela 09).
 *
 * Layout: row main com Time 1 / placar / Time 2; vencedor com troféu accent;
 * linha de artilheiros (borderTop outlineVariant) com bola dos dois lados;
 * "when" no rodapé.
 */
export function MatchHistoryCard({ partida }: { partida: Match }) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const drew = partida.result === ResultMatch.DRAW || !partida.winner;
  const winSide: "A" | "B" | null = drew
    ? null
    : partida.winner === partida.teamA
      ? "A"
      : "B";
  const scorersA = aggregate(
    partida.goals
      .filter((g) => g.team.id === partida.teamA.id)
      .map((g) => g.player.name),
  );
  const scorersB = aggregate(
    partida.goals
      .filter((g) => g.team.id === partida.teamB.id)
      .map((g) => g.player.name),
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <View style={styles.main}>
        <View style={styles.teamLeft}>
          {winSide === "A" ? (
            <MaterialCommunityIcons
              name="trophy"
              size={13}
              color={palette.tertiary}
            />
          ) : null}
          <TeamCrest seed={partida.teamA.id} size={20} />
          <Text
            style={[
              styles.team,
              {
                color:
                  winSide === "A" ? palette.onSurface : palette.onSurfaceVariant,
                fontWeight: winSide === "A" ? "800" : "700",
              },
            ]}
            numberOfLines={1}
          >
            Time 1
          </Text>
        </View>
        <View style={styles.scoreRow}>
          <Text
            style={[
              styles.score,
              {
                color:
                  winSide === "A" ? palette.onSurface : palette.onSurfaceVariant,
              },
            ]}
          >
            {placar.teamA}
          </Text>
          <Text style={[styles.scoreX, { color: palette.onSurfaceVariant }]}>
            ×
          </Text>
          <Text
            style={[
              styles.score,
              {
                color:
                  winSide === "B" ? palette.onSurface : palette.onSurfaceVariant,
              },
            ]}
          >
            {placar.teamB}
          </Text>
        </View>
        <View style={[styles.teamRight]}>
          <Text
            style={[
              styles.team,
              {
                color:
                  winSide === "B" ? palette.onSurface : palette.onSurfaceVariant,
                fontWeight: winSide === "B" ? "800" : "700",
                textAlign: "right",
              },
            ]}
            numberOfLines={1}
          >
            Time 2
          </Text>
          <TeamCrest seed={partida.teamB.id} size={20} />
          {winSide === "B" ? (
            <MaterialCommunityIcons
              name="trophy"
              size={13}
              color={palette.tertiary}
            />
          ) : null}
        </View>
      </View>

      {scorersA.length > 0 || scorersB.length > 0 ? (
        <View
          style={[
            styles.scorers,
            { borderTopColor: palette.outlineVariant },
          ]}
        >
          <View style={styles.scorerColLeft}>
            <MaterialCommunityIcons
              name="soccer"
              size={11}
              color={palette.primary}
            />
            <Text
              style={[styles.scorerText, { color: palette.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {scorersA.join(", ") || "—"}
            </Text>
          </View>
          <View style={styles.scorerColRight}>
            <Text
              style={[
                styles.scorerText,
                { color: palette.onSurfaceVariant, textAlign: "right" },
              ]}
              numberOfLines={2}
            >
              {scorersB.join(", ") || "—"}
            </Text>
            <MaterialCommunityIcons
              name="soccer"
              size={11}
              color={palette.secondary}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function aggregate(names: string[]): string[] {
  const map = new Map<string, number>();
  names.forEach((n) => map.set(n, (map.get(n) ?? 0) + 1));
  return Array.from(map.entries()).map(([name, n]) =>
    n > 1 ? `${name} (${n})` : name,
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 13,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
    gap: Spacing.sm,
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  teamLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  teamRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  team: { ...Typography.title, fontSize: 14 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  score: {
    ...Typography.headline,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  scoreX: { fontSize: 14, fontWeight: "600" },
  scorers: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  scorerColLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  scorerColRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  scorerText: { ...Typography.label, fontSize: 11.5, flex: 1 },
});
