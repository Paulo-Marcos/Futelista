import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

type EmptyStateProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
};

/**
 * Estado vazio reutilizável para listas e telas sem dados.
 * Centralizado vertical e horizontalmente; CTA opcional.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
}: EmptyStateProps) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={palette.onSurfaceVariant}
      />
      <Text style={[styles.title, { color: palette.onSurface }]} selectable>
        {title}
      </Text>
      {description ? (
        <Text
          style={[styles.description, { color: palette.onSurfaceVariant }]}
          selectable
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrapper}>
          <PrimaryButton
            label={actionLabel}
            onPress={onAction}
            disabled={actionDisabled}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  title: {
    ...Typography.title,
    textAlign: "center",
  },
  description: {
    ...Typography.body,
    textAlign: "center",
  },
  actionWrapper: {
    marginTop: Spacing.md,
  },
});
