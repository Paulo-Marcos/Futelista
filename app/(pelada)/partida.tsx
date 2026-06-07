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
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { EmptyState } from "@/src/shared/ui/EmptyState";

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
  } | null>(null);

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
      />

      {celebration ? <GoalCelebration cel={celebration} /> : null}
      {subToast ? <SubstitutionToast t={subToast} /> : null}
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
  onOpenPicker,
}: {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  status?: TimerStatus;
  goalLimit: number;
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
        <View style={styles.sbLimit}>
          <MaterialCommunityIcons
            name="bullseye-arrow"
            size={12}
            color={palette.onSurfaceVariant}
          />
          <Text
            style={[styles.sbLimitText, { color: palette.onSurfaceVariant }]}
          >
            limite {goalLimit} gols
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
          <TeamCrest seed={teamA.id} size={28} />
          <Text style={[styles.sbTeam, { color: palette.onSurface }]}>
            Time 1
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
          <TeamCrest seed={teamB.id} size={28} />
          <Text style={[styles.sbTeam, { color: palette.onSurface }]}>
            Time 2
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
                {side === "A" ? "Time 1" : "Time 2"}
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

function SubstitutionSheet({
  open,
  teamA,
  teamB,
  reservas,
  onClose,
  onSub,
}: {
  open: boolean;
  teamA: Team;
  teamB: Team;
  reservas: Player[];
  onClose: () => void;
  onSub: (side: "A" | "B", outPlayer: Player) => void;
}) {
  const palette = usePalette();
  const [selected, setSelected] = useState<{
    side: "A" | "B";
    player: Player;
  } | null>(null);

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  const onPickField = (side: "A" | "B", player: Player) =>
    setSelected({ side, player });
  const onPickBench = () => {
    if (!selected) return;
    onSub(selected.side, selected.player);
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
                Manter o time
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
                    selected={selected?.player.id === p.id}
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
                    selected={selected?.player.id === p.id}
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
                {reservas.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={onPickBench}
                    disabled={!selected}
                    accessibilityRole="button"
                    accessibilityLabel={`Trocar ${p.name} para entrar`}
                    style={({ pressed }) => [
                      styles.benchItem,
                      {
                        backgroundColor: palette.surfaceContainerHigh,
                        borderColor: palette.outlineVariant,
                        opacity: selected ? (pressed ? 0.8 : 1) : 0.5,
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
                        name="arrow-down"
                        size={12}
                        color={palette.goal}
                      />
                      <Text
                        style={[styles.benchItemEnter, { color: palette.goal }]}
                      >
                        entra
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
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
}: {
  cel: {
    player: Player;
    side: "A" | "B";
    scoreA: number;
    scoreB: number;
  };
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
              {cel.side === "A" ? "Time 1" : "Time 2"} marcou
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
}: {
  t: { inP: Player; outP: Player; side: "A" | "B" };
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
        {t.side === "A" ? "Time 1" : "Time 2"}
      </Text>
    </View>
  );
}

// ====================================================================
// Helpers + Styles
// ====================================================================

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
});
