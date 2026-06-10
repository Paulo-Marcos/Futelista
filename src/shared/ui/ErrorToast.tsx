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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Toast flutuante de erro (M-11) — substitui o banner inline que
 * empurrava o conteúdo. Aparece sobreposto na parte inferior da tela
 * com fade-in + slide-up; o auto-dismiss continua sendo
 * responsabilidade do callsite (setTimeout que zera `erro`).
 *
 * Props:
 *  - `erro: string | null` → quando `null`, o toast não renderiza.
 *  - `onFechar`           → handler do X.
 *  - `bottomOffset`       → opcional, somado ao `insets.bottom` (ex.: pra
 *                            ficar acima de um FAB que já vive lá).
 */
export function ErrorToast({
  erro,
  onFechar,
  bottomOffset = 0,
}: {
  erro: string | null;
  onFechar: () => void;
  bottomOffset?: number;
}) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!erro) return;
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
    return () => {
      // O state externo controla unmount; aqui só preparamos um próximo
      // ciclo de entrada caso a mesma instância seja reutilizada.
      fade.setValue(0);
      slide.setValue(20);
    };
  }, [erro, fade, slide]);

  if (!erro) return null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: insets.bottom + Spacing.lg + bottomOffset,
          opacity: fade,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: palette.errorContainer,
            borderColor: palette.error,
            shadowColor: palette.shadow,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <MaterialCommunityIcons
          name="alert-circle"
          size={16}
          color={palette.error}
        />
        <Text style={[styles.text, { color: palette.error }]} selectable>
          {erro}
        </Text>
        <Pressable
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
          hitSlop={8}
          style={styles.closeBtn}
          android_ripple={{ color: palette.error + "33" }}
        >
          <MaterialCommunityIcons
            name="close"
            size={16}
            color={palette.error}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    ...Typography.label,
    flex: 1,
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
