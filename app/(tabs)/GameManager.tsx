import { Image, StyleSheet, Platform, TouchableOpacity } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSoccer } from "@/hooks/useSoccer";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useState } from "react";
import { useNavigation } from "expo-router";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { ParamListBase } from "@react-navigation/native";

export default function GameManagerScreen() {
  const manager = useSoccer();
  // const [teams] = useState(manager.next);

  let navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const onPress = () => {
    manager.manager.setPlayingGame();
    navigation.navigate("currentGame");
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
        <ThemedText type="title">
          Times: {manager.manager.next.length}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Jogadores: {manager.manager.players.length}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Jogos Realizados: {manager.manager.matches.length}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Time Com vantagem: {manager.manager.advantageToNext?.id}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Proxima Partida: {manager.manager.next[0]?.id} x{" "}
          {manager.manager.next[1]?.id}
        </ThemedText>
      </ThemedView>
      <TouchableOpacity onPress={onPress}>
        <ThemedView style={styles.button}>
          <ThemedText>Iniciar Partida</ThemedText>
        </ThemedView>
      </TouchableOpacity>
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
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
