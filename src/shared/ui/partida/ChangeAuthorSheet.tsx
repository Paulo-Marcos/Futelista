import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { Goal } from "@/src/domain/Goal";
import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { AppBottomSheet } from "@/src/shared/ui/AppBottomSheet";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { AutorOption } from "./AutorOption";
import { minutoDoGol } from "./helpers";

/**
 * Subsheet aberto a partir do `GolActionSheet`. Lista os jogadores dos
 * 2 times (em campo, no momento) — o domínio decide se vira ownGoal
 * quando o escolhido não pertence ao `gol.team`.
 */
export function ChangeAuthorSheet({
  gol,
  onClose,
  onEscolher,
}: {
  gol: Goal | null;
  onClose: () => void;
  onEscolher: (g: Goal, novoAutor: Player) => void;
}) {
  const palette = usePalette();
  if (!gol) {
    return (
      <AppBottomSheet visible={false} onClose={onClose} snapPoint="65%">
        <View />
      </AppBottomSheet>
    );
  }
  const teamA = gol.match.teamA;
  const teamB = gol.match.teamB;
  return (
    <AppBottomSheet visible onClose={onClose} snapPoint="65%">
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <View>
            <Text
              style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
            >
              Corrigir autor — {minutoDoGol(gol)}'
            </Text>
            <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
              Quem fez de verdade?
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={palette.onSurface}
            />
          </Pressable>
        </View>

        <BottomSheetScrollView style={styles.subAuthorScroll}>
          <View style={styles.subColRow}>
            <View style={styles.subCol}>
              <View
                style={[
                  styles.subTag,
                  { backgroundColor: palette.primary + "22" },
                ]}
              >
                <Text style={[styles.subTagText, { color: palette.primary }]}>
                  Time 1
                </Text>
              </View>
              {teamA.players.map((p) => (
                <AutorOption
                  key={p.id}
                  player={p}
                  tone="A"
                  eAtual={p.id === gol.player.id}
                  onPress={() => onEscolher(gol, p)}
                />
              ))}
            </View>
            <View style={styles.subCol}>
              <View
                style={[
                  styles.subTag,
                  { backgroundColor: palette.secondary + "22" },
                ]}
              >
                <Text style={[styles.subTagText, { color: palette.secondary }]}>
                  Time 2
                </Text>
              </View>
              {teamB.players.map((p) => (
                <AutorOption
                  key={p.id}
                  player={p}
                  tone="B"
                  eAtual={p.id === gol.player.id}
                  onPress={() => onEscolher(gol, p)}
                />
              ))}
            </View>
          </View>
        </BottomSheetScrollView>
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
  // Sheet de troca de autor do gol: lista pode passar de uma tela; altura
  // limitada com rolagem própria (também via BottomSheetScrollView).
  subAuthorScroll: { maxHeight: 380 },
  subColRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs },
  subCol: { flex: 1, gap: 4 },
  subTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginBottom: 2,
  },
  subTagText: { ...Typography.label, fontSize: 10 },
});
