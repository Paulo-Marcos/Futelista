import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
import { TeamCrest } from "@/src/shared/ui/TeamCrest";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * TeamQueue — card de time na fila. Portado de `.fl-queuecard`.
 *
 * row gap12, padding 12, radius 14; pos Nº (num 800/16 primary, width 30) +
 * TeamCrest 26 + avatares 30 sobrepostos (marginLeft -8 ring surface) +
 * nomes "X · Y · Z" (12 dim, flex:1).
 */
export function TeamQueue({
  team,
  idx,
  onActionsPress,
}: {
  team: Team;
  idx: number;
  onActionsPress?: () => void;
}) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <Text style={[styles.pos, { color: palette.primary }]}>
        {idx + 1}º
      </Text>
      <TeamCrest seed={team.id} size={26} />
      <View style={styles.avs}>
        {team.players.map((p, i) => (
          <View
            key={p.id}
            style={[
              i === 0
                ? null
                : { marginLeft: -8 },
              { borderRadius: 999, borderWidth: 2, borderColor: palette.surface },
            ]}
          >
            <PlayerAvatar player={p} size={30} />
          </View>
        ))}
      </View>
      <Text
        style={[styles.names, { color: palette.onSurfaceVariant }]}
        numberOfLines={2}
      >
        {team.players.map((p) => p.name).join(" · ") || "—"}
      </Text>
      {onActionsPress ? (
        <Pressable
          onPress={onActionsPress}
          accessibilityRole="button"
          accessibilityLabel={`Ações do Time ${idx + 1}`}
          style={styles.menuBtn}
          android_ripple={{ color: palette.primary + "22" }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={18}
            color={palette.onSurfaceVariant}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  pos: {
    ...Typography.title,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    width: 30,
  },
  avs: { flexDirection: "row", alignItems: "center" },
  names: {
    ...Typography.body,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
