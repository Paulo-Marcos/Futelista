import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { gerarRelatorioExecucao } from "@/src/domain/RelatorioExecucao";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { MatchHistoryCard } from "@/src/shared/ui/MatchHistoryCard";
import { Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Histórico (handoff v2, tela 09).
 *
 * Lista as últimas partidas da execução ativa. ScreenHeader com voltar +
 * label "Últimos jogos" + lista de MatchHistoryCard. Vazio com EmptyState.
 */
export default function HistoricoScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gestor } = useSoccer();
  const matches = useGameSlice((g) => g.matches) ?? [];
  const [compartilhando, setCompartilhando] = useState(false);

  if (!gestor) return <Redirect href="/" />;

  const ordenadas = [...matches].reverse();

  const compartilhar = async () => {
    if (compartilhando) return;
    setCompartilhando(true);
    try {
      await Share.share({ message: gerarRelatorioExecucao(gestor) });
    } catch {
      // Usuário cancelou ou app indisponível — silencioso, o botão volta
      // ao normal e não fica em loading-state preso.
    } finally {
      setCompartilhando(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: palette.surfaceContainerHigh,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={palette.onSurface}
          />
        </Pressable>
        <Text style={[styles.title, { color: palette.onSurface }]}>
          Histórico
        </Text>
        {ordenadas.length > 0 ? (
          <Pressable
            onPress={compartilhar}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar resumo da execução"
            disabled={compartilhando}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: palette.surfaceContainerHigh,
                opacity: pressed || compartilhando ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={20}
              color={palette.onSurface}
            />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <FlatList
        data={ordenadas}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        ListHeaderComponent={
          ordenadas.length > 0 ? (
            <Text
              style={[styles.label, { color: palette.onSurfaceVariant }]}
            >
              Últimos jogos
            </Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }) => <MatchHistoryCard partida={item} />}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="Sem jogos ainda"
            description="Os resultados das partidas aparecem aqui."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Typography.headline,
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
  list: { paddingHorizontal: Spacing.lg },
  label: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
});
