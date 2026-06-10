import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import {
  EmptyIllustration,
  type IlustracaoEmpty,
} from "@/src/shared/ui/EmptyIllustration";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

type EmptyStateProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /**
   * M-16: usa ilustração SVG em vez do ícone monocromático. Quando
   * presente, eleva o tom "premium sério" do empty state. O `icon`
   * continua sendo o fallback se nenhuma variante for passada.
   */
  illustration?: IlustracaoEmpty;
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
  illustration,
}: EmptyStateProps) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      {illustration ? (
        <EmptyIllustration variante={illustration} size={120} />
      ) : (
        <MaterialCommunityIcons
          name={icon}
          size={64}
          color={palette.onSurfaceVariant}
        />
      )}
      <Text
        style={[styles.title, { color: palette.onSurface }]}
        accessibilityRole="header"
        selectable
      >
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
