import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { Card } from "@/src/shared/ui/Card";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";

export function ProximosStrip({
  proximos,
  onPress,
}: {
  proximos: { id: string; jogadores: { id: string; name: string }[] }[];
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ver fila de times que vão entrar"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card variant="outlined" padding="md">
        <View style={styles.proximosHead}>
          <Text
            style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}
          >
            Próximos a entrar
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={palette.onSurfaceVariant}
          />
        </View>
        <View style={styles.proximosList}>
          {proximos.map((time, idx) => (
            <View key={time.id} style={styles.proximoItem}>
              <View
                style={[
                  styles.proximoPos,
                  { backgroundColor: palette.surfaceContainerHigh },
                ]}
              >
                <Text
                  style={[styles.proximoPosText, { color: palette.primary }]}
                >
                  {idx + 1}º
                </Text>
              </View>
              <TeamCrest seed={time.id} size={22} />
              <View style={styles.proximoAvs}>
                {time.jogadores.slice(0, 5).map((j) => (
                  <PlayerAvatar key={j.id} player={j} size={22} />
                ))}
              </View>
              <Text
                style={[styles.proximoNames, { color: palette.onSurface }]}
                numberOfLines={1}
              >
                {time.jogadores.map((j) => j.name).join(" · ") || "—"}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  proximosHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  proximosList: { marginTop: Spacing.xs, gap: Spacing.sm },
  proximoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  proximoPos: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  proximoPosText: { ...Typography.label, fontWeight: "800" },
  proximoAvs: { flexDirection: "row", gap: -6 as never },
  proximoNames: {
    flex: 1,
    ...Typography.body,
    fontSize: 12,
  },
});
