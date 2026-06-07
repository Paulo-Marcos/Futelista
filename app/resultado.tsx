import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Goal } from "@/src/domain/Goal";
import { ResultMatch } from "@/src/domain/Match";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

type Cenario =
  | { kind: "victory"; vencedor: Team; perdedor: Team }
  | { kind: "draw_auto" }
  | { kind: "draw_manual"; teamA: Team; teamB: Team };

/**
 * Resumo da partida (handoff v2, tela 06).
 *
 * Trophy 60×60 (accent@22%) · eyebrow "FIM DE JOGO"/"EMPATE" · placar 60px
 * tabular (vencedor onSurface, perdedor dim) · row "Time 1 / Time 2" ·
 * scorers box agregado por jogador · winner pill (`goal@14%`) ou empate-pick ·
 * CTAs "Próxima partida" + "Encerrar pelada".
 */
export default function ResultadoScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  return <ResultadoInner gestor={gestor} />;
}

function ResultadoInner({ gestor }: { gestor: GestorJogo }) {
  const palette = usePalette();
  const router = useRouter();

  const result = useGameSliceRequired((g) => g.playing?.result);
  const playing = useGameSliceRequired((g) => g.playing);
  const advantagePrevia = useGameSliceRequired((g) => g.advantageToNext);
  const segundoNextCheio = useGameSliceRequired(
    (g) => g.next[1]?.fullTeam === true,
  );
  const goals = useGameSliceRequired((g) => g.playing?.countGoals());
  const allGoals: Goal[] = useGameSliceRequired((g) => g.playing?.goals ?? []);

  const [escolhidoId, setEscolhidoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!playing || result === undefined) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <Text style={[styles.fallbackTitle, { color: palette.onSurface }]}>
          Nenhum resultado pendente
        </Text>
      </View>
    );
  }

  const cenario = detectarCenario({
    result,
    advantagePrevia: !!advantagePrevia,
    segundoNextCheio,
    teamA: playing.teamA,
    teamB: playing.teamB,
    winner: playing.winner,
    loser: playing.loser,
  });

  const proxima = (timeExterno?: Team) => {
    try {
      gestor.setNextMatch(timeExterno);
      router.replace("/times");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const encerrarPelada = () => {
    try {
      gestor.setNextMatch();
    } catch {
      /* já encerrada — segue para tela */
    }
    router.replace("/peladas");
  };

  const placarA = goals?.teamA ?? 0;
  const placarB = goals?.teamB ?? 0;
  const draw = cenario.kind !== "victory";
  const winnerSide: "A" | "B" | null = draw
    ? null
    : cenario.vencedor === playing.teamA
      ? "A"
      : "B";
  const escolhidoSide: "A" | "B" | null = !escolhidoId
    ? null
    : escolhidoId === playing.teamA.id
      ? "A"
      : "B";
  const pickSide = winnerSide ?? escolhidoSide;
  const canConfirm = cenario.kind !== "draw_manual" || pickSide !== null;

  const scorersA = aggregateScorers(
    allGoals.filter((g) => g.team.id === playing.teamA.id),
  );
  const scorersB = aggregateScorers(
    allGoals.filter((g) => g.team.id === playing.teamB.id),
  );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.trophy,
          { backgroundColor: palette.tertiary + "38" },
        ]}
      >
        <MaterialCommunityIcons
          name={draw ? "flag-checkered" : "trophy"}
          size={30}
          color={palette.tertiary}
        />
      </View>

      <Text style={[styles.eyebrow, { color: palette.onSurfaceVariant }]}>
        {draw ? "Empate" : "Fim de jogo"}
      </Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCrest}>
          <TeamCrest seed={playing.teamA.id} size={36} />
        </View>
        <Text
          style={[
            styles.scoreNum,
            {
              color:
                pickSide === "A" ? palette.onSurface : palette.onSurfaceVariant,
            },
          ]}
        >
          {placarA}
        </Text>
        <Text style={[styles.scoreX, { color: palette.onSurfaceVariant }]}>
          ×
        </Text>
        <Text
          style={[
            styles.scoreNum,
            {
              color:
                pickSide === "B" ? palette.onSurface : palette.onSurfaceVariant,
            },
          ]}
        >
          {placarB}
        </Text>
        <View style={styles.scoreCrest}>
          <TeamCrest seed={playing.teamB.id} size={36} />
        </View>
      </View>

      <View style={styles.teamsRow}>
        <Text
          style={[styles.teamLabel, { color: palette.onSurfaceVariant }]}
          selectable
        >
          Time 1 {placarA} × {placarB} Time 2
        </Text>
      </View>

      <View
        style={[
          styles.scorersBox,
          { backgroundColor: palette.surfaceContainerHigh },
        ]}
      >
        <View style={styles.scorersCol}>
          {scorersA.length === 0 ? (
            <Text style={[styles.scorerNone, { color: palette.onSurfaceVariant }]}>
              —
            </Text>
          ) : (
            scorersA.map((s) => (
              <View key={s.name} style={styles.scorerRow}>
                <MaterialCommunityIcons
                  name="soccer"
                  size={12}
                  color={palette.primary}
                />
                <Text style={[styles.scorerName, { color: palette.onSurface }]}>
                  {s.name}
                  {s.count > 1 ? ` (${s.count})` : ""}
                </Text>
              </View>
            ))
          )}
        </View>
        <View style={[styles.scorersCol, { alignItems: "flex-end" }]}>
          {scorersB.length === 0 ? (
            <Text style={[styles.scorerNone, { color: palette.onSurfaceVariant }]}>
              —
            </Text>
          ) : (
            scorersB.map((s) => (
              <View
                key={s.name}
                style={[styles.scorerRow, { flexDirection: "row-reverse" }]}
              >
                <MaterialCommunityIcons
                  name="soccer"
                  size={12}
                  color={palette.secondary}
                />
                <Text style={[styles.scorerName, { color: palette.onSurface }]}>
                  {s.name}
                  {s.count > 1 ? ` (${s.count})` : ""}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      {cenario.kind === "victory" ? (
        <>
          <Text style={[styles.vitoriaTitle, { color: palette.onSurface }]}>
            Vitória
          </Text>
          <View
            style={[
              styles.winnerPill,
              { backgroundColor: palette.goal + "24" },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy"
              size={15}
              color={palette.goal}
            />
            <Text style={[styles.winnerText, { color: palette.goal }]}>
              {winnerSide === "A" ? "Time 1" : "Time 2"} continua jogando
            </Text>
          </View>
        </>
      ) : null}

      {cenario.kind === "draw_auto" ? (
        <View style={styles.drawAutoBlock}>
          <Text style={[styles.drawHint, { color: palette.onSurfaceVariant }]}>
            {advantagePrevia
              ? "Time com vantagem prévia segue jogando."
              : "Empate decidido automaticamente pela fila."}
          </Text>
        </View>
      ) : null}

      {cenario.kind === "draw_manual" ? (
        <View style={styles.drawManualBlock}>
          <Text style={[styles.drawManualTitle, { color: palette.onSurface }]}>
            Empate sem vantagem
          </Text>
          <Text style={[styles.drawHint, { color: palette.onSurfaceVariant }]}>
            Quem segue jogando?
          </Text>
          <View style={styles.pickRow}>
            <PickButton
              label="Time 1"
              selected={escolhidoId === cenario.teamA.id}
              onPress={() => setEscolhidoId(cenario.teamA.id)}
            />
            <PickButton
              label="Time 2"
              selected={escolhidoId === cenario.teamB.id}
              onPress={() => setEscolhidoId(cenario.teamB.id)}
            />
          </View>
        </View>
      ) : null}

      {erro ? (
        <Text style={[styles.erro, { color: palette.error }]} selectable>
          {erro}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          label="Próxima partida"
          icon="play-circle-outline"
          onPress={() => {
            if (cenario.kind === "draw_manual") {
              if (!escolhidoId) {
                setErro("Selecione qual time continua.");
                return;
              }
              const escolhido =
                cenario.teamA.id === escolhidoId
                  ? cenario.teamA
                  : cenario.teamB;
              proxima(escolhido);
            } else {
              proxima();
            }
          }}
          disabled={!canConfirm}
          fullWidth
        />
        <SecondaryButton
          label="Encerrar pelada"
          icon="flag-checkered"
          onPress={encerrarPelada}
          fullWidth
        />
        <SecondaryButton
          label="Voltar à partida"
          icon="arrow-left"
          onPress={() => router.back()}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

function PickButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      onTouchEnd={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Escolher ${label}`}
      style={({ pressed }) => [
        styles.pick,
        {
          backgroundColor: selected
            ? palette.primary + "2E"
            : palette.surfaceContainerHigh,
          borderColor: selected ? palette.primary : palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.pickLabel,
          { color: selected ? palette.primary : palette.onSurface },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function aggregateScorers(goals: Goal[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  goals.forEach((g) => {
    const n = g.player.name;
    map.set(n, (map.get(n) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

function detectarCenario(input: {
  result: ResultMatch;
  advantagePrevia: boolean;
  segundoNextCheio: boolean;
  teamA: Team;
  teamB: Team;
  winner?: Team;
  loser?: Team;
}): Cenario {
  if (input.result === ResultMatch.VICTORY) {
    return {
      kind: "victory",
      vencedor: input.winner!,
      perdedor: input.loser!,
    };
  }
  if (input.advantagePrevia || input.segundoNextCheio) {
    return { kind: "draw_auto" };
  }
  return { kind: "draw_manual", teamA: input.teamA, teamB: input.teamB };
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  fallbackTitle: { ...Typography.headline, padding: Spacing.lg },
  trophy: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  eyebrow: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  scoreCrest: { alignItems: "center" },
  scoreNum: {
    fontSize: 60,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
  },
  scoreX: {
    fontSize: 32,
    fontWeight: "600",
  },
  teamsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    width: "100%",
    marginTop: Spacing.xs,
  },
  teamLabel: { ...Typography.title, fontSize: 14, fontWeight: "700" },
  scorersBox: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    width: "100%",
    marginTop: Spacing.md,
  },
  scorersCol: { flex: 1, gap: 5 },
  scorerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  scorerName: { ...Typography.body, fontSize: 13, fontWeight: "600" },
  scorerNone: { ...Typography.body, fontSize: 13 },
  vitoriaTitle: {
    ...Typography.headline,
    fontSize: 20,
    fontWeight: "800",
    marginTop: Spacing.sm,
  },
  winnerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
  },
  winnerText: { ...Typography.title, fontSize: 13.5, fontWeight: "700" },
  drawAutoBlock: {
    width: "100%",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  drawHint: {
    ...Typography.body,
    fontSize: 14,
    textAlign: "center",
  },
  drawManualBlock: {
    width: "100%",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  drawManualTitle: {
    ...Typography.headline,
    fontSize: 18,
    fontWeight: "800",
  },
  pickRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
    width: "100%",
  },
  pick: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    borderCurve: "continuous",
  },
  pickLabel: {
    ...Typography.title,
    fontSize: 15,
    fontWeight: "700",
  },
  erro: { ...Typography.body, textAlign: "center" },
  actions: {
    width: "100%",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
