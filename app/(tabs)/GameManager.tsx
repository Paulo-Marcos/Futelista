import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useNavigation } from "expo-router";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { ParamListBase } from "@react-navigation/native";

import { HelloWave } from "@/src/shared/ui/HelloWave";
import { ThemedText } from "@/src/shared/ui/ThemedText";
import { ThemedView } from "@/src/shared/ui/ThemedView";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSlice } from "@/src/app-shell/useGameSlice";
import ParallaxScrollView from "@/src/shared/ui/ParallaxScrollView";

export default function GameManagerScreen() {
  const { manager } = useSoccer();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const totalTimes = useGameSlice((g) => g.next.length);
  const totalJogadores = useGameSlice((g) => g.players.length);
  const totalJogos = useGameSlice((g) => g.matches.length);
  const vantagemId = useGameSlice((g) => g.advantageToNext?.id);
  const proxA = useGameSlice((g) => g.next[0]?.id);
  const proxB = useGameSlice((g) => g.next[1]?.id);
  const temPartida = useGameSlice((g) => g.playing !== undefined);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onPress = () => {
    setErrorMsg(null);
    try {
      manager.setPlayingGame();
      navigation.navigate("currentGame");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[GameManager] Falha ao iniciar partida:", error);
      setErrorMsg(msg);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <HelloWave />
        <ThemedText type="title">Times: {totalTimes}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Jogadores: {totalJogadores}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Jogos Realizados: {totalJogos}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Time com vantagem: {vantagemId ?? "—"}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Próxima Partida: {proxA ?? "—"} x {proxB ?? "—"}
        </ThemedText>
      </ThemedView>
      {temPartida && (
        <ThemedView style={styles.titleContainer}>
          <ThemedText>Há uma partida em andamento.</ThemedText>
        </ThemedView>
      )}
      <TouchableOpacity onPress={onPress}>
        <ThemedView style={styles.button}>
          <ThemedText>Iniciar Partida</ThemedText>
        </ThemedView>
      </TouchableOpacity>
      {errorMsg && (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        </ThemedView>
      )}
      <ThemedView style={styles.titleContainer}></ThemedView>
      <ThemedView style={styles.titleContainer}></ThemedView>
      <ThemedView style={styles.titleContainer}></ThemedView>
      <ThemedView style={styles.titleContainer}></ThemedView>
      <ThemedView style={styles.titleContainer}></ThemedView>
      <ThemedView style={styles.titleContainer}></ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  button: {
    flexDirection: "row",

    alignItems: "center",
    backgroundColor: "red",
    padding: 10,
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c92a2a",
    backgroundColor: "#fff5f5",
  },
  errorText: {
    color: "#c92a2a",
    fontWeight: "600",
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
