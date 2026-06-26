import { StyleSheet, Text, View } from "react-native";

import { Match } from "@/src/domain/Match";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";

/** Placar AO VIVO do Hero: crest · nome · score · nome · crest. */
export function HeroPlacar({
  partida,
  placar,
  palette,
}: {
  partida: Match;
  placar: { teamA: number; teamB: number };
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <View style={styles.heroBody}>
      <View style={styles.heroPlacarRow}>
        <TeamCrest
          seed={partida.teamA.id}
          size={26}
          corOverride={partida.teamA.corCustom}
        />
        <Text
          style={[styles.heroPlacarTeam, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {nomeDoTime(partida.teamA, 0)}
        </Text>
        <Text style={[styles.heroPlacarScore, { color: palette.onSurface }]}>
          {placar.teamA} × {placar.teamB}
        </Text>
        <Text
          style={[
            styles.heroPlacarTeam,
            { color: palette.onSurface, textAlign: "right" },
          ]}
          numberOfLines={1}
        >
          {nomeDoTime(partida.teamB, 1)}
        </Text>
        <TeamCrest
          seed={partida.teamB.id}
          size={26}
          corOverride={partida.teamB.corCustom}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Corpo do Hero (placar AO VIVO). Fica logo abaixo do header.
  heroBody: {
    marginTop: Spacing.md,
  },
  heroPlacarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroPlacarTeam: { ...Typography.body, fontWeight: "700", flex: 1 },
  heroPlacarScore: {
    ...Typography.headline,
    fontSize: 22,
    minWidth: 60,
    textAlign: "center",
  },
});
