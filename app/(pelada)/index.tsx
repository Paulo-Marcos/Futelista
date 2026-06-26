import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
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
import { PeladaStatus } from "@/src/domain/GestorJogo";
import { Pelada } from "@/src/domain/Pelada";
import { ResumoPeladaTipo } from "@/src/domain/ports/RepositorioPelada";
import { TimerStatus } from "@/src/domain/Timer";
import { usePrefs } from "@/src/shared/prefs/prefsContext";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { TopSnackbar } from "@/src/shared/ui/TopSnackbar";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { Wordmark } from "@/src/shared/ui/Wordmark";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { AvulsaCard } from "@/src/shared/ui/home/AvulsaCard";
import { ErrorBanner } from "@/src/shared/ui/home/ErrorBanner";
import { PeladaTipoCard } from "@/src/shared/ui/home/PeladaTipoCard";
import { ProximosStrip } from "@/src/shared/ui/home/ProximosStrip";
import { StatCard } from "@/src/shared/ui/home/StatCard";
import { UltimosJogos } from "@/src/shared/ui/home/UltimosJogos";
import { Hero } from "@/src/shared/ui/home/hero/Hero";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Home dual-mode:
 *  - Sem execução ativa → Gestão (seleção de pelada, design selection-first).
 *  - Com execução ativa → Dashboard interno da pelada (hero matchup,
 *    placar ao vivo se houver, stats, próximos, gerenciar).
 */
export default function HomeScreen() {
  const { gestor } = useSoccer();
  const { prefs, hydrating } = usePrefs();
  // Gate de onboarding (F-16): na PRIMEIRA abertura, manda pro tour
  // antes de mostrar a Home. Só age em modo Gestão (sem execução
  // ativa) e depois da hidratação — assim sessões em andamento não
  // perdem o lugar nem disparam loop antes do storage responder.
  if (!hydrating && !prefs.onboardingFeito && !gestor) {
    return <Redirect href="/onboarding" />;
  }
  return gestor ? <ExecucaoHome /> : <GestaoHome />;
}

// ====================================================================
// MODO GESTÃO (sem execução ativa) — seleção-primeiro
// ====================================================================

function GestaoHome() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listarPeladas, iniciarExecucaoAvulsa } = useSoccer();

  const [peladas, setPeladas] = useState<ResumoPeladaTipo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [acao, setAcao] = useState<"iniciando-avulsa" | null>(null);

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
        {/* Wordmark agora é o entry point das configurações globais. */}
        <Pressable
          onPress={() => router.push("/configuracoes")}
          accessibilityRole="button"
          accessibilityLabel="Abrir configurações"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Wordmark size={22} />
        </Pressable>
        <View style={styles.gestaoHeaderRight}>
          <Pressable
            onPress={() => router.push("/configuracoes")}
            accessibilityRole="button"
            accessibilityLabel="Configurações"
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtnGhost,
              {
                backgroundColor: palette.surfaceContainerHigh,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={18}
              color={palette.onSurface}
            />
          </Pressable>
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
      </View>

      <FlatList
        data={peladas ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.gestaoList}
        ListHeaderComponent={
          <View style={styles.gestaoTopBlock}>
            <Text style={[styles.gestaoTitle, { color: palette.onSurface }]}>
              Minhas peladas
            </Text>
            <Text
              style={[
                styles.gestaoSubtitle,
                { color: palette.onSurfaceVariant },
              ]}
            >
              Escolha uma pelada para entrar ou comece uma avulsa.
            </Text>

            <AvulsaCard
              onPress={onAvulsa}
              loading={acao === "iniciando-avulsa"}
            />

            <Pressable
              onPress={() => router.push("/pelada-nova")}
              accessibilityRole="button"
              accessibilityLabel="Criar nova pelada"
              style={({ pressed }) => [
                styles.dashedCta,
                {
                  borderColor: palette.primary,
                  backgroundColor: palette.primary + "14",
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={18}
                color={palette.primary}
              />
              <Text style={[styles.dashedCtaText, { color: palette.primary }]}>
                Criar nova pelada
              </Text>
            </Pressable>

            {peladas === null ? (
              <View style={styles.spinnerBlock}>
                <ActivityIndicator size="large" color={palette.primary} />
              </View>
            ) : peladas.length > 0 ? (
              <View style={styles.sectionRow}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  Peladas cadastradas
                </Text>
                <View
                  style={[
                    styles.count,
                    { backgroundColor: palette.surfaceContainerHigh },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: palette.onSurfaceVariant },
                    ]}
                  >
                    {peladas.length}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          peladas === null ? null : (
            <EmptyState
              icon="soccer"
              illustration="campo"
              title="Nenhuma pelada cadastrada"
              description="Cadastre uma pelada (ex.: Fute CEF) para reusar nome e regras."
            />
          )
        }
        renderItem={({ item, index }) => (
          <PeladaTipoCard
            resumo={item}
            recente={index === 0}
            onAbrir={() =>
              router.push({
                pathname: "/peladas/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListFooterComponent={
          peladas && peladas.length > 0 ? (
            <View style={styles.gestaoFooter}>
              <MaterialCommunityIcons
                name="soccer"
                size={13}
                color={palette.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.gestaoFooterText,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                {peladas.length} {peladas.length === 1 ? "pelada" : "peladas"} ·
                organize sua resenha
              </Text>
            </View>
          ) : null
        }
      />

      {erro ? (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <ErrorBanner mensagem={erro} />
        </View>
      ) : null}
    </View>
  );
}

// ====================================================================
// MODO EXECUÇÃO (com gestor ativo) — home da pelada
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
  const playing = useGameSlice((g) => g.playing);
  const statusTimer = useGameSlice((g) => g.timer?.status);
  const restSeconds = useGameSlice((g) => g.timer?.restTime);
  const proximos =
    useGameSlice((g) =>
      g.next.slice(0, 3).map((t) => ({
        id: t.id,
        jogadores: t.players.map((p) => ({ id: p.id, name: p.name })),
      })),
    ) ?? [];
  const timesEmCampo = useGameSlice((g) => ({
    a: g.next[0]?.id,
    b: g.next[1]?.id,
    nomeA: g.next[0]?.nomeCustom,
    nomeB: g.next[1]?.nomeCustom,
    corA: g.next[0]?.corCustom,
    corB: g.next[1]?.corCustom,
  })) ?? {
    a: undefined,
    b: undefined,
    nomeA: undefined,
    nomeB: undefined,
    corA: undefined,
    corB: undefined,
  };
  const ultimasPartidas =
    useGameSlice((g) => g.matches.slice(-3).reverse()) ?? [];

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

  /**
   * M-20: menu de gerenciamento aberto pelo cog do header. Plugando
   * os 4 handlers que existiam mas estavam órfãos (onFinalizar,
   * onLimpar, voltarParaGestao, salvar-como-pelada) + atalho para
   * /regras (que era o destino direto antes).
   */
  type AcaoGestao =
    | "regras"
    | "voltar"
    | "salvar-como"
    | "limpar"
    | "finalizar"
    | "cancelar";
  const abrirMenuGestao = async () => {
    const escolha = await escolherOpcao<AcaoGestao>({
      titulo: "Gerenciar pelada",
      mensagem: "O que você quer fazer?",
      opcoes: [
        { label: "Regras desta pelada", valor: "regras" },
        { label: "Voltar para gestão", valor: "voltar" },
        { label: "Salvar como pelada", valor: "salvar-como" },
        {
          label: "Limpar jogadores e times",
          valor: "limpar",
          estilo: "destructive",
        },
        {
          label: "Finalizar execução",
          valor: "finalizar",
          estilo: "destructive",
        },
        { label: "Cancelar", valor: "cancelar", estilo: "cancel" },
      ],
    });
    if (!escolha || escolha === "cancelar") return;
    if (escolha === "regras") router.push("/regras");
    else if (escolha === "voltar") onVoltarGestao();
    else if (escolha === "salvar-como") router.push("/salvar-como-pelada");
    else if (escolha === "limpar") onLimpar();
    else if (escolha === "finalizar") onFinalizar();
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header persistente (back + nome/local + cog) — handoff Pelada.html */}
      <View style={styles.phead}>
        <Pressable
          onPress={() => voltarParaGestao().catch(reportarErro)}
          accessibilityRole="button"
          accessibilityLabel="Voltar para minhas peladas"
          style={({ pressed }) => [
            styles.pheadIconBtn,
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

        <View style={styles.pheadTitle}>
          <View style={styles.pheadNameRow}>
            <Text
              style={[styles.pheadName, { color: palette.onSurface }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {tituloHero}
            </Text>
            {peladaAvulsa ? (
              <View
                style={[
                  styles.pheadAvulsaTag,
                  { borderColor: palette.outline },
                ]}
              >
                <Text
                  style={[
                    styles.pheadAvulsaText,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  AVULSA
                </Text>
              </View>
            ) : null}
          </View>
          {peladaTipo?.local ? (
            <View style={styles.pheadLocalRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={13}
                color={palette.onSurfaceVariant}
              />
              <Text
                style={[styles.pheadLocal, { color: palette.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {peladaTipo.local}
              </Text>
            </View>
          ) : null}
        </View>

        {__DEV__ ? (
          <Pressable
            onPress={() => router.push("/dev")}
            accessibilityRole="button"
            accessibilityLabel="Abrir dev tools"
            style={({ pressed }) => [
              styles.pheadIconBtn,
              {
                backgroundColor: palette.surfaceContainerHigh,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.devEmoji}>🛠</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={abrirMenuGestao}
          accessibilityRole="button"
          accessibilityLabel="Gerenciar pelada"
          accessibilityHint="Abre menu com regras, voltar para gestão, salvar como pelada, limpar e finalizar"
          style={({ pressed }) => [
            styles.pheadIconBtn,
            {
              backgroundColor: palette.surfaceContainerHigh,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={20}
            color={palette.onSurface}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.sm, paddingBottom: insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Hero
          labelStatus={labelStatus}
          live={!!playing && statusTimer === TimerStatus.STARTED}
          totalJogadores={totalJogadores}
          totalTimes={totalTimesVisivel}
          timeAId={timesEmCampo.a}
          timeBId={timesEmCampo.b}
          timeANome={timesEmCampo.nomeA}
          timeBNome={timesEmCampo.nomeB}
          timeACor={timesEmCampo.corA}
          timeBCor={timesEmCampo.corB}
          showMatchup={!playing && timesNaFila >= 2}
          cta={!playing && cta ? cta : null}
          onCta={() => (cta ? router.push(cta.href as never) : undefined)}
          partida={playing ?? null}
          restSeconds={restSeconds}
          statusTimer={statusTimer}
          onAbrirPartida={() => router.push("/partida")}
        />

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
          <StatCard
            icon="clock-outline"
            value={timesNaFila}
            label="na fila"
            // M-02: rola a tela /times até a section "Fila" automaticamente.
            // Sem param o usuário caía no topo (Próxima partida) e tinha que
            // rolar pra ver a fila — confunde a expectativa do "na fila".
            onPress={() =>
              router.push({
                pathname: "/times",
                params: { scrollTo: "fila" },
              })
            }
            accessibilityLabel={`${timesNaFila} times na fila. Toque para abrir lista.`}
          />
        </View>

        {proximos.length > 0 ? (
          <ProximosStrip
            proximos={proximos}
            onPress={() => router.push("/times")}
          />
        ) : null}

        {ultimasPartidas.length > 0 ? (
          <UltimosJogos partidas={ultimasPartidas} />
        ) : null}

        {/* Bloco "Gerenciar" (Voltar/Salvar/Finalizar/Limpar) foi removido para
          alinhar com o design Pelada.html. Os handlers (onVoltarGestao,
          onFinalizar, onLimpar, salvar-como-pelada) seguem definidos para
          serem religados a um menu de configurações futuro (cog do header). */}

        {erro ? <ErrorBanner mensagem={erro} /> : null}
      </ScrollView>

      {/* M-19: indicador "salvando…" como snackbar no topo seguro —
          mais visível que o row inline no rodapé do Hero, que era
          fácil de perder durante o scroll. */}
      <TopSnackbar visible={saving} mensagem="salvando…" comSpinner />
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

// ====================================================================
// Estilos
// ====================================================================

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },

  // ----- Modo gestão -----
  gestaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  gestaoHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconBtnGhost: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  devButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  devButtonText: { ...Typography.label, fontSize: 11 },
  devEmoji: { fontSize: 18 },
  gestaoList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  gestaoTopBlock: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gestaoTitle: {
    ...Typography.display,
    fontSize: 32,
    letterSpacing: -0.8,
    marginBottom: -8,
  },
  gestaoSubtitle: { ...Typography.body, fontSize: 13 },
  gestaoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  gestaoFooterText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0,
    textTransform: "none",
  },
  spinnerBlock: { paddingVertical: Spacing.xl, alignItems: "center" },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    flex: 1,
  },
  count: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    minWidth: 28,
    alignItems: "center",
  },
  countText: { ...Typography.label },

  dashedCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingHorizontal: Spacing.lg,
    borderCurve: "continuous",
  },
  dashedCtaText: { ...Typography.title, fontSize: 15, fontWeight: "800" },

  // ----- Modo execução -----
  // Header persistente (back + nome/local + dev/cog) — handoff Pelada.html
  phead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  pheadIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pheadTitle: { flex: 1, minWidth: 0 },
  // M-09: row do nome com `flex: 1, minWidth: 0` permite o `pheadName`
  // encolher de fato quando o nome é longo, em vez de empurrar o tag
  // AVULSA ou os botões de cog/dev pra fora.
  pheadNameRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  // M-09: `flex: 1` (em vez de `flexShrink: 1`) força o nome a ocupar
  // o espaço restante na row e truncar com ellipsis em vez de espremer
  // o tag AVULSA. `ellipsizeMode="tail"` é explícito (mesmo sendo default)
  // para deixar a intenção clara no JSX.
  pheadName: {
    flex: 1,
    fontWeight: "800",
    fontSize: 22,
    letterSpacing: -0.2,
  },
  pheadAvulsaTag: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pheadAvulsaText: { fontWeight: "800", fontSize: 9, letterSpacing: 1 },
  pheadLocalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  pheadLocal: { fontSize: 12, flexShrink: 1 },

  statsRow: { flexDirection: "row", gap: Spacing.md },
});
