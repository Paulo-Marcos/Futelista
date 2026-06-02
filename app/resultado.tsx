import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GameManager } from "@/src/domain/GameManager";
import { ResultMatch } from "@/src/domain/Match";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

type Cenario =
  | { kind: "victory"; vencedor: Team; perdedor: Team }
  | { kind: "draw_auto" }
  | { kind: "draw_manual"; teamA: Team; teamB: Team };

export default function ResultadoScreen() {
  const { manager } = useSoccer();
  if (!manager) return <Redirect href="/" />;
  return <ResultadoInner manager={manager} />;
}

function ResultadoInner({ manager }: { manager: GameManager }) {
  const palette = usePalette();
  const router = useRouter();

  const result = useGameSliceRequired((g) => g.playing?.result);
  const playing = useGameSliceRequired((g) => g.playing);
  const advantagePrevia = useGameSliceRequired((g) => g.advantageToNext);
  const segundoNextCheio = useGameSliceRequired(
    (g) => g.next[1]?.fullTeam === true,
  );
  const goals = useGameSliceRequired((g) => g.playing?.countGoals());

  const [escolhidoId, setEscolhidoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!playing || result === undefined) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.onSurface }]}>
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

  const confirmar = (timeExterno?: Team) => {
    try {
      manager.setNextMatch(timeExterno);
      router.replace("/times");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.placar, { color: palette.onSurface }]} selectable>
        Time 1 {goals?.teamA ?? 0} × {goals?.teamB ?? 0} Time 2
      </Text>

      {cenario.kind === "victory" ? (
        <CenarioVitoria cenario={cenario} onConfirmar={() => confirmar()} />
      ) : null}

      {cenario.kind === "draw_auto" ? (
        <CenarioEmpateAutomatico
          temAdvantage={!!advantagePrevia}
          onConfirmar={() => confirmar()}
        />
      ) : null}

      {cenario.kind === "draw_manual" ? (
        <CenarioEmpateManual
          teamA={cenario.teamA}
          teamB={cenario.teamB}
          escolhidoId={escolhidoId}
          onSelecionar={setEscolhidoId}
          onConfirmar={() => {
            const escolhido =
              cenario.teamA.id === escolhidoId
                ? cenario.teamA
                : cenario.teamB.id === escolhidoId
                  ? cenario.teamB
                  : null;
            if (!escolhido) {
              setErro("Selecione qual time continua.");
              return;
            }
            confirmar(escolhido);
          }}
        />
      ) : null}

      {erro ? (
        <Text style={[styles.erro, { color: palette.error }]} selectable>
          {erro}
        </Text>
      ) : null}

      <SecondaryButton
        label="Voltar à partida"
        onPress={() => router.back()}
        fullWidth
      />
    </ScrollView>
  );
}

function CenarioVitoria({
  cenario,
  onConfirmar,
}: {
  cenario: { vencedor: Team; perdedor: Team };
  onConfirmar: () => void;
}) {
  const palette = usePalette();
  const tituloVencedor =
    cenario.vencedor === undefined ? "Vencedor" : nomeDoTime(cenario.vencedor);
  return (
    <>
      <Card variant="primary">
        <View style={styles.iconRow}>
          <MaterialCommunityIcons
            name="trophy"
            size={32}
            color={palette.secondary}
          />
          <Text style={[styles.heading, { color: palette.onSurface }]}>
            Vitória
          </Text>
        </View>
        <Text style={[styles.body, { color: palette.onSurface }]}>
          {tituloVencedor} continua jogando e ganha vantagem. O perdedor vai
          para o fim da fila.
        </Text>
      </Card>
      <PrimaryButton
        label="Próxima partida"
        icon="play-circle-outline"
        onPress={onConfirmar}
        fullWidth
      />
    </>
  );
}

function CenarioEmpateAutomatico({
  temAdvantage,
  onConfirmar,
}: {
  temAdvantage: boolean;
  onConfirmar: () => void;
}) {
  const palette = usePalette();
  return (
    <>
      <Card variant="primary">
        <View style={styles.iconRow}>
          <MaterialCommunityIcons
            name="equal"
            size={32}
            color={palette.primary}
          />
          <Text style={[styles.heading, { color: palette.onSurface }]}>
            Empate
          </Text>
        </View>
        <Text style={[styles.body, { color: palette.onSurface }]}>
          {temAdvantage
            ? "Time com vantagem prévia segue jogando."
            : "Empate decidido automaticamente pela fila."}
        </Text>
      </Card>
      <PrimaryButton
        label="Próxima partida"
        icon="play-circle-outline"
        onPress={onConfirmar}
        fullWidth
      />
    </>
  );
}

function CenarioEmpateManual({
  teamA,
  teamB,
  escolhidoId,
  onSelecionar,
  onConfirmar,
}: {
  teamA: Team;
  teamB: Team;
  escolhidoId: string | null;
  onSelecionar: (id: string) => void;
  onConfirmar: () => void;
}) {
  const palette = usePalette();
  return (
    <>
      <Card variant="surface">
        <View style={styles.iconRow}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={28}
            color={palette.warning}
          />
          <Text style={[styles.heading, { color: palette.onSurface }]}>
            Empate sem vantagem
          </Text>
        </View>
        <Text style={[styles.body, { color: palette.onSurfaceVariant }]}>
          Quem segue jogando?
        </Text>
      </Card>
      <View style={styles.escolhaRow}>
        <View style={styles.flex}>
          <OptionButton
            label={nomeDoTime(teamA, "Time 1")}
            selected={escolhidoId === teamA.id}
            onPress={() => onSelecionar(teamA.id)}
          />
        </View>
        <View style={styles.flex}>
          <OptionButton
            label={nomeDoTime(teamB, "Time 2")}
            selected={escolhidoId === teamB.id}
            onPress={() => onSelecionar(teamB.id)}
          />
        </View>
      </View>
      <PrimaryButton
        label="Próxima partida"
        icon="play-circle-outline"
        onPress={onConfirmar}
        disabled={!escolhidoId}
        fullWidth
      />
    </>
  );
}

function OptionButton({
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
    <View
      style={[
        styles.option,
        {
          backgroundColor: selected
            ? palette.primaryContainer
            : palette.surface,
          borderColor: selected ? palette.primary : palette.outline,
        },
      ]}
      onTouchEnd={onPress}
    >
      <Text
        style={[
          styles.optionLabel,
          {
            color: selected ? palette.onPrimaryContainer : palette.onSurface,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
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

function nomeDoTime(_team: Team, fallback = "Time"): string {
  // Time não tem nome legível ainda; usamos label posicional dado pelo chamador.
  return fallback;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.headline,
    padding: Spacing.lg,
  },
  placar: {
    ...Typography.display,
    fontSize: 28,
    textAlign: "center",
    paddingVertical: Spacing.md,
    fontVariant: ["tabular-nums"],
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heading: {
    ...Typography.headline,
  },
  body: {
    ...Typography.body,
    fontSize: 16,
    lineHeight: 22,
  },
  escolhaRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  option: {
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
    alignItems: "center",
    borderCurve: "continuous",
  },
  optionLabel: {
    ...Typography.title,
  },
  erro: {
    ...Typography.body,
    textAlign: "center",
  },
});
