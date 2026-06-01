import { StyleSheet, Text, View } from "react-native";

import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

type TabHeaderProps = {
  title: string;
};

/**
 * Header compacto das tabs Jogadores e Times.
 * Mostra o título da tab + nome da pelada como subtítulo.
 *
 * O dashboard completo (chips de regras, CTA, gerenciar) fica só na
 * tab Pelada — aqui o foco é o conteúdo da lista.
 */
export function TabHeader({ title }: TabHeaderProps) {
  const palette = usePalette();
  const nomePelada = useGameSlice((g) => g.name);
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.surface,
          borderBottomColor: palette.outlineVariant,
        },
      ]}
    >
      <Text
        style={[styles.subtitle, { color: palette.onSurfaceVariant }]}
        numberOfLines={1}
      >
        {nomePelada}
      </Text>
      <Text
        style={[styles.title, { color: palette.onSurface }]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  subtitle: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.headline,
    marginTop: 2,
  },
});
