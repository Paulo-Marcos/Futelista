import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Match } from "@/src/domain/Match";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Spacing, Typography } from "@/src/shared/theme/Colors";
import { RecentRow } from "./RecentRow";

export function UltimosJogos({ partidas }: { partidas: Match[] }) {
  const palette = usePalette();
  const router = useRouter();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.fieldLabel, { color: palette.onSurfaceVariant }]}>
          Últimos jogos
        </Text>
        <Pressable
          onPress={() => router.push("/historico" as never)}
          accessibilityRole="button"
          accessibilityLabel="Ver todos os jogos"
          style={({ pressed }) => [
            styles.linkRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.linkText, { color: palette.primary }]}>
            ver tudo
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={14}
            color={palette.primary}
          />
        </Pressable>
      </View>
      <View style={styles.recentList}>
        {partidas.map((p) => (
          <RecentRow key={p.id} partida={p} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md, marginTop: Spacing.md },
  fieldLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  linkText: { ...Typography.label, fontSize: 12.5, fontWeight: "700" },
  recentList: { gap: Spacing.sm },
});
