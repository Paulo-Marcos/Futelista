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

export default function CurrentGameScreen() {
  const manager = useSoccer();
  // const [teams] = useState(manager.next);
  const goals = manager.manager.playing?.countGoals();

  let navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const onPressBegin = () => {
    manager.manager.setPlayingGame();
  };
  const onPressPause = () => {
    manager.manager.setPlayingGame();
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
          {manager.manager.playing?.teamA.id.substring(0, 3)} X{" "}
          {manager.manager.playing?.teamB.id.substring(0, 3)}
        </ThemedText>
      </ThemedView>
      {goals && (
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            {goals.teamA} X {goals.teamB}
          </ThemedText>
        </ThemedView>
      )}

      <TouchableOpacity onPress={onPressBegin}>
        <ThemedView style={styles.button}>
          <ThemedText>Iniciar Partida</ThemedText>
        </ThemedView>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressPause}>
        <ThemedView style={styles.button}>
          <ThemedText>Pausar</ThemedText>
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
