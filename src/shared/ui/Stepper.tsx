import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};

/**
 * Stepper Material-ish: [-] valor [+].
 * Usado em formulário de regras (jogadores por time, tempos, limite de gols).
 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  disabled,
}: StepperProps) {
  const palette = usePalette();
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const setIfValid = (next: number) => {
    if (next < min || next > max) return;
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <Pressable
        disabled={!canDecrement}
        onPress={() => setIfValid(value - step)}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: canDecrement ? palette.primary : palette.outline,
            opacity: pressed && canDecrement ? 0.6 : 1,
          },
        ]}
        android_ripple={{ color: palette.primary + "22" }}
      >
        <MaterialCommunityIcons
          name="minus"
          size={20}
          color={canDecrement ? palette.primary : palette.onSurfaceVariant}
        />
      </Pressable>
      <Text style={[styles.value, { color: palette.onSurface }]} selectable>
        {value}
      </Text>
      <Pressable
        disabled={!canIncrement}
        onPress={() => setIfValid(value + step)}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: canIncrement ? palette.primary : palette.outline,
            opacity: pressed && canIncrement ? 0.6 : 1,
          },
        ]}
        android_ripple={{ color: palette.primary + "22" }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={20}
          color={canIncrement ? palette.primary : palette.onSurfaceVariant}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  value: {
    ...Typography.title,
    fontSize: 20,
    minWidth: 32,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});
