import { StyleSheet, Text, View } from "react-native";

import { Match, ResultMatch } from "@/src/domain/Match";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { Card } from "@/src/shared/ui/Card";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";

export function UltimaPartidaCard({ partida }: { partida: Match }) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const winnerName =
    partida.result === ResultMatch.DRAW
      ? "Empate"
      : partida.winner
        ? "Time vencedor"
        : "Finalizada";
  return (
    <Card variant="outlined" padding="md">
      <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
        Última partida
      </Text>
      <View style={[styles.miniPlacarRow, { marginTop: Spacing.xs }]}>
        <TeamCrest seed={partida.teamA.id} size={24} />
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
        <TeamCrest seed={partida.teamB.id} size={24} />
      </View>
      <Text style={[styles.miniPlacarSub, { color: palette.onSurfaceVariant }]}>
        {winnerName}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
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
  miniPlacarSub: {
    ...Typography.label,
    marginTop: Spacing.xs,
  },
});
