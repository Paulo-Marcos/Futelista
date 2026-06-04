import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
import { PeladaStatus } from "@/src/domain/GestorJogo";
import { Pelada } from "@/src/domain/Pelada";
import { ResumoExecucao } from "@/src/domain/ports/RepositorioPelada";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Tela de execuções de uma Pelada (tipo).
 *
 * Mostra a lista de vezes que a pelada foi executada — mais recente
 * primeiro — com data, status e totais. Botão grande "Iniciar nova
 * execução" cria nova execução vinculada à pelada e a torna ativa.
 */
export default function ExecucoesDePeladaScreen() {
  const palette = usePalette();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const peladaId = params.id;
  const {
    carregarPelada,
    listarExecucoesDe,
    iniciarExecucao,
    selecionarExecucao,
  } = useSoccer();
  const execucaoAtivaId = useGameSlice((g) => g.id);

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [execucoes, setExecucoes] = useState<ResumoExecucao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);

  const recarregar = useCallback(() => {
    if (!peladaId) return;
    Promise.all([carregarPelada(peladaId), listarExecucoesDe(peladaId)])
      .then(([p, ex]) => {
        setPelada(p);
        setExecucoes(ex);
        setErro(null);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  }, [peladaId, carregarPelada, listarExecucoesDe]);

  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar]),
  );

  const onIniciar = async () => {
    if (!peladaId || iniciando) return;
    const temAnterior = (execucoes?.length ?? 0) > 0;
    let herdar = false;
    if (temAnterior) {
      const escolha = await escolherOpcao<"herdar" | "vazia">({
        titulo: "Nova execução",
        mensagem: "Iniciar com os mesmos jogadores da última execução?",
        opcoes: [
          { label: "Cancelar", valor: "vazia", estilo: "cancel" },
          { label: "Vazia", valor: "vazia" },
          { label: "Herdar", valor: "herdar" },
        ],
      });
      if (escolha === null) return;
      herdar = escolha === "herdar";
    }
    setIniciando(true);
    iniciarExecucao(peladaId, { herdarJogadores: herdar })
      .then(() => router.dismissAll())
      .catch((e) => {
        setErro(e instanceof Error ? e.message : String(e));
        setIniciando(false);
      });
  };

  const onAbrirExecucao = (id: string) => {
    if (id === execucaoAtivaId) {
      router.dismissAll();
      return;
    }
    selecionarExecucao(id)
      .then(() => router.dismissAll())
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View
        style={[styles.header, { borderBottomColor: palette.outlineVariant }]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.headerButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={palette.onSurface}
          />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {pelada?.nome ?? "Pelada"}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {pelada === null || execucoes === null ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={execucoes}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Card variant="outlined" padding="md">
                <Text
                  style={[
                    styles.regrasLabel,
                    { color: palette.onSurfaceVariant },
                  ]}
                >
                  Regras default
                </Text>
                <Text style={[styles.regrasText, { color: palette.onSurface }]}>
                  {pelada.regras.playersPerTeam}×{pelada.regras.playersPerTeam}{" "}
                  · {formatarMinutos(pelada.regras.timeMatch)} ·{" "}
                  {pelada.regras.numberTimes === 1
                    ? "1 tempo"
                    : `${pelada.regras.numberTimes} tempos`}{" "}
                  · {pelada.regras.goalLimit} gols
                </Text>
              </Card>
              <PrimaryButton
                label={iniciando ? "Iniciando…" : "Iniciar nova execução"}
                icon="play-circle-outline"
                onPress={() => onIniciar()}
                disabled={iniciando}
                fullWidth
              />
              <Text
                style={[
                  styles.sectionLabel,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                Execuções
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ExecucaoCard
              resumo={item}
              ativa={item.id === execucaoAtivaId}
              onPress={() => onAbrirExecucao(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-blank-outline"
              title="Nenhuma execução ainda"
              description="Toque em “Iniciar nova execução” para registrar a primeira."
            />
          }
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

function ExecucaoCard({
  resumo,
  ativa,
  onPress,
}: {
  resumo: ResumoExecucao;
  ativa: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const dataLabel = formatarData(resumo);
  const status = statusLabel(resumo.status, ativa);
  return (
    <Card variant="surface" padding="md">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir execução de ${dataLabel}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View style={styles.execHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.execDate, { color: palette.onSurface }]}
              numberOfLines={1}
            >
              {dataLabel}
            </Text>
            <Text style={[styles.execSub, { color: palette.onSurfaceVariant }]}>
              {resumo.totalJogadores}{" "}
              {resumo.totalJogadores === 1 ? "jogador" : "jogadores"} ·{" "}
              {resumo.totalPartidas}{" "}
              {resumo.totalPartidas === 1 ? "partida" : "partidas"}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: status.bg, borderColor: status.fg },
            ]}
          >
            <Text style={[styles.statusPillText, { color: status.fg }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

function statusLabel(
  status: PeladaStatus,
  ativa: boolean,
): { label: string; bg: string; fg: string } {
  // cores fixas suaves; tema é responsabilidade dos componentes maiores
  if (ativa) return { label: "EM USO", bg: "#C8E6C9", fg: "#1B5E20" };
  switch (status) {
    case PeladaStatus.CREATED:
      return { label: "RASCUNHO", bg: "#EEEEEE", fg: "#666" };
    case PeladaStatus.ATIVA:
      return { label: "ATIVA", bg: "#FFE0B2", fg: "#E65100" };
    case PeladaStatus.FINALIZADA:
      return { label: "FINALIZADA", bg: "#F5F5F5", fg: "#666" };
  }
}

function formatarData(r: ResumoExecucao): string {
  const ts = r.endedAt ?? r.startedAt ?? r.createdAt;
  if (!ts) return r.name;
  try {
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return r.name;
  }
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
  headerBlock: { gap: Spacing.md, marginBottom: Spacing.md },
  regrasLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  regrasText: { ...Typography.body, fontSize: 14 },
  sectionLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  execHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  execDate: { ...Typography.body, fontWeight: "600" },
  execSub: { ...Typography.label, marginTop: 2 },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusPillText: { ...Typography.label, fontSize: 10, letterSpacing: 0.5 },
  errorBanner: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorText: { ...Typography.label },
});
