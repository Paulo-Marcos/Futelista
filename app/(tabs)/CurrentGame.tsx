import { Image, StyleSheet, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "expo-router";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { ParamListBase } from "@react-navigation/native";

import { ThemedText } from "@/src/shared/ui/ThemedText";
import { ThemedView } from "@/src/shared/ui/ThemedView";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSlice } from "@/src/app-shell/useGameSlice";
import ParallaxScrollView from "@/src/shared/ui/ParallaxScrollView";
import { Player } from "@/src/domain/Player";
import { Team } from "@/src/domain/Team";
import { TimerStatus } from "@/src/domain/Timer";

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function CurrentGameScreen() {
  const { manager: game } = useSoccer();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // Slices reativos: o componente re-renderiza somente quando o
  // GameManager emite notify (incluindo cada tick do cronometro).
  const playing = useGameSlice((g) => g.playing);
  const status = useGameSlice((g) => g.timer?.status);
  const restTime = useGameSlice((g) => g.timer?.restTime ?? 0);
  const currentNumberTime = useGameSlice((g) => g.timer?.currentNumberTime);
  const numberTimes = useGameSlice((g) => g.timer?.numberTimes);
  const goals = useGameSlice((g) => g.playing?.countGoals());

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!playing) {
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
          <ThemedText type="title">Nenhuma partida em andamento</ThemedText>
        </ThemedView>
        <ThemedText>
          Volte para a aba &quot;Gerenciamento&quot; e toque em &quot;Iniciar
          Partida&quot;.
        </ThemedText>
      </ParallaxScrollView>
    );
  }

  const canStart =
    !status || status === TimerStatus.CREATED || status === TimerStatus.ENDED;
  const canPause = status === TimerStatus.STARTED;
  const canContinue = status === TimerStatus.PAUSED;

  const safe = <T,>(fn: () => T) => {
    try {
      setErrorMsg(null);
      fn();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[CurrentGame] Acao falhou:", error);
      setErrorMsg(msg);
    }
  };

  const handleStart = () => safe(() => game.start());
  const handlePause = () => safe(() => game.pause());
  const handleContinue = () => safe(() => game.continue());
  const handleGoal = (team: Team, player: Player) =>
    safe(() => game.addGoal(team, player));
  const handleEnd = () =>
    safe(() => {
      game.setResult();
      game.setNextMatch();
      navigation.navigate("Geriamento");
    });

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
        <ThemedText type="title">
          Time A ({playing.teamA.id.substring(0, 4)}) x Time B (
          {playing.teamB.id.substring(0, 4)})
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          {goals?.teamA ?? 0} x {goals?.teamB ?? 0}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.titleContainer}>
        <ThemedText>
          Tempo: {formatTime(restTime)}
          {currentNumberTime !== undefined && numberTimes !== undefined
            ? `  ·  ${currentNumberTime}/${numberTimes}`
            : ""}
          {status !== undefined ? `  ·  ${TimerStatus[status]}` : ""}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.row}>
        <TouchableOpacity
          onPress={handleStart}
          disabled={!canStart}
          style={[styles.button, !canStart && styles.disabled]}
        >
          <ThemedText>Iniciar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePause}
          disabled={!canPause}
          style={[styles.button, !canPause && styles.disabled]}
        >
          <ThemedText>Pausar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          style={[styles.button, !canContinue && styles.disabled]}
        >
          <ThemedText>Continuar</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.teamSection}>
        <ThemedText type="subtitle">Time A — gol por:</ThemedText>
        {playing.teamA.players.map((player) => (
          <TouchableOpacity
            key={player.id}
            onPress={() => handleGoal(playing.teamA, player)}
            style={styles.goalButton}
          >
            <ThemedText>⚽ {player.name}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.teamSection}>
        <ThemedText type="subtitle">Time B — gol por:</ThemedText>
        {playing.teamB.players.map((player) => (
          <TouchableOpacity
            key={player.id}
            onPress={() => handleGoal(playing.teamB, player)}
            style={styles.goalButton}
          >
            <ThemedText>⚽ {player.name}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <TouchableOpacity onPress={handleEnd} style={styles.endButton}>
        <ThemedText>Encerrar Partida</ThemedText>
      </TouchableOpacity>

      {errorMsg && (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1e88e5",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  disabled: {
    backgroundColor: "#9ca3af",
  },
  teamSection: {
    marginTop: 16,
    gap: 6,
  },
  goalButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  endButton: {
    marginTop: 24,
    backgroundColor: "#c92a2a",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: "center",
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
