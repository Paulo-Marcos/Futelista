import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * RuleCard — card de regra com ícone + título + sub + control/segmented.
 * Portado de `.fl-rulecard`.
 */
export function RuleCard({
  icon,
  title,
  sub,
  hint,
  control,
  seg,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  sub?: string;
  hint?: string;
  control?: ReactNode;
  seg?: ReactNode;
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
      <View style={styles.row}>
        <View
          style={[styles.ico, { backgroundColor: palette.primary + "29" }]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={palette.primary}
          />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: palette.onSurface }]}>
            {title}
          </Text>
          {sub ? (
            <Text style={[styles.sub, { color: palette.onSurfaceVariant }]}>
              {sub}
            </Text>
          ) : null}
        </View>
        {control}
      </View>
      {seg ? <View style={{ marginTop: Spacing.md }}>{seg}</View> : null}
      {hint ? (
        <Text style={[styles.hint, { color: palette.warning }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md + 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  ico: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  title: { ...Typography.title, fontSize: 15, fontWeight: "700" },
  sub: { ...Typography.label, fontSize: 12, marginTop: 1 },
  hint: { ...Typography.label, fontSize: 12, marginTop: Spacing.sm },
});
