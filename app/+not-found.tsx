import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { usePalette } from "@/src/shared/hooks/usePalette";
import { EmptyState } from "@/src/shared/ui/EmptyState";

export default function NotFoundScreen() {
  const palette = usePalette();
  return (
    <>
      <Stack.Screen options={{ title: "Não encontrado" }} />
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <EmptyState icon="map-search-outline" title="Essa página não existe." />
        <Link href="/jogadores" style={styles.link}>
          Voltar à pelada
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
