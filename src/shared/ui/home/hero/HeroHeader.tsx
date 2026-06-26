import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { LivePulseDot } from "@/src/shared/ui/LivePulseDot";
import { HeroStatusBadge } from "./HeroStatusBadge";

/**
 * Linha superior do Hero — status à esquerda, badge de modo à direita,
 * ambos na MESMA linha. No modo AO VIVO o status vira "status + cronômetro";
 * nos demais é a linha de resumo (ex.: "Execução ativa · 16 de jun.").
 */
export function HeroHeader({
  badgeLabel,
  isLive,
  live,
  statusLine,
  statusLabel,
  cronometro,
  palette,
}: {
  badgeLabel: string;
  isLive: boolean;
  live: boolean;
  statusLine: string;
  statusLabel: string;
  cronometro: string;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <View style={styles.heroHeader}>
      <View style={styles.heroHeaderStatus}>
        <LivePulseDot
          size={isLive ? 8 : 7}
          color={
            isLive ? (live ? palette.goal : palette.warning) : palette.goal
          }
          live={live}
        />
        {isLive ? (
          <>
            <Text
              style={[
                styles.heroLiveLabel,
                { color: live ? palette.goal : palette.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
            <Text style={[styles.heroLiveTimer, { color: palette.onSurface }]}>
              {cronometro}
            </Text>
          </>
        ) : (
          <Text
            style={[styles.heroStatus, { color: palette.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {statusLine}
          </Text>
        )}
      </View>
      <HeroStatusBadge label={badgeLabel} palette={palette} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Linha superior do Hero: status (esquerda) + badge (direita) na MESMA linha.
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  // Grupo de status à esquerda; flexShrink permite truncar o texto e manter o
  // badge colado à direita quando a linha de status é longa.
  heroHeaderStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  heroStatus: { ...Typography.label, flexShrink: 1 },
  // Status/cronômetro AO VIVO vivem no header. Aqui ficam só os estilos do
  // texto (label + cronômetro).
  heroLiveLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 11,
  },
  heroLiveTimer: {
    ...Typography.title,
    fontVariant: ["tabular-nums"],
  },
});
