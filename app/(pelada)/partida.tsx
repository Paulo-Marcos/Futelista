import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle as SvgCircle,
  Defs,
  Line as SvgLine,
  Pattern,
  Rect as SvgRect,
} from "react-native-svg";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { usePrefs } from "@/src/shared/prefs/prefsContext";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Goal } from "@/src/domain/Goal";
import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { LivePulseDot } from "@/src/shared/ui/LivePulseDot";
import { MatchTimeline } from "@/src/shared/ui/MatchTimeline";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { confirmAcao } from "@/src/shared/ui/confirmAcao";

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

// Formação 1-2-2 (frações 0..1 dentro da metade do time).
const FORMATION = [
  { x: 0.5, y: 0.18 },
  { x: 0.28, y: 0.45 },
  { x: 0.72, y: 0.45 },
  { x: 0.32, y: 0.78 },
  { x: 0.68, y: 0.78 },
] as const;

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
  const goals = useGameSliceRequired((g) => g.playing?.countGoals());
  const goalEvents = useGameSliceRequired<Goal[]>(
    (g) => g.playing?.goals ?? [],
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

  const reservas = proximoTime?.players ?? [];

  const safeAction = (fn: () => void) => {
    try {
      fn();
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const registrarGol = (side: "A" | "B", player: Player) => {
    if (status === TimerStatus.ENDED) return;
    safeAction(() => {
      const team =
        side === "A" ? (playing as NonNullable<typeof playing>).teamA : (playing as NonNullable<typeof playing>).teamB;
      gestor.addGoal(team, player);
      const afterA = (goals?.teamA ?? 0) + (side === "A" ? 1 : 0);
      const afterB = (goals?.teamB ?? 0) + (side === "B" ? 1 : 0);
      setCelebration({ player, side, scoreA: afterA, scoreB: afterB });
      setSpotlight(player.id);
    });
  };

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
    return () => clearTimeout(t);
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

  const onSubstituir = (side: "A" | "B", outPlayer: Player) => {
    safeAction(() => {
      if (!proximoTime || proximoTime.players.length === 0) {
        throw Error("Não há jogador no próximo time para entrar.");
      }
      const inPlayer = proximoTime.players[0];
      gestor.switchPlayerLeft(inPlayer, outPlayer);
      setSubToast({ inP: inPlayer, outP: outPlayer, side });
      setSubOpen(false);
    });
  };

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

  /**
   * Aplica vários pares de troca em sequência. A última troca aparece no
   * toast, com contador "+N" quando houve mais de uma. Erros do domínio
   * (jogador que já saiu, time cheio) interrompem a sequência — o que
   * já passou fica aplicado.
   */
  const onSubstituirMultiplos = (pares: ParTroca[]) => {
    if (pares.length === 0) return;
    safeAction(() => {
      for (const par of pares) {
        gestor.switchPlayerLeft(par.inP, par.outP);
      }
      const ultimo = pares[pares.length - 1];
      setSubToast({
        inP: ultimo.inP,
        outP: ultimo.outP,
        side: ultimo.side,
        extras: pares.length - 1,
      });
      setSubOpen(false);
    });
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
          onOpen={() => setSubOpen(true)}
        />
        <BenchRail
          side="right"
          reserves={reservas}
          posicaoNaFila={proximoTime ? 3 : null}
          onOpen={() => setSubOpen(true)}
        />

        <View style={styles.halfTop}>
          {teamA.players.map((p, i) => {
            const pos = FORMATION[i] ?? FORMATION[FORMATION.length - 1];
            return (
              <PlayerDot
                key={p.id}
                player={p}
                tone="A"
                pos={pos}
                active={running}
                spot={spotlight === p.id}
                onScore={() => registrarGol("A", p)}
              />
            );
          })}
        </View>

        <View style={styles.halfBottom}>
          {teamB.players.map((p, i) => {
            const pos = FORMATION[i] ?? FORMATION[FORMATION.length - 1];
            const mirrored = { x: pos.x, y: 1 - pos.y };
            return (
              <PlayerDot
                key={p.id}
                player={p}
                tone="B"
                pos={mirrored}
                active={running}
                spot={spotlight === p.id}
                onScore={() => registrarGol("B", p)}
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
              style={[
                styles.kickHintText,
                { color: palette.onSurfaceVariant },
              ]}
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
        onUndo={() => safeAction(() => gestor.undoLastGoal())}
        onLongPressGol={(g) => setGolEmAcao(g)}
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
        <CtrlButton
          label="Encerrar"
          icon="flag-checkered"
          variant="danger"
          onPress={onEncerrar}
        />
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
        onClose={() => setSubOpen(false)}
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
// MatchScoreboard
// ====================================================================

function MatchScoreboard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  status,
  goalLimit,
  totalDuration,
  onOpenPicker,
}: {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  status?: TimerStatus;
  goalLimit: number;
  /** Duração total da partida em segundos (do Rules.getDurationMatch). */
  totalDuration: number;
  onOpenPicker: (side: "A" | "B") => void;
}) {
  const palette = usePalette();
  const live = status === TimerStatus.STARTED;
  const statusLabel =
    status === TimerStatus.STARTED
      ? "AO VIVO"
      : status === TimerStatus.PAUSED
        ? "PAUSADO"
        : status === TimerStatus.ENDED
          ? "FIM"
          : status === TimerStatus.INTERVAL
            ? "INTERVALO"
            : "PRONTO";
  return (
    <View
      style={[
        styles.scoreboard,
        {
          backgroundColor: palette.background,
          borderBottomColor: palette.outlineVariant,
        },
      ]}
    >
      <View style={styles.sbStatusRow}>
        <View style={styles.sbStatus}>
          <LivePulseDot
            color={live ? palette.goal : palette.warning}
            live={live}
            size={8}
          />
          <Text
            style={[
              styles.sbStatusText,
              { color: live ? palette.goal : palette.onSurfaceVariant },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        {/* Badge "M min · até N gols" — qualquer dos dois critérios
            encerra a partida (limite atingido OU cronômetro zerou). */}
        <View
          style={[
            styles.sbCriterioBadge,
            {
              backgroundColor: palette.surfaceContainerHigh,
              borderColor: palette.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="timer-outline"
            size={11}
            color={palette.onSurfaceVariant}
          />
          <Text
            style={[
              styles.sbCriterioText,
              { color: palette.onSurfaceVariant },
            ]}
          >
            {Math.max(1, Math.round(totalDuration / 60))} min
          </Text>
          <Text
            style={[
              styles.sbCriterioSep,
              { color: palette.onSurfaceVariant },
            ]}
          >
            ·
          </Text>
          <MaterialCommunityIcons
            name="bullseye-arrow"
            size={11}
            color={palette.onSurfaceVariant}
          />
          <Text
            style={[
              styles.sbCriterioText,
              { color: palette.onSurfaceVariant },
            ]}
          >
            até {goalLimit} {goalLimit === 1 ? "gol" : "gols"}
          </Text>
        </View>
      </View>

      <View style={styles.sbMain}>
        <Pressable
          onPress={() => onOpenPicker("A")}
          accessibilityRole="button"
          accessibilityLabel="Marcar gol do Time 1"
          style={({ pressed }) => [
            styles.sbSide,
            { opacity: pressed ? 0.75 : 1, alignItems: "center" },
          ]}
        >
          <TeamCrest
            seed={teamA.id}
            size={28}
            corOverride={teamA.corCustom}
          />
          <Text style={[styles.sbTeam, { color: palette.onSurface }]}>
            {nomeDoTime(teamA, 0)}
          </Text>
          <View
            style={[
              styles.sbGolButton,
              { backgroundColor: palette.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="soccer"
              size={11}
              color={palette.onPrimary}
            />
            <Text style={[styles.sbGolText, { color: palette.onPrimary }]}>
              GOL
            </Text>
          </View>
        </Pressable>

        <View style={styles.sbScore}>
          <Text
            style={[
              styles.sbNum,
              {
                color: palette.primary,
                textShadowColor: palette.glow,
                textShadowRadius: 18,
                textShadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            {scoreA}
          </Text>
          <Text style={[styles.sbX, { color: palette.onSurfaceVariant }]}>
            ×
          </Text>
          <Text style={[styles.sbNum, { color: palette.secondary }]}>
            {scoreB}
          </Text>
        </View>

        <Pressable
          onPress={() => onOpenPicker("B")}
          accessibilityRole="button"
          accessibilityLabel="Marcar gol do Time 2"
          style={({ pressed }) => [
            styles.sbSide,
            { opacity: pressed ? 0.75 : 1, alignItems: "center" },
          ]}
        >
          <TeamCrest
            seed={teamB.id}
            size={28}
            corOverride={teamB.corCustom}
          />
          <Text style={[styles.sbTeam, { color: palette.onSurface }]}>
            {nomeDoTime(teamB, 1)}
          </Text>
          <View
            style={[
              styles.sbGolButton,
              { backgroundColor: palette.secondary },
            ]}
          >
            <MaterialCommunityIcons
              name="soccer"
              size={11}
              color={palette.onSecondary}
            />
            <Text style={[styles.sbGolText, { color: palette.onSecondary }]}>
              GOL
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ====================================================================
// Field
// ====================================================================

// FieldBackdrop — réplica 1:1 do `<svg class="fieldbg">` do design Partida.html:
// listras em pattern + contorno + linha do meio + círculo central + grande/pequena
// área (cada lado) + arcos de canto. viewBox 200×360, preserveAspectRatio="none"
// para esticar e ocupar o campo todo (igual ao protótipo).
function FieldBackdrop() {
  const palette = usePalette();
  // Linhas mais nítidas que o palette.fieldLine (alpha 0.10 no dark — muito
  // tímido sobre gramado escuro). Hardcode local para não impactar outros
  // componentes que dependem do token (PitchLines no Hero, AvulsaPitch).
  const LINE = "rgba(255,255,255,0.32)";
  const SW = 2.4;
  return (
    <View style={styles.fieldBg} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 200 360"
        preserveAspectRatio="none"
      >
        <Defs>
          <Pattern
            id="stripes"
            width={200}
            height={40}
            patternUnits="userSpaceOnUse"
          >
            <SvgRect width={200} height={40} fill={palette.fieldA} />
            <SvgRect y={20} width={200} height={20} fill={palette.fieldB} />
          </Pattern>
        </Defs>
        <SvgRect width={200} height={360} fill="url(#stripes)" />

        {/* contorno do campo — quinas a 90° (sem rx) */}
        <SvgRect
          x={8}
          y={8}
          width={184}
          height={344}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        {/* linha do meio */}
        <SvgLine
          x1={8}
          y1={180}
          x2={192}
          y2={180}
          stroke={LINE}
          strokeWidth={SW}
        />
        {/* círculo central */}
        <SvgCircle
          cx={100}
          cy={180}
          r={42}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        {/* grande área superior + pequena área superior */}
        <SvgRect
          x={60}
          y={8}
          width={80}
          height={48}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        <SvgRect
          x={82}
          y={8}
          width={36}
          height={20}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        {/* grande área inferior + pequena área inferior */}
        <SvgRect
          x={60}
          y={304}
          width={80}
          height={48}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
        <SvgRect
          x={82}
          y={332}
          width={36}
          height={20}
          fill="none"
          stroke={LINE}
          strokeWidth={SW}
        />
      </Svg>
    </View>
  );
}

function PlayerDot({
  player,
  tone,
  pos,
  active,
  spot,
  onScore,
}: {
  player: Player;
  tone: "A" | "B";
  pos: { x: number; y: number };
  active: boolean;
  spot: boolean;
  onScore: () => void;
}) {
  const palette = usePalette();
  const goalsCount = player.goals.length;

  // Burst: bola sobe ~14px e some
  const burstY = useRef(new Animated.Value(6)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (!spot) return;
    Animated.parallel([
      Animated.timing(burstOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(burstY, {
        toValue: -14,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(burstScale, {
        toValue: 1.1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(burstOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      burstY.setValue(6);
      burstScale.setValue(0.4);
    });
  }, [spot, burstOpacity, burstY, burstScale]);

  return (
    <Pressable
      onPress={() => active && onScore()}
      disabled={!active}
      accessibilityRole="button"
      accessibilityLabel={`Gol de ${player.name}`}
      // Android: desliga o ripple retangular do default — o destaque persistente
      // do último marcador é o halo verde circular controlado por `spot`.
      android_ripple={null}
      style={({ pressed }) => [
        styles.dot,
        {
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
        },
        pressed && active && { transform: [{ scale: 0.92 }] },
      ]}
    >
      {spot ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -20,
            opacity: burstOpacity,
            transform: [{ translateY: burstY }, { scale: burstScale }],
          }}
        >
          <MaterialCommunityIcons
            name="soccer"
            size={18}
            color={palette.goal}
          />
        </Animated.View>
      ) : null}
      <View
        style={[
          styles.dotAv,
          spot
            ? {
                shadowColor: palette.goal,
                shadowOpacity: 0.9,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
                elevation: 10,
                transform: [{ scale: 1.18 }],
              }
            : null,
        ]}
      >
        <PlayerAvatar player={player} size={42} tone={tone} />
        {goalsCount > 0 ? (
          <View
            style={[
              styles.dotGoal,
              { backgroundColor: palette.goal },
            ]}
          >
            <MaterialCommunityIcons
              name="soccer"
              size={9}
              color={palette.background}
            />
            <Text style={[styles.dotGoalText, { color: palette.background }]}>
              {goalsCount}
            </Text>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.dotNameWrap,
          { backgroundColor: palette.background + "B3" },
        ]}
      >
        <Text
          style={[styles.dotName, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {player.name}
        </Text>
      </View>
    </Pressable>
  );
}

function CenterDisc({
  ready,
  running,
  paused,
  remaining,
  total,
  onKick,
  onToggle,
}: {
  ready: boolean;
  running: boolean;
  paused: boolean;
  remaining: number;
  total: number;
  onKick: () => void;
  onToggle: () => void;
}) {
  const palette = usePalette();
  const R = 50;
  const C = 2 * Math.PI * R;
  const prog = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!ready) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.35,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ready, ringScale, ringOpacity]);

  if (ready) {
    return (
      <View style={styles.centerDiscWrap} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centerDiscPulseRing,
            {
              borderColor: palette.primary,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Pressable
          onPress={onKick}
          accessibilityRole="button"
          accessibilityLabel="Apitar início (centro do campo)"
          style={({ pressed }) => [
            styles.centerDisc,
            {
              backgroundColor: palette.primary,
              shadowColor: palette.glow,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="whistle"
            size={28}
            color={palette.onPrimary}
          />
          <Text style={[styles.centerDiscLabel, { color: palette.onPrimary }]}>
            INICIAR
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={
        paused
          ? "Continuar (centro do campo)"
          : "Pausar (centro do campo)"
      }
      style={({ pressed }) => [
        styles.centerDiscTimer,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <SvgCircle
          cx={60}
          cy={60}
          r={R}
          stroke={palette.surfaceContainerHigh}
          strokeWidth={6}
          fill="none"
        />
        <SvgCircle
          cx={60}
          cy={60}
          r={R}
          stroke={palette.primary}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - prog)}
          transform="rotate(-90 60 60)"
        />
      </Svg>
      <View style={styles.centerDiscContent}>
        <Text style={[styles.centerDiscTime, { color: palette.onSurface }]}>
          {formatSeconds(remaining)}
        </Text>
        <Text
          style={[
            styles.centerDiscSub,
            { color: palette.onSurfaceVariant },
          ]}
        >
          {paused ? "tocar p/ seguir" : running ? "tempo" : "tempo"}
        </Text>
      </View>
    </Pressable>
  );
}

// BenchRail — trilho compacto centralizado verticalmente (top 50% / translateY -50%
// via marginTop = -(altura/2)). Pressable: toque abre o SubstitutionSheet, igual ao
// `<button class="bench">` do design.
function BenchRail({
  side,
  reserves,
  posicaoNaFila,
  onOpen,
}: {
  side: "left" | "right";
  reserves: Player[];
  posicaoNaFila: number | null;
  onOpen: () => void;
}) {
  const palette = usePalette();
  if (!reserves || reserves.length === 0) return null;
  const visiveis = reserves.slice(0, 5);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Banco com ${reserves.length} reservas — abrir trocas`}
      style={({ pressed }) => [
        styles.benchRail,
        side === "left" ? styles.benchRailLeft : styles.benchRailRight,
        {
          backgroundColor: "rgba(16,16,19,0.78)",
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.benchRailHead}>
        <MaterialCommunityIcons
          name="seat-outline"
          size={13}
          color={palette.onSurfaceVariant}
        />
        <View style={styles.benchRailLabelWrap}>
          <Text
            style={[
              styles.benchRailLabel,
              {
                color: palette.onSurfaceVariant,
                transform: [{ rotate: side === "left" ? "-90deg" : "90deg" }],
              },
            ]}
          >
            BANCO{posicaoNaFila ? ` · ${posicaoNaFila}º` : ""}
          </Text>
        </View>
      </View>
      <View style={styles.benchRailAvs}>
        {visiveis.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.benchAv,
              { borderColor: palette.background },
              i > 0 && { marginTop: -5 },
            ]}
          >
            <PlayerAvatar player={p} size={26} />
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ====================================================================
// CtrlButton — barra de controles inferior (Pausar / Trocas / Encerrar).
// Variantes (do design `Partida.tsx`): secondary = sólido suave;
// ghost = só borda; danger = borda vermelha + tinta vermelha.
// ====================================================================

function CtrlButton({
  label,
  icon,
  variant,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  variant: "secondary" | "ghost" | "danger";
  onPress?: () => void;
}) {
  const palette = usePalette();
  // "Encerrar" — destrutivo mas reversível na percepção do usuário (fim de
  // partida ≠ fim de sessão), então usa laranja (warning) em vez do vermelho
  // primary. Mantém o tom de alerta sem confundir com o vermelho do placar.
  const tint = variant === "danger" ? palette.warning : palette.onSurface;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.ctrlBtn,
        variant === "secondary" && {
          backgroundColor: palette.surfaceContainerHigh,
        },
        variant === "ghost" && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: palette.outlineVariant,
        },
        variant === "danger" && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: palette.warning + "66",
        },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={tint} />
      <Text style={[styles.ctrlBtnLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

// ====================================================================
// Sheets
// ====================================================================

function ScorerSheet({
  side,
  teamA,
  teamB,
  onClose,
  onPick,
}: {
  side: "A" | "B" | null;
  teamA: Team;
  teamB: Team;
  onClose: () => void;
  onPick: (side: "A" | "B", player: Player) => void;
}) {
  const palette = usePalette();
  if (!side) return null;
  const players = side === "A" ? teamA.players : teamB.players;
  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetWrap} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.sheetGrab, { backgroundColor: palette.outline }]}
          />
          <View style={styles.sheetHead}>
            <View>
              <Text
                style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
              >
                Quem marcou?
              </Text>
              <Text
                style={[styles.sheetTitle, { color: palette.onSurface }]}
              >
                {side === "A" ? nomeDoTime(teamA, 0) : nomeDoTime(teamB, 1)}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={palette.onSurface}
              />
            </Pressable>
          </View>
          <View style={styles.sheetGrid}>
            {players.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => onPick(side, p)}
                accessibilityRole="button"
                accessibilityLabel={`Marcar gol para ${p.name}`}
                style={({ pressed }) => [
                  styles.scorerCard,
                  {
                    backgroundColor: palette.surfaceContainerHigh,
                    borderColor:
                      side === "A" ? palette.primary : palette.secondary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <PlayerAvatar player={p} size={42} tone={side} />
                <Text
                  style={[styles.scorerName, { color: palette.onSurface }]}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
                {p.goals.length > 0 ? (
                  <View
                    style={[
                      styles.scorerGoals,
                      { backgroundColor: palette.goal + "33" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="soccer"
                      size={10}
                      color={palette.goal}
                    />
                    <Text style={[styles.scorerGoalsText, { color: palette.goal }]}>
                      {p.goals.length}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Par de troca: jogador `outP` (em campo, time `side`) sai pra `inP`
 * entrar. Usado no modo multi-select da `SubstitutionSheet`.
 */
type ParTroca = {
  outP: Player;
  inP: Player;
  side: "A" | "B";
};

function SubstitutionSheet({
  open,
  teamA,
  teamB,
  reservas,
  onClose,
  onSub,
  onSubMultiplos,
}: {
  open: boolean;
  teamA: Team;
  teamB: Team;
  reservas: Player[];
  onClose: () => void;
  onSub: (side: "A" | "B", outPlayer: Player) => void;
  /**
   * Aplica vários pares de troca de uma vez. Quando ausente, o modo
   * multi fica disponível visualmente mas o "Aplicar" cai em pares
   * individuais via `onSub`. Em produção sempre vem preenchido.
   */
  onSubMultiplos?: (pares: ParTroca[]) => void;
}) {
  const palette = usePalette();
  const [selected, setSelected] = useState<{
    side: "A" | "B";
    player: Player;
  } | null>(null);
  const [multi, setMulti] = useState(false);
  const [pares, setPares] = useState<ParTroca[]>([]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setPares([]);
      setMulti(false);
    }
  }, [open]);

  // Tabelas reversas pra checar "já está em algum par?" sem percorrer
  // a lista N vezes.
  const outIds = new Set(pares.map((p) => p.outP.id));
  const inIds = new Set(pares.map((p) => p.inP.id));

  const onPickField = (side: "A" | "B", player: Player) => {
    if (!multi) {
      setSelected({ side, player });
      return;
    }
    if (outIds.has(player.id)) {
      // Cancela o par já criado pra esse jogador.
      setPares((prev) => prev.filter((p) => p.outP.id !== player.id));
      return;
    }
    setSelected({ side, player });
  };

  const onPickBench = (player?: Player) => {
    if (!selected) return;
    if (!multi) {
      onSub(selected.side, selected.player);
      return;
    }
    if (!player) return;
    if (inIds.has(player.id)) {
      // Toque num jogador já pareado: cancela o par dele.
      setPares((prev) => prev.filter((p) => p.inP.id !== player.id));
      return;
    }
    setPares((prev) => [
      ...prev,
      { outP: selected.player, inP: player, side: selected.side },
    ]);
    setSelected(null);
  };

  const aplicarMultiplos = () => {
    if (pares.length === 0) return;
    if (onSubMultiplos) onSubMultiplos(pares);
    else pares.forEach((p) => onSub(p.side, p.outP));
  };

  if (!open) return null;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetWrap} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.sheetGrab, { backgroundColor: palette.outline }]}
          />
          <View style={styles.sheetHead}>
            <View>
              <Text
                style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
              >
                Substituição
              </Text>
              <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
                {multi ? `Trocar vários (${pares.length})` : "Manter o time"}
              </Text>
            </View>
            <View style={styles.sheetHeadActions}>
              <Pressable
                onPress={() => {
                  // Alterna modo; ao sair do multi, descarta pares pendentes.
                  setMulti((v) => {
                    if (v) setPares([]);
                    setSelected(null);
                    return !v;
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  multi
                    ? "Voltar para troca única"
                    : "Selecionar vários jogadores"
                }
                accessibilityState={{ selected: multi }}
                style={({ pressed }) => [
                  styles.multiToggle,
                  {
                    backgroundColor: multi
                      ? palette.primary
                      : palette.surfaceContainerHigh,
                    borderColor: multi ? palette.primary : palette.outline,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="checkbox-multiple-outline"
                  size={14}
                  color={multi ? palette.onPrimary : palette.onSurface}
                />
                <Text
                  style={[
                    styles.multiToggleText,
                    {
                      color: multi ? palette.onPrimary : palette.onSurface,
                    },
                  ]}
                >
                  Vários
                </Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={styles.iconBtn}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={palette.onSurface}
                />
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.subHint,
              {
                backgroundColor: selected
                  ? palette.goal + "22"
                  : palette.surfaceContainerHigh,
                borderColor: selected ? palette.goal : palette.outlineVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-switch"
              size={14}
              color={selected ? palette.goal : palette.onSurfaceVariant}
            />
            <Text style={[styles.subHintText, { color: palette.onSurface }]}>
              {selected
                ? `${selected.player.name} sai — toque em quem entra do banco`
                : multi
                  ? pares.length === 0
                    ? "Selecione pares (em campo → banco). Toque em 'Aplicar' no fim."
                    : `${pares.length} ${pares.length === 1 ? "troca pareada" : "trocas pareadas"} — selecione mais ou toque 'Aplicar'`
                  : "1. Toque em quem sai (em campo)"}
            </Text>
          </View>

          <ScrollView style={{ maxHeight: 380 }}>
            <Text
              style={[
                styles.sheetEyebrow,
                {
                  color: palette.onSurfaceVariant,
                  marginTop: Spacing.sm,
                },
              ]}
            >
              Em campo
            </Text>
            <View style={styles.subColRow}>
              <View style={styles.subCol}>
                <View
                  style={[
                    styles.subTag,
                    { backgroundColor: palette.primary + "22" },
                  ]}
                >
                  <Text style={[styles.subTagText, { color: palette.primary }]}>
                    Time 1
                  </Text>
                </View>
                {teamA.players.map((p) => (
                  <FieldPlayerItem
                    key={p.id}
                    player={p}
                    tone="A"
                    selected={
                      selected?.player.id === p.id || outIds.has(p.id)
                    }
                    onPress={() => onPickField("A", p)}
                  />
                ))}
              </View>
              <View style={styles.subCol}>
                <View
                  style={[
                    styles.subTag,
                    { backgroundColor: palette.secondary + "22" },
                  ]}
                >
                  <Text style={[styles.subTagText, { color: palette.secondary }]}>
                    Time 2
                  </Text>
                </View>
                {teamB.players.map((p) => (
                  <FieldPlayerItem
                    key={p.id}
                    player={p}
                    tone="B"
                    selected={
                      selected?.player.id === p.id || outIds.has(p.id)
                    }
                    onPress={() => onPickField("B", p)}
                  />
                ))}
              </View>
            </View>

            <Text
              style={[
                styles.sheetEyebrow,
                {
                  color: palette.onSurfaceVariant,
                  marginTop: Spacing.md,
                },
              ]}
            >
              Banco {reservas.length ? `(${reservas.length})` : ""}
            </Text>
            {reservas.length === 0 ? (
              <Text
                style={[
                  styles.subEmpty,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                Sem reservas no banco agora.
              </Text>
            ) : (
              <View style={styles.benchList}>
                {reservas.map((p) => {
                  const pareado = inIds.has(p.id);
                  const habilitado = pareado || !!selected;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => onPickBench(p)}
                      disabled={!habilitado}
                      accessibilityRole="button"
                      accessibilityLabel={
                        pareado
                          ? `Cancelar troca de ${p.name}`
                          : `Trocar ${p.name} para entrar`
                      }
                      style={({ pressed }) => [
                        styles.benchItem,
                        {
                          backgroundColor: pareado
                            ? palette.goal + "22"
                            : palette.surfaceContainerHigh,
                          borderColor: pareado
                            ? palette.goal
                            : palette.outlineVariant,
                          opacity: habilitado ? (pressed ? 0.8 : 1) : 0.5,
                        },
                      ]}
                    >
                      <PlayerAvatar player={p} size={32} />
                      <Text
                        style={[
                          styles.benchItemName,
                          { color: palette.onSurface },
                        ]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                      <View style={styles.benchItemRight}>
                        <MaterialCommunityIcons
                          name={pareado ? "check-circle" : "arrow-down"}
                          size={12}
                          color={palette.goal}
                        />
                        <Text
                          style={[
                            styles.benchItemEnter,
                            { color: palette.goal },
                          ]}
                        >
                          {pareado ? "pareado" : "entra"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {multi ? (
            <Pressable
              onPress={aplicarMultiplos}
              disabled={pares.length === 0}
              accessibilityRole="button"
              accessibilityLabel={
                pares.length > 0
                  ? `Aplicar ${pares.length} ${pares.length === 1 ? "troca" : "trocas"}`
                  : "Aplicar trocas"
              }
              accessibilityState={{ disabled: pares.length === 0 }}
              style={({ pressed }) => [
                styles.aplicarBtn,
                {
                  backgroundColor:
                    pares.length === 0
                      ? palette.primaryDim
                      : palette.primary,
                  opacity:
                    pares.length === 0 ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="check-all"
                size={18}
                color={palette.onPrimary}
              />
              <Text style={[styles.aplicarBtnText, { color: palette.onPrimary }]}>
                {pares.length === 0
                  ? "Aplicar trocas"
                  : `Aplicar ${pares.length} ${pares.length === 1 ? "troca" : "trocas"}`}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FieldPlayerItem({
  player,
  tone,
  selected,
  onPress,
}: {
  player: Player;
  tone: "A" | "B";
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Selecionar ${player.name} para sair`}
      style={({ pressed }) => [
        styles.fpi,
        {
          backgroundColor: selected
            ? palette.goal + "22"
            : palette.surfaceContainerHigh,
          borderColor: selected
            ? palette.goal
            : tone === "A"
              ? palette.primary
              : palette.secondary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <PlayerAvatar player={player} size={28} tone={tone} />
      <Text
        style={[styles.fpiName, { color: palette.onSurface }]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      <MaterialCommunityIcons
        name={selected ? "check-circle" : "arrow-up"}
        size={14}
        color={selected ? palette.goal : palette.onSurfaceVariant}
      />
    </Pressable>
  );
}

// ====================================================================
// Celebration + Toast
// ====================================================================

function GoalCelebration({
  cel,
  teamA,
  teamB,
}: {
  cel: {
    player: Player;
    side: "A" | "B";
    scoreA: number;
    scoreB: number;
  };
  teamA: Team;
  teamB: Team;
}) {
  const palette = usePalette();
  const scale = useRef(new Animated.Value(0.3)).current;
  const cardY = useRef(new Animated.Value(16)).current;
  const cardOpacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 7,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(cardY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [scale, cardY, cardOpacity]);
  const sideColor = cel.side === "A" ? palette.primary : palette.secondary;
  return (
    <View pointerEvents="none" style={styles.celebOverlay}>
      {/* Radial-ish gradient via duas camadas opacas (Svg na bg seria ideal) */}
      <View
        style={[
          styles.celebBg,
          { backgroundColor: sideColor + "55" },
        ]}
      />
      <View style={styles.celebBgDark} />

      <Confetti side={cel.side} palette={palette} />

      <Animated.View
        style={[
          styles.celebBig,
          {
            transform: [{ scale }],
            shadowColor: palette.glow,
          },
        ]}
      >
        <Text
          style={[
            styles.celebTitle,
            {
              color: "#FFFFFF",
              textShadowColor: palette.glow,
              textShadowRadius: 30,
              textShadowOffset: { width: 0, height: 6 },
            },
          ]}
        >
          GOL!
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.celebCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
            opacity: cardOpacity,
            transform: [{ translateY: cardY }],
          },
        ]}
      >
        <PlayerAvatar player={cel.player} size={48} tone={cel.side} ring />
        <View style={{ flex: 1 }}>
          <Text style={[styles.celebName, { color: palette.onSurface }]}>
            {cel.player.name}
          </Text>
          <View style={styles.celebSubRow}>
            <MaterialCommunityIcons
              name="soccer"
              size={12}
              color={palette.onSurfaceVariant}
            />
            <Text style={[styles.celebSub, { color: palette.onSurfaceVariant }]}>
              {cel.side === "A" ? nomeDoTime(teamA, 0) : nomeDoTime(teamB, 1)} marcou
            </Text>
          </View>
        </View>
        <Text style={[styles.celebScore, { color: palette.onSurface }]}>
          {cel.scoreA}
          <Text style={{ color: palette.onSurfaceVariant }}> × </Text>
          {cel.scoreB}
        </Text>
      </Animated.View>
    </View>
  );
}

function Confetti({
  side,
  palette,
}: {
  side: "A" | "B";
  palette: ReturnType<typeof usePalette>;
}) {
  // 14 partículas distribuídas horizontalmente, caem com delay escalonado.
  const colors = [
    side === "A" ? palette.primary : palette.secondary,
    palette.goal,
    palette.tertiary,
    palette.primary,
  ];
  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {Array.from({ length: 14 }).map((_, i) => (
        <ConfettiPiece
          key={i}
          index={i}
          color={colors[i % colors.length]}
        />
      ))}
    </View>
  );
}

function ConfettiPiece({ index, color }: { index: number; color: string }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 40),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 420,
          duration: 1400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [index, opacity, rotate, translateY]);
  const rotateInterp = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "540deg"],
  });
  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: `${index * 7}%`,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { rotate: rotateInterp }],
        },
      ]}
    />
  );
}

function SubstitutionToast({
  t,
  teamA,
  teamB,
}: {
  t: { inP: Player; outP: Player; side: "A" | "B"; extras?: number };
  teamA: Team;
  teamB: Team;
}) {
  const palette = usePalette();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          shadowColor: palette.glow,
        },
      ]}
    >
      <View
        style={[styles.toastIcon, { backgroundColor: palette.primary }]}
      >
        <MaterialCommunityIcons
          name="account-switch"
          size={18}
          color={palette.onPrimary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.toastRow}>
          <MaterialCommunityIcons
            name="arrow-down"
            size={12}
            color={palette.goal}
          />
          <Text style={[styles.toastBold, { color: palette.onSurface }]}>
            {t.inP.name}
          </Text>
          <Text style={[styles.toastLight, { color: palette.onSurfaceVariant }]}>
            entrou
          </Text>
        </View>
        <View style={styles.toastRow}>
          <MaterialCommunityIcons
            name="arrow-up"
            size={12}
            color={palette.onSurfaceVariant}
          />
          <Text style={[styles.toastLight, { color: palette.onSurfaceVariant }]}>
            {t.outP.name} saiu
          </Text>
        </View>
      </View>
      <Text style={[styles.toastSide, { color: palette.onSurfaceVariant }]}>
        {t.extras && t.extras > 0
          ? `+${t.extras} ${t.extras === 1 ? "troca" : "trocas"}`
          : t.side === "A"
            ? nomeDoTime(teamA, 0)
            : nomeDoTime(teamB, 1)}
      </Text>
    </View>
  );
}

/**
 * Sheet de ações para um gol selecionado via long-press na timeline
 * (F-11). 2 opções: corrigir autor (abre subsheet) e remover (passa
 * pra confirmAcao do callsite).
 */
function GolActionSheet({
  gol,
  onClose,
  onCorrigirAutor,
  onRemover,
}: {
  gol: Goal | null;
  onClose: () => void;
  onCorrigirAutor: (g: Goal) => void;
  onRemover: (g: Goal) => void;
}) {
  const palette = usePalette();
  if (!gol) return null;
  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetWrap} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.sheetGrab, { backgroundColor: palette.outline }]}
          />
          <View style={styles.sheetHead}>
            <View>
              <Text
                style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
              >
                Gol — {gol.player.name} ({minutoDoGol(gol)}')
              </Text>
              <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
                Corrigir registro
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar ações do gol"
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={palette.onSurface}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => onCorrigirAutor(gol)}
            accessibilityRole="button"
            accessibilityLabel="Corrigir autor do gol"
            style={({ pressed }) => [
              styles.golActionRow,
              {
                backgroundColor: palette.surfaceContainerHigh,
                borderColor: palette.outlineVariant,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={20}
              color={palette.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.golActionTitle, { color: palette.onSurface }]}>
                Corrigir autor
              </Text>
              <Text
                style={[
                  styles.golActionSub,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                Escolha o jogador certo entre os 2 times
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={palette.onSurfaceVariant}
            />
          </Pressable>

          <Pressable
            onPress={() => onRemover(gol)}
            accessibilityRole="button"
            accessibilityLabel="Remover este gol"
            style={({ pressed }) => [
              styles.golActionRow,
              {
                backgroundColor: palette.errorContainer,
                borderColor: palette.error,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={20}
              color={palette.error}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.golActionTitle, { color: palette.error }]}>
                Remover este gol
              </Text>
              <Text
                style={[styles.golActionSub, { color: palette.error, opacity: 0.85 }]}
              >
                Apaga o registro definitivamente
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Subsheet aberto a partir do `GolActionSheet`. Lista os jogadores dos
 * 2 times (em campo, no momento) — o domínio decide se vira ownGoal
 * quando o escolhido não pertence ao `gol.team`.
 */
function ChangeAuthorSheet({
  gol,
  onClose,
  onEscolher,
}: {
  gol: Goal | null;
  onClose: () => void;
  onEscolher: (g: Goal, novoAutor: Player) => void;
}) {
  const palette = usePalette();
  if (!gol) return null;
  const teamA = gol.match.teamA;
  const teamB = gol.match.teamB;
  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetWrap} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.sheetGrab, { backgroundColor: palette.outline }]}
          />
          <View style={styles.sheetHead}>
            <View>
              <Text
                style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
              >
                Corrigir autor — {minutoDoGol(gol)}'
              </Text>
              <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
                Quem fez de verdade?
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={palette.onSurface}
              />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 380 }}>
            <View style={styles.subColRow}>
              <View style={styles.subCol}>
                <View
                  style={[
                    styles.subTag,
                    { backgroundColor: palette.primary + "22" },
                  ]}
                >
                  <Text style={[styles.subTagText, { color: palette.primary }]}>
                    Time 1
                  </Text>
                </View>
                {teamA.players.map((p) => (
                  <AutorOption
                    key={p.id}
                    player={p}
                    tone="A"
                    eAtual={p.id === gol.player.id}
                    onPress={() => onEscolher(gol, p)}
                  />
                ))}
              </View>
              <View style={styles.subCol}>
                <View
                  style={[
                    styles.subTag,
                    { backgroundColor: palette.secondary + "22" },
                  ]}
                >
                  <Text style={[styles.subTagText, { color: palette.secondary }]}>
                    Time 2
                  </Text>
                </View>
                {teamB.players.map((p) => (
                  <AutorOption
                    key={p.id}
                    player={p}
                    tone="B"
                    eAtual={p.id === gol.player.id}
                    onPress={() => onEscolher(gol, p)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Linha de jogador escolhível na lista de "corrigir autor". */
function AutorOption({
  player,
  tone,
  eAtual,
  onPress,
}: {
  player: Player;
  tone: "A" | "B";
  eAtual: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={eAtual}
      accessibilityRole="button"
      accessibilityLabel={
        eAtual
          ? `${player.name} (autor atual)`
          : `Trocar autor para ${player.name}`
      }
      style={({ pressed }) => [
        styles.fpi,
        {
          backgroundColor: palette.surfaceContainerHigh,
          borderColor: tone === "A" ? palette.primary : palette.secondary,
          opacity: eAtual ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <PlayerAvatar player={player} size={28} tone={tone} />
      <Text
        style={[styles.fpiName, { color: palette.onSurface }]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      {eAtual ? (
        <MaterialCommunityIcons
          name="account-check"
          size={14}
          color={palette.onSurfaceVariant}
        />
      ) : null}
    </Pressable>
  );
}

/**
 * Toast curto no topo da tela, anunciando que faltam 2 minutos ou 30
 * segundos para o fim do tempo (F-08). Visual mais sóbrio que o
 * `SubstitutionToast` — alerta, não evento de jogo.
 */
function CheckpointToast({
  texto,
  topOffset,
}: {
  texto: string;
  topOffset: number;
}) {
  const palette = usePalette();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.checkpointToast,
        {
          top: topOffset + Spacing.sm,
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons
        name="alarm"
        size={16}
        color={palette.warning}
      />
      <Text
        style={[styles.checkpointToastText, { color: palette.onSurface }]}
      >
        {texto}
      </Text>
    </View>
  );
}

// ====================================================================
// Helpers + Styles
// ====================================================================

function minutoDoGol(gol: Goal): number {
  // ScreenTime.timeStroke é decorrido em segundos no tempo atual.
  return Math.max(0, Math.floor(gol.time.timeStroke / 60));
}

function formatSeconds(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // ----- Scoreboard ----- (design `.sb`: fundo preto, sem container, só borda inferior)
  scoreboard: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  sbStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sbStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  sbStatusText: {
    ...Typography.label,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sbLimit: { flexDirection: "row", alignItems: "center", gap: 4 },
  sbLimitText: { ...Typography.label, fontSize: 10 },
  // Badge "M min · até N gols" — pílula contornada no canto direito do
  // status row do scoreboard.
  sbCriterioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  sbCriterioText: { ...Typography.label, fontSize: 10 },
  sbCriterioSep: { ...Typography.label, fontSize: 10, opacity: 0.6 },
  sbMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sbSide: {
    flex: 1,
    alignItems: "flex-start",
    gap: 4,
  },
  sbTeam: { ...Typography.title, fontSize: 14 },
  sbGolButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  sbGolText: { ...Typography.label, fontSize: 10 },
  sbScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  sbNum: {
    ...Typography.display,
    fontSize: 46,
    fontVariant: ["tabular-nums"],
    minWidth: 40,
    textAlign: "center",
  },
  sbX: { ...Typography.headline, fontSize: 22 },

  // ----- Field -----
  // Container do campo — quinas a 90° (sem borderRadius). O contorno SVG já
  // marca o limite do gramado; arredondar o container "cropava" cantos das
  // listras e destoava da diagramação do design (caixa retangular cheia).
  field: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  fieldBg: {
    ...StyleSheet.absoluteFillObject,
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
  dot: {
    position: "absolute",
    alignItems: "center",
    width: 64,
    marginLeft: -32,
    marginTop: -32,
  },
  // Wrapper do avatar — precisa ser explicitamente redondo (42×42, raio 21)
  // para que o `shadowColor: goal` do spot do último marcador se projete como
  // halo circular (e não um quadrado com sombra).
  dotAv: {
    position: "relative",
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  dotGoal: {
    position: "absolute",
    right: -4,
    bottom: -2,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dotGoalText: {
    ...Typography.label,
    fontSize: 9,
    fontWeight: "800",
  },
  dotNameWrap: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    maxWidth: 70,
  },
  dotName: {
    ...Typography.label,
    fontSize: 10.5,
    fontWeight: "700",
    textAlign: "center",
  },

  centerDiscWrap: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 112,
    height: 112,
    marginLeft: -56,
    marginTop: -56,
    alignItems: "center",
    justifyContent: "center",
  },
  centerDiscPulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  centerDisc: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 8,
    gap: 4,
  },
  centerDiscLabel: { ...Typography.label, fontSize: 12, letterSpacing: 1 },
  centerDiscTimer: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  centerDiscContent: { position: "absolute", alignItems: "center" },
  centerDiscTime: {
    ...Typography.headline,
    fontSize: 22,
    fontVariant: ["tabular-nums"],
  },
  centerDiscSub: { ...Typography.label, fontSize: 10, marginTop: 2 },

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

  // Banco — design `.bench`: largura 40, centralizado vertical via marginTop = -altura/2.
  // Altura total ~180 (cabeçalho ~80 + ~5 avatares 26 sobrepostos -5 = ~100). Não cresce
  // para cobrir o campo todo. Toque abre SubstitutionSheet.
  benchRail: {
    position: "absolute",
    top: "50%",
    width: 40,
    marginTop: -90,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 6,
    zIndex: 7,
  },
  benchRailLeft: {
    left: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  benchRailRight: {
    right: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  benchRailHead: { alignItems: "center", gap: 8, height: 70, justifyContent: "center" },
  benchRailLabelWrap: { alignItems: "center", justifyContent: "center" },
  benchRailLabel: {
    ...Typography.label,
    fontSize: 8,
    letterSpacing: 1.5,
    width: 70,
    textAlign: "center",
  },
  benchRailAvs: { alignItems: "center" },
  benchAv: { borderWidth: 1.5, borderRadius: 999 },

  // ----- Controls -----
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  ctrlBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderCurve: "continuous",
  },
  ctrlBtnLabel: { ...Typography.title, fontSize: 15 },
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

  // ----- Sheets -----
  sheetWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
    borderCurve: "continuous",
  },
  sheetGrab: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: Spacing.sm,
    opacity: 0.4,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetEyebrow: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
  },
  sheetTitle: { ...Typography.headline, fontSize: 18, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  scorerCard: {
    width: "30%",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
    borderCurve: "continuous",
  },
  scorerName: { ...Typography.label, fontSize: 11, textAlign: "center" },
  scorerGoals: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  scorerGoalsText: { ...Typography.label, fontSize: 10 },

  subHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  subHintText: { ...Typography.body, fontSize: 13, flex: 1 },
  subColRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs },
  subCol: { flex: 1, gap: 4 },
  subTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginBottom: 2,
  },
  subTagText: { ...Typography.label, fontSize: 10 },
  fpi: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  fpiName: { ...Typography.body, fontSize: 13, flex: 1 },
  subEmpty: { ...Typography.body, fontStyle: "italic", marginTop: 4 },
  benchList: { gap: Spacing.xs, marginTop: 4 },
  benchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  benchItemName: { ...Typography.body, fontSize: 14, flex: 1 },
  benchItemRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  benchItemEnter: { ...Typography.label, fontSize: 11 },

  // ----- Celebration + toast -----
  celebOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    overflow: "hidden",
  },
  celebBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  celebBgDark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  confettiLayer: {
    position: "absolute",
    top: -20,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: "absolute",
    top: 0,
    width: 9,
    height: 14,
    borderRadius: 2,
  },
  celebBig: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
  },
  celebTitle: {
    fontSize: 96,
    fontWeight: "900",
    letterSpacing: -3,
  },
  celebCard: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    minWidth: 280,
    borderCurve: "continuous",
  },
  celebName: { ...Typography.headline, fontSize: 18 },
  celebSubRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  celebSub: { ...Typography.label, fontSize: 11 },
  celebScore: {
    ...Typography.display,
    fontSize: 28,
    fontVariant: ["tabular-nums"],
  },

  toast: {
    position: "absolute",
    bottom: 96,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
    zIndex: 50,
    borderCurve: "continuous",
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toastRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  toastBold: { ...Typography.title, fontSize: 13 },
  toastLight: { ...Typography.body, fontSize: 12 },
  toastSide: { ...Typography.label, fontSize: 11 },

  // ----- Sheet de ações do gol (F-11) — corrigir / remover -----
  golActionRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  golActionTitle: { ...Typography.title, fontSize: 14 },
  golActionSub: { ...Typography.label, fontSize: 11, marginTop: 2 },

  // ----- Sheet: header com toggle + botão Aplicar (F-09) -----
  sheetHeadActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  multiToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  multiToggleText: { ...Typography.label, fontSize: 11 },
  aplicarBtn: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  aplicarBtnText: { ...Typography.title, fontSize: 15 },

  // ----- Checkpoint toast (F-08) — alerta no topo da tela -----
  checkpointToast: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 60,
    borderCurve: "continuous",
  },
  checkpointToastText: { ...Typography.title, fontSize: 13 },
});
