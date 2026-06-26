import { StyleSheet, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { ConfettiPiece } from "./ConfettiPiece";

export function Confetti({
  side,
  palette,
}: {
  side: "A" | "B";
  palette: ReturnType<typeof usePalette>;
}) {
  // 14 partículas distribuídas horizontalmente, caem com delay escalonado.
  const colors = [
    side === "A" ? palette.primary : palette.secondary,
    palette.goal,
    palette.tertiary,
    palette.primary,
  ];
  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {Array.from({ length: 14 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} color={colors[i % colors.length]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  confettiLayer: {
    position: "absolute",
    top: -20,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
