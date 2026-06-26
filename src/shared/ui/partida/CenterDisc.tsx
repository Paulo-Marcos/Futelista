import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle as SvgCircle } from "react-native-svg";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Typography } from "@/src/shared/theme/Colors";
import { formatSeconds } from "./helpers";

export function CenterDisc({
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
        paused ? "Continuar (centro do campo)" : "Pausar (centro do campo)"
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
          style={[styles.centerDiscSub, { color: palette.onSurfaceVariant }]}
        >
          {paused ? "tocar p/ seguir" : running ? "tempo" : "tempo"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  },
  centerDiscSub: { ...Typography.label, fontSize: 10, marginTop: 2 },
});
