import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { PeladaStatus } from "@/src/domain/GestorJogo";
import { Match, ResultMatch } from "@/src/domain/Match";
import { Pelada } from "@/src/domain/Pelada";
import { ResumoPeladaTipo } from "@/src/domain/ports/RepositorioPelada";
import { TimerStatus } from "@/src/domain/Timer";
import { usePrefs } from "@/src/shared/prefs/prefsContext";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { TopSnackbar } from "@/src/shared/ui/TopSnackbar";
import { LivePulseDot } from "@/src/shared/ui/LivePulseDot";
import { PitchLines } from "@/src/shared/ui/PitchLines";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { RuleChip } from "@/src/shared/ui/RuleChip";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Wordmark } from "@/src/shared/ui/Wordmark";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
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
              <Text style={[styles.devButtonText, { color: palette.onSurface }]}>
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

function AvulsaCard({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading: boolean;
}) {
  const palette = usePalette();
  // RN Web não traduz shadowColor pra box-shadow vermelho; injetamos o CSS
  // diretamente. RadialGradient SVG do AvulsaGlow também fica subdimensionado
  // no web — o boxShadow é quem garante o glow visível no navegador.
  // Reproduz o box-shadow do protótipo HTML (`extra.css` / `.fl-avulsa`):
  // `0 14px 36px -12px var(--glow)` onde --glow = palette.glow.
  const webGlow =
    Platform.OS === "web"
      ? ({ boxShadow: `0 14px 36px -12px ${palette.glow}` } as object)
      : null;
  return (
    <View style={styles.avulsaShell}>
      <AvulsaGlow color={palette.primary} />
      <Pressable
        onPress={onPress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Iniciar pelada avulsa"
        style={({ pressed }) => [
          styles.avulsaCard,
          {
            backgroundColor: palette.primary,
            shadowColor: palette.glow,
            opacity: pressed ? 0.92 : 1,
          },
          webGlow,
        ]}
      >
        <Svg
          style={StyleSheet.absoluteFillObject}
          width="100%"
          height="100%"
          aria-hidden
        >
          <Defs>
            <LinearGradient id="avulsaBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={palette.primary} stopOpacity="1" />
              <Stop
                offset="0.65"
                stopColor={palette.primaryDim}
                stopOpacity="1"
              />
              <Stop offset="1" stopColor={palette.primaryDim} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#avulsaBg)" />
        </Svg>
        <AvulsaPitch />
        <View style={styles.avulsaContent}>
          <View
            style={[styles.avulsaIcon, { backgroundColor: "rgba(0,0,0,0.22)" }]}
          >
            <MaterialCommunityIcons
              name="whistle"
              size={26}
              color={palette.onPrimary}
            />
          </View>
          <View style={styles.avulsaText}>
            <Text style={[styles.avulsaTitle, { color: palette.onPrimary }]}>
              Pelada avulsa
            </Text>
            <Text
              style={[
                styles.avulsaSub,
                { color: palette.onPrimary, opacity: 0.85 },
              ]}
            >
              Comece a jogar agora, sem cadastro
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={palette.onPrimary} />
          ) : (
            <MaterialCommunityIcons
              name="play"
              size={22}
              color={palette.onPrimary}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Glow avermelhado por baixo do AvulsaCard.
 *
 * RN não suporta `filter:blur`, então simulamos o blur empilhando dois
 * RadialGradients (núcleo + halo) — mesmo padrão do `Splash.tsx`.
 * O `preserveAspectRatio="none"` estica o gradiente circular pra acompanhar
 * o formato horizontal do card. Opacidades fortalecidas para o glow render
 * com clareza em iOS/Android (no web, complemento com boxShadow CSS).
 */
function AvulsaGlow({ color }: { color: string }) {
  return (
    <View style={styles.avulsaGlow} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Defs>
          <RadialGradient id="avulsaGlowCore" cx="50" cy="55" r="45">
            <Stop offset="0" stopColor={color} stopOpacity={0.55} />
            <Stop offset="0.3" stopColor={color} stopOpacity={0.32} />
            <Stop offset="0.6" stopColor={color} stopOpacity={0.12} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="avulsaGlowHalo" cx="50" cy="55" r="50">
            <Stop offset="0" stopColor={color} stopOpacity={0.22} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.08} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#avulsaGlowHalo)" />
        <Rect width="100" height="100" fill="url(#avulsaGlowCore)" />
      </Svg>
    </View>
  );
}

/**
 * Linhas de campo sobre o gradiente vermelho do AvulsaCard.
 * Inline (não usa PitchLines compartilhado) porque o `fieldLine` tokenizado
 * é tuned pra gramado verde escuro e some sobre o vermelho. ViewBox achatado
 * acompanha o aspect ratio do card sem cropar tudo via `slice`.
 */
function AvulsaPitch() {
  const stroke = "rgba(255,255,255,0.18)";
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 300 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect
          x={6}
          y={6}
          width={288}
          height={88}
          rx={4}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
        <Line
          x1={150}
          y1={6}
          x2={150}
          y2={94}
          stroke={stroke}
          strokeWidth={2}
        />
        <Circle
          cx={150}
          cy={50}
          r={22}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
        <Circle cx={150} cy={50} r={2.5} fill={stroke} />
        <Rect
          x={6}
          y={26}
          width={38}
          height={48}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
        <Rect
          x={256}
          y={26}
          width={38}
          height={48}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}

function PeladaTipoCard({
  resumo,
  recente,
  onAbrir,
}: {
  resumo: ResumoPeladaTipo;
  recente: boolean;
  onAbrir: () => void;
}) {
  const palette = usePalette();
  const agenda = formatAgenda(resumo.dia, resumo.hora);
  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      accessibilityLabel={`Abrir pelada ${resumo.nome}`}
      style={({ pressed }) => [
        styles.peladaCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.crestBox,
          { backgroundColor: palette.surfaceContainerHigh },
        ]}
      >
        <TeamCrest seed={resumo.id} size={36} />
      </View>
      <View style={styles.peladaBody}>
        <View style={styles.peladaTopRow}>
          <Text
            style={[styles.peladaName, { color: palette.onSurface }]}
            numberOfLines={1}
          >
            {resumo.nome}
          </Text>
          {recente ? (
            <View
              style={[
                styles.recenteTag,
                { backgroundColor: palette.goal + "29" },
              ]}
            >
              <Text style={[styles.recenteTagText, { color: palette.goal }]}>
                RECENTE
              </Text>
            </View>
          ) : null}
        </View>
        {agenda || resumo.local ? (
          <View style={styles.peladaMetaRow}>
            {agenda ? (
              <View style={styles.peladaMetaItem}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={12}
                  color={palette.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.peladaMetaText,
                    { color: palette.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {agenda}
                </Text>
              </View>
            ) : null}
            {resumo.local ? (
              <View style={styles.peladaMetaItem}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={12}
                  color={palette.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.peladaMetaText,
                    { color: palette.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {resumo.local}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.peladaRulesRow}>
          <MaterialCommunityIcons
            name="account-multiple-outline"
            size={12}
            color={palette.onSurface}
          />
          <Text style={[styles.peladaRuleText, { color: palette.onSurface }]}>
            {resumo.regras.playersPerTeam}×{resumo.regras.playersPerTeam}
          </Text>
          <Text
            style={[styles.peladaRuleSep, { color: palette.onSurfaceVariant }]}
          >
            ·
          </Text>
          <MaterialCommunityIcons
            name="timer-outline"
            size={12}
            color={palette.onSurface}
          />
          <Text style={[styles.peladaRuleText, { color: palette.onSurface }]}>
            {timeMatchToLabel(resumo.regras.timeMatch)}
          </Text>
          <Text
            style={[styles.peladaRuleSep, { color: palette.onSurfaceVariant }]}
          >
            ·
          </Text>
          <MaterialCommunityIcons
            name="history"
            size={12}
            color={palette.onSurface}
          />
          <Text style={[styles.peladaRuleText, { color: palette.onSurface }]}>
            {resumo.totalExecucoes}{" "}
            {resumo.totalExecucoes === 1 ? "jogo" : "jogos"}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={palette.onSurfaceVariant}
      />
    </Pressable>
  );
}

function formatAgenda(dia?: string, hora?: string): string {
  if (dia && hora) return `${dia} · ${hora}`;
  return dia ?? hora ?? "";
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
// Hero — versão compacta do design Pelada.html: PRÓXIMA PARTIDA + matchup
// + status line ("12 jogadores · 3 times") + CTA com glow vermelho.
// Header com nome/local/cog foi extraído para fora (phead persistente).
// ====================================================================

function Hero({
  labelStatus,
  live,
  totalJogadores,
  totalTimes,
  timeAId,
  timeBId,
  timeANome,
  timeBNome,
  timeACor,
  timeBCor,
  showMatchup,
  cta,
  onCta,
  partida,
  restSeconds,
  statusTimer,
  onAbrirPartida,
}: {
  labelStatus: string;
  live: boolean;
  totalJogadores: number;
  totalTimes: number;
  timeAId?: string;
  timeBId?: string;
  /** Nome custom do Time A (F-18). Cai em "Time 1" quando undefined. */
  timeANome?: string;
  /** Nome custom do Time B (F-18). Cai em "Time 2" quando undefined. */
  timeBNome?: string;
  /** Cor custom (hex) do Time A para o escudo. Opcional. */
  timeACor?: string;
  /** Cor custom (hex) do Time B para o escudo. Opcional. */
  timeBCor?: string;
  showMatchup: boolean;
  cta: {
    label: string;
    icon: Parameters<typeof PrimaryButton>[0]["icon"];
  } | null;
  onCta: () => void;
  // Quando há partida em andamento, o Hero PELADA ATIVA absorve o AO VIVO:
  // o placar mini, o cronômetro e o CTA "Abrir partida" passam a ser o
  // conteúdo principal do card (o container separado abaixo foi removido).
  partida: Match | null;
  restSeconds?: number;
  statusTimer?: TimerStatus;
  onAbrirPartida: () => void;
}) {
  const palette = usePalette();
  // Glow vermelho — receita do handoff README_PeladaHome.md §1:
  //   iOS: shadowColor=primary opaco + offset/opacity/radius no wrapper
  //   Android: HeroGlowHalo (View vermelha por baixo)
  //   Web: boxShadow CSS direto
  const webHeroGlow =
    Platform.OS === "web"
      ? ({ boxShadow: `0 14px 38px -14px ${palette.glow}` } as object)
      : null;
  const statusLine = showMatchup
    ? `${totalJogadores} ${totalJogadores === 1 ? "jogador" : "jogadores"} · ${totalTimes} ${totalTimes === 1 ? "time" : "times"}`
    : labelStatus;
  // Quando há partida em andamento, o hero mostra o placar AO VIVO no lugar
  // do matchup e do CTA "Iniciar partida".
  const placar = partida ? partida.countGoals() : null;
  const cronometro =
    restSeconds === undefined ? "--:--" : formatSeconds(restSeconds);
  const statusPartidaLabel =
    statusTimer === TimerStatus.STARTED
      ? "AO VIVO"
      : statusTimer === TimerStatus.PAUSED
        ? "PAUSADO"
        : statusTimer === TimerStatus.INTERVAL
          ? "INTERVALO"
          : statusTimer === TimerStatus.ENDED
            ? "FIM"
            : "EM ANDAMENTO";
  return (
    <View
      style={[styles.heroShadow, { shadowColor: palette.primary }, webHeroGlow]}
    >
      <HeroGlowHalo color={palette.primary} />
      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.surface,
            borderColor: palette.primary + "55",
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFillObject}
          aria-hidden
        >
          <Defs>
            <LinearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={palette.primary} stopOpacity="0.35" />
              <Stop offset="0.55" stopColor={palette.surface} stopOpacity="1" />
              <Stop offset="1" stopColor={palette.surface} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#hg)" />
        </Svg>
        <PitchLines opacity={0.16} />

        <Text style={[styles.heroLabel, { color: palette.onSurfaceVariant }]}>
          {showMatchup ? "PRÓXIMA PARTIDA" : "PELADA ATIVA"}
        </Text>

        {partida && placar ? (
          <>
            <View style={styles.heroLiveRow}>
              <View style={styles.heroLiveStatus}>
                <LivePulseDot
                  size={8}
                  color={live ? palette.goal : palette.warning}
                  live={live}
                />
                <Text
                  style={[
                    styles.heroLiveLabel,
                    { color: live ? palette.goal : palette.onSurfaceVariant },
                  ]}
                >
                  {statusPartidaLabel}
                </Text>
              </View>
              <Text
                style={[styles.heroLiveTimer, { color: palette.onSurface }]}
              >
                {cronometro}
              </Text>
            </View>
            <View style={styles.heroPlacarRow}>
              <TeamCrest
                seed={partida.teamA.id}
                size={26}
                corOverride={partida.teamA.corCustom}
              />
              <Text
                style={[styles.heroPlacarTeam, { color: palette.onSurface }]}
                numberOfLines={1}
              >
                {nomeDoTime(partida.teamA, 0)}
              </Text>
              <Text
                style={[styles.heroPlacarScore, { color: palette.onSurface }]}
              >
                {placar.teamA} × {placar.teamB}
              </Text>
              <Text
                style={[
                  styles.heroPlacarTeam,
                  { color: palette.onSurface, textAlign: "right" },
                ]}
                numberOfLines={1}
              >
                {nomeDoTime(partida.teamB, 1)}
              </Text>
              <TeamCrest
                seed={partida.teamB.id}
                size={26}
                corOverride={partida.teamB.corCustom}
              />
            </View>
            <View style={styles.heroCtaWrap}>
              <HeroPrimaryCTA
                label="Abrir partida"
                icon="play-circle-outline"
                onPress={onAbrirPartida}
                palette={palette}
              />
            </View>
          </>
        ) : (
          <>
            {showMatchup && timeAId && timeBId ? (
              <View style={styles.matchup}>
                <TeamCrest seed={timeAId} size={30} corOverride={timeACor} />
                <Text
                  style={[styles.matchupTeam, { color: palette.onSurface }]}
                  numberOfLines={1}
                >
                  {timeANome ?? "Time 1"}
                </Text>
                <Text
                  style={[
                    styles.matchupVs,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  vs
                </Text>
                <Text
                  style={[
                    styles.matchupTeam,
                    { color: palette.onSurface, textAlign: "right" },
                  ]}
                  numberOfLines={1}
                >
                  {timeBNome ?? "Time 2"}
                </Text>
                <TeamCrest seed={timeBId} size={30} corOverride={timeBCor} />
              </View>
            ) : null}

            <View style={styles.heroStatusRow}>
              <LivePulseDot
                size={7}
                color={live ? palette.goal : palette.goal}
                live={live}
              />
              <Text
                style={[styles.heroStatus, { color: palette.onSurfaceVariant }]}
              >
                {statusLine}
              </Text>
            </View>

            {cta ? (
              <View style={styles.heroCtaWrap}>
                <HeroPrimaryCTA
                  label={cta.label}
                  icon={cta.icon}
                  onPress={onCta}
                  palette={palette}
                />
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

// Halo vermelho atrás do hero — vazamento colorido que o elevation Android
// não dá. Dimensões do handoff (left/right 12, top 16, bottom -6).
// Web NÃO renderiza: lá o boxShadow CSS já faz o blur de verdade; uma View
// vermelha com bottom:-6 vira um retângulo hard-edged saindo do card.
function HeroGlowHalo({ color }: { color: string }) {
  if (Platform.OS === "web") return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.heroGlowHalo, { backgroundColor: color }]}
    />
  );
}

// CTA "Iniciar partida" com glow vermelho. Mesma receita do hero (shadowColor
// + halo + boxShadow web), em escala menor.
function HeroPrimaryCTA({
  label,
  icon,
  onPress,
  palette,
}: {
  label: string;
  icon: Parameters<typeof PrimaryButton>[0]["icon"];
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
}) {
  const webCtaGlow =
    Platform.OS === "web"
      ? ({ boxShadow: `0 12px 34px -10px ${palette.glow}` } as object)
      : null;
  return (
    <View
      style={[
        styles.heroCtaShadow,
        { shadowColor: palette.primary },
        webCtaGlow,
      ]}
    >
      {Platform.OS !== "web" ? (
        <View
          pointerEvents="none"
          style={[styles.heroCtaHalo, { backgroundColor: palette.primary }]}
        />
      ) : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.heroCta,
          { backgroundColor: palette.primary },
          pressed && styles.heroCtaPressed,
        ]}
        android_ripple={{ color: palette.onPrimary + "22" }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={palette.onPrimary}
        />
        <Text style={[styles.heroCtaText, { color: palette.onPrimary }]}>
          {label}
        </Text>
      </Pressable>
    </View>
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
      <View style={[styles.statIcoGlow, { shadowColor: palette.primary }]}>
        <MaterialCommunityIcons name={icon} size={28} color={palette.primary} />
      </View>
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
  const live = statusTimer === TimerStatus.STARTED;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir partida em andamento"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={styles.miniPlacarHeader}>
        <View style={styles.miniPlacarStatus}>
          <View
            style={[
              styles.miniLiveDot,
              { backgroundColor: live ? palette.goal : palette.warning },
            ]}
          />
          <Text
            style={[
              styles.miniPlacarTitle,
              { color: palette.onSurfaceVariant },
            ]}
          >
            {live ? "AO VIVO" : "EM ANDAMENTO"}
          </Text>
        </View>
        <Text style={[styles.miniPlacarTimer, { color: palette.onSurface }]}>
          {cronometro}
          {statusTimer === TimerStatus.PAUSED ? "  ⏸" : ""}
          {statusTimer === TimerStatus.INTERVAL ? "  ⏲" : ""}
        </Text>
      </View>
      <View style={styles.miniPlacarRow}>
        <TeamCrest seed={partida.teamA.id} size={26} />
        <Text
          style={[styles.miniPlacarTeam, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          Time 1
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
          Time 2
        </Text>
        <TeamCrest seed={partida.teamB.id} size={26} />
      </View>
    </Pressable>
  );
}

function UltimosJogos({ partidas }: { partidas: Match[] }) {
  const palette = usePalette();
  const router = useRouter();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
          Últimos jogos
        </Text>
        <Pressable
          onPress={() => router.push("/historico" as never)}
          accessibilityRole="button"
          accessibilityLabel="Ver todos os jogos"
          style={({ pressed }) => [
            styles.linkRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.linkText, { color: palette.primary }]}>
            ver tudo
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={14}
            color={palette.primary}
          />
        </Pressable>
      </View>
      <View style={styles.recentList}>
        {partidas.map((p) => (
          <RecentRow key={p.id} partida={p} />
        ))}
      </View>
    </View>
  );
}

function RecentRow({ partida }: { partida: Match }) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const win =
    partida.result === ResultMatch.DRAW
      ? null
      : placar.teamA > placar.teamB
        ? "A"
        : "B";
  return (
    <View
      style={[
        styles.recent,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <View style={styles.recentTeams}>
        <View style={styles.recentTeamRow}>
          <TeamCrest seed={partida.teamA.id} size={18} />
          <Text
            style={[
              styles.recentTeam,
              {
                color:
                  win === "A" ? palette.onSurface : palette.onSurfaceVariant,
                fontWeight: win === "A" ? "800" : "600",
              },
            ]}
            numberOfLines={1}
          >
            Time 1
          </Text>
          {win === "A" ? (
            <MaterialCommunityIcons
              name="trophy"
              size={11}
              color={palette.tertiary}
            />
          ) : null}
        </View>
        <View style={styles.recentTeamRow}>
          <TeamCrest seed={partida.teamB.id} size={18} />
          <Text
            style={[
              styles.recentTeam,
              {
                color:
                  win === "B" ? palette.onSurface : palette.onSurfaceVariant,
                fontWeight: win === "B" ? "800" : "600",
              },
            ]}
            numberOfLines={1}
          >
            Time 2
          </Text>
          {win === "B" ? (
            <MaterialCommunityIcons
              name="trophy"
              size={11}
              color={palette.tertiary}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.recentScores}>
        <Text
          style={[
            styles.recentScore,
            {
              color: win === "A" ? palette.onSurface : palette.onSurfaceVariant,
            },
          ]}
        >
          {placar.teamA}
        </Text>
        <Text
          style={[
            styles.recentScore,
            {
              color: win === "B" ? palette.onSurface : palette.onSurfaceVariant,
            },
          ]}
        >
          {placar.teamB}
        </Text>
      </View>
    </View>
  );
}

function UltimaPartidaCard({ partida }: { partida: Match }) {
  const palette = usePalette();
  const placar = partida.countGoals();
  const winnerName =
    partida.result === ResultMatch.DRAW
      ? "Empate"
      : partida.winner
        ? "Time vencedor"
        : "Finalizada";
  return (
    <Card variant="outlined" padding="md">
      <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
        Última partida
      </Text>
      <View style={[styles.miniPlacarRow, { marginTop: Spacing.xs }]}>
        <TeamCrest seed={partida.teamA.id} size={24} />
        <Text
          style={[styles.miniPlacarTeam, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          Time 1
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
          Time 2
        </Text>
        <TeamCrest seed={partida.teamB.id} size={24} />
      </View>
      <Text style={[styles.miniPlacarSub, { color: palette.onSurfaceVariant }]}>
        {winnerName}
      </Text>
    </Card>
  );
}

function ProximosStrip({
  proximos,
  onPress,
}: {
  proximos: { id: string; jogadores: { id: string; name: string }[] }[];
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
        <View style={styles.proximosHead}>
          <Text
            style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}
          >
            Próximos a entrar
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={palette.onSurfaceVariant}
          />
        </View>
        <View style={styles.proximosList}>
          {proximos.map((time, idx) => (
            <View key={time.id} style={styles.proximoItem}>
              <View
                style={[
                  styles.proximoPos,
                  { backgroundColor: palette.surfaceContainerHigh },
                ]}
              >
                <Text
                  style={[styles.proximoPosText, { color: palette.primary }]}
                >
                  {idx + 1}º
                </Text>
              </View>
              <TeamCrest seed={time.id} size={22} />
              <View style={styles.proximoAvs}>
                {time.jogadores.slice(0, 5).map((j) => (
                  <PlayerAvatar key={j.id} player={j} size={22} />
                ))}
              </View>
              <Text
                style={[styles.proximoNames, { color: palette.onSurface }]}
                numberOfLines={1}
              >
                {time.jogadores.map((j) => j.name).join(" · ") || "—"}
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
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
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

  // Glow vai por baixo via SVG (AvulsaGlow) — RN não tem filter:blur, então o
  // padrão do Splash (RadialGradient empilhado) é o que produz a sombra
  // avermelhada cross-platform. O shell não pode clipar (sem overflow:hidden).
  avulsaShell: {
    position: "relative",
  },
  avulsaGlow: {
    position: "absolute",
    left: -16,
    right: -16,
    top: -8,
    bottom: -28,
  },
  avulsaCard: {
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 18,
    // Sombra nativa adicional pro iOS — soma com o glow SVG sem competir.
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
    borderCurve: "continuous",
  },
  avulsaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avulsaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avulsaText: { flex: 1 },
  avulsaTitle: { ...Typography.headline, fontSize: 18, fontWeight: "800" },
  avulsaSub: { ...Typography.body, fontSize: 12.5, marginTop: 2 },

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

  peladaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  crestBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  peladaBody: {
    flex: 1,
    gap: 4,
  },
  peladaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  peladaName: { ...Typography.title, fontSize: 16, fontWeight: "800", flex: 1 },
  peladaMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  peladaMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  peladaMetaText: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  peladaRulesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  peladaRuleText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  peladaRuleSep: {
    fontSize: 11.5,
    fontWeight: "600",
    marginHorizontal: 2,
  },
  recenteTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  recenteTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

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

  // Wrapper de sombra do hero: shadowColor=primary (HEX opaco), sem overflow
  // (senão clipa o halo). Receita do README_PeladaHome §1.
  heroShadow: {
    borderRadius: Radius.xl,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  // Halo vermelho atrás do hero (vaza ~6px por baixo do card)
  heroGlowHalo: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 16,
    bottom: -6,
    borderRadius: Radius.xl,
    opacity: Platform.OS === "android" ? 0.38 : 0.5,
  },
  hero: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderCurve: "continuous",
    gap: Spacing.md,
    // M-03: altura mínima estável evita layout-jump quando o hero alterna
    // entre "PRÓXIMA PARTIDA" (matchup + status + CTA) e "PELADA ATIVA"
    // (placar AO VIVO + cronômetro + CTA). Os dois modos têm conteúdo
    // diferente em tamanho — sem minHeight a Home re-flow os StatCards
    // logo abaixo, gerando o jump.
    minHeight: 220,
  },
  heroCtaWrap: {
    marginTop: Spacing.xs,
  },
  // CTA "Iniciar partida" dentro do hero — glow em escala menor
  heroCtaShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  heroCtaHalo: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 14,
    bottom: -4,
    borderRadius: Radius.md,
    opacity: Platform.OS === "android" ? 0.4 : 0.5,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 54,
    borderRadius: Radius.md,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  heroCtaPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  heroCtaText: { ...Typography.title, fontSize: 16, fontWeight: "800" },
  heroStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  heroLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    marginTop: 2,
  },
  heroTitle: {
    ...Typography.display,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  heroStatus: { ...Typography.label, marginTop: 6 },
  heroActions: { flexDirection: "row", gap: Spacing.xs },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avulsaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  avulsaBadgeText: { ...Typography.label, fontSize: 10, letterSpacing: 0.6 },
  matchup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  matchupTeam: {
    ...Typography.title,
    fontSize: 15,
    flex: 1,
  },
  matchupVs: {
    ...Typography.label,
    textTransform: "uppercase",
  },
  heroChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },

  // Bloco AO VIVO dentro do Hero PELADA ATIVA — absorve o que antes era um
  // <Card> separado (MiniPlacar). Linha de status + cronômetro acima, linha
  // de placar (crest · nome · score · nome · crest) abaixo.
  heroLiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLiveStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroLiveLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 11,
  },
  heroLiveTimer: {
    ...Typography.title,
    fontVariant: ["tabular-nums"],
  },
  heroPlacarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroPlacarTeam: { ...Typography.body, fontWeight: "700", flex: 1 },
  heroPlacarScore: {
    ...Typography.headline,
    fontSize: 22,
    minWidth: 60,
    textAlign: "center",
  },

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
  // Glow sutil no ícone vermelho do StatCard — shadowColor injetado em runtime
  statIcoGlow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  statValue: {
    ...Typography.display,
    fontSize: 32,
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

  miniPlacarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  miniPlacarStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniLiveDot: { width: 8, height: 8, borderRadius: 4 },
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
  miniPlacarTeam: { ...Typography.body, fontWeight: "700", flex: 1 },
  miniPlacarScore: {
    ...Typography.headline,
    fontSize: 22,
    minWidth: 60,
    textAlign: "center",
  },
  miniPlacarSub: {
    ...Typography.label,
    marginTop: Spacing.xs,
  },

  proximosHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  proximosList: { marginTop: Spacing.xs, gap: Spacing.sm },
  proximoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  proximoPos: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  proximoPosText: { ...Typography.label, fontWeight: "800" },
  proximoAvs: { flexDirection: "row", gap: -6 as never },
  proximoNames: {
    flex: 1,
    ...Typography.body,
    fontSize: 12,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  linkText: { ...Typography.label, fontSize: 12.5, fontWeight: "700" },
  recentList: { gap: Spacing.sm },
  recent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  recentTeams: { flex: 1, gap: 4 },
  recentTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recentTeam: { ...Typography.body, fontSize: 13, flex: 1 },
  recentScores: {
    alignItems: "center",
    gap: 4,
  },
  recentScore: {
    ...Typography.title,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
});
