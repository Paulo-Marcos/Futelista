import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { PlayerRow } from "@/src/shared/ui/PlayerRow";
import { TabHeader } from "@/src/shared/ui/TabHeader";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

export default function JogadoresScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { manager } = useSoccer();

  const players = useGameSlice((g) => g.players);
  const playersWithoutTeam = useGameSlice((g) => g.playersWithoutTeam);

  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");

  const adicionar = () => {
    const nome = novoNome.trim();
    if (!nome) return;
    try {
      manager.addPlayer(nome);
      setNovoNome("");
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const remover = (p: Player) => {
    try {
      manager.removePlayer(p);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const iniciarEdicao = (p: Player) => {
    setEditingId(p.id);
    setEditingNome(p.name);
  };

  const confirmarEdicao = (p: Player) => {
    try {
      manager.renamePlayer(p, editingNome);
      setEditingId(null);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <TabHeader title="Jogadores" />

      <View style={styles.addRow}>
        <TextInput
          value={novoNome}
          onChangeText={setNovoNome}
          placeholder="Adicionar jogador"
          placeholderTextColor={palette.onSurfaceVariant}
          onSubmitEditing={adicionar}
          returnKeyType="done"
          style={[
            styles.input,
            {
              borderColor: palette.outline,
              backgroundColor: palette.surface,
              color: palette.onSurface,
            },
          ]}
        />
        <Pressable
          onPress={adicionar}
          disabled={!novoNome.trim()}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: novoNome.trim()
                ? palette.primary
                : palette.outline,
              opacity: pressed && novoNome.trim() ? 0.85 : 1,
            },
          ]}
          android_ripple={{ color: palette.onPrimary + "33" }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={palette.onPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.counterRow}>
        <Text
          style={[styles.counter, { color: palette.onSurfaceVariant }]}
          selectable
        >
          {players.length} {players.length === 1 ? "jogador" : "jogadores"}
          {playersWithoutTeam > 0 ? ` · ${playersWithoutTeam} sem time` : ""}
        </Text>
      </View>

      {erro ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: palette.errorContainer,
              borderColor: palette.error,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle"
            size={16}
            color={palette.error}
          />
          <Text style={[styles.errorText, { color: palette.error }]} selectable>
            {erro}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        ListEmptyComponent={
          <EmptyState
            icon="account-multiple-outline"
            title="Nenhum jogador cadastrado"
            description="Adicione jogadores no campo acima para começar a montar a pelada."
          />
        }
        renderItem={({ item }) => {
          if (editingId === item.id) {
            return (
              <View
                style={[
                  styles.editRow,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.primary,
                  },
                ]}
              >
                <TextInput
                  value={editingNome}
                  onChangeText={setEditingNome}
                  autoFocus
                  onSubmitEditing={() => confirmarEdicao(item)}
                  style={[styles.editInput, { color: palette.onSurface }]}
                />
                <Pressable
                  onPress={() => confirmarEdicao(item)}
                  style={styles.iconAction}
                  android_ripple={{ color: palette.primary + "33" }}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={22}
                    color={palette.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setEditingId(null)}
                  style={styles.iconAction}
                  android_ripple={{ color: palette.error + "33" }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color={palette.error}
                  />
                </Pressable>
              </View>
            );
          }

          return (
            <PlayerRow
              player={item}
              showSituation
              showGoals
              onLongPress={() => iniciarEdicao(item)}
              right={
                <Pressable
                  onPress={() => remover(item)}
                  style={styles.iconAction}
                  android_ripple={{ color: palette.error + "33" }}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={22}
                    color={palette.error}
                  />
                </Pressable>
              }
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    ...Typography.body,
    fontSize: 16,
    borderCurve: "continuous",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  counterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  counter: {
    ...Typography.label,
  },
  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.label,
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minHeight: 56,
    borderCurve: "continuous",
  },
  editInput: {
    flex: 1,
    ...Typography.title,
    fontSize: 16,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
