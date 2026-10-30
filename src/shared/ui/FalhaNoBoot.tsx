import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { EmptyState } from "@/src/shared/ui/EmptyState";

/**
 * Tela exibida quando o app não consegue ler o armazenamento no boot.
 * Sem ela o provider ficaria sem renderizar nada — tela em branco eterna.
 */
export function FalhaNoBoot({
  detalhe,
  onTentarDeNovo,
}: {
  detalhe: string;
  onTentarDeNovo: () => void;
}) {
  const palette = usePalette();
  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <EmptyState
        icon="database-alert-outline"
        title="Não foi possível abrir suas peladas"
        description="O armazenamento do aparelho não respondeu. Seus dados não foram apagados."
        actionLabel="Tentar de novo"
        onAction={onTentarDeNovo}
      />
      <Text
        style={[styles.detalhe, { color: palette.onSurfaceVariant }]}
        selectable
      >
        {detalhe}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: Spacing.lg },
  detalhe: { ...Typography.label, textAlign: "center", marginTop: Spacing.md },
});
