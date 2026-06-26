import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { AppBottomSheet } from "@/src/shared/ui/AppBottomSheet";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function ModalAdicionarLote({
  visivel,
  onFechar,
  onConfirmar,
}: {
  visivel: boolean;
  onFechar: () => void;
  onConfirmar: (nomes: string[]) => void;
}) {
  const palette = usePalette();
  const [texto, setTexto] = useState("");

  useEffect(() => {
    if (!visivel) setTexto("");
  }, [visivel]);

  const nomes = useMemo(
    () =>
      texto
        .split(/[\n,;]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    [texto],
  );

  return (
    <AppBottomSheet visible={visivel} onClose={onFechar} snapPoint="55%">
      <View style={styles.modalCard}>
        <Text style={[styles.modalTitle, { color: palette.onSurface }]}>
          Adicionar vários
        </Text>
        <Text style={[styles.modalHint, { color: palette.onSurfaceVariant }]}>
          Cole ou digite um nome por linha (ou separados por vírgula). Vazios e
          duplicados serão ignorados.
        </Text>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          multiline
          autoFocus
          placeholder={"Ex.:\nAna\nBia\nCaio"}
          placeholderTextColor={palette.onSurfaceVariant}
          accessibilityLabel="Lista de nomes para adicionar em lote"
          style={[
            styles.modalInput,
            {
              color: palette.onSurface,
              borderColor: palette.outline,
              backgroundColor: palette.background,
            },
          ]}
        />
        <Text
          style={[styles.modalCounter, { color: palette.onSurfaceVariant }]}
        >
          {nomes.length} {nomes.length === 1 ? "nome" : "nomes"} reconhecidos
        </Text>
        <View style={styles.modalActions}>
          <Pressable
            onPress={onFechar}
            accessibilityRole="button"
            accessibilityLabel="Cancelar adição em lote"
            style={({ pressed }) => [
              styles.modalSecondary,
              {
                borderColor: palette.outline,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ color: palette.onSurface }}>Cancelar</Text>
          </Pressable>
          {/* Sem glow no botão de modal — convenção: glow só em CTA
                principal da tela. Modal já está sobreposto ao fundo, não
                precisa competir visualmente. */}
          <Pressable
            onPress={() => onConfirmar(nomes)}
            disabled={nomes.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Confirmar adição em lote"
            style={({ pressed }) => [
              styles.modalPrimary,
              {
                backgroundColor:
                  nomes.length > 0 ? palette.primary : palette.primaryDim,
                opacity:
                  pressed && nomes.length > 0
                    ? 0.85
                    : nomes.length > 0
                      ? 1
                      : 0.6,
              },
            ]}
          >
            <Text style={{ color: palette.onPrimary, fontWeight: "600" }}>
              Adicionar {nomes.length > 0 ? nomes.length : ""}
            </Text>
          </Pressable>
        </View>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  modalCard: {
    flex: 1,
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.sm,
  },
  modalTitle: {
    ...Typography.headline,
  },
  modalHint: {
    ...Typography.body,
  },
  // `flex: 1` faz o textarea ocupar o espaço sobrando entre o cabeçalho e os
  // botões e rolar internamente quando a lista é grande — antes ele crescia
  // (até maxHeight) e empurrava os botões pra fora da área visível do sheet.
  modalInput: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    fontSize: 15,
    textAlignVertical: "top",
  },
  modalCounter: {
    ...Typography.label,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalSecondary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modalPrimary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
});
