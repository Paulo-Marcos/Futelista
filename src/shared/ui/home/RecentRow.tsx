import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Match, ResultMatch } from "@/src/domain/Match";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";

export function RecentRow({ partida }: { partida: Match }) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const win =
    partida.result === ResultMatch.DRAW
      ? null
      : placar.teamA > placar.teamB
        ? "A"
        : "B";
  return (
    <View
      style={[
        styles.recent,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <View style={styles.recentTeams}>
        <View style={styles.recentTeamRow}>
          <TeamCrest seed={partida.teamA.id} size={18} />
          <Text
            style={[
              styles.recentTeam,
              {
                color:
                  win === "A" ? palette.onSurface : palette.onSurfaceVariant,
                fontWeight: win === "A" ? "800" : "600",
              },
            ]}
            numberOfLines={1}
          >
            Time 1
          </Text>
          {win === "A" ? (
            <MaterialCommunityIcons
              name="trophy"
              size={11}
              color={palette.tertiary}
            />
          ) : null}
        </View>
        <View style={styles.recentTeamRow}>
          <TeamCrest seed={partida.teamB.id} size={18} />
          <Text
            style={[
              styles.recentTeam,
              {
                color:
                  win === "B" ? palette.onSurface : palette.onSurfaceVariant,
                fontWeight: win === "B" ? "800" : "600",
              },
            ]}
            numberOfLines={1}
          >
            Time 2
          </Text>
          {win === "B" ? (
            <MaterialCommunityIcons
              name="trophy"
              size={11}
              color={palette.tertiary}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.recentScores}>
        <Text
          style={[
            styles.recentScore,
            {
              color: win === "A" ? palette.onSurface : palette.onSurfaceVariant,
            },
          ]}
        >
          {placar.teamA}
        </Text>
        <Text
          style={[
            styles.recentScore,
            {
              color: win === "B" ? palette.onSurface : palette.onSurfaceVariant,
            },
          ]}
        >
          {placar.teamB}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  recent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  recentTeams: { flex: 1, gap: 4 },
  recentTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recentTeam: { ...Typography.body, fontSize: 13, flex: 1 },
  recentScores: {
    alignItems: "center",
    gap: 4,
  },
  recentScore: {
    ...Typography.title,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
});
