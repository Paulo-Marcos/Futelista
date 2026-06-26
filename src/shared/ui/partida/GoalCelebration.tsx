import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { Confetti } from "./Confetti";

export function GoalCelebration({
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
      <View style={[styles.celebBg, { backgroundColor: sideColor + "55" }]} />
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
            <Text
              style={[styles.celebSub, { color: palette.onSurfaceVariant }]}
            >
              {cel.side === "A" ? nomeDoTime(teamA, 0) : nomeDoTime(teamB, 1)}{" "}
              marcou
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

const styles = StyleSheet.create({
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
  celebSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  celebSub: { ...Typography.label, fontSize: 11 },
  celebScore: {
    ...Typography.display,
    fontSize: 28,
  },
});
