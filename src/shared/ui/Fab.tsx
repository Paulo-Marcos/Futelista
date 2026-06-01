import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

type FabProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  extended?: string;
  testID?: string;
};

/**
 * Floating Action Button (Material 3). Posiciona automaticamente no canto
 * inferior direito do parent (este precisa ter position relative ou ser
 * o ScrollView/View root da tela).
 *
 * Variante `extended` mostra texto ao lado do ícone.
 */
export function Fab({ icon, onPress, extended, testID }: FabProps) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        styles.elevation,
        {
          backgroundColor: palette.primary,
          opacity: pressed ? 0.85 : 1,
          paddingHorizontal: extended ? Spacing.lg : 0,
          width: extended ? undefined : 56,
        },
      ]}
      android_ripple={{ color: palette.onPrimary + "33" }}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={palette.onPrimary}
        />
        {extended ? (
          <Text style={[styles.label, { color: palette.onPrimary }]}>
            {extended}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  elevation: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    ...Typography.title,
    fontSize: 16,
  },
});
