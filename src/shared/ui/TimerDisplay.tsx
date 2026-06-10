import { StyleSheet, Text, View } from "react-native";

import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

type TimerDisplayProps = {
  restSeconds: number;
  currentHalf?: number;
  totalHalves?: number;
  status?: TimerStatus;
};

/**
 * Cronômetro grande + indicador de tempo (1º/2º) + pill de status.
 */
export function TimerDisplay({
  restSeconds,
  currentHalf,
  totalHalves,
  status,
}: TimerDisplayProps) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      <Text style={[styles.time, { color: palette.onSurface }]}>
        {formatSeconds(restSeconds)}
      </Text>
      {currentHalf !== undefined && totalHalves !== undefined ? (
        <Text style={[styles.half, { color: palette.onSurfaceVariant }]}>
          {currentHalf}º de {totalHalves}{" "}
          {totalHalves === 1 ? "tempo" : "tempos"}
        </Text>
      ) : null}
      {status !== undefined ? <StatusPill status={status} /> : null}
    </View>
  );
}

function StatusPill({ status }: { status: TimerStatus }) {
  const palette = usePalette();
  const mapping: Record<TimerStatus, { label: string; color: string }> = {
    [TimerStatus.CREATED]: {
      label: "Pronto",
      color: palette.onSurfaceVariant,
    },
    [TimerStatus.STARTED]: {
      label: "Em jogo",
      color: palette.success,
    },
    [TimerStatus.PAUSED]: {
      label: "Pausado",
      color: palette.warning,
    },
    [TimerStatus.INTERVAL]: {
      label: "Intervalo",
      color: palette.primary,
    },
    [TimerStatus.ENDED]: {
      label: "Encerrado",
      color: palette.error,
    },
  };
  const { label, color } = mapping[status];
  return (
    <View style={[styles.pill, { backgroundColor: color + "22" }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function formatSeconds(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s)}`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  time: {
    ...Typography.display,
    fontSize: 56,
    letterSpacing: 1,
  },
  half: {
    ...Typography.label,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
  },
  pillText: {
    ...Typography.label,
  },
});
