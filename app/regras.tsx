import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { ChoosingTeams } from "@/src/domain/Rules";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { RuleCard } from "@/src/shared/ui/RuleCard";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/shared/ui/SegmentedControl";
import { Stepper } from "@/src/shared/ui/Stepper";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Regras (handoff v2, tela 07).
 *
 * Header simples · cfgPelada com escudo · sections "Partida"/"Times" ·
 * RuleCard para cada regra · SegmentedControl para modo de sorteio ·
 * Cancelar/Salvar.
 */
export default function RegrasScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  return <RegrasInner gestor={gestor} />;
}

function RegrasInner({ gestor }: { gestor: GestorJogo }) {
  const palette = usePalette();
  const router = useRouter();

  const rules = useGameSliceRequired((g) => g.rules);
  const temPartida = useGameSliceRequired((g) => g.playing !== undefined);
  const temTimes = useGameSliceRequired((g) => g.next.length > 0);
  const statusTimer = useGameSliceRequired((g) => g.timer?.status);
  const totalJogadores = useGameSliceRequired((g) => g.players.length);
  const peladaId = useGameSliceRequired((g) => g.peladaId);

  const [nome, setNome] = useState(gestor.name);
  const [playersPerTeam, setPlayersPerTeam] = useState(rules.playersPerTeam);
  const [numberTimes, setNumberTimes] = useState(rules.numberTimes);
  const [goalLimit, setGoalLimit] = useState(rules.goalLimit);
  const [choosingTeams, setChoosingTeams] = useState<ChoosingTeams>(
    rules.choosingTeams,
  );
  const [minutos, setMinutos] = useState(() => extrairMinutos(rules.timeMatch));
  const [erro, setErro] = useState<string | null>(null);

  const bloqueiaPlayersPerTeam = temPartida || temTimes;
  const bloqueiaNumberTimes =
    statusTimer !== undefined &&
    statusTimer !== TimerStatus.CREATED &&
    statusTimer !== TimerStatus.ENDED;
  const bloqueiaChoosingTeams = temTimes;

  const salvar = () => {
    try {
      gestor.name = nome.trim() || gestor.name;
      gestor.atualizarRegras({
        name: nome.trim() || rules.name,
        playersPerTeam,
        numberTimes,
        goalLimit,
        choosingTeams,
        timeMatch: formatarTempo(minutos),
      });
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const timesEstimados =
    playersPerTeam > 0 ? Math.floor(totalJogadores / playersPerTeam) : 0;
  const sobrando = totalJogadores - timesEstimados * playersPerTeam;

  const choosingOptions: SegmentedOption<string>[] = [
    { value: String(ChoosingTeams.BY_ORDER), label: "Ordem" },
    {
      value: String(ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS),
      label: "Topo",
    },
    { value: String(ChoosingTeams.BY_MIXING_TEAMS), label: "Embaralhar" },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          Regras
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: palette.surfaceContainerHigh,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={palette.onSurface}
          />
        </Pressable>
      </View>

      <View
        style={[
          styles.cfgPelada,
          {
            backgroundColor: palette.surface,
            borderColor: palette.primary + "4D",
          },
        ]}
      >
        <View
          style={[
            styles.cfgBadge,
            { backgroundColor: palette.surfaceContainerHigh },
          ]}
        >
          <TeamCrest seed={peladaId ?? gestor.id} size={36} />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Pelada"
            placeholderTextColor={palette.onSurfaceVariant}
            accessibilityLabel="Nome da pelada"
            style={[
              styles.cfgNomeInput,
              { color: palette.onSurface, borderColor: "transparent" },
            ]}
          />
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
        Partida
      </Text>

      <RuleCard
        icon="timer-outline"
        title="Duração da partida"
        sub="minutos por partida"
        control={
          <Stepper value={minutos} onChange={setMinutos} min={1} max={60} />
        }
      />

      <RuleCard
        icon="bullseye-arrow"
        title="Limite de gols"
        sub="encerra ao atingir"
        control={
          <Stepper
            value={goalLimit}
            onChange={setGoalLimit}
            min={1}
            max={20}
          />
        }
      />

      <RuleCard
        icon="repeat"
        title="Número de tempos"
        sub="quantos tempos por partida"
        hint={bloqueiaNumberTimes ? "Bloqueado: cronômetro em uso." : undefined}
        control={
          <Stepper
            value={numberTimes}
            onChange={setNumberTimes}
            min={1}
            max={4}
            disabled={bloqueiaNumberTimes}
          />
        }
      />

      <Text style={[styles.sectionLabel, { color: palette.onSurfaceVariant }]}>
        Times
      </Text>

      <RuleCard
        icon="account-multiple"
        title="Formato dos times"
        sub="jogadores por time"
        hint={
          bloqueiaPlayersPerTeam
            ? "Bloqueado: há times montados ou partida em andamento."
            : undefined
        }
        control={
          <Stepper
            value={playersPerTeam}
            onChange={setPlayersPerTeam}
            min={1}
            max={11}
            disabled={bloqueiaPlayersPerTeam}
          />
        }
      />

      <RuleCard
        icon="dice-multiple"
        title="Modo de sorteio"
        sub="como os times são formados"
        hint={
          bloqueiaChoosingTeams
            ? "Para mudar, primeiro resete os times."
            : undefined
        }
        seg={
          <SegmentedControl
            value={String(choosingTeams)}
            options={choosingOptions}
            onChange={(v) => setChoosingTeams(Number(v) as ChoosingTeams)}
            disabled={bloqueiaChoosingTeams}
          />
        }
      />

      <View
        style={[
          styles.preview,
          {
            backgroundColor: palette.surfaceContainerHigh,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <Text style={[styles.previewLabel, { color: palette.onSurfaceVariant }]}>
          PREVIEW
        </Text>
        <Text style={[styles.previewText, { color: palette.onSurface }]}>
          {totalJogadores} jogadores → {timesEstimados}{" "}
          {timesEstimados === 1 ? "time" : "times"} completo
          {timesEstimados === 1 ? "" : "s"}
          {sobrando > 0 ? ` + ${sobrando} sobrando` : ""}
        </Text>
      </View>

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
          <Text style={[styles.errorText, { color: palette.error }]} selectable>
            {erro}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.flex}>
          <SecondaryButton
            label="Cancelar"
            onPress={() => router.back()}
            fullWidth
          />
        </View>
        <View style={styles.flex}>
          <PrimaryButton label="Salvar" onPress={salvar} fullWidth />
        </View>
      </View>
    </ScrollView>
  );
}

function extrairMinutos(timeMatch: string): number {
  const parts = timeMatch.split(":");
  if (parts.length !== 3) return 10;
  return parseInt(parts[1], 10);
}

function formatarTempo(minutos: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `00:${pad(minutos)}:00`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...Typography.headline, fontSize: 22, fontWeight: "800" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cfgPelada: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  cfgBadge: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  cfgNomeInput: {
    ...Typography.title,
    fontSize: 17,
    fontWeight: "800",
    borderWidth: 0,
    paddingVertical: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
    marginTop: Spacing.sm,
  },
  preview: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
    gap: 4,
  },
  previewLabel: { ...Typography.label, fontSize: 10, letterSpacing: 0.8 },
  previewText: { ...Typography.body, fontSize: 14, fontWeight: "600" },
  errorBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: { ...Typography.label, flex: 1 },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  flex: { flex: 1 },
});
