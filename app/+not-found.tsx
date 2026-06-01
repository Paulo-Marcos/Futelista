import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/src/shared/ui/ThemedText";
import { ThemedView } from "@/src/shared/ui/ThemedView";

export default function NotFoundScreen({ route }: { route: any }) {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Essa página não existe.</ThemedText>
        <ThemedText type="title">{route}</ThemedText>
        <Link href="/(tabs)" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
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
