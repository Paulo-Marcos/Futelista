import { Pressable, StyleSheet, Text, View } from "react-native";

import { Match } from "@/src/domain/Match";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { formatSeconds } from "./formatSeconds";

export function MiniPlacar({
  partida,
  restSeconds,
  statusTimer,
  onPress,
}: {
  partida: Match;
  restSeconds?: number;
  statusTimer?: TimerStatus;
  onPress: () => void;
}) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const cronometro =
    restSeconds === undefined ? "--:--" : formatSeconds(restSeconds);
  const live = statusTimer === TimerStatus.STARTED;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir partida em andamento"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={styles.miniPlacarHeader}>
        <View style={styles.miniPlacarStatus}>
          <View
            style={[
              styles.miniLiveDot,
              { backgroundColor: live ? palette.goal : palette.warning },
            ]}
          />
          <Text
            style={[
              styles.miniPlacarTitle,
              { color: palette.onSurfaceVariant },
            ]}
          >
            {live ? "AO VIVO" : "EM ANDAMENTO"}
          </Text>
        </View>
        <Text style={[styles.miniPlacarTimer, { color: palette.onSurface }]}>
          {cronometro}
          {statusTimer === TimerStatus.PAUSED ? "  ⏸" : ""}
          {statusTimer === TimerStatus.INTERVAL ? "  ⏲" : ""}
        </Text>
      </View>
      <View style={styles.miniPlacarRow}>
        <TeamCrest seed={partida.teamA.id} size={26} />
        <Text
          style={[styles.miniPlacarTeam, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          Time 1
        </Text>
        <Text style={[styles.miniPlacarScore, { color: palette.onSurface }]}>
          {placar.teamA} × {placar.teamB}
        </Text>
        <Text
          style={[
            styles.miniPlacarTeam,
            { color: palette.onSurface, textAlign: "right" },
          ]}
          numberOfLines={1}
        >
          Time 2
        </Text>
        <TeamCrest seed={partida.teamB.id} size={26} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  miniPlacarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  miniPlacarStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniLiveDot: { width: 8, height: 8, borderRadius: 4 },
  miniPlacarTitle: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniPlacarTimer: {
    ...Typography.title,
    fontVariant: ["tabular-nums"],
  },
  miniPlacarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  miniPlacarTeam: { ...Typography.body, fontWeight: "700", flex: 1 },
  miniPlacarScore: {
    ...Typography.headline,
    fontSize: 22,
    minWidth: 60,
    textAlign: "center",
  },
});
