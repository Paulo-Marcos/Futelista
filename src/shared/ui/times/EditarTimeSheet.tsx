import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { AppBottomSheet } from "@/src/shared/ui/AppBottomSheet";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/** Paleta de cores predefinidas para o usuário escolher. Hex 6 dígitos. */
const CORES_TIME: readonly { hex: string; label: string }[] = [
  { hex: "#E11D2A", label: "Vermelho" },
  { hex: "#2E6BE6", label: "Azul" },
  { hex: "#12A150", label: "Verde" },
  { hex: "#F4C20D", label: "Amarelo" },
  { hex: "#1C1C1E", label: "Preto" },
  { hex: "#7B3FE4", label: "Roxo" },
];

export function EditarTimeSheet({
  team,
  idx,
  onClose,
  onSalvar,
}: {
  team: Team | null;
  idx: number;
  onClose: () => void;
  onSalvar: (time: Team, patch: { nome?: string; cor?: string }) => void;
}) {
  const palette = usePalette();
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!team) return;
    setNome(team.nomeCustom ?? "");
    setCor(team.corCustom);
  }, [team?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!team) return null;

  const placeholderNome = nomeDoTime(team, idx);

  return (
    <AppBottomSheet visible onClose={onClose} snapPoint="75%">
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <View>
            <Text
              style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
            >
              Personalizar
            </Text>
            <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
              Editar time
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar editor de time"
            style={styles.sheetCloseBtn}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={palette.onSurface}
            />
          </Pressable>
        </View>

        <ScrollView style={{ maxHeight: 420 }}>
          <Text
            style={[styles.sheetLabel, { color: palette.onSurfaceVariant }]}
          >
            Nome
          </Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder={placeholderNome}
            placeholderTextColor={palette.onSurfaceVariant}
            maxLength={30}
            accessibilityLabel="Nome do time"
            style={[
              styles.sheetInput,
              {
                color: palette.onSurface,
                borderColor: palette.outline,
                backgroundColor: palette.background,
              },
            ]}
          />

          <Text
            style={[
              styles.sheetLabel,
              { color: palette.onSurfaceVariant, marginTop: Spacing.md },
            ]}
          >
            Cor
          </Text>
          <View style={styles.coresGrid}>
            <Pressable
              onPress={() => setCor(undefined)}
              accessibilityRole="button"
              accessibilityLabel="Cor padrão (do escudo)"
              accessibilityState={{ selected: cor === undefined }}
              style={({ pressed }) => [
                styles.corChip,
                {
                  backgroundColor: palette.surfaceContainerHigh,
                  borderColor:
                    cor === undefined ? palette.primary : palette.outline,
                  borderWidth: cor === undefined ? 2 : 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="palette-swatch"
                size={18}
                color={palette.onSurfaceVariant}
              />
              <Text style={[styles.corLabel, { color: palette.onSurface }]}>
                Padrão
              </Text>
            </Pressable>
            {CORES_TIME.map((c) => (
              <Pressable
                key={c.hex}
                onPress={() => setCor(c.hex)}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${c.label}`}
                accessibilityState={{ selected: cor === c.hex }}
                style={({ pressed }) => [
                  styles.corChip,
                  {
                    backgroundColor: palette.surfaceContainerHigh,
                    borderColor:
                      cor === c.hex ? palette.primary : palette.outline,
                    borderWidth: cor === c.hex ? 2 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.corDot, { backgroundColor: c.hex }]} />
                <Text style={[styles.corLabel, { color: palette.onSurface }]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Pressable
          onPress={() =>
            onSalvar(team, {
              nome: nome.trim(),
              cor: cor ?? "",
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Salvar edição do time"
          style={({ pressed }) => [
            styles.sheetSalvar,
            {
              backgroundColor: palette.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={palette.onPrimary}
          />
          <Text style={[styles.sheetSalvarText, { color: palette.onPrimary }]}>
            Salvar
          </Text>
        </Pressable>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: Spacing.sm,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sheetEyebrow: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 10,
  },
  sheetTitle: { ...Typography.headline, fontSize: 18, marginTop: 2 },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetLabel: {
    ...Typography.label,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sheetInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    ...Typography.body,
    fontSize: 15,
    borderCurve: "continuous",
  },
  coresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  corChip: {
    flexBasis: "30%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  corDot: { width: 18, height: 18, borderRadius: 9 },
  corLabel: { ...Typography.label, fontSize: 12, flex: 1 },
  sheetSalvar: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  sheetSalvarText: { ...Typography.title, fontSize: 15, fontWeight: "800" },
});
