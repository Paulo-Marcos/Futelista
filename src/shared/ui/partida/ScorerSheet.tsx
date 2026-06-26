import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { AppBottomSheet } from "@/src/shared/ui/AppBottomSheet";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function ScorerSheet({
  side,
  teamA,
  teamB,
  onClose,
  onPick,
}: {
  side: "A" | "B" | null;
  teamA: Team;
  teamB: Team;
  onClose: () => void;
  onPick: (side: "A" | "B", player: Player) => void;
}) {
  const palette = usePalette();
  if (!side) return null;
  const players = side === "A" ? teamA.players : teamB.players;
  return (
    <AppBottomSheet visible onClose={onClose} snapPoint="65%">
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <View>
            <Text
              style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
            >
              Quem marcou?
            </Text>
            <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
              {side === "A" ? nomeDoTime(teamA, 0) : nomeDoTime(teamB, 1)}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={palette.onSurface}
            />
          </Pressable>
        </View>
        <View style={styles.sheetGrid}>
          {players.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => onPick(side, p)}
              accessibilityRole="button"
              accessibilityLabel={`Marcar gol para ${p.name}`}
              style={({ pressed }) => [
                styles.scorerCard,
                {
                  backgroundColor: palette.surfaceContainerHigh,
                  borderColor:
                    side === "A" ? palette.primary : palette.secondary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <PlayerAvatar player={p} size={42} tone={side} />
              <Text
                style={[styles.scorerName, { color: palette.onSurface }]}
                numberOfLines={1}
              >
                {p.name}
              </Text>
              {p.goals.length > 0 ? (
                <View
                  style={[
                    styles.scorerGoals,
                    { backgroundColor: palette.goal + "33" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="soccer"
                    size={10}
                    color={palette.goal}
                  />
                  <Text
                    style={[styles.scorerGoalsText, { color: palette.goal }]}
                  >
                    {p.goals.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
    borderCurve: "continuous",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetEyebrow: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
  },
  sheetTitle: { ...Typography.headline, fontSize: 18, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  scorerCard: {
    width: "30%",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
    borderCurve: "continuous",
  },
  scorerName: { ...Typography.label, fontSize: 11, textAlign: "center" },
  scorerGoals: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  scorerGoalsText: { ...Typography.label, fontSize: 10 },
});
