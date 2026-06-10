import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

type ScoreBoardProps = {
  teamAName: string;
  teamBName: string;
  goalsA: number;
  goalsB: number;
};

/**
 * Placar grande da partida atual. Display 48 com tabular-nums.
 */
export function ScoreBoard({
  teamAName,
  teamBName,
  goalsA,
  goalsB,
}: ScoreBoardProps) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <Text
          style={[styles.team, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {teamAName}
        </Text>
      </View>
      <View style={styles.center}>
        <Text style={[styles.score, { color: palette.onSurface }]}>
          {goalsA}
        </Text>
        <Text style={[styles.dash, { color: palette.onSurfaceVariant }]}>
          –
        </Text>
        <Text style={[styles.score, { color: palette.onSurface }]}>
          {goalsB}
        </Text>
      </View>
      <View style={styles.side}>
        <Text
          style={[styles.team, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {teamBName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  side: {
    flex: 1,
    alignItems: "center",
  },
  team: {
    ...Typography.title,
    textAlign: "center",
  },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  score: {
    ...Typography.display,
    fontSize: 48,
  },
  dash: {
    ...Typography.display,
    fontSize: 36,
  },
});
