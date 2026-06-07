import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";

/**
 * LivePulseDot — bolinha que pulsa (anel expandindo) para indicar
 * estados "ao vivo" / live.
 *
 * Portado de prototype/css/app.css (.fl-dot.is-live + @keyframes pulse).
 * Reusável em Home (hero status), seleção (pelada com execução),
 * scoreboard, nav.
 */
export function LivePulseDot({
  size = 8,
  color,
  live = true,
}: {
  size?: number;
  color?: string;
  live?: boolean;
}) {
  const palette = usePalette();
  const dotColor = color ?? palette.goal;

  const opacity = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!live) {
      opacity.setValue(1);
      ringOpacity.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale, {
              toValue: 2.4,
              duration: 1400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 1400,
              easing: Easing.out(Easing.ease),
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
              toValue: 0.4,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, opacity, ringOpacity, ringScale]);

  return (
    <Animated.View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          styles.ring,
          {
            backgroundColor: dotColor,
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  dot: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
