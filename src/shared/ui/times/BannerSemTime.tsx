import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

export const BannerSemTime = memo(function BannerSemTime({
  quantidade,
  podeCriarIncompleto,
  onAlocar,
}: {
  quantidade: number;
  podeCriarIncompleto: boolean;
  onAlocar: () => void;
}) {
  const palette = usePalette();
  // Sempre mostramos o efeito do "Alocar agora" — varia se completa o último
  // time ou cria um novo (potencialmente incompleto).
  const hint = podeCriarIncompleto
    ? 'Como o último time está cheio, "Alocar agora" cria um novo time — que pode ficar incompleto.'
    : '"Alocar agora" completa o último time com os jogadores disponíveis.';
  return (
    <Card variant="surface">
      <View style={styles.bannerRow}>
        <MaterialCommunityIcons
          name="account-question"
          size={20}
          color={palette.warning}
        />
        <Text style={[styles.bannerText, { color: palette.onSurface }]}>
          {quantidade}{" "}
          {quantidade === 1 ? "jogador sem time" : "jogadores sem time"}
        </Text>
      </View>
      <Text style={[styles.bannerHint, { color: palette.onSurfaceVariant }]}>
        {hint}
      </Text>
      <View style={{ marginTop: Spacing.sm }}>
        <SecondaryButton
          label="Alocar agora"
          onPress={onAlocar}
          fullWidth
          accessibilityLabel="Alocar jogadores sem time"
        />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  bannerText: {
    ...Typography.body,
    flex: 1,
  },
  bannerHint: {
    ...Typography.label,
    marginTop: Spacing.xs,
  },
});
