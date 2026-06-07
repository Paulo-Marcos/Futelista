// ============================================================================
// Futelista — Splash (tela de loading)
// Porta fiel do protótipo HTML (.fl-splash em css/app.css + <Splash/> em
// screens.jsx). Refatorado conforme referência atualizada do designer.
//
// Diferenças principais vs. versão anterior:
//  - 1 shared value por trilha de animação (0→1), em vez de N valores em
//    paralelo. Propriedades derivadas via `interpolate` (worklet-safe).
//  - Loop infinito no preview = `withRepeat(timing, -1, false)` numa linha.
//  - Tap em modo preview NÃO dismissa (evita 404 ao tocar sem querer).
//  - Background gradient circular via `gradientUnits="userSpaceOnUse"` +
//    `useWindowDimensions` (rx/ry % padrão sai oval em portrait).
//  - LinearGradient do badge via `react-native-svg` (evita dependência
//    extra do `expo-linear-gradient` e o problema de cache do Metro).
// ============================================================================

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { PitchLines } from "@/src/shared/ui/PitchLines";

// Fonte display do protótipo é Archivo 800. Carregada em app/_layout.tsx
// via @expo-google-fonts/archivo. Se faltar, cai pro system.
const DISPLAY_FONT = "Archivo_800ExtraBold";
const TAG_FONT = "Archivo_600SemiBold";

// Duração base — igual ao protótipo (`splashglow 2.3s ease-out` e
// `setTimeout(onDone, 2300)`).
const DURATION = 2300;

// ----------------------------------------------------------------------------
// interpolate worklet-safe (referência atualizada)
// ----------------------------------------------------------------------------
function interpolate(v: number, input: number[], output: number[]): number {
  "worklet";
  if (v <= input[0]) return output[0];
  const last = input.length - 1;
  if (v >= input[last]) return output[last];
  for (let i = 1; i <= last; i++) {
    if (v <= input[i]) {
      const t = (v - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + t * (output[i] - output[i - 1]);
    }
  }
  return output[last];
}

// ----------------------------------------------------------------------------
// SPLASH
// ----------------------------------------------------------------------------
export function Splash({
  onDone,
  previewLoop = false,
}: {
  onDone: () => void;
  previewLoop?: boolean;
}) {
  const palette = usePalette();
  const { width: screenW, height: screenH } = useWindowDimensions();

  // -------------------------------------------------------------------------
  // BG circular — `gradientUnits="userSpaceOnUse"` exige pixels reais.
  // Sem isso, % se referem à bbox do <Rect> (a tela em portrait), o que
  // gera elipse esticada na vertical.
  // -------------------------------------------------------------------------
  const bgCx = screenW / 2;
  const bgCy = screenH * 0.3;
  const bgR = Math.max(screenW, screenH) * 0.75;

  // -------------------------------------------------------------------------
  // Shared values — 1 por trilha (0→1). Idêntico à referência.
  //   glow  = .fl-splash__glow      (splashglow)
  //   badge = .fl-splash__badge     (splashpop)
  //   name  = .fl-splash__name      (splashup delay .2s)
  //   tag   = .fl-splash__tag       (splashup delay .35s)
  //   bar   = .fl-splash__loader    (loadbar)
  // -------------------------------------------------------------------------
  const glow = useSharedValue(0);
  const badge = useSharedValue(0);
  const name = useSharedValue(0);
  const tag = useSharedValue(0);
  const bar = useSharedValue(0);

  useEffect(() => {
    // splashglow .. ease-out cubic, 2.3s.  Em preview: loop infinito.
    const glowRun = () =>
      withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
    glow.value = previewLoop ? withRepeat(glowRun(), -1, false) : glowRun();

    // splashpop .7s cubic-bezier(.2,1.3,.4,1) — sempre one-shot.
    badge.value = withTiming(1, {
      duration: 700,
      easing: Easing.bezier(0.2, 1.3, 0.4, 1),
    });

    // splashup .6s — name (delay .2s) + tag (delay .35s). One-shot.
    name.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    tag.value = withDelay(
      350,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    // loadbar 2.3s ease-in-out — loop em preview, one-shot fora.
    const barRun = () =>
      withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.ease) });
    bar.value = previewLoop ? withRepeat(barRun(), -1, false) : barRun();

    if (!previewLoop) {
      const t = setTimeout(onDone, DURATION);
      return () => clearTimeout(t);
    }
    // Cleanup das loops infinitas.
    return () => {
      cancelAnimation(glow);
      cancelAnimation(bar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLoop]);

  // -------------------------------------------------------------------------
  // Styles animados — interpolate mapeia 0→1 nas propriedades.
  // -------------------------------------------------------------------------
  const glowStyle = useAnimatedStyle(() => ({
    // splashglow: opacity 0%→1(40%)→.4(100%); scale .4→1.2.
    opacity: interpolate(glow.value, [0, 0.4, 1], [0, 1, 0.4]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.4, 1.2]) }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    // splashpop: opacity .2→1; scale .4→1; rotate -12→0deg.
    opacity: interpolate(badge.value, [0, 1], [0.2, 1]),
    transform: [
      { scale: interpolate(badge.value, [0, 1], [0.4, 1]) },
      { rotate: `${interpolate(badge.value, [0, 1], [-12, 0])}deg` },
    ],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(name.value, [0, 1], [0.2, 1]),
    transform: [{ translateY: interpolate(name.value, [0, 1], [14, 0]) }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tag.value, [0, 1], [0.2, 1]),
    transform: [{ translateY: interpolate(tag.value, [0, 1], [14, 0]) }],
  }));
  // loader: span 40%, left -45% → 105% (sobre track 130px).
  const TRACK = 130;
  const barStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          bar.value,
          [0, 1],
          [-0.45 * TRACK, 1.05 * TRACK],
        ),
      },
    ],
  }));

  return (
    <Pressable
      // Em preview, tap NÃO dismissa (evita 404 acidental quando o
      // back-stack está vazio). Para sair, usar o X no canto superior.
      onPress={previewLoop ? undefined : onDone}
      accessibilityRole={previewLoop ? undefined : "button"}
      accessibilityLabel={previewLoop ? undefined : "Pular splash"}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      {/* ----------- .fl-splash (fundo radial vermelho) -----------
          radial-gradient(120% 70% at 50% 30%, color-mix(primary 26%, bg), bg 70%)

          gradientUnits="userSpaceOnUse" com cx/cy/r em pixels reais →
          gradiente CIRCULAR, não distorcido pela aspect ratio da tela. */}
      <Svg
        width={screenW}
        height={screenH}
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          <RadialGradient
            id="bg"
            cx={bgCx}
            cy={bgCy}
            r={bgR}
            fx={bgCx}
            fy={bgCy}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={palette.primary} stopOpacity={0.22} />
            <Stop offset="0.35" stopColor={palette.primary} stopOpacity={0.12} />
            <Stop offset="0.7" stopColor={palette.primary} stopOpacity={0.02} />
            <Stop offset="1" stopColor={palette.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={screenW} height={screenH} fill="url(#bg)" />
      </Svg>

      {/* ----------- .fl-splash__pitch (linhas de campo) ----------- */}
      <View style={styles.pitch} pointerEvents="none">
        <PitchLines opacity={0.5} />
      </View>

      {/* ----------- .fl-splash__glow -----------
          radial-gradient(circle, glow, transparent 65%) + filter:blur(20px)

          Sem `filter:blur` em RN, simulamos com 3 RadialGradients
          empilhadas (curva gaussiana-like). */}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="g-core" cx="50" cy="50" r="40" fx="50" fy="50">
              <Stop offset="0" stopColor={palette.primary} stopOpacity={0.55} />
              <Stop offset="0.2" stopColor={palette.primary} stopOpacity={0.42} />
              <Stop offset="0.4" stopColor={palette.primary} stopOpacity={0.22} />
              <Stop offset="0.65" stopColor={palette.primary} stopOpacity={0.06} />
              <Stop offset="1" stopColor={palette.primary} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="g-halo" cx="50" cy="50" r="50" fx="50" fy="50">
              <Stop offset="0" stopColor={palette.primary} stopOpacity={0.32} />
              <Stop offset="0.25" stopColor={palette.primary} stopOpacity={0.22} />
              <Stop offset="0.5" stopColor={palette.primary} stopOpacity={0.1} />
              <Stop offset="0.8" stopColor={palette.primary} stopOpacity={0.02} />
              <Stop offset="1" stopColor={palette.primary} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="g-skin" cx="50" cy="50" r="50" fx="50" fy="50">
              <Stop offset="0" stopColor={palette.primary} stopOpacity={0.16} />
              <Stop offset="0.4" stopColor={palette.primary} stopOpacity={0.09} />
              <Stop offset="0.7" stopColor={palette.primary} stopOpacity={0.025} />
              <Stop offset="1" stopColor={palette.primary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#g-skin)" />
          <Circle cx="50" cy="50" r="50" fill="url(#g-halo)" />
          <Circle cx="50" cy="50" r="40" fill="url(#g-core)" />
        </Svg>
      </Animated.View>

      {/* ----------- .fl-splash__center (badge + nome + tag) ----------- */}
      <View style={styles.center}>
        {/* .fl-splash__badge: linear-gradient(140deg, primary, primaryDim)
            via react-native-svg <LinearGradient> (evita dependência do
            expo-linear-gradient e o problema de cache do Metro). */}
        <Animated.View
          style={[
            styles.badgeWrap,
            { shadowColor: palette.glow },
            badgeStyle,
          ]}
        >
          <View style={styles.badge}>
            <Svg
              width="100%"
              height="100%"
              style={StyleSheet.absoluteFillObject}
            >
              <Defs>
                <SvgLinearGradient
                  id="badge-bg"
                  x1="0.18"
                  y1="0"
                  x2="0.82"
                  y2="1"
                >
                  <Stop offset="0" stopColor={palette.primary} />
                  <Stop offset="1" stopColor={palette.primaryDim} />
                </SvgLinearGradient>
              </Defs>
              <Rect
                width="100%"
                height="100%"
                rx="30"
                ry="30"
                fill="url(#badge-bg)"
              />
            </Svg>
            <MaterialCommunityIcons
              name="soccer"
              size={46}
              color={palette.onPrimary}
            />
          </View>
        </Animated.View>

        {/* .fl-splash__name */}
        <Animated.Text
          style={[
            styles.name,
            { color: palette.onSurface, fontFamily: DISPLAY_FONT },
            nameStyle,
          ]}
        >
          Futelista
        </Animated.Text>

        {/* .fl-splash__tag */}
        <Animated.Text
          style={[
            styles.tag,
            { color: palette.onSurfaceVariant, fontFamily: TAG_FONT },
            tagStyle,
          ]}
        >
          ORGANIZE A PELADA
        </Animated.Text>
      </View>

      {/* ----------- .fl-splash__loader ----------- */}
      <View
        style={[styles.loaderTrack, { backgroundColor: palette.outlineVariant }]}
      >
        <Animated.View
          style={[
            styles.loaderSpan,
            { backgroundColor: palette.primary },
            barStyle,
          ]}
        />
      </View>

      {/* Botão de saída em modo preview (tap normal está desabilitado). */}
      {previewLoop ? (
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Sair da inspeção da splash"
          style={({ pressed }) => [
            styles.closeBtn,
            {
              backgroundColor: palette.surface + "CC",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={palette.onSurface}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  pitch: {
    position: "absolute",
    top: "8%",
    left: "8%",
    right: "8%",
    bottom: "8%",
  },
  glow: {
    position: "absolute",
    width: 420,
    height: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { alignItems: "center", zIndex: 2 },
  badgeWrap: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.55,
    shadowRadius: 25,
    elevation: 16,
    borderRadius: 30,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  name: {
    marginTop: 20,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  tag: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  loaderTrack: {
    position: "absolute",
    bottom: 70,
    width: 130,
    height: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  loaderSpan: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "40%",
    borderRadius: 4,
  },
  closeBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Splash;
