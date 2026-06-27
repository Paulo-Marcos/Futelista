import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { usePrefs } from "@/src/shared/prefs/prefsContext";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Goal } from "@/src/domain/Goal";
import { Player } from "@/src/domain/Player";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { gerarFormacao } from "@/src/shared/ui/formacao";
import { MatchTimeline } from "@/src/shared/ui/MatchTimeline";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { confirmAcao } from "@/src/shared/ui/confirmAcao";
import { BenchRail } from "@/src/shared/ui/partida/BenchRail";
import { CenterDisc } from "@/src/shared/ui/partida/CenterDisc";
import { ChangeAuthorSheet } from "@/src/shared/ui/partida/ChangeAuthorSheet";
import { CheckpointToast } from "@/src/shared/ui/partida/CheckpointToast";
import { CtrlButton } from "@/src/shared/ui/partida/CtrlButton";
import { FieldBackdrop } from "@/src/shared/ui/partida/FieldBackdrop";
import { GoalCelebration } from "@/src/shared/ui/partida/GoalCelebration";
import { GolActionSheet } from "@/src/shared/ui/partida/GolActionSheet";
import { MatchScoreboard } from "@/src/shared/ui/partida/MatchScoreboard";
import { PlayerDot } from "@/src/shared/ui/partida/PlayerDot";
import { ScorerSheet } from "@/src/shared/ui/partida/ScorerSheet";
import {
  ParTroca,
  SubstitutionSheet,
} from "@/src/shared/ui/partida/SubstitutionSheet";
import { SubstitutionToast } from "@/src/shared/ui/partida/SubstitutionToast";
import { minutoDoGol } from "@/src/shared/ui/partida/helpers";

// Constantes de módulo para fallbacks de array vazio — referência estável
// entre renders (evita criar `[]` novo a cada tick do cronômetro, o que
// re-renderizaria consumidores memoizados sem mudança real).
const SEM_RESERVAS: Player[] = [];
const SEM_GOLS: Goal[] = [];

/**
 * Partida — a estrela do app.
 *
 * Layout (de cima para baixo):
 *  1. Placar broadcast (status + crests + sides + score).
 *  2. Campo: dots em formação 1-2-2 por metade, bancos laterais, disco
 *     central (START → cronômetro).
 *  3. Controles: pausar/continuar · trocas · encerrar.
 *  4. Sheets: scorer picker, substituições, celebração.
 *
 * Marcar gol = 1 toque no dot do jogador (UX de excelência).
 */
export default function PartidaScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  return <PartidaInner gestor={gestor} />;
}

function PartidaInner({ gestor }: { gestor: GestorJogo }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { prefs } = usePrefs();

  const playing = useGameSliceRequired((g) => g.playing);
  const partidaResult = useGameSliceRequired((g) => g.playing?.result);
  const status = useGameSliceRequired((g) => g.timer?.status);
  const restTime = useGameSliceRequired((g) => g.timer?.restTime ?? 0);
  const totalDuration = useGameSliceRequired((g) => g.rules.getDurationMatch());
  // `countGoals()` recria `{ teamA, teamB }` a cada chamada (logo a cada tick).
  // Lemos os números crus (primitivos, estáveis no tick) e remontamos o objeto
  // via useMemo, dando referência estável quando o placar não mudou.
  const goalsA = useGameSliceRequired(
    (g) => g.playing?.countGoals().teamA ?? 0,
  );
  const goalsB = useGameSliceRequired(
    (g) => g.playing?.countGoals().teamB ?? 0,
  );
  const goals = useMemo(
    () => ({ teamA: goalsA, teamB: goalsB }),
    [goalsA, goalsB],
  );
  // `g.playing?.goals` é a referência viva do domínio (estável entre ticks),
  // mas o fallback `?? []` cria array novo a cada render. Derivamos uma chave
  // estável (qtd + ids) e só renovamos o array quando o conteúdo muda de fato.
  const goalEventsRaw = useGameSliceRequired<Goal[]>(
    (g) => g.playing?.goals ?? SEM_GOLS,
  );
  const goalEventsKey = goalEventsRaw.map((g) => g.player.id).join("|");
  const goalEvents = useMemo(
    () => goalEventsRaw,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goalEventsKey],
  );
  const goalLimit = useGameSliceRequired((g) => g.rules.goalLimit);
  const proximoTime = useGameSliceRequired((g) => g.next[0]);

  const [erro, setErro] = useState<string | null>(null);
  const [scorerSide, setScorerSide] = useState<"A" | "B" | null>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [celebration, setCelebration] = useState<{
    player: Player;
    side: "A" | "B";
    scoreA: number;
    scoreB: number;
  } | null>(null);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [subToast, setSubToast] = useState<{
    inP: Player;
    outP: Player;
    side: "A" | "B";
    /** Trocas adicionais aplicadas junto (modo multi). 0 ou ausente = troca única. */
    extras?: number;
  } | null>(null);
  const [checkpointToast, setCheckpointToast] = useState<string | null>(null);
  // Edição arbitrária de gol via long-press na timeline (F-11).
  // Quando definido: abre o sheet de ações do gol.
  // `golEditarAutor`: subsheet com lista de jogadores do mesmo time.
  const [golEmAcao, setGolEmAcao] = useState<Goal | null>(null);
  const [golEditarAutor, setGolEditarAutor] = useState<Goal | null>(null);
  // Tracking de checkpoints (F-08). Um disparo por partida, reseta quando o
  // `playing` (id da Match) muda. Ref em vez de state pra evitar re-render
  // a cada decremento do cronômetro.
  const checkpointRef = useRef<{
    matchId: string | null;
    doisMin: boolean;
    trintaSeg: boolean;
  }>({ matchId: null, doisMin: false, trintaSeg: false });

  // Fallback estável: `?? []` criaria array novo a cada render (cada tick),
  // re-renderizando BenchRail/SubstitutionSheet sem mudança real.
  const reservas = proximoTime?.players ?? SEM_RESERVAS;

  const safeAction = useCallback((fn: () => void) => {
    try {
      fn();
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // Handlers passados aos 3 consumidores memoizados (MatchTimeline / BenchRail
  // / SubstitutionSheet). Estabilizados com useCallback ANTES do early-return
  // abaixo (rules-of-hooks) para que o React.memo desses filhos realmente
  // segure num tick puro do cronômetro — props inline renovariam a cada render.
  const onUndoGol = useCallback(
    () => safeAction(() => gestor.desfazerUltimoGol()),
    [safeAction, gestor],
  );
  const onLongPressGol = useCallback((g: Goal) => setGolEmAcao(g), []);
  const onAbrirTrocas = useCallback(() => setSubOpen(true), []);
  const onFecharTrocas = useCallback(() => setSubOpen(false), []);
  const onSubstituir = useCallback(
    (side: "A" | "B", outPlayer: Player) => {
      safeAction(() => {
        if (!proximoTime || proximoTime.players.length === 0) {
          throw Error("Não há jogador no próximo time para entrar.");
        }
        const inPlayer = proximoTime.players[0];
        gestor.trocarJogadorPelaEsquerda(inPlayer, outPlayer);
        setSubToast({ inP: inPlayer, outP: outPlayer, side });
        // M-06: feedback visual da troca — destaca o jogador que acabou de
        // entrar com o mesmo pulse usado em gol (`spotlight`). É limpo
        // pelo useEffect do subToast logo abaixo.
        setSpotlight(inPlayer.id);
        setSubOpen(false);
      });
    },
    [safeAction, proximoTime, gestor],
  );
  const onSubstituirMultiplos = useCallback(
    (pares: ParTroca[]) => {
      if (pares.length === 0) return;
      safeAction(() => {
        for (const par of pares) {
          gestor.trocarJogadorPelaEsquerda(par.inP, par.outP);
        }
        const ultimo = pares[pares.length - 1];
        setSubToast({
          inP: ultimo.inP,
          outP: ultimo.outP,
          side: ultimo.side,
          extras: pares.length - 1,
        });
        // M-06: pulsa o último jogador entrante (o que aparece no toast).
        setSpotlight(ultimo.inP.id);
        setSubOpen(false);
      });
    },
    [safeAction, gestor],
  );

  const registrarGol = useCallback(
    (side: "A" | "B", player: Player) => {
      if (status === TimerStatus.ENDED) return;
      safeAction(() => {
        const team =
          side === "A"
            ? (playing as NonNullable<typeof playing>).teamA
            : (playing as NonNullable<typeof playing>).teamB;
        gestor.marcarGol(team, player);
        const afterA = (goals?.teamA ?? 0) + (side === "A" ? 1 : 0);
        const afterB = (goals?.teamB ?? 0) + (side === "B" ? 1 : 0);
        setCelebration({ player, side, scoreA: afterA, scoreB: afterB });
        setSpotlight(player.id);
      });
    },
    [status, safeAction, playing, goals, gestor],
  );

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => setCelebration(null), 1600);
    const s = setTimeout(() => setSpotlight(null), 1900);
    return () => {
      clearTimeout(t);
      clearTimeout(s);
    };
  }, [celebration]);

  useEffect(() => {
    if (!subToast) return;
    const t = setTimeout(() => setSubToast(null), 2400);
    // M-06: limpa o pulse do jogador entrante um pouco antes do toast
    // sumir, pra os dois fades coincidirem.
    const s = setTimeout(() => setSpotlight(null), 2200);
    return () => {
      clearTimeout(t);
      clearTimeout(s);
    };
  }, [subToast]);

  // Apito do fim do tempo (F-07). Dispara na transição para ENDED e
  // **só** quando a preferência está ligada. Erros do nativo são
  // silenciosos — o jogo não pode travar porque o sistema operacional
  // bloqueou vibração / device sem motor.
  useEffect(() => {
    if (!prefs.apitoHaptico) return;
    if (status !== TimerStatus.ENDED) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    // Padrão de vibração curto-curto-longo (~apito de árbitro).
    try {
      Vibration.vibrate([0, 120, 80, 120, 80, 280]);
    } catch {
      // Ignorado — web e alguns devices não têm motor.
    }
  }, [status, prefs.apitoHaptico]);

  // Encerramento automático por gol-limite (F-12) — quando o domínio
  // resolve `playing.result` sozinho (sem o usuário tocar Encerrar),
  // redireciona pra tela de resultado. Replace evita voltar pra
  // partida "encerrada" no histórico de navegação.
  useEffect(() => {
    if (partidaResult !== undefined) {
      router.replace("/resultado");
    }
  }, [partidaResult, router]);

  // Checkpoints do cronômetro (F-08) — dispara 1× por partida em 2min e 30s
  // restantes. Resetamos os flags quando muda o `playing.id` (nova partida)
  // pra que a próxima Match comece "limpa".
  useEffect(() => {
    const matchId = playing?.id ?? null;
    if (checkpointRef.current.matchId !== matchId) {
      checkpointRef.current = {
        matchId,
        doisMin: false,
        trintaSeg: false,
      };
    }
    // Só interessa enquanto a partida está rodando — pausa/intervalo/ENDED
    // não devem avançar checkpoints (o ENDED tem seu próprio apito).
    if (status !== TimerStatus.STARTED) return;

    if (!checkpointRef.current.doisMin && restTime > 0 && restTime <= 120) {
      checkpointRef.current.doisMin = true;
      dispararCheckpoint("Faltam 2 minutos");
    }
    if (!checkpointRef.current.trintaSeg && restTime > 0 && restTime <= 30) {
      checkpointRef.current.trintaSeg = true;
      dispararCheckpoint("Faltam 30 segundos");
    }

    function dispararCheckpoint(texto: string) {
      setCheckpointToast(texto);
      if (!prefs.apitoHaptico) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [restTime, status, playing?.id, prefs.apitoHaptico]);

  useEffect(() => {
    if (!checkpointToast) return;
    const t = setTimeout(() => setCheckpointToast(null), 2400);
    return () => clearTimeout(t);
  }, [checkpointToast]);

  // Formação adaptativa por time: coordenadas conforme a quantidade de
  // jogadores em campo (evita sobreposição quando playersPerTeam > 5).
  // Calculado ANTES do early-return abaixo para respeitar as regras de hooks.
  const formacaoA = useMemo(
    () => gerarFormacao(playing?.teamA.players.length ?? 0),
    [playing?.teamA.players.length],
  );
  const formacaoB = useMemo(
    () => gerarFormacao(playing?.teamB.players.length ?? 0),
    [playing?.teamB.players.length],
  );
  // Time B joga na metade de baixo: espelhamos o Y da formação. Pré-computado
  // (em vez de criar `{ x, y: 1 - pos.y }` dentro do .map) para que a prop
  // `pos` de cada PlayerDot seja referência estável entre renders — senão o
  // React.memo do dot do time B nunca segura (paridade com o time A).
  const formacaoBMirror = useMemo(
    () => formacaoB.map((p) => ({ x: p.x, y: 1 - p.y })),
    [formacaoB],
  );

  if (!playing) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: palette.background,
            paddingTop: insets.top + Spacing.lg,
          },
        ]}
      >
        <EmptyState
          icon="whistle"
          title="Nenhuma partida em andamento"
          description="Volte para a tab Times e toque em Iniciar partida."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const teamA = playing.teamA;
  const teamB = playing.teamB;
  const ready =
    status === undefined ||
    status === TimerStatus.CREATED ||
    status === TimerStatus.ENDED;
  const running = status === TimerStatus.STARTED;
  const paused = status === TimerStatus.PAUSED;
  const interval = status === TimerStatus.INTERVAL;

  const onKickoff = () => safeAction(() => gestor.start());
  const onToggle = () => {
    if (paused) safeAction(() => gestor.continue());
    else if (running) safeAction(() => gestor.pause());
    else if (interval) safeAction(() => gestor.start());
    else safeAction(() => gestor.start());
  };

  const onEncerrar = () =>
    safeAction(() => {
      gestor.setResult();
      router.replace("/resultado");
    });

  /**
   * Remove um gol arbitrário escolhido pelo long-press na timeline (F-11).
   * Pede confirmação destrutiva — o usuário acabou de tocar e segurar,
   * não vamos remover por toque acidental.
   */
  const onRemoverGol = async (gol: Goal) => {
    setGolEmAcao(null);
    const ok = await confirmAcao({
      titulo: "Remover este gol",
      mensagem: `Apaga o gol de ${gol.player.name} aos ${minutoDoGol(gol)} min. Não dá pra desfazer.`,
      textoConfirmar: "Remover",
      destrutivo: true,
    });
    if (!ok) return;
    safeAction(() => gestor.removerGol(gol));
  };

  /**
   * Aplica a troca de autor de um gol — segundo sheet aberto a partir do
   * sheet de ações. Resolve direto, sem confirmAcao (a ação não é
   * destrutiva e o usuário acabou de tocar no novo autor).
   */
  const onTrocarAutor = (gol: Goal, novoAutor: Player) => {
    setGolEditarAutor(null);
    safeAction(() => gestor.corrigirAutorDoGol(gol, novoAutor));
  };

  // Botão de controle de fluxo (Pausar/Continuar/Próximo) — design `Partida.tsx`:
  // todos os controles têm o mesmo peso visual; o INICIAR vive no disco central.
  const fluxoCtrl: {
    label: string;
    icon: "pause" | "play" | "skip-next";
  } | null = (() => {
    if (paused) return { label: "Continuar", icon: "play" };
    if (interval) return { label: "Próximo tempo", icon: "skip-next" };
    if (running) return { label: "Pausar", icon: "pause" };
    return null;
  })();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <MatchScoreboard
        teamA={teamA}
        teamB={teamB}
        scoreA={goals?.teamA ?? 0}
        scoreB={goals?.teamB ?? 0}
        status={status}
        goalLimit={goalLimit}
        totalDuration={totalDuration}
        onOpenPicker={(side) => setScorerSide(side)}
      />

      <View style={styles.field}>
        <FieldBackdrop />

        <BenchRail
          side="left"
          reserves={reservas}
          posicaoNaFila={proximoTime ? 3 : null}
          onOpen={onAbrirTrocas}
        />

        <View style={styles.halfTop}>
          {teamA.players.map((p, i) => {
            const pos = formacaoA[i] ?? formacaoA[formacaoA.length - 1];
            return (
              <PlayerDot
                key={p.id}
                player={p}
                tone="A"
                pos={pos}
                active={running}
                spot={spotlight === p.id}
                side="A"
                onScore={registrarGol}
              />
            );
          })}
        </View>

        <View style={styles.halfBottom}>
          {teamB.players.map((p, i) => {
            const pos =
              formacaoBMirror[i] ?? formacaoBMirror[formacaoBMirror.length - 1];
            return (
              <PlayerDot
                key={p.id}
                player={p}
                tone="B"
                pos={pos}
                active={running}
                spot={spotlight === p.id}
                side="B"
                onScore={registrarGol}
              />
            );
          })}
        </View>

        <CenterDisc
          ready={ready}
          running={running}
          paused={paused}
          remaining={restTime}
          total={totalDuration}
          onKick={onKickoff}
          onToggle={onToggle}
        />

        {ready ? (
          <View style={styles.kickHint}>
            <MaterialCommunityIcons
              name="whistle"
              size={14}
              color={palette.onSurfaceVariant}
            />
            <Text
              style={[styles.kickHintText, { color: palette.onSurfaceVariant }]}
            >
              Toque no centro para apitar
            </Text>
          </View>
        ) : null}
      </View>

      <MatchTimeline
        goals={goalEvents}
        teamA={teamA}
        teamB={teamB}
        onUndo={onUndoGol}
        onLongPressGol={onLongPressGol}
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
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
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

      <View
        style={[
          styles.controls,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: palette.background,
            borderTopColor: palette.outlineVariant,
          },
        ]}
      >
        {fluxoCtrl ? (
          <CtrlButton
            label={fluxoCtrl.label}
            icon={fluxoCtrl.icon}
            variant="secondary"
            onPress={onToggle}
          />
        ) : null}
        <CtrlButton
          label="Trocas"
          icon="account-switch"
          variant="ghost"
          onPress={() => setSubOpen(true)}
        />
        {/* "Encerrar" só faz sentido depois que a partida começou — antes do
            apito inicial (ready) o jogo nem rola, então o botão fica oculto. */}
        {!ready ? (
          <CtrlButton
            label="Encerrar"
            icon="flag-checkered"
            variant="danger"
            onPress={onEncerrar}
          />
        ) : null}
      </View>

      <ScorerSheet
        side={scorerSide}
        teamA={teamA}
        teamB={teamB}
        onClose={() => setScorerSide(null)}
        onPick={(side, player) => {
          setScorerSide(null);
          registrarGol(side, player);
        }}
      />

      <SubstitutionSheet
        open={subOpen}
        teamA={teamA}
        teamB={teamB}
        reservas={reservas}
        onClose={onFecharTrocas}
        onSub={onSubstituir}
        onSubMultiplos={onSubstituirMultiplos}
      />

      {celebration ? (
        <GoalCelebration cel={celebration} teamA={teamA} teamB={teamB} />
      ) : null}
      {subToast ? (
        <SubstitutionToast t={subToast} teamA={teamA} teamB={teamB} />
      ) : null}
      {checkpointToast ? (
        <CheckpointToast texto={checkpointToast} topOffset={insets.top} />
      ) : null}

      <GolActionSheet
        gol={golEmAcao}
        onClose={() => setGolEmAcao(null)}
        onCorrigirAutor={(g) => {
          setGolEmAcao(null);
          setGolEditarAutor(g);
        }}
        onRemover={onRemoverGol}
      />
      <ChangeAuthorSheet
        gol={golEditarAutor}
        onClose={() => setGolEditarAutor(null)}
        onEscolher={onTrocarAutor}
      />
    </View>
  );
}

// ====================================================================
// Styles (apenas o que PartidaInner usa diretamente)
// ====================================================================

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // ----- Field -----
  // Container do campo — quinas a 90° (sem borderRadius). O contorno SVG já
  // marca o limite do gramado; arredondar o container "cropava" cantos das
  // listras e destoava da diagramação do design (caixa retangular cheia).
  field: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  halfTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "50%",
  },
  halfBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },

  kickHint: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  kickHintText: { ...Typography.label, fontSize: 11 },

  // ----- Controls -----
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: { ...Typography.label, flex: 1 },
});
