import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export function LinhaEdicao({
  valor,
  onChange,
  onConfirmar,
  onCancelar,
}: {
  valor: string;
  onChange: (v: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.editRow,
        {
          backgroundColor: palette.surface,
          borderColor: palette.primary,
        },
      ]}
    >
      <TextInput
        value={valor}
        onChangeText={onChange}
        autoFocus
        onSubmitEditing={onConfirmar}
        // Commit ao perder foco (clicar fora) — comportamento "edit in place".
        onBlur={onConfirmar}
        accessibilityLabel="Editar nome do jogador"
        style={[styles.editInput, { color: palette.onSurface }]}
      />
      <Pressable
        onPress={onConfirmar}
        accessibilityRole="button"
        accessibilityLabel="Confirmar edição"
        style={styles.iconAction}
        android_ripple={{ color: palette.goal + "33" }}
      >
        <MaterialCommunityIcons name="check" size={22} color={palette.goal} />
      </Pressable>
      <Pressable
        onPress={onCancelar}
        accessibilityRole="button"
        accessibilityLabel="Cancelar edição"
        style={styles.iconAction}
        android_ripple={{ color: palette.warning + "33" }}
      >
        <MaterialCommunityIcons
          name="close"
          size={22}
          color={palette.warning}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minHeight: 56,
    borderCurve: "continuous",
  },
  editInput: {
    flex: 1,
    ...Typography.title,
    fontSize: 16,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
