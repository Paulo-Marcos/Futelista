import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function SubstitutionToast({
  t,
  teamA,
  teamB,
}: {
  t: { inP: Player; outP: Player; side: "A" | "B"; extras?: number };
  teamA: Team;
  teamB: Team;
}) {
  const palette = usePalette();
  // M-06: entrada animada — slide-up de +28 → 0 + fade 0 → 1. A saída
  // não anima (unmount em ~2.4s), mas a chegada com peso visual ajuda
  // o usuário a "ver" a troca acontecendo no campo.
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          shadowColor: palette.glow,
          opacity: fade,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View style={[styles.toastIcon, { backgroundColor: palette.primary }]}>
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
          <Text
            style={[styles.toastLight, { color: palette.onSurfaceVariant }]}
          >
            entrou
          </Text>
        </View>
        <View style={styles.toastRow}>
          <MaterialCommunityIcons
            name="arrow-up"
            size={12}
            color={palette.onSurfaceVariant}
          />
          <Text
            style={[styles.toastLight, { color: palette.onSurfaceVariant }]}
          >
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
