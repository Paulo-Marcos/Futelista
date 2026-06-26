import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Goal } from "@/src/domain/Goal";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { AppBottomSheet } from "@/src/shared/ui/AppBottomSheet";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { minutoDoGol } from "./helpers";

/**
 * Sheet de ações para um gol selecionado via long-press na timeline
 * (F-11). 2 opções: corrigir autor (abre subsheet) e remover (passa
 * pra confirmAcao do callsite).
 */
export function GolActionSheet({
  gol,
  onClose,
  onCorrigirAutor,
  onRemover,
}: {
  gol: Goal | null;
  onClose: () => void;
  onCorrigirAutor: (g: Goal) => void;
  onRemover: (g: Goal) => void;
}) {
  const palette = usePalette();
  return (
    <AppBottomSheet visible={gol !== null} onClose={onClose} snapPoint="50%">
      <View style={styles.sheet}>
        {gol ? (
          <>
            <View style={styles.sheetHead}>
              <View>
                <Text
                  style={[
                    styles.sheetEyebrow,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  Gol — {gol.player.name} ({minutoDoGol(gol)}')
                </Text>
                <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
                  Corrigir registro
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar ações do gol"
                style={styles.iconBtn}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={palette.onSurface}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => onCorrigirAutor(gol)}
              accessibilityRole="button"
              accessibilityLabel="Corrigir autor do gol"
              style={({ pressed }) => [
                styles.golActionRow,
                {
                  backgroundColor: palette.surfaceContainerHigh,
                  borderColor: palette.outlineVariant,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account-edit-outline"
                size={20}
                color={palette.primary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.golActionTitle, { color: palette.onSurface }]}
                >
                  Corrigir autor
                </Text>
                <Text
                  style={[
                    styles.golActionSub,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  Escolha o jogador certo entre os 2 times
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={palette.onSurfaceVariant}
              />
            </Pressable>

            <Pressable
              onPress={() => onRemover(gol)}
              accessibilityRole="button"
              accessibilityLabel="Remover este gol"
              style={({ pressed }) => [
                styles.golActionRow,
                {
                  backgroundColor: palette.errorContainer,
                  borderColor: palette.error,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color={palette.error}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.golActionTitle, { color: palette.error }]}>
                  Remover este gol
                </Text>
                <Text
                  style={[
                    styles.golActionSub,
                    { color: palette.error, opacity: 0.85 },
                  ]}
                >
                  Apaga o registro definitivamente
                </Text>
              </View>
            </Pressable>
          </>
        ) : null}
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
    borderCurve: "continuous",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetEyebrow: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
  },
  sheetTitle: { ...Typography.headline, fontSize: 18, marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  golActionRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  golActionTitle: { ...Typography.title, fontSize: 14 },
  golActionSub: { ...Typography.label, fontSize: 11, marginTop: 2 },
});
