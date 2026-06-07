import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";

/**
 * PlayerAvatar — foto se houver, senão avatar divertido procedural
 * determinístico pelo nome (offline, sem dependência de rede),
 * fallback final em iniciais.
 *
 * Tone "A"/"B" adiciona anel de borda na cor primária/secundária.
 * `ring` envolve com anel duplo (usado na celebração de gol).
 */

const FUN_PALETTE: Array<[string, string]> = [
  ["#FF6B6B", "#FFD93D"],
  ["#4ECDC4", "#1A535C"],
  ["#FF6F61", "#6B5B95"],
  ["#88B04B", "#F7CAC9"],
  ["#92A8D1", "#034F84"],
  ["#955251", "#B565A7"],
  ["#009B77", "#DD4124"],
  ["#45B7D1", "#FFA07A"],
  ["#F39C12", "#8E44AD"],
  ["#16A085", "#F1C40F"],
  ["#E74C3C", "#3498DB"],
  ["#2ECC71", "#9B59B6"],
];

function avatarHash(seed: string): number {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type PlayerLite = Pick<Player, "id" | "name"> & { photoUri?: string };

type PlayerAvatarProps = {
  player: PlayerLite;
  size?: number;
  tone?: "A" | "B";
  ring?: boolean;
};

export function PlayerAvatar({
  player,
  size = 40,
  tone,
  ring,
}: PlayerAvatarProps) {
  const palette = usePalette();
  const h = avatarHash(player.name + ":" + player.id);
  const [c1, c2] = FUN_PALETTE[h % FUN_PALETTE.length];
  const fs = Math.round(size * 0.36);
  const toneColor =
    tone === "A"
      ? palette.primary
      : tone === "B"
        ? palette.secondary
        : undefined;

  const ringInner: ViewStyle | null = toneColor
    ? {
        borderWidth: ring ? 2 : 2,
        borderColor: toneColor,
      }
    : null;
  const ringOuter: ViewStyle | null =
    ring && toneColor
      ? {
          padding: 3,
          borderRadius: size / 2 + 5,
          backgroundColor: palette.background,
        }
      : null;

  const content = player.photoUri ? (
    <Image
      source={{ uri: player.photoUri }}
      style={[styles.image, { width: size, height: size }]}
    />
  ) : (
    <FunBackground c1={c1} c2={c2} size={size} hash={h} />
  );

  const innerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: "hidden",
    ...(ringInner ?? {}),
  };

  const node = (
    <View style={innerStyle} aria-hidden>
      {content}
      {!player.photoUri ? (
        <View style={styles.initialsLayer} pointerEvents="none">
          <Text
            style={[
              styles.initialsText,
              {
                fontSize: fs,
                color: "#FFFFFF",
                textShadowColor: "rgba(0,0,0,0.35)",
                textShadowRadius: 2,
              },
            ]}
          >
            {initials(player.name)}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (ringOuter) {
    return <View style={ringOuter}>{node}</View>;
  }
  return node;
}

function FunBackground({
  c1,
  c2,
  size,
  hash,
}: {
  c1: string;
  c2: string;
  size: number;
  hash: number;
}) {
  const id = "ag" + (hash & 0xffff).toString(36);
  const blobX = 20 + ((hash >> 3) % 40);
  const blobY = 20 + ((hash >> 7) % 40);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c1} />
          <Stop offset="1" stopColor={c2} />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill={`url(#${id})`} />
      <Circle
        cx={blobX}
        cy={blobY}
        r="32"
        fill="#FFFFFF"
        opacity={0.18}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },
  initialsLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
