import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { ResumoPeladaTipo } from "@/src/domain/ports/RepositorioPelada";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Tela de gestão de Peladas (tipos cadastrados).
 *
 * Lista as peladas que o usuário cadastrou (ex.: Fute CEF, Fute BB),
 * mostrando regras default e quantas execuções já tiveram. Tap → tela
 * de execuções daquela pelada. "+" → cadastro de pelada (nome + regras).
 */
export default function PeladasScreen() {
  const palette = usePalette();
  const router = useRouter();
  const { listarPeladas } = useSoccer();
  const peladaIdAtiva = useGameSlice((g) => g.peladaId);

  const [resumos, setResumos] = useState<ResumoPeladaTipo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    listarPeladas()
      .then((rs) => {
        setResumos(rs);
        setErro(null);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  }, [listarPeladas]);

  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View
        style={[styles.header, { borderBottomColor: palette.outlineVariant }]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={styles.headerButton}
        >
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={palette.onSurface}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.onSurface }]}>
          Minhas peladas
        </Text>
        <Pressable
          onPress={() => router.push("/pelada-nova")}
          accessibilityRole="button"
          accessibilityLabel="Cadastrar nova pelada"
          style={styles.headerButton}
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={palette.primary}
          />
        </Pressable>
      </View>

      {resumos === null ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : resumos.length === 0 ? (
        <EmptyState
          icon="soccer"
          title="Nenhuma pelada cadastrada"
          description="Cadastre sua primeira pelada (ex.: Fute CEF) para começar a registrar execuções."
          actionLabel="Cadastrar pelada"
          onAction={() => router.push("/pelada-nova")}
        />
      ) : (
        <FlatList
          data={resumos}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PeladaCard
              resumo={item}
              ativa={item.id === peladaIdAtiva}
              onPress={() =>
                router.push({
                  pathname: "/peladas/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}

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
          <Text style={[styles.errorText, { color: palette.error }]} selectable>
            {erro}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PeladaCard({
  resumo,
  ativa,
  onPress,
}: {
  resumo: ResumoPeladaTipo;
  ativa: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Card variant="surface" padding="md">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir pelada ${resumo.nome}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.cardTitle, { color: palette.onSurface }]}
              numberOfLines={1}
            >
              {resumo.nome}
            </Text>
            <Text style={[styles.cardSub, { color: palette.onSurfaceVariant }]}>
              {regrasResumo(resumo.regras)}
            </Text>
          </View>
          {ativa ? (
            <View
              style={[
                styles.ativaBadge,
                {
                  backgroundColor: palette.primaryContainer,
                  borderColor: palette.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.ativaBadgeText,
                  { color: palette.onPrimaryContainer },
                ]}
              >
                EM USO
              </Text>
            </View>
          ) : null}
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={palette.onSurfaceVariant}
          />
        </View>

        <View style={styles.cardStats}>
          <MaterialCommunityIcons
            name="history"
            size={16}
            color={palette.onSurfaceVariant}
          />
          <Text style={[styles.cardStatText, { color: palette.onSurface }]}>
            {resumo.totalExecucoes === 0
              ? "nenhuma execução ainda"
              : resumo.totalExecucoes === 1
                ? "1 execução"
                : `${resumo.totalExecucoes} execuções`}
          </Text>
        </View>
      </Pressable>
    </Card>
  );
}

function regrasResumo(r: ResumoPeladaTipo["regras"]): string {
  const tempo = formatarMinutos(r.timeMatch);
  return `${r.playersPerTeam}×${r.playersPerTeam} · ${tempo} · ${r.numberTimes === 1 ? "1 tempo" : `${r.numberTimes} tempos`} · ${r.goalLimit} gols`;
}

function formatarMinutos(timeMatch: string): string {
  const [h, m] = timeMatch.split(":").map((s) => parseInt(s, 10));
  if (!Number.isNaN(h) && h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}min`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: { ...Typography.title, flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.lg },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardTitle: { ...Typography.title },
  cardSub: { ...Typography.label, marginTop: 2 },
  ativaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  ativaBadgeText: { ...Typography.label, fontSize: 10, letterSpacing: 0.5 },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  cardStatText: { ...Typography.body, fontSize: 13 },
  errorBanner: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorText: { ...Typography.label },
});
