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
import { GameManager } from "@/src/domain/GameManager";
import { ChoosingTeams } from "@/src/domain/Rules";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { Stepper } from "@/src/shared/ui/Stepper";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export default function RegrasScreen() {
  const { manager } = useSoccer();
  if (!manager) return <Redirect href="/" />;
  return <RegrasInner manager={manager} />;
}

function RegrasInner({ manager }: { manager: GameManager }) {
  const palette = usePalette();
  const router = useRouter();

  const rules = useGameSliceRequired((g) => g.rules);
  const temPartida = useGameSliceRequired((g) => g.playing !== undefined);
  const temTimes = useGameSliceRequired((g) => g.next.length > 0);
  const statusTimer = useGameSliceRequired((g) => g.timer?.status);
  const totalJogadores = useGameSliceRequired((g) => g.players.length);

  const [nome, setNome] = useState(manager.name);
  const [playersPerTeam, setPlayersPerTeam] = useState(rules.playersPerTeam);
  const [numberTimes, setNumberTimes] = useState(rules.numberTimes);
  const [goalLimit, setGoalLimit] = useState(rules.goalLimit);
  const [choosingTeams, setChoosingTeams] = useState<ChoosingTeams>(
    rules.choosingTeams,
  );
  const [minutos, setMinutos] = useState(() => extrairMinutos(rules.timeMatch));
  const [segundos, setSegundos] = useState(() =>
    extrairSegundos(rules.timeMatch),
  );
  const [erro, setErro] = useState<string | null>(null);

  const bloqueiaPlayersPerTeam = temPartida || temTimes;
  const bloqueiaNumberTimes =
    statusTimer !== undefined &&
    statusTimer !== TimerStatus.CREATED &&
    statusTimer !== TimerStatus.ENDED;
  const bloqueiaChoosingTeams = temTimes;

  const salvar = () => {
    try {
      manager.name = nome.trim() || manager.name;
      manager.atualizarRegras({
        name: nome.trim() || rules.name,
        playersPerTeam,
        numberTimes,
        goalLimit,
        choosingTeams,
        timeMatch: formatarTempo(minutos, segundos),
      });
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const timesEstimados =
    playersPerTeam > 0 ? Math.floor(totalJogadores / playersPerTeam) : 0;
  const sobrando = totalJogadores - timesEstimados * playersPerTeam;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.onSurface }]}>Regras</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          android_ripple={{ color: palette.primary + "22", borderless: true }}
        >
          <MaterialCommunityIcons
            name="close"
            size={22}
            color={palette.onSurface}
          />
        </Pressable>
      </View>

      <Field label="Nome da pelada">
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Pelada"
          placeholderTextColor={palette.onSurfaceVariant}
          style={[
            styles.input,
            {
              borderColor: palette.outline,
              backgroundColor: palette.surface,
              color: palette.onSurface,
            },
          ]}
        />
      </Field>

      <Field
        label="Jogadores por time"
        hint={
          bloqueiaPlayersPerTeam
            ? "Bloqueado: há times montados ou partida em andamento."
            : undefined
        }
      >
        <Stepper
          value={playersPerTeam}
          onChange={setPlayersPerTeam}
          min={1}
          max={11}
          disabled={bloqueiaPlayersPerTeam}
        />
      </Field>

      <Field label="Tempo de partida">
        <View style={styles.timeRow}>
          <View style={styles.flex}>
            <Stepper value={minutos} onChange={setMinutos} min={0} max={60} />
            <Text
              style={[styles.timeLabel, { color: palette.onSurfaceVariant }]}
            >
              minutos
            </Text>
          </View>
          <View style={styles.flex}>
            <Stepper
              value={segundos}
              onChange={setSegundos}
              min={0}
              max={59}
              step={5}
            />
            <Text
              style={[styles.timeLabel, { color: palette.onSurfaceVariant }]}
            >
              segundos
            </Text>
          </View>
        </View>
      </Field>

      <Field
        label="Número de tempos"
        hint={bloqueiaNumberTimes ? "Bloqueado: cronômetro em uso." : undefined}
      >
        <Stepper
          value={numberTimes}
          onChange={setNumberTimes}
          min={1}
          max={4}
          disabled={bloqueiaNumberTimes}
        />
      </Field>

      <Field label="Limite de gols">
        <Stepper value={goalLimit} onChange={setGoalLimit} min={1} max={20} />
      </Field>

      <Field
        label="Modo de sorteio"
        hint={
          bloqueiaChoosingTeams
            ? "Para mudar, primeiro resete os times."
            : undefined
        }
      >
        <View style={styles.segmentRow}>
          {(
            [
              { value: ChoosingTeams.BY_ORDER, label: "Ordem" },
              {
                value: ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS,
                label: "Topo",
              },
              { value: ChoosingTeams.BY_MIXING_TEAMS, label: "Embaralhar" },
            ] as const
          ).map((opt) => {
            const sel = choosingTeams === opt.value;
            return (
              <Pressable
                key={opt.value}
                disabled={bloqueiaChoosingTeams}
                onPress={() => setChoosingTeams(opt.value)}
                style={({ pressed }) => [
                  styles.segment,
                  {
                    backgroundColor: sel ? palette.primary : palette.surface,
                    borderColor: sel ? palette.primary : palette.outline,
                    opacity: bloqueiaChoosingTeams ? 0.5 : pressed ? 0.7 : 1,
                  },
                ]}
                android_ripple={{ color: palette.primary + "22" }}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color: sel ? palette.onPrimary : palette.onSurface,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Card variant="outlined" padding="md">
        <Text
          style={[styles.previewLabel, { color: palette.onSurfaceVariant }]}
        >
          Preview
        </Text>
        <Text style={[styles.previewText, { color: palette.onSurface }]}>
          {totalJogadores} jogadores → {timesEstimados}{" "}
          {timesEstimados === 1 ? "time" : "times"} completo
          {timesEstimados === 1 ? "" : "s"}
          {sobrando > 0 ? ` + ${sobrando} sobrando` : ""}
        </Text>
      </Card>

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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const palette = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
      {children}
      {hint ? (
        <Text style={[styles.fieldHint, { color: palette.warning }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function extrairMinutos(timeMatch: string): number {
  const parts = timeMatch.split(":");
  if (parts.length !== 3) return 10;
  return parseInt(parts[1], 10);
}

function extrairSegundos(timeMatch: string): number {
  const parts = timeMatch.split(":");
  if (parts.length !== 3) return 0;
  return parseInt(parts[2], 10);
}

function formatarTempo(minutos: number, segundos: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `00:${pad(minutos)}:${pad(segundos)}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...Typography.headline,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldHint: {
    ...Typography.label,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Typography.body,
    fontSize: 16,
    borderCurve: "continuous",
  },
  timeRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  flex: {
    flex: 1,
  },
  timeLabel: {
    ...Typography.label,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  segmentRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    borderCurve: "continuous",
  },
  segmentLabel: {
    ...Typography.label,
    fontSize: 13,
  },
  previewLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewText: {
    ...Typography.body,
    fontSize: 15,
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
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
