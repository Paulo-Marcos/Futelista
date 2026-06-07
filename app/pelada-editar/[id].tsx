import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { Pelada } from "@/src/domain/Pelada";
import { ChoosingTeams } from "@/src/domain/Rules";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { Field } from "@/src/shared/ui/Field";
import { MiniStepper } from "@/src/shared/ui/MiniStepper";
import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/shared/ui/SegmentedControl";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Editar pelada cadastrada (F-02).
 *
 * Espelha o layout de `pelada-nova.tsx` mas:
 *  - Carrega a Pelada por `id` no foco e pré-popula os campos.
 *  - Chama `atualizarPelada(id, patch)` em vez de `criarPelada`.
 *  - CTA "Salvar alterações" volta com `router.back()`.
 *  - Não persiste regras-tempo (mantém `numberTimes` atual).
 *
 * Por que duplicar e não extrair? O form roda em duas situações com
 * fluxos de navegação diferentes (replace vs back) e o handoff trata as
 * duas telas como cópias visuais quase idênticas — vale o custo do diff
 * para manter cada tela legível. Refactor para componente compartilhado
 * fica como dívida explícita se vier mais um callsite (ex.: salvar avulsa
 * como pelada com form completo).
 */
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export default function PeladaEditarScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const peladaId = params.id;
  const { carregarPelada, atualizarPelada } = useSoccer();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Persistentes (chegam até o domínio)
  const [nome, setNome] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [goalLimit, setGoalLimit] = useState(2);
  const [minutos, setMinutos] = useState(10);
  const [choosingTeams, setChoosingTeams] = useState<ChoosingTeams>(
    ChoosingTeams.BY_ORDER,
  );

  // Agenda + observações (todos persistidos)
  const [local, setLocal] = useState("");
  const [dia, setDia] = useState<(typeof DIAS)[number]>("Qua");
  const [hora, setHora] = useState("21:00");
  const [obs, setObs] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Carrega a Pelada no foco. Em FormSheet o foco pode voltar (ex.: ao
  // fechar um sub-sheet) — useFocusEffect aceita esse comportamento sem
  // re-fetch desnecessário se peladaId não mudar.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      if (!peladaId) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      carregarPelada(peladaId)
        .then((p) => {
          if (!ativo) return;
          setPelada(p);
          setCarregando(false);
        })
        .catch((e) => {
          if (!ativo) return;
          setErro(e instanceof Error ? e.message : String(e));
          setCarregando(false);
        });
      return () => {
        ativo = false;
      };
    }, [peladaId, carregarPelada]),
  );

  // Quando a pelada chega, sincroniza os states uma vez. O efeito depende
  // do id da pelada — atualizações posteriores do mesmo registro não
  // sobrescrevem edições não-salvas do usuário.
  useEffect(() => {
    if (!pelada) return;
    setNome(pelada.nome);
    setPlayersPerTeam(pelada.regras.playersPerTeam);
    setGoalLimit(pelada.regras.goalLimit);
    setMinutos(extrairMinutos(pelada.regras.timeMatch));
    setChoosingTeams(pelada.regras.choosingTeams);
    setLocal(pelada.local ?? "");
    setDia(diaParaChip(pelada.dia));
    setHora(pelada.hora ?? "21:00");
    setObs(pelada.observacoes ?? "");
  }, [pelada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const podeSalvar = !!nome.trim() && !salvando && !!pelada;

  const onSalvar = () => {
    if (!podeSalvar || !pelada) return;
    setSalvando(true);
    atualizarPelada(pelada.id, {
      nome: nome.trim(),
      regras: {
        playersPerTeam,
        timeMatch: formatarTempo(minutos),
        numberTimes: pelada.regras.numberTimes,
        goalLimit,
        choosingTeams,
      },
      agenda: {
        dia: rotuloDia(dia),
        hora: hora.trim() || undefined,
        local: local.trim() || undefined,
      },
      // String vazia remove; conteúdo persiste. Nunca undefined daqui —
      // sempre passamos o que o usuário tem no campo.
      observacoes: obs.trim(),
    })
      .then(() => router.back())
      .catch((e) => {
        setErro(e instanceof Error ? e.message : String(e));
        setSalvando(false);
      });
  };

  const choosingOptions: SegmentedOption<string>[] = [
    { value: String(ChoosingTeams.BY_ORDER), label: "Ordem" },
    {
      value: String(ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS),
      label: "Topo",
    },
    { value: String(ChoosingTeams.BY_MIXING_TEAMS), label: "Embaralhar" },
  ];

  if (carregando) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: palette.background, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!pelada) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: palette.background, paddingTop: insets.top },
        ]}
      >
        <EmptyState
          icon="alert-circle-outline"
          title="Pelada não encontrada"
          description="A pelada pode ter sido removida em outro dispositivo."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: palette.surfaceContainerHigh,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={palette.onSurface}
          />
        </Pressable>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          Editar pelada
        </Text>
      </View>

      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        Identificação
      </Text>
      <Field
        icon="shield-outline"
        placeholder="Nome da pelada (ex.: Fute de Quarta)"
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
        maxLength={40}
        returnKeyType="next"
      />
      <Field
        icon="map-marker-outline"
        placeholder="Local (ex.: Quadra do CEF)"
        value={local}
        onChangeText={setLocal}
      />

      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        Dia
      </Text>
      <View style={styles.dayChips}>
        {DIAS.map((d) => {
          const ativo = d === dia;
          return (
            <Pressable
              key={d}
              onPress={() => setDia(d)}
              accessibilityRole="button"
              accessibilityLabel={`Dia ${d}`}
              style={({ pressed }) => [
                styles.dayChip,
                {
                  backgroundColor: ativo ? palette.primary : palette.surface,
                  borderColor: ativo ? palette.primary : palette.outlineVariant,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayChipText,
                  {
                    color: ativo ? palette.onPrimary : palette.onSurfaceVariant,
                  },
                ]}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        Horário
      </Text>
      <Field
        icon="clock-time-four-outline"
        placeholder="21:00"
        value={hora}
        onChangeText={setHora}
      />

      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        Regras default
      </Text>
      <View style={styles.quickRules}>
        <MiniStepper
          icon="account-multiple"
          label="por time"
          value={playersPerTeam}
          onChange={setPlayersPerTeam}
          min={3}
          max={8}
        />
        <MiniStepper
          icon="bullseye-arrow"
          label="limite gols"
          value={goalLimit}
          onChange={setGoalLimit}
          min={1}
          max={9}
        />
        <MiniStepper
          icon="timer-outline"
          label="minutos"
          value={minutos}
          onChange={setMinutos}
          min={2}
          max={60}
        />
      </View>

      <View
        style={[
          styles.note,
          {
            backgroundColor: palette.surfaceContainerHigh,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={palette.onSurfaceVariant}
        />
        <Text style={[styles.noteText, { color: palette.onSurfaceVariant }]}>
          Alterações aqui valem para próximas execuções. Execuções já criadas
          mantêm as regras com que nasceram.
        </Text>
      </View>

      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        Modo de sorteio
      </Text>
      <SegmentedControl
        value={String(choosingTeams)}
        options={choosingOptions}
        onChange={(v) => setChoosingTeams(Number(v) as ChoosingTeams)}
      />

      <Text style={[styles.label, { color: palette.onSurfaceVariant }]}>
        Observações
      </Text>
      <TextInput
        value={obs}
        onChangeText={setObs}
        placeholder="Ex.: levar coletes, PIX da quadra, etc."
        placeholderTextColor={palette.onSurfaceVariant}
        multiline
        accessibilityLabel="Observações"
        style={[
          styles.textarea,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
            color: palette.onSurface,
          },
        ]}
      />

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
        <PrimaryCTA
          label={salvando ? "Salvando…" : "Salvar alterações"}
          icon="check"
          disabled={!podeSalvar}
          onPress={onSalvar}
          palette={palette}
        />
      </View>
    </ScrollView>
  );
}

// CTA com glow vermelho. Mesma receita do pelada-nova/PrimaryCTA. Mantido
// inline para evitar dependência circular com o Helper de PrimaryCTA da
// outra tela (e por simetria — duas telas, duas cópias).
function PrimaryCTA({
  label,
  icon,
  disabled,
  onPress,
  palette,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
}) {
  const webGlow =
    !disabled && Platform.OS === "web"
      ? ({ boxShadow: `0 14px 40px -10px ${palette.glow}` } as object)
      : null;
  return (
    <View
      style={[
        styles.ctaShadow,
        { shadowColor: palette.primary },
        disabled && styles.ctaShadowOff,
        webGlow,
      ]}
    >
      {!disabled ? <GlowHalo color={palette.primary} /> : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: disabled ? palette.primaryDim : palette.primary,
            opacity: disabled ? 0.6 : 1,
          },
          pressed && !disabled && styles.pressedSoft,
        ]}
        android_ripple={{ color: palette.onPrimary + "22" }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={palette.onPrimary}
        />
        <Text style={[styles.ctaText, { color: palette.onPrimary }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function GlowHalo({ color }: { color: string }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.glowHalo, { backgroundColor: color }]}
    />
  );
}

function formatarTempo(minutos: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `00:${pad(minutos)}:00`;
}

function extrairMinutos(timeMatch: string): number {
  const partes = timeMatch.split(":").map((s) => parseInt(s, 10));
  const [h, m] = partes;
  if (Number.isNaN(h) || Number.isNaN(m)) return 10;
  return h * 60 + m;
}

function rotuloDia(dia: (typeof DIAS)[number]): string {
  switch (dia) {
    case "Seg":
      return "Segundas";
    case "Ter":
      return "Terças";
    case "Qua":
      return "Quartas";
    case "Qui":
      return "Quintas";
    case "Sex":
      return "Sextas";
    case "Sáb":
      return "Sábados";
    case "Dom":
      return "Domingos";
  }
}

/**
 * Reverso de `rotuloDia` — descobre qual chip ligar a partir do texto
 * persistido em `pelada.dia`. Cai em "Qua" se a string não bater com
 * nenhum dia conhecido (incluindo undefined).
 */
function diaParaChip(dia: string | undefined): (typeof DIAS)[number] {
  switch (dia) {
    case "Segundas":
      return "Seg";
    case "Terças":
      return "Ter";
    case "Quartas":
      return "Qua";
    case "Quintas":
      return "Qui";
    case "Sextas":
      return "Sex";
    case "Sábados":
      return "Sáb";
    case "Domingos":
      return "Dom";
    default:
      return "Qua";
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.headline, fontSize: 22, fontWeight: "800", flex: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
    marginTop: Spacing.sm,
  },
  dayChips: {
    flexDirection: "row",
    gap: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    borderCurve: "continuous",
  },
  dayChipText: { ...Typography.title, fontSize: 13, fontWeight: "700" },
  quickRules: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  noteText: { ...Typography.label, fontSize: 12, flex: 1 },
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    fontSize: 14,
    textAlignVertical: "top",
    borderCurve: "continuous",
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
  errorText: { ...Typography.label, flex: 1 },
  actions: { gap: Spacing.sm, marginTop: Spacing.lg },
  pressedSoft: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  // ---- CTA com glow vermelho ----
  ctaShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 10,
  },
  ctaShadowOff: { shadowOpacity: 0, elevation: 0 },
  glowHalo: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 14,
    bottom: -6,
    borderRadius: Radius.md,
    opacity: Platform.OS === "android" ? 0.4 : 0.55,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 54,
    borderRadius: Radius.md,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  ctaText: { ...Typography.title, fontSize: 16, fontWeight: "800" },
});
