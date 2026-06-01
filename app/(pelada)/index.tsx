import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { RuleChip } from "@/src/shared/ui/RuleChip";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Home da pelada — dashboard com status, CTA principal e gerenciamento
 * (nova pelada, regras, limpar dados).
 */
export default function HomeScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { manager, criarNovaPelada, limparDados } = useSoccer();

  const nome = useGameSlice((g) => g.name);
  const totalJogadores = useGameSlice((g) => g.players.length);
  const totalTimes = useGameSlice((g) => g.next.length);
  const playersWithoutTeam = useGameSlice((g) => g.playersWithoutTeam);
  const playersPerTeam = useGameSlice((g) => g.rules.playersPerTeam);
  const timeMatch = useGameSlice((g) => g.rules.timeMatch);
  const numberTimes = useGameSlice((g) => g.rules.numberTimes);
  const goalLimit = useGameSlice((g) => g.rules.goalLimit);
  const temPartida = useGameSlice((g) => g.playing !== undefined);
  const statusTimer = useGameSlice((g) => g.timer?.status);

  const [novoNomePelada, setNovoNomePelada] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const estado = labelEstado({
    totalJogadores,
    totalTimes,
    temPartida,
    statusTimer,
  });
  const cta = decidirCta({
    totalJogadores,
    totalTimes,
    playersPerTeam,
    temPartida,
  });

  const safeAction = (fn: () => void) => {
    try {
      fn();
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const confirmarLimpar = () => {
    Alert.alert(
      "Limpar dados",
      "Isso apaga todos os jogadores, times e a partida atual. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => {
            limparDados().catch((e) =>
              setErro(e instanceof Error ? e.message : String(e)),
            );
          },
        },
      ],
    );
  };

  const criar = () => {
    const nomeFinal = novoNomePelada.trim();
    if (!nomeFinal) {
      setErro("Informe um nome para a nova pelada.");
      return;
    }
    Alert.alert(
      "Nova pelada",
      `Criar uma nova pelada "${nomeFinal}"? A pelada atual será arquivada.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Criar",
          onPress: () => {
            criarNovaPelada(nomeFinal)
              .then(() => {
                setNovoNomePelada("");
                setErro(null);
              })
              .catch((e) =>
                setErro(e instanceof Error ? e.message : String(e)),
              );
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom },
      ]}
    >
      <Card variant="primary">
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleBlock}>
            <Text
              style={[styles.heroTitle, { color: palette.onSurface }]}
              numberOfLines={1}
              selectable
            >
              {nome}
            </Text>
            <Text
              style={[styles.heroEstado, { color: palette.onSurfaceVariant }]}
            >
              {estado}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/regras")}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: palette.surface,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            android_ripple={{ color: palette.primary + "22" }}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={20}
              color={palette.onSurface}
            />
          </Pressable>
        </View>

        <View style={styles.chips}>
          <RuleChip label={`${playersPerTeam}×${playersPerTeam}`} />
          <RuleChip label={timeMatchToLabel(timeMatch)} />
          <RuleChip
            label={`${numberTimes} ${numberTimes === 1 ? "tempo" : "tempos"}`}
          />
          <RuleChip label={`Limite ${goalLimit} gols`} />
        </View>
      </Card>

      {cta ? (
        <PrimaryButton
          label={cta.label}
          icon={cta.icon}
          onPress={() => router.push(cta.href as never)}
          fullWidth
        />
      ) : null}

      <View style={styles.statsRow}>
        <StatCard
          icon="account-multiple"
          value={totalJogadores}
          label={totalJogadores === 1 ? "jogador" : "jogadores"}
          onPress={() => router.push("/jogadores")}
        />
        <StatCard
          icon="shield-account"
          value={totalTimes}
          label={totalTimes === 1 ? "time" : "times"}
          onPress={() => router.push("/times")}
        />
      </View>

      {playersWithoutTeam > 0 ? (
        <Card variant="outlined" padding="md">
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
        </Card>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.onSurfaceVariant }]}>
          Gerenciar pelada
        </Text>

        <Card variant="surface" padding="md">
          <Text
            style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}
          >
            Nova pelada
          </Text>
          <View style={styles.novaPeladaRow}>
            <TextInput
              value={novoNomePelada}
              onChangeText={setNovoNomePelada}
              placeholder="Ex.: Pelada de sábado"
              placeholderTextColor={palette.onSurfaceVariant}
              onSubmitEditing={criar}
              style={[
                styles.input,
                {
                  borderColor: palette.outline,
                  backgroundColor: palette.background,
                  color: palette.onSurface,
                },
              ]}
            />
          </View>
          <View style={{ marginTop: Spacing.sm }}>
            <PrimaryButton
              label="Criar nova pelada"
              icon="plus-circle"
              onPress={() => safeAction(criar)}
              disabled={!novoNomePelada.trim()}
              fullWidth
            />
          </View>
        </Card>

        <SecondaryButton
          label="Editar regras"
          icon="cog-outline"
          onPress={() => router.push("/regras")}
          fullWidth
        />

        <SecondaryButton
          label="Limpar dados desta pelada"
          icon="trash-can-outline"
          onPress={confirmarLimpar}
          destructive
          fullWidth
        />
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
          <Text
            style={[styles.errorText, { color: palette.error }]}
            selectable
          >
            {erro}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.footer, { color: palette.onSurfaceVariant }]}>
        id: {manager.id.slice(0, 8)}…
      </Text>
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      android_ripple={{ color: palette.primary + "22" }}
    >
      <MaterialCommunityIcons name={icon} size={28} color={palette.primary} />
      <Text
        style={[styles.statValue, { color: palette.onSurface }]}
        selectable
      >
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
    </Pressable>
  );
}

type CtaConfig = {
  label: string;
  href: string;
  icon: Parameters<typeof PrimaryButton>[0]["icon"];
};

function decidirCta(params: {
  totalJogadores: number;
  totalTimes: number;
  playersPerTeam: number;
  temPartida: boolean;
}): CtaConfig | null {
  if (params.temPartida) {
    return {
      label: "Voltar à partida",
      href: "/partida",
      icon: "play-circle-outline",
    };
  }
  if (params.totalJogadores === 0) {
    return {
      label: "Adicionar jogadores",
      href: "/jogadores",
      icon: "account-plus",
    };
  }
  if (params.totalJogadores < 2 * params.playersPerTeam) {
    return {
      label: "Adicionar mais jogadores",
      href: "/jogadores",
      icon: "account-plus",
    };
  }
  if (params.totalTimes === 0) {
    return { label: "Montar times", href: "/times", icon: "shuffle-variant" };
  }
  return { label: "Iniciar partida", href: "/partida", icon: "whistle" };
}

function labelEstado(params: {
  totalJogadores: number;
  totalTimes: number;
  temPartida: boolean;
  statusTimer?: TimerStatus;
}): string {
  if (params.temPartida) {
    if (params.statusTimer === TimerStatus.STARTED)
      return "Partida em andamento";
    if (params.statusTimer === TimerStatus.PAUSED) return "Partida pausada";
    if (params.statusTimer === TimerStatus.INTERVAL) return "Intervalo";
    return "Partida pronta";
  }
  if (params.totalJogadores === 0) return "Aguardando jogadores";
  if (params.totalTimes === 0) return "Aguardando montar times";
  return "Times prontos";
}

function timeMatchToLabel(timeMatch: string): string {
  const [h, m] = timeMatch.split(":").map((s) => parseInt(s, 10));
  if (!Number.isNaN(h) && h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}min`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroTitleBlock: {
    flex: 1,
  },
  heroTitle: {
    ...Typography.display,
    fontSize: 28,
  },
  heroEstado: {
    ...Typography.label,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
    borderCurve: "continuous",
  },
  statValue: {
    ...Typography.display,
    fontSize: 32,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    ...Typography.label,
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
  section: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  novaPeladaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Typography.body,
    fontSize: 15,
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
  errorText: {
    ...Typography.label,
    flex: 1,
  },
  footer: {
    ...Typography.label,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
