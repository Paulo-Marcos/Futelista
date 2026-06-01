import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { Fab } from "@/src/shared/ui/Fab";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { TabHeader } from "@/src/shared/ui/TabHeader";
import { TeamCard } from "@/src/shared/ui/TeamCard";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

export default function TimesScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { manager } = useSoccer();

  const next = useGameSlice((g) => g.next);
  const advantageId = useGameSlice((g) => g.advantageToNext?.id);
  const totalJogadores = useGameSlice((g) => g.players.length);
  const playersPerTeam = useGameSlice((g) => g.rules.playersPerTeam);
  const playersWithoutTeam = useGameSlice((g) => g.playersWithoutTeam);
  const temPartida = useGameSlice((g) => g.playing !== undefined);

  const [erro, setErro] = useState<string | null>(null);

  const podeMontar = totalJogadores >= 2 * playersPerTeam;
  const safeAction = (fn: () => void) => {
    try {
      fn();
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const montar = () => safeAction(() => manager.createTeams());
  const sortearNovamente = () =>
    safeAction(() => {
      manager.resetTimes();
      manager.createTeams();
    });
  const alocarSemTime = () =>
    safeAction(() => manager.relocatePlayersWithoutTeam());
  const iniciarPartida = () =>
    safeAction(() => {
      manager.setPlayingGame();
      router.push("/partida");
    });

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <TabHeader title="Times" />

      {next.length === 0 ? (
        <EmptyState
          icon="shield-outline"
          title="Times ainda não foram montados"
          description={
            podeMontar
              ? "Use o botão abaixo para sortear os times de acordo com as regras."
              : `Adicione pelo menos ${2 * playersPerTeam} jogadores para montar 2 times.`
          }
          actionLabel="Montar times"
          onAction={montar}
          actionDisabled={!podeMontar}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xxl + 56 },
          ]}
        >
          {erro ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: palette.errorContainer,
                  borderColor: palette.error,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color={palette.error}
              />
              <Text
                style={[styles.errorText, { color: palette.error }]}
                selectable
              >
                {erro}
              </Text>
            </View>
          ) : null}

          {playersWithoutTeam > 0 ? (
            <Card variant="surface">
              <View style={styles.bannerRow}>
                <MaterialCommunityIcons
                  name="account-question"
                  size={20}
                  color={palette.warning}
                />
                <Text style={[styles.bannerText, { color: palette.onSurface }]}>
                  {playersWithoutTeam}{" "}
                  {playersWithoutTeam === 1
                    ? "jogador sem time"
                    : "jogadores sem time"}
                </Text>
              </View>
              <View style={{ marginTop: Spacing.sm }}>
                <SecondaryButton
                  label="Alocar agora"
                  onPress={alocarSemTime}
                  fullWidth
                />
              </View>
            </Card>
          ) : null}

          <Text
            style={[styles.sectionTitle, { color: palette.onSurfaceVariant }]}
          >
            Próxima partida
          </Text>
          <View style={styles.nextRow}>
            {next[0] ? (
              <View style={styles.flex}>
                <TeamCard
                  team={next[0]}
                  title="Time 1"
                  state="next"
                  showAdvantage={advantageId === next[0].id}
                />
              </View>
            ) : null}
            {next[1] ? (
              <View style={styles.flex}>
                <TeamCard
                  team={next[1]}
                  title="Time 2"
                  state="next"
                  showAdvantage={advantageId === next[1].id}
                />
              </View>
            ) : null}
          </View>

          {!temPartida ? (
            <PrimaryButton
              label="Iniciar partida"
              icon="whistle"
              onPress={iniciarPartida}
              disabled={next.length < 2}
              fullWidth
            />
          ) : (
            <PrimaryButton
              label="Voltar à partida"
              icon="play-circle-outline"
              onPress={() => router.push("/partida")}
              fullWidth
            />
          )}

          {next.length > 2 ? (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.onSurfaceVariant, marginTop: Spacing.lg },
                ]}
              >
                Fila ({next.length - 2})
              </Text>
              {next.slice(2).map((team, idx) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  title={`Time ${idx + 3}`}
                  state="queue"
                  showAdvantage={advantageId === team.id}
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      )}

      {next.length > 0 && !temPartida ? (
        <Fab icon="dice-multiple" onPress={sortearNovamente} testID="sortear" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.label,
    flex: 1,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  bannerText: {
    ...Typography.body,
    flex: 1,
  },
  sectionTitle: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nextRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
});
