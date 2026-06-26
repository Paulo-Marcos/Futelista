import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

export function ConfettiPiece({
  index,
  color,
}: {
  index: number;
  color: string;
}) {
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

const styles = StyleSheet.create({
  confettiPiece: {
    position: "absolute",
    top: 0,
    width: 9,
    height: 14,
    borderRadius: 2,
  },
});
