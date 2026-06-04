import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { PlayerRow } from "@/src/shared/ui/PlayerRow";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { ScoreBoard } from "@/src/shared/ui/ScoreBoard";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { TimerDisplay } from "@/src/shared/ui/TimerDisplay";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export default function PartidaScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  return <PartidaInner gestor={gestor} />;
}

function PartidaInner({ gestor }: { gestor: GestorJogo }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const playing = useGameSliceRequired((g) => g.playing);
  const status = useGameSliceRequired((g) => g.timer?.status);
  const restTime = useGameSliceRequired((g) => g.timer?.restTime ?? 0);
  const currentHalf = useGameSliceRequired((g) => g.timer?.currentNumberTime);
  const totalHalves = useGameSliceRequired((g) => g.timer?.numberTimes);
  const goals = useGameSliceRequired((g) => g.playing?.countGoals());
  const proximoTime = useGameSliceRequired((g) => g.next[0]);

  const [erro, setErro] = useState<string | null>(null);

  const safeAction = (fn: () => void) => {
    try {
      fn();
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  if (!playing) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: palette.background,
            paddingTop: insets.top + Spacing.lg,
          },
        ]}
      >
        <Header onBack={() => router.back()} title="Partida" />
        <EmptyState
          icon="whistle"
          title="Nenhuma partida em andamento"
          description="Volte para a tab Times e toque em Iniciar partida."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const canStart =
    status === undefined ||
    status === TimerStatus.CREATED ||
    status === TimerStatus.ENDED;
  const canPause = status === TimerStatus.STARTED;
  const canContinue = status === TimerStatus.PAUSED;
  const isInterval = status === TimerStatus.INTERVAL;

  const ctaPrincipal = (() => {
    if (canPause)
      return {
        label: "Pausar",
        icon: "pause" as const,
        action: () => safeAction(() => gestor.pause()),
      };
    if (canContinue)
      return {
        label: "Continuar",
        icon: "play" as const,
        action: () => safeAction(() => gestor.continue()),
      };
    if (isInterval)
      return {
        label: "Próximo tempo",
        icon: "skip-next" as const,
        action: () => safeAction(() => gestor.start()),
      };
    if (canStart)
      return {
        label: "Iniciar",
        icon: "play" as const,
        action: () => safeAction(() => gestor.start()),
      };
    return null;
  })();

  const encerrar = () =>
    safeAction(() => {
      gestor.setResult();
      router.replace("/resultado");
    });

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <Header onBack={() => router.back()} title="Partida" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 88 },
        ]}
      >
        <Card variant="primary">
          <ScoreBoard
            teamAName="Time 1"
            teamBName="Time 2"
            goalsA={goals?.teamA ?? 0}
            goalsB={goals?.teamB ?? 0}
          />
          <View style={{ marginTop: Spacing.md }}>
            <TimerDisplay
              restSeconds={restTime}
              currentHalf={currentHalf}
              totalHalves={totalHalves}
              status={status}
            />
          </View>
        </Card>

        {ctaPrincipal ? (
          <PrimaryButton
            label={ctaPrincipal.label}
            icon={ctaPrincipal.icon}
            onPress={ctaPrincipal.action}
            fullWidth
          />
        ) : null}

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

        <View style={styles.teamsRow}>
          <TimeColuna
            titulo="Time 1"
            team={playing.teamA}
            placar={goals?.teamA ?? 0}
            onGol={(player) =>
              safeAction(() => gestor.addGoal(playing.teamA, player))
            }
            onTirar={(player) =>
              safeAction(() => gestor.removeFromGame(player))
            }
            onSubstituir={(player) =>
              safeAction(() => {
                if (!proximoTime || proximoTime.players.length === 0) {
                  throw Error("Não há jogador no próximo time para entrar.");
                }
                gestor.switchPlayerLeft(proximoTime.players[0], player);
              })
            }
          />
          <TimeColuna
            titulo="Time 2"
            team={playing.teamB}
            placar={goals?.teamB ?? 0}
            onGol={(player) =>
              safeAction(() => gestor.addGoal(playing.teamB, player))
            }
            onTirar={(player) =>
              safeAction(() => gestor.removeFromGame(player))
            }
            onSubstituir={(player) =>
              safeAction(() => {
                if (!proximoTime || proximoTime.players.length === 0) {
                  throw Error("Não há jogador no próximo time para entrar.");
                }
                gestor.switchPlayerLeft(proximoTime.players[0], player);
              })
            }
          />
        </View>

        {proximoTime && proximoTime.players.length > 0 ? (
          <Card variant="outlined" padding="md">
            <Text
              style={[styles.previewLabel, { color: palette.onSurfaceVariant }]}
            >
              Próximo a entrar
            </Text>
            <Text style={[styles.previewName, { color: palette.onSurface }]}>
              {proximoTime.players[0].name}
            </Text>
          </Card>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: palette.background,
            borderTopColor: palette.outlineVariant,
          },
        ]}
      >
        <SecondaryButton
          label="Encerrar partida"
          icon="stop-circle-outline"
          onPress={encerrar}
          destructive
          fullWidth
        />
      </View>
    </View>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  const palette = usePalette();
  return (
    <View
      style={[styles.header, { borderBottomColor: palette.outlineVariant }]}
    >
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          { opacity: pressed ? 0.5 : 1 },
        ]}
        android_ripple={{ color: palette.primary + "22", borderless: true }}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={palette.onSurface}
        />
      </Pressable>
      <Text style={[styles.headerTitle, { color: palette.onSurface }]}>
        {title}
      </Text>
    </View>
  );
}

function TimeColuna({
  titulo,
  team,
  placar,
  onGol,
  onTirar,
  onSubstituir,
}: {
  titulo: string;
  team: { players: Player[] } & Team;
  placar: number;
  onGol: (p: Player) => void;
  onTirar: (p: Player) => void;
  onSubstituir: (p: Player) => void;
}) {
  const palette = usePalette();
  return (
    <View style={[styles.col, { backgroundColor: palette.surface }]}>
      <View style={styles.colHeader}>
        <Text style={[styles.colTitle, { color: palette.onSurface }]}>
          {titulo}
        </Text>
        <Text style={[styles.colScore, { color: palette.primary }]} selectable>
          {placar}
        </Text>
      </View>
      {team.players.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          compact
          onPress={() => onGol(player)}
          right={
            <View style={{ flexDirection: "row", gap: 2 }}>
              <Pressable
                onPress={() => onSubstituir(player)}
                style={styles.iconAction}
                android_ripple={{ color: palette.primary + "33" }}
              >
                <MaterialCommunityIcons
                  name="account-switch"
                  size={20}
                  color={palette.primary}
                />
              </Pressable>
              <Pressable
                onPress={() => onTirar(player)}
                style={styles.iconAction}
                android_ripple={{ color: palette.error + "33" }}
              >
                <MaterialCommunityIcons
                  name="account-minus"
                  size={20}
                  color={palette.error}
                />
              </Pressable>
            </View>
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 18,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.label,
    flex: 1,
  },
  teamsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  col: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
    borderCurve: "continuous",
  },
  colHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  colTitle: {
    ...Typography.title,
  },
  colScore: {
    ...Typography.display,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  previewName: {
    ...Typography.title,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
});
