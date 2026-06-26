import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";

/** Confronto da próxima partida: Time A vs Time B. */
export function HeroMatchup({
  timeAId,
  timeBId,
  timeANome,
  timeBNome,
  timeACor,
  timeBCor,
  palette,
}: {
  timeAId: string;
  timeBId: string;
  timeANome?: string;
  timeBNome?: string;
  timeACor?: string;
  timeBCor?: string;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <View style={styles.heroBody}>
      <View style={styles.matchup}>
        <TeamCrest seed={timeAId} size={30} corOverride={timeACor} />
        <Text
          style={[styles.matchupTeam, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {timeANome ?? "Time 1"}
        </Text>
        <Text style={[styles.matchupVs, { color: palette.onSurfaceVariant }]}>
          vs
        </Text>
        <Text
          style={[
            styles.matchupTeam,
            { color: palette.onSurface, textAlign: "right" },
          ]}
          numberOfLines={1}
        >
          {timeBNome ?? "Time 2"}
        </Text>
        <TeamCrest seed={timeBId} size={30} corOverride={timeBCor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Corpo do Hero (matchup). Fica logo abaixo do header.
  heroBody: {
    marginTop: Spacing.md,
  },
  matchup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  matchupTeam: {
    ...Typography.title,
    fontSize: 15,
    flex: 1,
  },
  matchupVs: {
    ...Typography.label,
    textTransform: "uppercase",
  },
});
