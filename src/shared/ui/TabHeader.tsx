import { StyleSheet, Text, View } from "react-native";

import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

type TabHeaderProps = {
  title: string;
  /**
   * Linha pequena exibida ABAIXO do título (handoff `rn-export/Jogadores.tsx`).
   * Quando passada, substitui o overline com o nome da pelada — caso típico:
   * `"15 na pelada"`.
   */
  subtitle?: string;
};

/**
 * Header compacto das tabs Jogadores e Times.
 *
 * Sem `subtitle`: overline com o nome da pelada (uppercase, dim) + título.
 * Com `subtitle`: título + sub-line abaixo (não-uppercase), como pedido pelo
 * handoff de Jogadores. O overline com o nome da pelada some nesse caso para
 * manter o título grande como elemento dominante.
 */
export function TabHeader({ title, subtitle }: TabHeaderProps) {
  const palette = usePalette();
  const nomePelada = useGameSlice((g) => g.name);
  return (
    <View
      style={[styles.container, { backgroundColor: palette.surface }]}
    >
      {subtitle ? null : (
        <Text
          style={[styles.overline, { color: palette.onSurfaceVariant }]}
          numberOfLines={1}
        >
          {nomePelada}
        </Text>
      )}
      <Text
        style={[
          subtitle ? styles.titleLarge : styles.title,
          { color: palette.onSurface },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[styles.subtitle, { color: palette.onSurfaceVariant }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // "Faixa" do topo da aba: bg `palette.surface` (mais claro que o screen,
  // que é `palette.background`) com paddings generosos pra a barra ter
  // presença visual. Sem border bottom — a transição é só de tom.
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  overline: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Quando há subtitle (tab Jogadores do hand-off), o título usa o tamanho
  // grande do protótipo (30/800/-0.6) — bem maior que o Typography.headline
  // (24/800). Sem subtitle (tab Times) o tamanho legado é mantido.
  title: {
    ...Typography.headline,
    marginTop: 2,
  },
  titleLarge: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
});
