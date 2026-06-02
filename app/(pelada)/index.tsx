import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { PeladaStatus } from "@/src/domain/GameManager";
import { Match, ResultMatch } from "@/src/domain/Match";
import { Pelada } from "@/src/domain/Pelada";
import { ResumoPeladaTipo } from "@/src/domain/ports/RepositorioPelada";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { RuleChip } from "@/src/shared/ui/RuleChip";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Home da pelada — dual-mode:
 *  - Sem execução ativa: tela de "Gerenciar peladas" (iniciar avulsa,
 *    lista de tipos cadastrados, +). Só essa aba aparece.
 *  - Com execução ativa: dashboard de execução (status, mini-placar,
 *    stats, próximos, última partida, ações de ciclo de vida).
 */
export default function HomeScreen() {
  const { manager } = useSoccer();
  return manager ? <ExecucaoHome /> : <GestaoHome />;
}

// ====================================================================
// MODO GESTÃO (sem execução ativa)
// ====================================================================

function GestaoHome() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listarPeladas, iniciarExecucaoAvulsa, iniciarExecucao } = useSoccer();

  const [peladas, setPeladas] = useState<ResumoPeladaTipo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [acao, setAcao] = useState<"iniciando-avulsa" | "iniciando" | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarPeladas()
        .then((r) => {
          if (ativo) setPeladas(r);
        })
        .catch((e) => {
          if (ativo) setErro(e instanceof Error ? e.message : String(e));
        });
      return () => {
        ativo = false;
      };
    }, [listarPeladas]),
  );

  const onAvulsa = () => {
    if (acao) return;
    setAcao("iniciando-avulsa");
    iniciarExecucaoAvulsa()
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)))
      .finally(() => setAcao(null));
  };

  const onIniciarDeTipo = async (peladaId: string, podeHerdar: boolean) => {
    if (acao) return;
    let herdar = false;
    if (podeHerdar) {
      const escolha = await escolherOpcao<"herdar" | "vazia">({
        titulo: "Nova execução",
        mensagem: "Iniciar com os mesmos jogadores da última execução?",
        opcoes: [
          { label: "Cancelar", valor: "vazia", estilo: "cancel" },
          { label: "Vazia", valor: "vazia" },
          { label: "Herdar", valor: "herdar" },
        ],
      });
      if (escolha === null) return;
      herdar = escolha === "herdar";
    }
    setAcao("iniciando");
    iniciarExecucao(peladaId, { herdarJogadores: herdar })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)))
      .finally(() => setAcao(null));
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.gestaoHeader}>
        <View style={styles.gestaoHeaderRow}>
          <Text style={[styles.gestaoTitle, { color: palette.onSurface }]}>
            FuteLista
          </Text>
          {__DEV__ ? (
            <Pressable
              onPress={() => router.push("/dev")}
              accessibilityRole="button"
              accessibilityLabel="Abrir dev tools"
              style={({ pressed }) => [
                styles.devButton,
                {
                  borderColor: palette.outline,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[styles.devButtonText, { color: palette.onSurface }]}
              >
                🛠 dev
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text
          style={[styles.gestaoSubtitle, { color: palette.onSurfaceVariant }]}
        >
          Comece uma pelada nova ou escolha uma cadastrada.
        </Text>
      </View>

      <View style={styles.gestaoActions}>
        <PrimaryButton
          label={
            acao === "iniciando-avulsa" ? "Iniciando…" : "Iniciar pelada avulsa"
          }
          icon="play-circle-outline"
          onPress={onAvulsa}
          disabled={acao !== null}
          fullWidth
        />
        <SecondaryButton
          label="Cadastrar nova pelada"
          icon="plus"
          onPress={() => router.push("/pelada-nova")}
          fullWidth
        />
      </View>

      <Text style={[styles.gestaoSection, { color: palette.onSurfaceVariant }]}>
        Minhas peladas
      </Text>

      {peladas === null ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : peladas.length === 0 ? (
        <EmptyState
          icon="soccer"
          title="Nenhuma pelada cadastrada"
          description="Cadastre uma pelada (ex.: Fute CEF) para reusar nome e regras."
        />
      ) : (
        <FlatList
          data={peladas}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.gestaoList}
          renderItem={({ item }) => (
            <PeladaTipoCard
              resumo={item}
              onAbrir={() =>
                router.push({
                  pathname: "/peladas/[id]",
                  params: { id: item.id },
                })
              }
              onIniciar={() =>
                onIniciarDeTipo(item.id, item.totalExecucoes > 0)
              }
              loading={acao === "iniciando"}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      {erro ? <ErrorBanner mensagem={erro} /> : null}
    </View>
  );
}

function PeladaTipoCard({
  resumo,
  onAbrir,
  onIniciar,
  loading,
}: {
  resumo: ResumoPeladaTipo;
  onAbrir: () => void;
  onIniciar: () => void;
  loading: boolean;
}) {
  const palette = usePalette();
  return (
    <Card variant="surface" padding="md">
      <Pressable
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityLabel={`Abrir pelada ${resumo.nome}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Text
          style={[styles.tipoNome, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {resumo.nome}
        </Text>
        <Text style={[styles.tipoRegras, { color: palette.onSurfaceVariant }]}>
          {resumo.regras.playersPerTeam}×{resumo.regras.playersPerTeam} ·{" "}
          {timeMatchToLabel(resumo.regras.timeMatch)} ·{" "}
          {resumo.totalExecucoes === 1
            ? "1 execução"
            : `${resumo.totalExecucoes} execuções`}
        </Text>
      </Pressable>
      <View style={{ marginTop: Spacing.sm }}>
        <PrimaryButton
          label="Iniciar nova execução"
          icon="play-circle-outline"
          onPress={onIniciar}
          disabled={loading}
          fullWidth
        />
      </View>
    </Card>
  );
}

// ====================================================================
// MODO EXECUÇÃO (com manager ativo)
// ====================================================================

function ExecucaoHome() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    saving,
    finalizarExecucao,
    voltarParaGestao,
    limparJogadoresETimes,
    carregarPelada,
  } = useSoccer();

  const nome = useGameSlice((g) => g.name);
  const status = useGameSlice((g) => g.status);
  const startedAt = useGameSlice((g) => g.startedAt);
  const peladaId = useGameSlice((g) => g.peladaId);
  const totalJogadores = useGameSlice((g) => g.players.length) ?? 0;
  const timesNaFila = useGameSlice((g) => g.next.length) ?? 0;
  const playersPerTeam = useGameSlice((g) => g.rules.playersPerTeam) ?? 4;
  const timeMatch = useGameSlice((g) => g.rules.timeMatch) ?? "00:10:00";
  const numberTimes = useGameSlice((g) => g.rules.numberTimes) ?? 1;
  const goalLimit = useGameSlice((g) => g.rules.goalLimit) ?? 2;
  const playing = useGameSlice((g) => g.playing);
  const statusTimer = useGameSlice((g) => g.timer?.status);
  const restSeconds = useGameSlice((g) => g.timer?.restTime);
  const proximos =
    useGameSlice((g) =>
      g.next.slice(0, 3).map((t) => ({
        id: t.id,
        jogadores: t.players.map((p) => p.name),
      })),
    ) ?? [];
  const ultimaPartida = useGameSlice((g) =>
    g.matches.length > 0 ? g.matches[g.matches.length - 1] : undefined,
  );

  const [peladaTipo, setPeladaTipo] = useState<Pelada | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      if (!peladaId) {
        setPeladaTipo(null);
        return;
      }
      carregarPelada(peladaId)
        .then((p) => {
          if (ativo) setPeladaTipo(p);
        })
        .catch(() => {
          if (ativo) setPeladaTipo(null);
        });
      return () => {
        ativo = false;
      };
    }, [peladaId, carregarPelada]),
  );

  const totalTimesVisivel = timesNaFila + (playing ? 2 : 0);
  const peladaFinalizada = status === PeladaStatus.FINALIZADA;
  const peladaAvulsa = !peladaId;
  const cta = decidirCta({
    status: status ?? PeladaStatus.CREATED,
    totalJogadores,
    timesNaFila,
    playersPerTeam,
    temPartida: !!playing,
    statusTimer,
  });
  const labelStatus = textoStatus({
    status: status ?? PeladaStatus.CREATED,
    temPartida: !!playing,
    statusTimer,
    dataExecucao: startedAt,
  });
  const tituloHero = peladaTipo?.nome ?? nome ?? "Pelada";

  const reportarErro = (e: unknown) =>
    setErro(e instanceof Error ? e.message : String(e));

  const onFinalizar = async () => {
    const ok = await confirmAcao({
      titulo: "Finalizar esta execução",
      mensagem:
        "Encerra a execução atual e a arquiva no histórico. Não dá pra reabrir.",
      textoConfirmar: "Finalizar",
      destrutivo: true,
    });
    if (!ok) return;
    finalizarExecucao().catch(reportarErro);
  };

  const onLimpar = async () => {
    const ok = await confirmAcao({
      titulo: "Limpar jogadores e times",
      mensagem:
        "Remove todos os jogadores e times desta execução. O histórico de partidas e as regras são preservados.",
      textoConfirmar: "Limpar",
      destrutivo: true,
    });
    if (!ok) return;
    limparJogadoresETimes().catch(reportarErro);
  };

  const onVoltarGestao = () => {
    voltarParaGestao().catch(reportarErro);
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
              numberOfLines={2}
            >
              {tituloHero}
            </Text>
            <Text
              style={[styles.heroEstado, { color: palette.onSurfaceVariant }]}
            >
              {labelStatus}
            </Text>
            {peladaAvulsa ? (
              <View
                style={[
                  styles.avulsaBadge,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.outline,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avulsaBadgeText,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  AVULSA
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.heroActions}>
            {__DEV__ ? (
              <Pressable
                onPress={() => router.push("/dev")}
                accessibilityRole="button"
                accessibilityLabel="Abrir dev tools"
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: palette.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.devEmoji}>🛠</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.push("/regras")}
              accessibilityRole="button"
              accessibilityLabel="Editar regras da execução"
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

      {playing ? (
        <Card variant="surface" padding="md">
          <MiniPlacar
            partida={playing}
            restSeconds={restSeconds}
            statusTimer={statusTimer}
            onPress={() => router.push("/partida")}
          />
        </Card>
      ) : null}

      {/* CTA escondido quando o mini-placar já é a porta para /partida. */}
      {cta && !playing ? (
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
          accessibilityLabel={`${totalJogadores} jogadores. Toque para abrir lista.`}
        />
        <StatCard
          icon="shield-account"
          value={totalTimesVisivel}
          label={totalTimesVisivel === 1 ? "time" : "times"}
          onPress={() => router.push("/times")}
          accessibilityLabel={`${totalTimesVisivel} times no total. Toque para abrir lista.`}
        />
      </View>

      {proximos.length > 0 ? (
        <ProximosStrip
          proximos={proximos}
          onPress={() => router.push("/times")}
        />
      ) : null}

      {ultimaPartida ? <UltimaPartidaCard partida={ultimaPartida} /> : null}

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: palette.onSurfaceVariant }]}
        >
          Gerenciar
        </Text>

        <SecondaryButton
          label="Voltar para minhas peladas"
          icon="arrow-left"
          onPress={onVoltarGestao}
          fullWidth
        />

        {peladaAvulsa && !peladaFinalizada ? (
          <SecondaryButton
            label="Salvar como pelada cadastrada"
            icon="content-save-outline"
            onPress={() => router.push("/salvar-como-pelada")}
            fullWidth
          />
        ) : null}

        {!peladaFinalizada ? (
          <SecondaryButton
            label="Finalizar esta execução"
            icon="flag-checkered"
            onPress={onFinalizar}
            destructive
            fullWidth
          />
        ) : null}

        {!peladaFinalizada ? (
          <SecondaryButton
            label="Limpar jogadores e times"
            icon="account-off-outline"
            onPress={onLimpar}
            destructive
            fullWidth
          />
        ) : null}
      </View>

      {erro ? <ErrorBanner mensagem={erro} /> : null}

      {saving ? (
        <View style={styles.savingRow}>
          <ActivityIndicator size="small" color={palette.onSurfaceVariant} />
          <Text
            style={[styles.savingText, { color: palette.onSurfaceVariant }]}
          >
            salvando…
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ====================================================================
// Componentes compartilhados
// ====================================================================

function StatCard({
  icon,
  value,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
      <Text style={[styles.statValue, { color: palette.onSurface }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MiniPlacar({
  partida,
  restSeconds,
  statusTimer,
  onPress,
}: {
  partida: Match;
  restSeconds?: number;
  statusTimer?: TimerStatus;
  onPress: () => void;
}) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const cronometro =
    restSeconds === undefined ? "--:--" : formatSeconds(restSeconds);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir partida em andamento"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={styles.miniPlacarHeader}>
        <Text
          style={[styles.miniPlacarTitle, { color: palette.onSurfaceVariant }]}
        >
          Partida em andamento
        </Text>
        <Text style={[styles.miniPlacarTimer, { color: palette.onSurface }]}>
          {cronometro}
          {statusTimer === TimerStatus.PAUSED ? "  ⏸" : ""}
          {statusTimer === TimerStatus.INTERVAL ? "  ⏲" : ""}
        </Text>
      </View>
      <View style={styles.miniPlacarRow}>
        <Text
          style={[styles.miniPlacarTeam, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {nomeTime(partida, "A")}
        </Text>
        <Text style={[styles.miniPlacarScore, { color: palette.onSurface }]}>
          {placar.teamA} × {placar.teamB}
        </Text>
        <Text
          style={[
            styles.miniPlacarTeam,
            { color: palette.onSurface, textAlign: "right" },
          ]}
          numberOfLines={1}
        >
          {nomeTime(partida, "B")}
        </Text>
      </View>
    </Pressable>
  );
}

function UltimaPartidaCard({ partida }: { partida: Match }) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const resultadoLabel =
    partida.result === ResultMatch.DRAW
      ? "Empate"
      : partida.winner
        ? `Vitória: ${nomeTimeDireto(partida.winner.players.map((p) => p.name))}`
        : "Finalizada";
  return (
    <Card variant="outlined" padding="md">
      <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
        Última partida
      </Text>
      <View style={[styles.miniPlacarRow, { marginTop: Spacing.xs }]}>
        <Text
          style={[styles.miniPlacarTeam, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {nomeTime(partida, "A")}
        </Text>
        <Text style={[styles.miniPlacarScore, { color: palette.onSurface }]}>
          {placar.teamA} × {placar.teamB}
        </Text>
        <Text
          style={[
            styles.miniPlacarTeam,
            { color: palette.onSurface, textAlign: "right" },
          ]}
          numberOfLines={1}
        >
          {nomeTime(partida, "B")}
        </Text>
      </View>
      <Text style={[styles.miniPlacarSub, { color: palette.onSurfaceVariant }]}>
        {resultadoLabel}
      </Text>
    </Card>
  );
}

function ProximosStrip({
  proximos,
  onPress,
}: {
  proximos: { id: string; jogadores: string[] }[];
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ver fila de times que vão entrar"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card variant="outlined" padding="md">
        <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
          Próximos a entrar
        </Text>
        <View style={styles.proximosRow}>
          {proximos.map((time, idx) => (
            <View
              key={time.id}
              style={[
                styles.proximoChip,
                {
                  backgroundColor: palette.surfaceVariant,
                  borderColor: palette.outlineVariant,
                },
              ]}
            >
              <Text style={[styles.proximoChipPos, { color: palette.primary }]}>
                {idx + 1}º
              </Text>
              <Text
                style={[styles.proximoChipText, { color: palette.onSurface }]}
                numberOfLines={2}
              >
                {time.jogadores.join(" · ") || "—"}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

function ErrorBanner({ mensagem }: { mensagem: string }) {
  const palette = usePalette();
  return (
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
        {mensagem}
      </Text>
    </View>
  );
}

// ====================================================================
// Helpers
// ====================================================================

type CtaConfig = {
  label: string;
  href: string;
  icon: Parameters<typeof PrimaryButton>[0]["icon"];
};

function decidirCta(params: {
  status: PeladaStatus;
  totalJogadores: number;
  timesNaFila: number;
  playersPerTeam: number;
  temPartida: boolean;
  statusTimer?: TimerStatus;
}): CtaConfig | null {
  if (params.status === PeladaStatus.FINALIZADA) return null;
  if (params.temPartida) return ctaPartida(params.statusTimer);
  if (params.totalJogadores === 0)
    return {
      label: "Adicionar jogadores",
      href: "/jogadores",
      icon: "account-plus",
    };
  if (params.totalJogadores < 2 * params.playersPerTeam)
    return {
      label: "Adicionar mais jogadores",
      href: "/jogadores",
      icon: "account-plus",
    };
  if (params.timesNaFila === 0)
    return { label: "Montar times", href: "/times", icon: "shuffle-variant" };
  return { label: "Iniciar partida", href: "/partida", icon: "whistle" };
}

function ctaPartida(statusTimer?: TimerStatus): CtaConfig {
  switch (statusTimer) {
    case TimerStatus.PAUSED:
      return {
        label: "Retomar partida",
        href: "/partida",
        icon: "play-circle-outline",
      };
    case TimerStatus.INTERVAL:
      return {
        label: "Próximo tempo",
        href: "/partida",
        icon: "fast-forward",
      };
    case TimerStatus.ENDED:
      return {
        label: "Encerrar partida",
        href: "/partida",
        icon: "flag-checkered",
      };
    case TimerStatus.STARTED:
      return {
        label: "Voltar à partida",
        href: "/partida",
        icon: "play-circle-outline",
      };
    default:
      return {
        label: "Iniciar tempo",
        href: "/partida",
        icon: "play-circle-outline",
      };
  }
}

function textoStatus(params: {
  status: PeladaStatus;
  temPartida: boolean;
  statusTimer?: TimerStatus;
  dataExecucao?: number;
}): string {
  const dataLabel = formatarDataCurta(params.dataExecucao);
  const sufixo = dataLabel ? ` · ${dataLabel}` : "";
  if (params.status === PeladaStatus.FINALIZADA)
    return `Execução finalizada${sufixo}`;
  if (params.status === PeladaStatus.CREATED) return "Execução criada";
  if (params.temPartida) {
    if (params.statusTimer === TimerStatus.STARTED)
      return `Partida em andamento${sufixo}`;
    if (params.statusTimer === TimerStatus.PAUSED)
      return `Partida pausada${sufixo}`;
    if (params.statusTimer === TimerStatus.INTERVAL)
      return `Intervalo${sufixo}`;
    if (params.statusTimer === TimerStatus.ENDED)
      return `Partida encerrada${sufixo}`;
    return `Partida pronta${sufixo}`;
  }
  return `Execução ativa${sufixo}`;
}

function formatarDataCurta(ts?: number): string | null {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return null;
  }
}

function timeMatchToLabel(timeMatch: string): string {
  const [h, m] = timeMatch.split(":").map((s) => parseInt(s, 10));
  if (!Number.isNaN(h) && h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}min`;
}

function formatSeconds(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function nomeTime(partida: Match, lado: "A" | "B"): string {
  const time = lado === "A" ? partida.teamA : partida.teamB;
  return nomeTimeDireto(time.players.map((p) => p.name));
}

function nomeTimeDireto(jogadores: string[]): string {
  if (jogadores.length === 0) return "—";
  if (jogadores.length <= 2) return jogadores.join(" / ");
  return `${jogadores[0]} +${jogadores.length - 1}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ----- Modo gestão -----
  gestaoHeader: { paddingHorizontal: Spacing.lg, gap: Spacing.xs },
  gestaoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gestaoTitle: { ...Typography.display, fontSize: 32 },
  gestaoSubtitle: { ...Typography.body },
  devButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  devButtonText: { ...Typography.label, fontSize: 11 },
  devEmoji: { fontSize: 18 },
  heroActions: { flexDirection: "row", gap: Spacing.xs },
  gestaoActions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  gestaoSection: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  gestaoList: { padding: Spacing.lg, gap: Spacing.sm },
  tipoNome: { ...Typography.title },
  tipoRegras: { ...Typography.label, marginTop: 2 },

  // ----- Modo execução -----
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroTitleBlock: { flex: 1 },
  heroTitle: { ...Typography.display, fontSize: 28 },
  heroEstado: { ...Typography.label, marginTop: 2 },
  avulsaBadge: {
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  avulsaBadgeText: { ...Typography.label, fontSize: 10, letterSpacing: 0.5 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  statsRow: { flexDirection: "row", gap: Spacing.md },
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
  statLabel: { ...Typography.label },
  section: { gap: Spacing.md, marginTop: Spacing.md },
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
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  savingText: { ...Typography.label },
  miniPlacarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  miniPlacarTitle: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniPlacarTimer: {
    ...Typography.title,
    fontVariant: ["tabular-nums"],
  },
  miniPlacarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  miniPlacarTeam: {
    ...Typography.body,
    fontWeight: "600",
    flex: 1,
  },
  miniPlacarScore: {
    ...Typography.headline,
    fontSize: 22,
    fontVariant: ["tabular-nums"],
    minWidth: 60,
    textAlign: "center",
  },
  miniPlacarSub: {
    ...Typography.label,
    marginTop: Spacing.xs,
  },
  proximosRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  proximoChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: 2,
    minHeight: 56,
    borderCurve: "continuous",
  },
  proximoChipPos: {
    ...Typography.label,
    fontWeight: "700",
  },
  proximoChipText: {
    ...Typography.body,
    fontSize: 12,
  },
});
