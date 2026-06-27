import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { AppBottomSheet } from "@/src/shared/ui/AppBottomSheet";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";
import { FieldPlayerItem } from "./FieldPlayerItem";

/**
 * Par de troca: jogador `outP` (em campo, time `side`) sai pra `inP`
 * entrar. Usado no modo multi-select da `SubstitutionSheet`.
 */
export type ParTroca = {
  outP: Player;
  inP: Player;
  side: "A" | "B";
};

function SubstitutionSheetImpl({
  open,
  teamA,
  teamB,
  reservas,
  onClose,
  onSub,
  onSubMultiplos,
}: {
  open: boolean;
  teamA: Team;
  teamB: Team;
  reservas: Player[];
  onClose: () => void;
  onSub: (side: "A" | "B", outPlayer: Player) => void;
  /**
   * Aplica vários pares de troca de uma vez. Quando ausente, o modo
   * multi fica disponível visualmente mas o "Aplicar" cai em pares
   * individuais via `onSub`. Em produção sempre vem preenchido.
   */
  onSubMultiplos?: (pares: ParTroca[]) => void;
}) {
  const palette = usePalette();
  const [selected, setSelected] = useState<{
    side: "A" | "B";
    player: Player;
  } | null>(null);
  const [multi, setMulti] = useState(false);
  const [pares, setPares] = useState<ParTroca[]>([]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setPares([]);
      setMulti(false);
    }
  }, [open]);

  // Tabelas reversas pra checar "já está em algum par?" sem percorrer
  // a lista N vezes.
  const outIds = new Set(pares.map((p) => p.outP.id));
  const inIds = new Set(pares.map((p) => p.inP.id));

  const onPickField = (side: "A" | "B", player: Player) => {
    if (!multi) {
      setSelected({ side, player });
      return;
    }
    if (outIds.has(player.id)) {
      // Cancela o par já criado pra esse jogador.
      setPares((prev) => prev.filter((p) => p.outP.id !== player.id));
      return;
    }
    setSelected({ side, player });
  };

  const onPickBench = (player?: Player) => {
    if (!selected) return;
    if (!multi) {
      onSub(selected.side, selected.player);
      return;
    }
    if (!player) return;
    if (inIds.has(player.id)) {
      // Toque num jogador já pareado: cancela o par dele.
      setPares((prev) => prev.filter((p) => p.inP.id !== player.id));
      return;
    }
    setPares((prev) => [
      ...prev,
      { outP: selected.player, inP: player, side: selected.side },
    ]);
    setSelected(null);
  };

  const aplicarMultiplos = () => {
    if (pares.length === 0) return;
    if (onSubMultiplos) onSubMultiplos(pares);
    else pares.forEach((p) => onSub(p.side, p.outP));
  };

  return (
    <AppBottomSheet visible={open} onClose={onClose} snapPoint="85%">
      <View style={[styles.sheet, styles.subSheetFill]}>
        <View style={styles.sheetHead}>
          <View>
            <Text
              style={[styles.sheetEyebrow, { color: palette.onSurfaceVariant }]}
            >
              Substituição
            </Text>
            <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
              {multi ? `Trocar vários (${pares.length})` : "Manter o time"}
            </Text>
          </View>
          <View style={styles.sheetHeadActions}>
            <Pressable
              onPress={() => {
                // Alterna modo; ao sair do multi, descarta pares pendentes.
                setMulti((v) => {
                  if (v) setPares([]);
                  setSelected(null);
                  return !v;
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={
                multi
                  ? "Voltar para troca única"
                  : "Selecionar vários jogadores"
              }
              accessibilityState={{ selected: multi }}
              style={({ pressed }) => [
                styles.multiToggle,
                {
                  backgroundColor: multi
                    ? palette.primary
                    : palette.surfaceContainerHigh,
                  borderColor: multi ? palette.primary : palette.outline,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="checkbox-multiple-outline"
                size={14}
                color={multi ? palette.onPrimary : palette.onSurface}
              />
              <Text
                style={[
                  styles.multiToggleText,
                  {
                    color: multi ? palette.onPrimary : palette.onSurface,
                  },
                ]}
              >
                Vários
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={palette.onSurface}
              />
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.subHint,
            {
              backgroundColor: selected
                ? palette.goal + "22"
                : palette.surfaceContainerHigh,
              borderColor: selected ? palette.goal : palette.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="account-switch"
            size={14}
            color={selected ? palette.goal : palette.onSurfaceVariant}
          />
          <Text style={[styles.subHintText, { color: palette.onSurface }]}>
            {selected
              ? `${selected.player.name} sai — toque em quem entra do banco`
              : multi
                ? pares.length === 0
                  ? "Selecione pares (em campo → banco). Toque em 'Aplicar' no fim."
                  : `${pares.length} ${pares.length === 1 ? "troca pareada" : "trocas pareadas"} — selecione mais ou toque 'Aplicar'`
                : "1. Toque em quem sai (em campo)"}
          </Text>
        </View>

        <BottomSheetScrollView style={styles.subScroll}>
          <Text
            style={[
              styles.sheetEyebrow,
              {
                color: palette.onSurfaceVariant,
                marginTop: Spacing.sm,
              },
            ]}
          >
            Em campo
          </Text>
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
                <FieldPlayerItem
                  key={p.id}
                  player={p}
                  tone="A"
                  selected={selected?.player.id === p.id || outIds.has(p.id)}
                  onPress={() => onPickField("A", p)}
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
                <FieldPlayerItem
                  key={p.id}
                  player={p}
                  tone="B"
                  selected={selected?.player.id === p.id || outIds.has(p.id)}
                  onPress={() => onPickField("B", p)}
                />
              ))}
            </View>
          </View>

          <Text
            style={[
              styles.sheetEyebrow,
              {
                color: palette.onSurfaceVariant,
                marginTop: Spacing.md,
              },
            ]}
          >
            Banco {reservas.length ? `(${reservas.length})` : ""}
          </Text>
          {reservas.length === 0 ? (
            <Text
              style={[styles.subEmpty, { color: palette.onSurfaceVariant }]}
            >
              Sem reservas no banco agora.
            </Text>
          ) : (
            <View style={styles.benchList}>
              {reservas.map((p) => {
                const pareado = inIds.has(p.id);
                const habilitado = pareado || !!selected;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => onPickBench(p)}
                    disabled={!habilitado}
                    accessibilityRole="button"
                    accessibilityLabel={
                      pareado
                        ? `Cancelar troca de ${p.name}`
                        : `Trocar ${p.name} para entrar`
                    }
                    style={({ pressed }) => [
                      styles.benchItem,
                      {
                        backgroundColor: pareado
                          ? palette.goal + "22"
                          : palette.surfaceContainerHigh,
                        borderColor: pareado
                          ? palette.goal
                          : palette.outlineVariant,
                        opacity: habilitado ? (pressed ? 0.8 : 1) : 0.5,
                      },
                    ]}
                  >
                    <PlayerAvatar player={p} size={32} />
                    <Text
                      style={[
                        styles.benchItemName,
                        { color: palette.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <View style={styles.benchItemRight}>
                      <MaterialCommunityIcons
                        name={pareado ? "check-circle" : "arrow-down"}
                        size={12}
                        color={palette.goal}
                      />
                      <Text
                        style={[styles.benchItemEnter, { color: palette.goal }]}
                      >
                        {pareado ? "pareado" : "entra"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </BottomSheetScrollView>

        {multi ? (
          <Pressable
            onPress={aplicarMultiplos}
            disabled={pares.length === 0}
            accessibilityRole="button"
            accessibilityLabel={
              pares.length > 0
                ? `Aplicar ${pares.length} ${pares.length === 1 ? "troca" : "trocas"}`
                : "Aplicar trocas"
            }
            accessibilityState={{ disabled: pares.length === 0 }}
            style={({ pressed }) => [
              styles.aplicarBtn,
              {
                backgroundColor:
                  pares.length === 0 ? palette.primaryDim : palette.primary,
                opacity: pares.length === 0 ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-all"
              size={18}
              color={palette.onPrimary}
            />
            <Text style={[styles.aplicarBtnText, { color: palette.onPrimary }]}>
              {pares.length === 0
                ? "Aplicar trocas"
                : `Aplicar ${pares.length} ${pares.length === 1 ? "troca" : "trocas"}`}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AppBottomSheet>
  );
}

// React.memo: num tick puro do cronômetro as props (open/teamA/teamB/reservas/
// handlers) mantêm referência — o sheet não re-renderiza por segundo.
export const SubstitutionSheet = memo(SubstitutionSheetImpl);

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
    borderCurve: "continuous",
  },
  // Substituição: o card preenche o sheet (85%) e a lista de campo+banco
  // rola por dentro (BottomSheetScrollView), mantendo o botão "Aplicar" fixo.
  subSheetFill: { flex: 1 },
  subScroll: { flex: 1 },
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
  subHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  subHintText: { ...Typography.body, fontSize: 13, flex: 1 },
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
  subEmpty: { ...Typography.body, fontStyle: "italic", marginTop: 4 },
  benchList: { gap: Spacing.xs, marginTop: 4 },
  benchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  benchItemName: { ...Typography.body, fontSize: 14, flex: 1 },
  benchItemRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  benchItemEnter: { ...Typography.label, fontSize: 11 },
  sheetHeadActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  multiToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  multiToggleText: { ...Typography.label, fontSize: 11 },
  aplicarBtn: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  aplicarBtnText: { ...Typography.title, fontSize: 15 },
});
