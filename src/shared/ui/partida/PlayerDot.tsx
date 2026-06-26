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

import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { Typography } from "@/src/shared/theme/Colors";

export function PlayerDot({
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
          <View style={[styles.dotGoal, { backgroundColor: palette.goal }]}>
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

const styles = StyleSheet.create({
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
});
