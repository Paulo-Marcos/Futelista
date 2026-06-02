import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { ChoosingTeams } from "@/src/domain/Rules";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { Stepper } from "@/src/shared/ui/Stepper";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Cadastro de uma nova Pelada (tipo): nome + regras default.
 * Apresentada como formSheet a partir da tela /peladas.
 */
export default function PeladaNovaScreen() {
  const palette = usePalette();
  const router = useRouter();
  const { criarPelada } = useSoccer();

  const [nome, setNome] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [minutos, setMinutos] = useState(10);
  const [segundos, setSegundos] = useState(0);
  const [numberTimes, setNumberTimes] = useState(1);
  const [goalLimit, setGoalLimit] = useState(2);
  const [choosingTeams, setChoosingTeams] = useState<ChoosingTeams>(
    ChoosingTeams.BY_ORDER,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const podeSalvar = !!nome.trim() && !salvando;

  const onSalvar = () => {
    if (!podeSalvar) return;
    setSalvando(true);
    criarPelada(nome.trim(), {
      playersPerTeam,
      timeMatch: formatarTempo(minutos, segundos),
      numberTimes,
      goalLimit,
      choosingTeams,
    })
      .then(() => router.back())
      .catch((e) => {
        setErro(e instanceof Error ? e.message : String(e));
        setSalvando(false);
      });
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          Nova pelada
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
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
          placeholder="Ex.: Fute CEF"
          placeholderTextColor={palette.onSurfaceVariant}
          autoFocus
          autoCapitalize="words"
          maxLength={40}
          returnKeyType="next"
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

      <Field label="Jogadores por time">
        <Stepper
          value={playersPerTeam}
          onChange={setPlayersPerTeam}
          min={1}
          max={11}
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

      <Field label="Número de tempos">
        <Stepper
          value={numberTimes}
          onChange={setNumberTimes}
          min={1}
          max={4}
        />
      </Field>

      <Field label="Limite de gols">
        <Stepper value={goalLimit} onChange={setGoalLimit} min={1} max={20} />
      </Field>

      <Field label="Modo de sorteio">
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
                onPress={() => setChoosingTeams(opt.value)}
                style={({ pressed }) => [
                  styles.segment,
                  {
                    backgroundColor: sel ? palette.primary : palette.surface,
                    borderColor: sel ? palette.primary : palette.outline,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                android_ripple={{ color: palette.primary + "22" }}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    { color: sel ? palette.onPrimary : palette.onSurface },
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
          Como vai ficar
        </Text>
        <Text style={[styles.previewText, { color: palette.onSurface }]}>
          {playersPerTeam}×{playersPerTeam} · {minutos}min{" "}
          {segundos > 0 ? `${segundos}s ` : ""}·{" "}
          {numberTimes === 1 ? "1 tempo" : `${numberTimes} tempos`} · limite{" "}
          {goalLimit} gols
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
            disabled={salvando}
          />
        </View>
        <View style={styles.flex}>
          <PrimaryButton
            label={salvando ? "Salvando…" : "Cadastrar"}
            onPress={onSalvar}
            disabled={!podeSalvar}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const palette = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function formatarTempo(minutos: number, segundos: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `00:${pad(minutos)}:${pad(segundos)}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...Typography.headline },
  closeButton: { padding: 8, borderRadius: 20 },
  field: { gap: Spacing.xs },
  fieldLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Typography.body,
    fontSize: 15,
    borderCurve: "continuous",
  },
  timeRow: { flexDirection: "row", gap: Spacing.md },
  flex: { flex: 1 },
  timeLabel: {
    ...Typography.label,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  segmentRow: { flexDirection: "row", gap: Spacing.sm },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  segmentLabel: { ...Typography.label, fontSize: 13, fontWeight: "600" },
  previewLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  previewText: { ...Typography.body, fontSize: 14 },
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
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
});
