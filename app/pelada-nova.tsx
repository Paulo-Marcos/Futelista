import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { ChoosingTeams } from "@/src/domain/Rules";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Field } from "@/src/shared/ui/Field";
import { MiniStepper } from "@/src/shared/ui/MiniStepper";
import {
  SegmentedControl,
  SegmentedOption,
} from "@/src/shared/ui/SegmentedControl";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Nova pelada (handoff `rn-export/NovaPelada.tsx`).
 *
 * Header: botão `arrow-left` (square-rounded, surface2) + título à esquerda.
 * Seções: Identificação · Dia · Horário · Regras rápidas · Nota · Modo de
 * sorteio · Observações · Preview · CTA `Criar e entrar na pelada` com glow
 * vermelho. Pós-criar usa `router.replace` para a home da pelada (`ADD_PELADA`
 * + enter do handoff).
 *
 */
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export default function PeladaNovaScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { criarPelada } = useSoccer();

  // Persistentes (chegam até o domínio)
  const [nome, setNome] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const [goalLimit, setGoalLimit] = useState(2);
  const [minutos, setMinutos] = useState(10);
  const [choosingTeams, setChoosingTeams] = useState<ChoosingTeams>(
    ChoosingTeams.BY_ORDER,
  );

  // Agenda + observações (todos persistidos no domínio Pelada)
  const [local, setLocal] = useState("");
  const [dia, setDia] = useState<(typeof DIAS)[number]>("Qua");
  const [hora, setHora] = useState("21:00");
  const [obs, setObs] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const podeSalvar = !!nome.trim() && !salvando;

  const onSalvar = () => {
    if (!podeSalvar) return;
    setSalvando(true);
    criarPelada(
      nome.trim(),
      {
        playersPerTeam,
        timeMatch: formatarTempo(minutos),
        numberTimes: 1,
        goalLimit,
        choosingTeams,
      },
      {
        dia: rotuloDia(dia),
        hora: hora.trim() || undefined,
        local: local.trim() || undefined,
      },
      obs.trim() || undefined,
    )
      .then((pelada) =>
        // "Criar e entrar" — substitui esta tela pela home da pelada
        // (replace evita ficar com Nova pelada no back stack).
        router.replace({
          pathname: "/peladas/[id]",
          params: { id: pelada.id },
        }),
      )
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
          Nova pelada
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
        autoFocus
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
        Regras rápidas
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
          name="clipboard-text-outline"
          size={14}
          color={palette.onSurfaceVariant}
        />
        <Text style={[styles.noteText, { color: palette.onSurfaceVariant }]}>
          Você ajusta todas as regras depois, na engrenagem da pelada.
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

      <View
        style={[
          styles.preview,
          {
            backgroundColor: palette.surfaceContainerHigh,
            borderColor: palette.outlineVariant,
          },
        ]}
      >
        <Text
          style={[styles.previewLabel, { color: palette.onSurfaceVariant }]}
        >
          PREVIEW
        </Text>
        <Text style={[styles.previewText, { color: palette.onSurface }]}>
          <Text style={[styles.previewAccent, { color: palette.primary }]}>
            {playersPerTeam}×{playersPerTeam}
          </Text>
          {` · ${minutos}min · 1 tempo · limite ${goalLimit} gols`}
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
        <PrimaryCTA
          label="Criar e entrar na pelada"
          icon="check"
          disabled={!podeSalvar}
          onPress={onSalvar}
          palette={palette}
        />
      </View>
    </ScrollView>
  );
}

// CTA com glow vermelho. Receita do README do handoff:
//   iOS:     wrapper com shadowColor=primary (HEX opaco) + offset/opacity/radius
//   Android: <GlowHalo/> (View vermelha translúcida atrás) — elevation só
//            gera relevo cinza.
//   Web:     boxShadow CSS direto via Platform.select — RN Web não traduz
//            shadowColor pra sombra colorida.
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
            // Sempre vermelho — quando desabilitado, usa primaryDim
            // (mais escuro/queimado) ao invés do cinza outline.
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.headline, fontSize: 22, fontWeight: "800", flex: 1 },
  // ScreenHeader do protótipo: .fl-iconbtn (40×40, border-radius var(--r-md))
  // — square-rounded, não círculo. Background = surface2 (surfaceContainerHigh).
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
  preview: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
    gap: 4,
  },
  previewLabel: { ...Typography.label, fontSize: 10, letterSpacing: 0.8 },
  previewText: { ...Typography.body, fontSize: 14, fontWeight: "600" },
  previewAccent: { fontWeight: "800" },
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
  // Wrapper carrega a sombra colorida no iOS. shadowColor é injetado em runtime
  // pelo PrimaryCTA (precisa ser HEX opaco — alpha vem do shadowOpacity).
  ctaShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 10,
  },
  ctaShadowOff: { shadowOpacity: 0, elevation: 0 },
  // GlowHalo — vazamento vermelho atrás do botão. Compensa a falta de
  // elevation colorida no Android e dá camada extra no iOS/web.
  glowHalo: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 14,
    bottom: -6,
    borderRadius: Radius.md,
    opacity: 0.5,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignSelf: "stretch",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  ctaText: { ...Typography.title, fontSize: 16, fontWeight: "800" },
});
