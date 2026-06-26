import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { AppBottomSheet } from "@/src/shared/ui/AppBottomSheet";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { StatTile } from "@/src/shared/ui/jogadores/StatTile";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Bottom sheet de leitura — não persiste nada, só agrega o que o domínio
 * já expõe via `Player.stats()`. Aparece quando `player !== null`; o
 * próprio componente lida com renderização condicional pra evitar
 * destruir o Modal a cada open/close (mantém o RN feliz).
 */
export function EstatisticasJogadorSheet({
  player,
  totalPartidasEncerradas,
  onFechar,
}: {
  player: Player | null;
  totalPartidasEncerradas: number;
  onFechar: () => void;
}) {
  const palette = usePalette();
  const stats = player?.stats();
  const presencaPct =
    stats && totalPartidasEncerradas > 0
      ? Math.round(
          // Conta como "partida disputada" só as que terminaram —
          // partidas em andamento não entram no denominador.
          (somaResultados(stats) / totalPartidasEncerradas) * 100,
        )
      : null;
  return (
    <AppBottomSheet
      visible={player !== null}
      onClose={onFechar}
      snapPoint="65%"
    >
      <View style={styles.sheetCard}>
        {player ? (
          <>
            <View style={styles.sheetHeader}>
              <PlayerAvatar player={player} size={56} />
              <View style={styles.sheetHeaderText}>
                <Text
                  style={[styles.sheetName, { color: palette.onSurface }]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
                <Text
                  style={[
                    styles.sheetSubtitle,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  Estatísticas nesta execução
                </Text>
              </View>
              <Pressable
                onPress={onFechar}
                accessibilityRole="button"
                accessibilityLabel="Fechar estatísticas"
                style={({ pressed }) => [
                  styles.sheetClose,
                  {
                    backgroundColor: palette.surfaceContainerHigh,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={palette.onSurface}
                />
              </Pressable>
            </View>

            {stats ? (
              <View style={styles.sheetStatsGrid}>
                <StatTile
                  icon="soccer"
                  label="Gols"
                  value={stats.gols}
                  accent="goal"
                />
                <StatTile
                  icon="whistle"
                  label="Partidas"
                  value={stats.partidas}
                />
                <StatTile
                  icon="trophy-outline"
                  label="Vitórias"
                  value={stats.vitorias}
                  accent="tertiary"
                />
                <StatTile icon="equal" label="Empates" value={stats.empates} />
                <StatTile
                  icon="close-octagon-outline"
                  label="Derrotas"
                  value={stats.derrotas}
                />
                {presencaPct !== null ? (
                  <StatTile
                    icon="account-check-outline"
                    label="Presença"
                    value={`${presencaPct}%`}
                  />
                ) : (
                  <StatTile
                    icon="account-check-outline"
                    label="Presença"
                    value="—"
                  />
                )}
              </View>
            ) : null}

            <Text
              style={[
                styles.sheetFootnote,
                { color: palette.onSurfaceVariant },
              ]}
            >
              {totalPartidasEncerradas === 0
                ? "Nenhuma partida encerrada ainda nesta execução."
                : `${totalPartidasEncerradas} ${
                    totalPartidasEncerradas === 1 ? "partida" : "partidas"
                  } encerrada${totalPartidasEncerradas === 1 ? "" : "s"} na execução.`}
            </Text>
          </>
        ) : null}
      </View>
    </AppBottomSheet>
  );
}

function somaResultados(stats: {
  vitorias: number;
  empates: number;
  derrotas: number;
}): number {
  return stats.vitorias + stats.empates + stats.derrotas;
}

const styles = StyleSheet.create({
  sheetCard: {
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sheetHeaderText: { flex: 1 },
  sheetName: { ...Typography.headline, fontSize: 20 },
  sheetSubtitle: { ...Typography.label, fontSize: 11, marginTop: 2 },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sheetFootnote: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0,
    textTransform: "none",
    textAlign: "center",
  },
});
