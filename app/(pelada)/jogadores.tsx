import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Player } from "@/src/domain/Player";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { PlayerRow } from "@/src/shared/ui/PlayerRow";
import { TabHeader } from "@/src/shared/ui/TabHeader";
import { confirmAcao } from "@/src/shared/ui/confirmAcao";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

const AUTO_DISMISS_ERRO_MS = 5000;

export default function JogadoresScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  return <JogadoresInner gestor={gestor} />;
}

function JogadoresInner({ gestor }: { gestor: GestorJogo }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  const players = useGameSliceRequired((g) => g.players);
  const playersWithoutTeam = useGameSliceRequired((g) => g.playersWithoutTeam);
  const temTimesFormados = useGameSliceRequired((g) => g.next.length > 0);

  const [novoNome, setNovoNome] = useState("");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [loteAberto, setLoteAberto] = useState(false);

  const listaRef = useRef<FlatList<Player>>(null);

  useEffect(() => {
    if (!erro) return;
    const id = setTimeout(() => setErro(null), AUTO_DISMISS_ERRO_MS);
    return () => clearTimeout(id);
  }, [erro]);

  const buscaNormalizada = busca.trim().toLowerCase();
  const jogadoresFiltrados = useMemo(() => {
    if (!buscaNormalizada) return players;
    return players.filter((p) =>
      p.name.toLowerCase().includes(buscaNormalizada),
    );
  }, [players, buscaNormalizada]);

  const adicionar = () => {
    const nome = novoNome.trim();
    if (!nome) return;
    try {
      gestor.addPlayer(nome);
      setNovoNome("");
      setErro(null);
      // Rolar até o fim para tornar visível o jogador recém-criado.
      setTimeout(() => listaRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const adicionarLote = (nomes: string[]) => {
    try {
      const criados = gestor.addPlayers(nomes);
      setLoteAberto(false);
      if (criados.length === 0) {
        setErro("Nenhum jogador adicionado (todos vazios ou duplicados).");
      } else {
        setErro(null);
        setTimeout(() => listaRef.current?.scrollToEnd({ animated: true }), 50);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const remover = async (p: Player) => {
    const ok = await confirmAcao({
      titulo: "Remover jogador",
      mensagem: `Remover "${p.name}" da pelada?`,
      textoConfirmar: "Remover",
      destrutivo: true,
    });
    if (!ok) return;
    try {
      gestor.removePlayer(p);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const iniciarEdicao = (p: Player) => {
    setEditingId(p.id);
    setEditingNome(p.name);
  };

  const cancelarEdicao = () => {
    setEditingId(null);
    setEditingNome("");
  };

  const confirmarEdicao = (p: Player) => {
    const nome = editingNome.trim();
    // No-op quando o nome não mudou — não chama o domínio e fecha a edição.
    if (nome === p.name) {
      cancelarEdicao();
      return;
    }
    try {
      gestor.renamePlayer(p, editingNome);
      cancelarEdicao();
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
          accessibilityLabel="Nome do novo jogador"
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
          accessibilityRole="button"
          accessibilityLabel="Adicionar jogador"
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
        <Pressable
          onPress={() => setLoteAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar vários jogadores"
          style={({ pressed }) => [
            styles.loteButton,
            {
              borderColor: palette.outline,
              backgroundColor: palette.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          android_ripple={{ color: palette.primary + "22" }}
        >
          <MaterialCommunityIcons
            name="format-list-bulleted-square"
            size={22}
            color={palette.primary}
          />
        </Pressable>
      </View>

      <View style={styles.counterRow}>
        <Text
          style={[styles.counter, { color: palette.onSurfaceVariant }]}
          selectable
        >
          {labelContador(players.length, playersWithoutTeam)}
        </Text>
      </View>

      {players.length >= 5 ? (
        <View style={styles.buscaRow}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={palette.onSurfaceVariant}
            style={{ marginLeft: Spacing.sm }}
          />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por nome"
            placeholderTextColor={palette.onSurfaceVariant}
            accessibilityLabel="Buscar jogador por nome"
            style={[styles.buscaInput, { color: palette.onSurface }]}
          />
          {busca ? (
            <Pressable
              onPress={() => setBusca("")}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              style={styles.iconAction}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={palette.onSurfaceVariant}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {erro ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: palette.errorContainer,
              borderColor: palette.error,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          <MaterialCommunityIcons
            name="alert-circle"
            size={16}
            color={palette.error}
          />
          <Text style={[styles.errorText, { color: palette.error }]} selectable>
            {erro}
          </Text>
          <Pressable
            onPress={() => setErro(null)}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
            style={styles.iconAction}
            android_ripple={{ color: palette.error + "33" }}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={palette.error}
            />
          </Pressable>
        </View>
      ) : null}

      <FlatList
        ref={listaRef}
        data={jogadoresFiltrados}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        ListEmptyComponent={
          buscaNormalizada ? (
            <EmptyState
              icon="magnify"
              title="Nenhum jogador encontrado"
              description={`Não há jogador com "${busca}" no nome.`}
            />
          ) : (
            <EmptyState
              icon="account-multiple-outline"
              title="Nenhum jogador cadastrado"
              description="Adicione jogadores no campo acima para começar a montar a pelada."
            />
          )
        }
        renderItem={({ item }) =>
          editingId === item.id ? (
            <LinhaEdicao
              valor={editingNome}
              onChange={setEditingNome}
              onConfirmar={() => confirmarEdicao(item)}
              onCancelar={cancelarEdicao}
            />
          ) : (
            <LinhaJogador
              player={item}
              mostrarSituacao={temTimesFormados}
              onEditar={() => iniciarEdicao(item)}
              onRemover={() => remover(item)}
            />
          )
        }
      />

      <ModalAdicionarLote
        visivel={loteAberto}
        onFechar={() => setLoteAberto(false)}
        onConfirmar={adicionarLote}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function LinhaJogador({
  player,
  mostrarSituacao,
  onEditar,
  onRemover,
}: {
  player: Player;
  mostrarSituacao: boolean;
  onEditar: () => void;
  onRemover: () => void;
}) {
  const palette = usePalette();

  const acoes = (
    <View style={styles.rightActions}>
      {/* Em web o swipe não é descobrível — mantém lixeira visível. */}
      {Platform.OS === "web" ? (
        <Pressable
          onPress={onRemover}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${player.name}`}
          style={styles.iconAction}
          android_ripple={{ color: palette.error + "33" }}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={22}
            color={palette.error}
          />
        </Pressable>
      ) : null}
      <Pressable
        onPress={onEditar}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${player.name}`}
        style={styles.iconAction}
        android_ripple={{ color: palette.primary + "33" }}
      >
        <MaterialCommunityIcons
          name="pencil-outline"
          size={22}
          color={palette.primary}
        />
      </Pressable>
    </View>
  );

  const linha = (
    <PlayerRow
      player={player}
      showSituation={mostrarSituacao}
      showGoals
      onLongPress={onEditar}
      right={acoes}
    />
  );

  if (Platform.OS === "web") return linha;

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          onPress={onRemover}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${player.name}`}
          style={[
            styles.swipeDeleteAction,
            { backgroundColor: palette.error },
          ]}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={24}
            color={palette.onError}
          />
          <Text style={[styles.swipeDeleteText, { color: palette.onError }]}>
            Remover
          </Text>
        </Pressable>
      )}
      overshootRight={false}
    >
      {linha}
    </Swipeable>
  );
}

function LinhaEdicao({
  valor,
  onChange,
  onConfirmar,
  onCancelar,
}: {
  valor: string;
  onChange: (v: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const palette = usePalette();
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
        value={valor}
        onChangeText={onChange}
        autoFocus
        onSubmitEditing={onConfirmar}
        // Commit ao perder foco (clicar fora) — comportamento "edit in place".
        onBlur={onConfirmar}
        accessibilityLabel="Editar nome do jogador"
        style={[styles.editInput, { color: palette.onSurface }]}
      />
      <Pressable
        onPress={onConfirmar}
        accessibilityRole="button"
        accessibilityLabel="Confirmar edição"
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
        onPress={onCancelar}
        accessibilityRole="button"
        accessibilityLabel="Cancelar edição"
        style={styles.iconAction}
        android_ripple={{ color: palette.error + "33" }}
      >
        <MaterialCommunityIcons name="close" size={22} color={palette.error} />
      </Pressable>
    </View>
  );
}

function ModalAdicionarLote({
  visivel,
  onFechar,
  onConfirmar,
}: {
  visivel: boolean;
  onFechar: () => void;
  onConfirmar: (nomes: string[]) => void;
}) {
  const palette = usePalette();
  const [texto, setTexto] = useState("");

  useEffect(() => {
    if (!visivel) setTexto("");
  }, [visivel]);

  const nomes = useMemo(
    () =>
      texto
        .split(/[\n,;]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    [texto],
  );

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      transparent
      onRequestClose={onFechar}
    >
      <View
        style={[
          styles.modalBackdrop,
          { backgroundColor: palette.shadow },
        ]}
      >
        <View
          style={[
            styles.modalCard,
            { backgroundColor: palette.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: palette.onSurface }]}>
            Adicionar vários
          </Text>
          <Text
            style={[
              styles.modalHint,
              { color: palette.onSurfaceVariant },
            ]}
          >
            Cole ou digite um nome por linha (ou separados por vírgula).
            Vazios e duplicados serão ignorados.
          </Text>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            multiline
            autoFocus
            placeholder={"Ex.:\nAna\nBia\nCaio"}
            placeholderTextColor={palette.onSurfaceVariant}
            accessibilityLabel="Lista de nomes para adicionar em lote"
            style={[
              styles.modalInput,
              {
                color: palette.onSurface,
                borderColor: palette.outline,
                backgroundColor: palette.background,
              },
            ]}
          />
          <Text
            style={[styles.modalCounter, { color: palette.onSurfaceVariant }]}
          >
            {nomes.length} {nomes.length === 1 ? "nome" : "nomes"} reconhecidos
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              onPress={onFechar}
              accessibilityRole="button"
              accessibilityLabel="Cancelar adição em lote"
              style={({ pressed }) => [
                styles.modalSecondary,
                {
                  borderColor: palette.outline,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ color: palette.onSurface }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirmar(nomes)}
              disabled={nomes.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Confirmar adição em lote"
              style={({ pressed }) => [
                styles.modalPrimary,
                {
                  backgroundColor:
                    nomes.length > 0 ? palette.primary : palette.outline,
                  opacity: pressed && nomes.length > 0 ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ color: palette.onPrimary, fontWeight: "600" }}>
                Adicionar {nomes.length > 0 ? nomes.length : ""}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Helpers de label
// ---------------------------------------------------------------------------

function labelContador(total: number, semTime: number): string {
  const baseTotal = `${total} ${total === 1 ? "jogador" : "jogadores"}`;
  if (semTime === 0) return baseTotal;
  const baseSem = `${semTime} sem time${semTime === 1 ? "" : "s"}`;
  return `${baseTotal} · ${baseSem}`;
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

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
  loteButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderCurve: "continuous",
  },
  counterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  counter: {
    ...Typography.label,
  },
  buscaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderColor: "transparent",
  },
  buscaInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    ...Typography.body,
    fontSize: 15,
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
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  swipeDeleteAction: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    marginLeft: Spacing.xs,
    gap: 2,
  },
  swipeDeleteText: {
    ...Typography.label,
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.sm,
  },
  modalTitle: {
    ...Typography.headline,
  },
  modalHint: {
    ...Typography.body,
  },
  modalInput: {
    minHeight: 140,
    maxHeight: 240,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    fontSize: 15,
    textAlignVertical: "top",
  },
  modalCounter: {
    ...Typography.label,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalSecondary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modalPrimary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
});
