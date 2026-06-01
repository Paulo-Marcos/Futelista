import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { TimerStatus } from "@/src/domain/Timer";
import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { RuleChip } from "@/src/shared/ui/RuleChip";

/**
 * Cabeçalho persistente da pelada: nome, regras resumidas (chips), badge de
 * estado e CTA contextual.
 *
 * Aparece nas tabs dentro de (pelada). Calcula o CTA mais útil para o estado
 * atual: adicionar jogadores → montar times → iniciar partida → voltar à partida.
 */
export function PeladaHeader() {
  const palette = usePalette();
  const router = useRouter();

  const nome = useGameSlice((g) => g.name);
  const playersPerTeam = useGameSlice((g) => g.rules.playersPerTeam);
  const timeMatch = useGameSlice((g) => g.rules.timeMatch);
  const numberTimes = useGameSlice((g) => g.rules.numberTimes);
  const goalLimit = useGameSlice((g) => g.rules.goalLimit);
  const totalJogadores = useGameSlice((g) => g.players.length);
  const totalTimes = useGameSlice((g) => g.next.length);
  const temPartida = useGameSlice((g) => g.playing !== undefined);
  const statusTimer = useGameSlice((g) => g.timer?.status);

  const cta = decidirCta({
    totalJogadores,
    totalTimes,
    playersPerTeam,
    temPartida,
  });

  const estado = labelEstado({
    totalJogadores,
    totalTimes,
    temPartida,
    statusTimer,
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.surface,
          borderBottomColor: palette.outlineVariant,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text
            style={[styles.title, { color: palette.onSurface }]}
            numberOfLines={1}
          >
            {nome}
          </Text>
          <Text style={[styles.estado, { color: palette.onSurfaceVariant }]}>
            {estado}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/regras")}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: palette.surfaceVariant,
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <RuleChip label={`${playersPerTeam}×${playersPerTeam}`} />
        <RuleChip label={timeMatchToLabel(timeMatch)} />
        <RuleChip
          label={`${numberTimes} ${numberTimes === 1 ? "tempo" : "tempos"}`}
        />
        <RuleChip label={`Limite ${goalLimit} gols`} />
      </ScrollView>

      {cta ? (
        <PrimaryButton
          label={cta.label}
          icon={cta.icon}
          onPress={() => router.push(cta.href as never)}
          fullWidth
        />
      ) : null}
    </View>
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
  if (params.totalJogadores < 2 * params.playersPerTeam) return null;
  if (params.totalTimes === 0) return null; // tab Times tem o CTA
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
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...Typography.headline,
  },
  estado: {
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
    gap: Spacing.xs,
  },
});
