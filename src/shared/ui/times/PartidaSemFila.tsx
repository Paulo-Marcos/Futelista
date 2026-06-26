import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { TeamMini } from "@/src/shared/ui/TeamMini";
import { BannerSemTime } from "@/src/shared/ui/times/BannerSemTime";
import { PrimaryCTA } from "@/src/shared/ui/times/PrimaryCTA";
import { Spacing } from "@/src/shared/theme/Colors";

// Visão da aba Times durante uma partida cuja fila ficou vazia (os dois únicos
// times entraram em campo). Read-only: mostra quem está jogando, deixa voltar
// à partida e — quando chega gente nova — formar o próximo time, tudo sem
// nunca mexer nos times em campo. Substitui o EmptyState "Montar times", que
// seria destrutivo aqui (recriar os times duplicaria quem está jogando).
export function PartidaSemFila({
  teamA,
  teamB,
  playersWithoutTeam,
  podeCriarIncompleto,
  onAlocar,
  onVoltar,
  insets,
  palette,
}: {
  teamA?: Team;
  teamB?: Team;
  playersWithoutTeam: number;
  podeCriarIncompleto: boolean;
  onAlocar: () => void;
  onVoltar: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + Spacing.xxl },
      ]}
    >
      {playersWithoutTeam > 0 ? (
        <BannerSemTime
          quantidade={playersWithoutTeam}
          podeCriarIncompleto={podeCriarIncompleto}
          onAlocar={onAlocar}
        />
      ) : null}

      <Text
        style={[styles.sectionTitle, { color: palette.onSurfaceVariant }]}
        accessibilityRole="header"
      >
        Partida em andamento
      </Text>
      <View style={styles.nextRow}>
        {teamA ? <TeamMini team={teamA} idx={0} tone="A" /> : null}
        {teamB ? <TeamMini team={teamB} idx={1} tone="B" /> : null}
      </View>

      <PrimaryCTA
        label="Voltar à partida"
        icon="play-circle-outline"
        onPress={onVoltar}
        palette={palette}
        accessibilityLabel="Voltar para a partida em andamento"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // `.screen { padding: 2px 16px 18px; gap: 14px }` do Times.html — gap de 14
  // (entre Spacing.md=12 e Spacing.lg=16) é específico desse handoff, então
  // vai cru. A lista de fila herda o mesmo container.
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: 14,
  },
  // Hand-off `.label`: 11/700, letter-spacing .06em, uppercase, dim.
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  nextRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
