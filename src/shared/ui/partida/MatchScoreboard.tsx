import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Team } from "@/src/domain/Team";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { LivePulseDot } from "@/src/shared/ui/LivePulseDot";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function MatchScoreboard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  status,
  goalLimit,
  totalDuration,
  onOpenPicker,
}: {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  status?: TimerStatus;
  goalLimit: number;
  /** Duração total da partida em segundos (do Rules.getDurationMatch). */
  totalDuration: number;
  onOpenPicker: (side: "A" | "B") => void;
}) {
  const palette = usePalette();
  const live = status === TimerStatus.STARTED;
  const statusLabel =
    status === TimerStatus.STARTED
      ? "AO VIVO"
      : status === TimerStatus.PAUSED
        ? "PAUSADO"
        : status === TimerStatus.ENDED
          ? "FIM"
          : status === TimerStatus.INTERVAL
            ? "INTERVALO"
            : "PRONTO";
  return (
    <View
      style={[
        styles.scoreboard,
        {
          backgroundColor: palette.background,
          borderBottomColor: palette.outlineVariant,
        },
      ]}
    >
      <View style={styles.sbStatusRow}>
        <View style={styles.sbStatus}>
          <LivePulseDot
            color={live ? palette.goal : palette.warning}
            live={live}
            size={8}
          />
          <Text
            style={[
              styles.sbStatusText,
              { color: live ? palette.goal : palette.onSurfaceVariant },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        {/* Badge "M min · até N gols" — qualquer dos dois critérios
            encerra a partida (limite atingido OU cronômetro zerou). */}
        <View
          style={[
            styles.sbCriterioBadge,
            {
              backgroundColor: palette.surfaceContainerHigh,
              borderColor: palette.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="timer-outline"
            size={11}
            color={palette.onSurfaceVariant}
          />
          <Text
            style={[styles.sbCriterioText, { color: palette.onSurfaceVariant }]}
          >
            {Math.max(1, Math.round(totalDuration / 60))} min
          </Text>
          <Text
            style={[styles.sbCriterioSep, { color: palette.onSurfaceVariant }]}
          >
            ·
          </Text>
          <MaterialCommunityIcons
            name="bullseye-arrow"
            size={11}
            color={palette.onSurfaceVariant}
          />
          <Text
            style={[styles.sbCriterioText, { color: palette.onSurfaceVariant }]}
          >
            até {goalLimit} {goalLimit === 1 ? "gol" : "gols"}
          </Text>
        </View>
      </View>

      <View style={styles.sbMain}>
        <Pressable
          onPress={() => onOpenPicker("A")}
          accessibilityRole="button"
          accessibilityLabel="Marcar gol do Time 1"
          style={({ pressed }) => [
            styles.sbSide,
            { opacity: pressed ? 0.75 : 1, alignItems: "center" },
          ]}
        >
          <TeamCrest seed={teamA.id} size={28} corOverride={teamA.corCustom} />
          <Text style={[styles.sbTeam, { color: palette.onSurface }]}>
            {nomeDoTime(teamA, 0)}
          </Text>
          <View
            style={[styles.sbGolButton, { backgroundColor: palette.primary }]}
          >
            <MaterialCommunityIcons
              name="soccer"
              size={11}
              color={palette.onPrimary}
            />
            <Text style={[styles.sbGolText, { color: palette.onPrimary }]}>
              GOL
            </Text>
          </View>
        </Pressable>

        <View style={styles.sbScore}>
          <Text
            style={[
              styles.sbNum,
              {
                color: palette.primary,
                textShadowColor: palette.glow,
                textShadowRadius: 18,
                textShadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            {scoreA}
          </Text>
          <Text style={[styles.sbX, { color: palette.onSurfaceVariant }]}>
            ×
          </Text>
          <Text style={[styles.sbNum, { color: palette.secondary }]}>
            {scoreB}
          </Text>
        </View>

        <Pressable
          onPress={() => onOpenPicker("B")}
          accessibilityRole="button"
          accessibilityLabel="Marcar gol do Time 2"
          style={({ pressed }) => [
            styles.sbSide,
            { opacity: pressed ? 0.75 : 1, alignItems: "center" },
          ]}
        >
          <TeamCrest seed={teamB.id} size={28} corOverride={teamB.corCustom} />
          <Text style={[styles.sbTeam, { color: palette.onSurface }]}>
            {nomeDoTime(teamB, 1)}
          </Text>
          <View
            style={[styles.sbGolButton, { backgroundColor: palette.secondary }]}
          >
            <MaterialCommunityIcons
              name="soccer"
              size={11}
              color={palette.onSecondary}
            />
            <Text style={[styles.sbGolText, { color: palette.onSecondary }]}>
              GOL
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreboard: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  sbStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sbStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  sbStatusText: {
    ...Typography.label,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sbCriterioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  sbCriterioText: { ...Typography.label, fontSize: 10 },
  sbCriterioSep: { ...Typography.label, fontSize: 10, opacity: 0.6 },
  sbMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sbSide: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  sbTeam: { ...Typography.title, fontSize: 14 },
  sbGolButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  sbGolText: { ...Typography.label, fontSize: 10 },
  sbScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  sbNum: {
    ...Typography.display,
    fontSize: 46,
    minWidth: 40,
    textAlign: "center",
  },
  sbX: { ...Typography.headline, fontSize: 22 },
});
