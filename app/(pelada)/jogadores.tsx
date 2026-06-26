import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  escolherFotoDoJogador,
  type OrigemFoto,
} from "@/src/app-shell/fotoJogador";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Player } from "@/src/domain/Player";
import { ChoosingTeams } from "@/src/domain/Rules";
import { usePalette } from "@/src/shared/hooks/usePalette";
import {
  AppDraggableList,
  type RenderItemParams,
} from "@/src/shared/ui/AppDraggableList";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { TabHeader } from "@/src/shared/ui/TabHeader";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { AddButton } from "@/src/shared/ui/jogadores/AddButton";
import { EstatisticasJogadorSheet } from "@/src/shared/ui/jogadores/EstatisticasJogadorSheet";
import { LinhaEdicao } from "@/src/shared/ui/jogadores/LinhaEdicao";
import { LinhaJogador } from "@/src/shared/ui/jogadores/LinhaJogador";
import { ModalAdicionarLote } from "@/src/shared/ui/jogadores/ModalAdicionarLote";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

const AUTO_DISMISS_ERRO_MS = 5000;

export default function JogadoresScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  return <JogadoresInner gestor={gestor} />;
}

function JogadoresInner({ gestor }: { gestor: GestorJogo }) {
  const { setFotoDoJogador } = useSoccer();
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  const players = useGameSliceRequired((g) => g.players);
  const playersWithoutTeam = useGameSliceRequired((g) => g.playersWithoutTeam);
  const temTimesFormados = useGameSliceRequired((g) => g.next.length > 0);
  // M-07: drag-to-reorder só faz sentido em modos baseados em ordem,
  // sem times formados nem partida em andamento (o domínio também bloqueia).
  const choosingTeams = useGameSliceRequired((g) => g.rules.choosingTeams);
  const temPartida = useGameSliceRequired((g) => g.playing !== undefined);
  // Total de partidas com resultado definido — usado para calcular % de
  // presença individual dos jogadores no sheet de estatísticas.
  const totalPartidasEncerradas = useGameSliceRequired(
    (g) => g.matches.filter((m) => m.result !== undefined).length,
  );

  const [novoNome, setNovoNome] = useState("");
  // O campo de digitar só aparece depois de tocar em "Adicionar jogador" —
  // por padrão a tela mostra só a lista (sem teclado/input no caminho).
  const [addAberto, setAddAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [loteAberto, setLoteAberto] = useState(false);
  const [statsAberto, setStatsAberto] = useState<Player | null>(null);

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

  // M-07: ativa drag-to-reorder quando todas as pré-condições do domínio
  // batem (sem times formados, sem partida) E a UI está num estado em
  // que mover faz sentido (sem filtro de busca aplicado, modo BY_ORDER*).
  const podeReordenar =
    !buscaNormalizada &&
    !temTimesFormados &&
    !temPartida &&
    (choosingTeams === ChoosingTeams.BY_ORDER ||
      choosingTeams === ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS);

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

  /**
   * Foto do jogador (F-19) — abre escolherOpcao com câmera/galeria/remover
   * e dispara o helper que copia a foto para o sandbox do app.
   */
  const trocarFoto = async (p: Player) => {
    type Acao = OrigemFoto | "remover" | "cancelar";
    const opcoes: {
      label: string;
      valor: Acao;
      estilo?: "destructive" | "cancel";
    }[] = [
      { label: "Tirar foto", valor: "camera" },
      { label: "Escolher da galeria", valor: "galeria" },
    ];
    if (p.fotoUri) {
      opcoes.push({
        label: "Remover foto",
        valor: "remover",
        estilo: "destructive",
      });
    }
    opcoes.push({ label: "Cancelar", valor: "cancelar", estilo: "cancel" });

    const escolha = await escolherOpcao<Acao>({
      titulo: `Foto de ${p.name}`,
      mensagem: "Escolha como atualizar a foto do jogador.",
      opcoes,
    });
    if (!escolha || escolha === "cancelar") return;
    try {
      if (escolha === "remover") {
        await setFotoDoJogador(p.id, null);
        setErro(null);
        return;
      }
      const uri = await escolherFotoDoJogador(p.id, escolha);
      if (uri) {
        await setFotoDoJogador(p.id, uri);
        setErro(null);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
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

  /**
   * M-07: callback do DraggableFlatList — `data` chega na ordem nova,
   * traduzo pra ids e delego pro domínio. Erros (ex.: condição de
   * corrida com partida que iniciou no meio do drag) viram banner.
   */
  const aplicarReordenacao = (novaOrdem: Player[]) => {
    try {
      gestor.reordenarJogadores(novaOrdem.map((p) => p.id));
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
      <TabHeader
        title="Jogadores"
        subtitle={labelContador(players.length, playersWithoutTeam)}
      />

      {/* Container interno com `gap: 12` entre as sections (linha 58 do
          `Jogadores.html`: `.screen { padding: 2px 16px 18px; gap: 12px }`).
          A FlatList sai com `flex:1` pra ocupar o resto da tela. */}
      <View style={styles.body}>
        <View style={styles.addRow}>
          {addAberto ? (
            <>
              <TextInput
                value={novoNome}
                onChangeText={setNovoNome}
                placeholder="Nome do jogador"
                placeholderTextColor={palette.onSurfaceVariant}
                onSubmitEditing={adicionar}
                returnKeyType="done"
                autoFocus
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
              <AddButton
                enabled={!!novoNome.trim()}
                onPress={adicionar}
                palette={palette}
                accessibilityLabel="Adicionar jogador"
              />
              <Pressable
                onPress={() => {
                  setAddAberto(false);
                  setNovoNome("");
                }}
                accessibilityRole="button"
                accessibilityLabel="Fechar adição de jogador"
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
                  name="close"
                  size={22}
                  color={palette.onSurfaceVariant}
                />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => setAddAberto(true)}
                accessibilityRole="button"
                accessibilityLabel="Adicionar jogador"
                style={({ pressed }) => [
                  styles.addOpenBtn,
                  {
                    borderColor: palette.outline,
                    backgroundColor: palette.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                android_ripple={{ color: palette.primary + "22" }}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={20}
                  color={palette.primary}
                />
                <Text
                  style={[styles.addOpenBtnText, { color: palette.onSurface }]}
                >
                  Adicionar jogador
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLoteAberto(true)}
                accessibilityRole="button"
                accessibilityLabel="Adicionar vários jogadores"
                accessibilityHint="Abre uma janela para colar ou digitar vários nomes de uma vez"
                style={({ pressed }) => [
                  styles.loteOpenBtn,
                  {
                    borderColor: palette.outline,
                    backgroundColor: palette.surface,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                android_ripple={{ color: palette.primary + "22" }}
              >
                <MaterialCommunityIcons
                  name="account-multiple-plus"
                  size={20}
                  color={palette.primary}
                />
                <Text
                  style={[styles.loteOpenBtnText, { color: palette.onSurface }]}
                >
                  Vários
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {players.length >= 5 ? (
          <View
            style={[
              styles.buscaRow,
              {
                backgroundColor: palette.surface,
                borderColor: palette.outline,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={palette.onSurfaceVariant}
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
            // Banner cor "warning" (laranja) — não "error" — seguindo o mapa
            // ICONS do handoff RN. O laranja distingue o aviso recuperável da
            // ação destrutiva real (que aparece em vermelho no swipe/lixeira
            // do swipe nativo).
            style={[
              styles.errorBanner,
              {
                backgroundColor: palette.warning + "24",
                borderColor: palette.warning + "73",
              },
            ]}
            accessibilityLiveRegion="polite"
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color={palette.warning}
            />
            <Text
              style={[styles.errorText, { color: palette.warning }]}
              selectable
            >
              {erro}
            </Text>
            <Pressable
              onPress={() => setErro(null)}
              accessibilityRole="button"
              accessibilityLabel="Fechar aviso"
              style={styles.iconAction}
              android_ripple={{ color: palette.warning + "33" }}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={palette.warning}
              />
            </Pressable>
          </View>
        ) : null}

        {podeReordenar ? (
          <AppDraggableList<Player>
            data={jogadoresFiltrados}
            keyExtractor={(p) => p.id}
            onDragEnd={({ data }) => aplicarReordenacao(data)}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + Spacing.xxl },
            ]}
            ListEmptyComponent={
              <EmptyState
                icon="account-multiple-outline"
                illustration="lista"
                title="Nenhum jogador cadastrado"
                description="Adicione jogadores no campo acima para começar a montar a pelada."
              />
            }
            renderItem={({ item, drag, isActive }: RenderItemParams<Player>) =>
              editingId === item.id ? (
                <LinhaEdicao
                  valor={editingNome}
                  onChange={setEditingNome}
                  onConfirmar={() => confirmarEdicao(item)}
                  onCancelar={cancelarEdicao}
                />
              ) : (
                <View style={{ opacity: isActive ? 0.85 : 1 }}>
                  <LinhaJogador
                    player={item}
                    mostrarSituacao={temTimesFormados}
                    onEditar={() => iniciarEdicao(item)}
                    onRemover={() => remover(item)}
                    onVerStats={() => setStatsAberto(item)}
                    onTrocarFoto={() => trocarFoto(item)}
                    onLongPress={drag}
                  />
                </View>
              )
            }
          />
        ) : (
          <FlatList
            ref={listaRef}
            data={jogadoresFiltrados}
            keyExtractor={(p) => p.id}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + Spacing.xxl },
            ]}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.xs }} />
            )}
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
                  onVerStats={() => setStatsAberto(item)}
                  onTrocarFoto={() => trocarFoto(item)}
                />
              )
            }
          />
        )}
      </View>

      <ModalAdicionarLote
        visivel={loteAberto}
        onFechar={() => setLoteAberto(false)}
        onConfirmar={adicionarLote}
      />

      <EstatisticasJogadorSheet
        player={statsAberto}
        totalPartidasEncerradas={totalPartidasEncerradas}
        onFechar={() => setStatsAberto(null)}
      />
    </View>
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
  // Container interno com gap consistente entre sections — receita exata do
  // `Jogadores.html` linha 58: `.screen { padding: 2px 16px 18px; gap: 12px }`.
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  // Botão que revela o campo de adicionar jogador (estado fechado). Mesma
  // identidade visual do input (bg surface + borda outline), em linha.
  addOpenBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  addOpenBtnText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
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
  // Botão "Adicionar vários" (estado fechado). Mesma identidade visual do
  // input/`addOpenBtn` (bg surface + borda outline), mas dimensionado ao
  // conteúdo (sem flex) — assim "Adicionar jogador" continua sendo o
  // primário dominante e este fica como atalho secundário ao lado, com
  // rótulo textual visível para deixar a função óbvia.
  loteOpenBtn: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  loteOpenBtnText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
  },
  // Caixa de busca com a mesma identidade do input "Adicionar jogador":
  // bg=surface, borda outline (hand-off `searchRow`: bg `T.surface`, border 1 `T.line`).
  buscaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  buscaInput: {
    flex: 1,
    paddingHorizontal: 0,
    ...Typography.body,
    fontSize: 14,
  },
  errorBanner: {
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
    flexGrow: 1,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
