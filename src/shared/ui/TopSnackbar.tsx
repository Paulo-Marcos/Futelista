import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Snackbar discreto no topo seguro (M-19). Pílula compacta com
 * spinner opcional. Aparece com fade + slide-down e some quando
 * `visible` volta a false.
 *
 * Uso: feedback de "salvando…" no rodapé do Hero ficava fácil de
 * perder durante o scroll; aqui fica fixo no topo enquanto o estado
 * dura.
 */
export function TopSnackbar({
  visible,
  mensagem,
  comSpinner,
}: {
  visible: boolean;
  mensagem: string;
  /** Mostra `ActivityIndicator` à esquerda da mensagem. */
  comSpinner?: boolean;
}) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: visible ? 0 : -12,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fade, slide]);

  // pointerEvents="none" — o snackbar é só informacional; não rouba
  // toques de elementos sob ele.
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          top: insets.top + Spacing.sm,
          opacity: fade,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: palette.surface,
            borderColor: palette.outlineVariant,
            shadowColor: palette.shadow,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {comSpinner ? (
          <ActivityIndicator size="small" color={palette.onSurfaceVariant} />
        ) : null}
        <Text style={[styles.text, { color: palette.onSurface }]}>
          {mensagem}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 70,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    ...Typography.label,
    fontWeight: "600",
  },
});
