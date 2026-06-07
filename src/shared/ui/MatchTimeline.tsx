import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Goal } from "@/src/domain/Goal";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * MatchTimeline — strip horizontal de gols (mais recente à esquerda),
 * cor por time (primary/secondary), minuto à direita do nome.
 * Quando `onUndo` é fornecido, o chip mais recente ganha um botão de
 * desfazer.
 *
 * Portado de prototype/js/match.jsx (MatchTimeline).
 */
type TimelineEntry = {
  id: string;
  side: "A" | "B";
  name: string;
  minute: number;
};

export function MatchTimeline({
  goals,
  teamA,
  teamB,
  onUndo,
}: {
  goals: Goal[];
  teamA: Team;
  teamB: Team;
  onUndo?: () => void;
}) {
  const palette = usePalette();
  if (goals.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          {
            backgroundColor: palette.surfaceContainerLow,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="soccer"
          size={13}
          color={palette.onSurfaceVariant}
        />
        <Text style={[styles.emptyText, { color: palette.onSurfaceVariant }]}>
          Toque num jogador no campo para marcar gol
        </Text>
      </View>
    );
  }

  const entries: TimelineEntry[] = goals
    .map((g, i) => ({
      id: `${g.player.id}-${i}`,
      side: g.team.id === teamA.id ? ("A" as const) : ("B" as const),
      name: g.player.name,
      minute: minuteOf(g),
    }))
    .reverse();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.surfaceContainerLow,
          borderTopColor: palette.outlineVariant,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {entries.map((e, i) => {
          const isMostRecent = i === 0;
          const tint = e.side === "A" ? palette.primary : palette.secondary;
          return (
            <View
              key={e.id}
              style={[
                styles.chip,
                {
                  backgroundColor: tint + "22",
                  borderColor: tint + "55",
                },
              ]}
            >
              <MaterialCommunityIcons name="soccer" size={11} color={tint} />
              <Text style={[styles.chipName, { color: tint }]}>{e.name}</Text>
              <Text
                style={[styles.chipMin, { color: palette.onSurfaceVariant }]}
              >
                {e.minute}'
              </Text>
              {isMostRecent && onUndo ? (
                <Pressable
                  onPress={onUndo}
                  accessibilityRole="button"
                  accessibilityLabel="Desfazer gol mais recente"
                  style={({ pressed }) => [
                    styles.undoBtn,
                    {
                      backgroundColor: palette.surfaceContainerHigh,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={11}
                    color={palette.onSurface}
                  />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function minuteOf(g: Goal): number {
  // ScreenTime: stroke (tempo 1..N) + timeStroke (segundos transcorridos).
  // Tempo decorrido total em minutos para o chip.
  const seconds = g.time.timeStroke;
  return Math.max(0, Math.floor(seconds / 60));
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  track: {
    gap: Spacing.xs,
    alignItems: "center",
    paddingRight: Spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipName: { ...Typography.label, fontSize: 12 },
  chipMin: { ...Typography.label, fontSize: 11, fontVariant: ["tabular-nums"] },
  undoBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  emptyText: { ...Typography.label, fontSize: 12 },
});
