import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
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
import { Palette, usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

/**
 * Tela de execuções de uma Pelada (tipo).
 *
 * Reskin do handoff: cabeçalho com escudo da pelada, status pills tematizados
 * (goal/warning/surfaceContainerHigh), mantém fluxo "Iniciar nova execução"
 * com escolha herdar/vazia.
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
    arquivarPelada,
    excluirPelada,
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

  /**
   * Menu de ações destrutivas (Arquivar / Excluir) no kebab do header.
   *
   * Cada ação tem uma confirmação dedicada com texto explicando o impacto.
   * Após sucesso, voltamos para a lista — esta tela não faz mais sentido
   * com a pelada arquivada/excluída no contexto atual.
   */
  const onAbrirMenu = useCallback(async () => {
    if (!pelada) return;
    type Acao = "arquivar" | "excluir" | "cancelar";
    const escolha = await escolherOpcao<Acao>({
      titulo: pelada.nome,
      mensagem: "Escolha uma ação para esta pelada.",
      opcoes: [
        { label: "Arquivar pelada", valor: "arquivar" },
        {
          label: "Excluir definitivamente",
          valor: "excluir",
          estilo: "destructive",
        },
        { label: "Cancelar", valor: "cancelar", estilo: "cancel" },
      ],
    });
    if (!escolha || escolha === "cancelar") return;

    if (escolha === "arquivar") {
      const ok = await confirmAcao({
        titulo: "Arquivar pelada",
        mensagem:
          "A pelada some das suas listagens, mas o histórico fica preservado em disco.",
        textoConfirmar: "Arquivar",
      });
      if (!ok) return;
      arquivarPelada(pelada.id)
        .then(() => router.back())
        .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
      return;
    }

    const ok = await confirmAcao({
      titulo: "Excluir esta pelada",
      mensagem:
        "Vai apagar o cadastro da pelada definitivamente. As execuções já jogadas ficam preservadas no histórico.",
      textoConfirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    excluirPelada(pelada.id)
      .then(() => router.back())
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  }, [pelada, arquivarPelada, excluirPelada, router]);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View
        style={[styles.header, { borderBottomColor: palette.outlineVariant }]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [
            styles.iconButton,
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
        <Text
          style={[styles.headerTitle, { color: palette.onSurface }]}
          numberOfLines={1}
        >
          {pelada?.nome ?? "Pelada"}
        </Text>
        {pelada ? (
          <View style={styles.headerActions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/pelada-editar/[id]",
                  params: { id: pelada.id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Editar pelada"
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: palette.surfaceContainerHigh,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={palette.onSurface}
              />
            </Pressable>
            <Pressable
              onPress={onAbrirMenu}
              accessibilityRole="button"
              accessibilityLabel="Ações da pelada"
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: palette.surfaceContainerHigh,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color={palette.onSurface}
              />
            </Pressable>
          </View>
        ) : (
          <View style={styles.iconButton} />
        )}
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

              {pelada.observacoes ? (
                <ObservacoesCard texto={pelada.observacoes} />
              ) : null}

              <PrimaryCTAComGlow
                label={iniciando ? "Iniciando…" : "Iniciar nova execução"}
                icon="whistle"
                onPress={onIniciar}
                disabled={iniciando}
                palette={palette}
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

// CTA principal com glow vermelho. Mesma receita do hero/CTA de
// app/(pelada)/index.tsx e pelada-nova.tsx:
//   iOS:    shadowColor=primary (HEX opaco) + offset/opacity/radius no wrapper
//   Android: halo (View vermelha translúcida) atrás
//   Web:    boxShadow CSS direto (RN Web não traduz shadowColor pra cor)
function PrimaryCTAComGlow({
  label,
  icon,
  onPress,
  disabled,
  palette,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  palette: Palette;
}) {
  const webGlow =
    !disabled && Platform.OS === "web"
      ? ({ boxShadow: `0 14px 40px -10px ${palette.glow}` } as object)
      : null;
  return (
    <View
      style={[
        styles.ctaShadow,
        { shadowColor: palette.primary },
        disabled && styles.ctaShadowOff,
        webGlow,
      ]}
    >
      {!disabled && Platform.OS !== "web" ? (
        <View
          pointerEvents="none"
          style={[styles.ctaHalo, { backgroundColor: palette.primary }]}
        />
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: disabled ? palette.primaryDim : palette.primary,
            opacity: disabled ? 0.6 : 1,
          },
          pressed && !disabled && styles.ctaPressed,
        ]}
        android_ripple={{ color: palette.onPrimary + "22" }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={palette.onPrimary}
        />
        <Text style={[styles.ctaText, { color: palette.onPrimary }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Card recolhível com as observações da pelada. Cabeçalho sempre visível;
 * corpo aparece ao tocar. Inicia recolhido pra não engolir o CTA principal
 * em peladas com nota longa.
 */
function ObservacoesCard({ texto }: { texto: string }) {
  const palette = usePalette();
  const [aberto, setAberto] = useState(false);
  return (
    <Pressable
      onPress={() => setAberto((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={
        aberto ? "Recolher observações" : "Mostrar observações"
      }
      accessibilityState={{ expanded: aberto }}
      style={({ pressed }) => [
        styles.obsCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.obsHeader}>
        <MaterialCommunityIcons
          name="note-text-outline"
          size={16}
          color={palette.onSurfaceVariant}
        />
        <Text
          style={[styles.obsLabel, { color: palette.onSurfaceVariant }]}
          accessibilityRole="header"
        >
          Observações
        </Text>
        <View style={{ flex: 1 }} />
        <MaterialCommunityIcons
          name={aberto ? "chevron-up" : "chevron-down"}
          size={18}
          color={palette.onSurfaceVariant}
        />
      </View>
      {aberto ? (
        <Text style={[styles.obsText, { color: palette.onSurface }]} selectable>
          {texto}
        </Text>
      ) : null}
    </Pressable>
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
  const status = statusInfo(resumo.status, ativa, palette);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir execução de ${dataLabel}`}
      style={({ pressed }) => [
        styles.execCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
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
  );
}

function statusInfo(
  status: PeladaStatus,
  ativa: boolean,
  palette: Palette,
): { label: string; bg: string; fg: string } {
  if (ativa) {
    return { label: "EM USO", bg: palette.goal + "22", fg: palette.goal };
  }
  switch (status) {
    case PeladaStatus.CREATED:
      return {
        label: "RASCUNHO",
        bg: palette.surfaceContainerHigh,
        fg: palette.onSurfaceVariant,
      };
    case PeladaStatus.ATIVA:
      return {
        label: "ATIVA",
        bg: palette.warning + "22",
        fg: palette.warning,
      };
    case PeladaStatus.FINALIZADA:
      return {
        label: "FINALIZADA",
        bg: palette.surfaceContainerHigh,
        fg: palette.onSurfaceVariant,
      };
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
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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

  // ---- Card de observações recolhível ----
  obsCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
    gap: Spacing.sm,
  },
  obsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  obsLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  obsText: { ...Typography.body, fontSize: 14, lineHeight: 20 },

  execCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderCurve: "continuous",
  },
  execHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  execDate: { ...Typography.body, fontWeight: "700", fontSize: 15 },
  execSub: { ...Typography.label, fontSize: 11, marginTop: 2 },
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

  // ---- CTA "Iniciar nova execução" com glow vermelho ----
  ctaShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 10,
  },
  ctaShadowOff: { shadowOpacity: 0, elevation: 0 },
  ctaHalo: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 14,
    bottom: -6,
    borderRadius: Radius.md,
    opacity: Platform.OS === "android" ? 0.4 : 0.55,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 54,
    borderRadius: Radius.md,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  ctaText: { ...Typography.title, fontSize: 16, fontWeight: "800" },
});
