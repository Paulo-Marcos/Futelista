import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View } from "react-native";

import { Match } from "@/src/domain/Match";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing } from "@/src/shared/theme/Colors";
import { PitchLines } from "@/src/shared/ui/PitchLines";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { formatSeconds } from "../formatSeconds";
import { HeroGlowHalo } from "./HeroGlowHalo";
import { HeroHeader } from "./HeroHeader";
import { HeroMatchup } from "./HeroMatchup";
import { HeroPlacar } from "./HeroPlacar";
import { HeroPrimaryCTA } from "./HeroPrimaryCTA";

// ====================================================================
// Hero — versão compacta do design Pelada.html: PRÓXIMA PARTIDA + matchup
// + status line ("12 jogadores · 3 times") + CTA com glow vermelho.
// Header com nome/local/cog foi extraído para fora (phead persistente).
// ====================================================================

export function Hero({
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
        <LinearGradient
          colors={[palette.primary + "59", palette.surface, palette.surface]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <PitchLines opacity={0.38} />

        {/* Linha superior: status à esquerda, badge de modo à direita —
            ambos na MESMA linha. */}
        <HeroHeader
          badgeLabel={showMatchup ? "PRÓXIMA PARTIDA" : "PELADA ATIVA"}
          isLive={!!(partida && placar)}
          live={live}
          statusLine={statusLine}
          statusLabel={statusPartidaLabel}
          cronometro={cronometro}
          palette={palette}
        />

        {/* Corpo: placar AO VIVO ou confronto. O modo idle não tem corpo,
            deixando o campo respirar entre o header e o CTA. */}
        {partida && placar ? (
          <HeroPlacar partida={partida} placar={placar} palette={palette} />
        ) : showMatchup && timeAId && timeBId ? (
          <HeroMatchup
            timeAId={timeAId}
            timeBId={timeBId}
            timeANome={timeANome}
            timeBNome={timeBNome}
            timeACor={timeACor}
            timeBCor={timeBCor}
            palette={palette}
          />
        ) : null}

        {/* CTA ancorado no rodapé do card (marginTop: "auto" no wrap). */}
        {partida && placar ? (
          <View style={styles.heroCtaWrap}>
            <HeroPrimaryCTA
              label="Abrir partida"
              icon="play-circle-outline"
              onPress={onAbrirPartida}
              palette={palette}
            />
          </View>
        ) : cta ? (
          <View style={styles.heroCtaWrap}>
            <HeroPrimaryCTA
              label={cta.label}
              icon={cta.icon}
              onPress={onCta}
              palette={palette}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Wrapper de sombra do hero: shadowColor=primary (HEX opaco), sem overflow
  // (senão clipa o halo). Receita do README_PeladaHome §1.
  heroShadow: {
    borderRadius: Radius.xl,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  hero: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderCurve: "continuous",
    // M-03: altura mínima estável evita layout-jump quando o hero alterna
    // entre "PRÓXIMA PARTIDA" (matchup + status + CTA) e "PELADA ATIVA"
    // (placar AO VIVO + cronômetro + CTA). Os dois modos têm conteúdo
    // diferente em tamanho — sem minHeight a Home re-flow os StatCards
    // logo abaixo, gerando o jump.
    minHeight: 220,
  },
  heroCtaWrap: {
    // "auto" empurra o CTA para o rodapé do card, aproveitando o espaço
    // livre do minHeight e deixando o campo (PitchLines) visível no meio.
    marginTop: "auto",
  },
});
