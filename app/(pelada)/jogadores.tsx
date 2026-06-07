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
      <TabHeader
        title="Jogadores"
        subtitle={labelContador(players.length, playersWithoutTeam)}
      />

      {/* Container interno com `gap: 12` entre as sections (linha 58 do
          `Jogadores.html`: `.screen { padding: 2px 16px 18px; gap: 12px }`).
          A FlatList sai com `flex:1` pra ocupar o resto da tela. */}
      <View style={styles.body}>
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
        <AddButton
          enabled={!!novoNome.trim()}
          onPress={adicionar}
          palette={palette}
          accessibilityLabel="Adicionar jogador"
        />
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
          <Text style={[styles.errorText, { color: palette.warning }]} selectable>
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
      </View>

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

// Botão "+" primário com glow vermelho.
//   - iOS:     shadowColor=primary (HEX opaco) + opacity/radius no wrapper.
//   - Android: <GlowHalo/> (View vermelha translúcida atrás) — elevation só
//              gera relevo cinza, nunca brilho colorido.
//   - Web:     boxShadow CSS direto via Platform.select — RN Web não traduz
//              shadowColor para sombra colorida.
// Quando desabilitado, vira surface cinza sem glow. Mesma receita do
// PeladaNovaScreen.PrimaryCTA, em escala menor.
function AddButton({
  enabled,
  onPress,
  palette,
  accessibilityLabel,
}: {
  enabled: boolean;
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
  accessibilityLabel: string;
}) {
  // Sombra colorida por plataforma — receita do `Jogadores.html` linha 79:
  //   web   → `boxShadow` CSS (RN Web não traduz `shadowColor`).
  //   iOS   → `shadowColor` + opacity/radius no wrapper (`glowShadow`).
  //   Android → <GlowHalo/> (View vermelha translúcida atrás), porque
  //             `elevation` só dá relevo cinza.
  // IMPORTANTE: o halo é RENDERIZADO SÓ no Android. Em web/iOS ele vira uma
  // mancha vermelha no DOM atrás do botão e parece "outro botão" — exatamente
  // o bug que aparecia nesta tela.
  const webGlow =
    enabled && Platform.OS === "web"
      ? ({
          boxShadow: `0 6px 18px -4px ${palette.glow}, 0 2px 4px rgba(0,0,0,0.4)`,
        } as object)
      : null;
  return (
    <View
      style={[
        enabled && styles.glowShadow,
        enabled && { shadowColor: palette.primary },
        webGlow,
      ]}
    >
      {enabled && Platform.OS === "android" ? (
        <GlowHalo color={palette.primary} radius={Radius.md} />
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !enabled }}
        style={({ pressed }) => [
          styles.addButton,
          {
            // Sempre vermelho — quando desabilitado vai para `primaryDim`
            // (vermelho queimado) em vez de cinza. Fidelidade ao
            // `Jogadores.html` (`.addbtn { background: var(--primary) }`,
            // sem estado disabled), e consistente com o `PrimaryCTA` da
            // tela Nova pelada deste mesmo hand-off.
            backgroundColor: enabled ? palette.primary : palette.primaryDim,
            opacity: pressed && enabled ? 0.85 : enabled ? 1 : 0.6,
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
  );
}

// View vermelha translúcida deslocada para baixo. Compensa a ausência de
// elevation colorida no Android e adiciona uma camada extra no iOS/web.
function GlowHalo({ color, radius }: { color: string; radius: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.glowHalo,
        {
          backgroundColor: color,
          borderRadius: radius,
          opacity: Platform.OS === "android" ? 0.4 : 0.55,
        },
      ]}
    />
  );
}

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

  const totalGoals = player.goals.length;

  // Lado direito da linha: badge de gols (verde, 18% bg) + pencil(primary) +
  // delete(warning). Ordem importa — o handoff coloca pencil ANTES do delete.
  // No web mantemos a lixeira visível (sem Swipeable para descobrir).
  const acoes = (
    <View style={styles.rightActions}>
      {totalGoals > 0 ? (
        <View
          style={[
            styles.goalBadge,
            // Goal a ~18% — hex 8 dígitos "2E" ≈ 0.18 alpha.
            { backgroundColor: palette.goal + "2E" },
          ]}
        >
          <MaterialCommunityIcons
            name="soccer"
            size={13}
            color={palette.goal}
          />
          <Text style={[styles.goalBadgeText, { color: palette.goal }]}>
            {totalGoals}
          </Text>
        </View>
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
      {Platform.OS === "web" ? (
        <Pressable
          onPress={onRemover}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${player.name}`}
          style={styles.iconAction}
          android_ripple={{ color: palette.warning + "33" }}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={22}
            color={palette.warning}
          />
        </Pressable>
      ) : null}
    </View>
  );

  const sub =
    totalGoals > 0
      ? `${totalGoals} ${totalGoals === 1 ? "gol" : "gols"} na pelada`
      : "sem gols ainda";
  const linha = (
    <PlayerRow
      player={player}
      showSituation={mostrarSituacao}
      // showGoals=false — o badge verde do handoff é montado aqui no slot
      // `right`; deixar showGoals=true desenharia DOIS contadores.
      onLongPress={onEditar}
      subtitle={sub}
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
        android_ripple={{ color: palette.goal + "33" }}
      >
        <MaterialCommunityIcons name="check" size={22} color={palette.goal} />
      </Pressable>
      <Pressable
        onPress={onCancelar}
        accessibilityRole="button"
        accessibilityLabel="Cancelar edição"
        style={styles.iconAction}
        android_ripple={{ color: palette.warning + "33" }}
      >
        <MaterialCommunityIcons
          name="close"
          size={22}
          color={palette.warning}
        />
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
            <View
              style={[
                nomes.length > 0 && styles.glowShadow,
                nomes.length > 0 && { shadowColor: palette.primary },
                nomes.length > 0 && Platform.OS === "web"
                  ? ({
                      boxShadow: `0 6px 18px -4px ${palette.glow}, 0 2px 4px rgba(0,0,0,0.4)`,
                    } as object)
                  : null,
              ]}
            >
              {nomes.length > 0 && Platform.OS === "android" ? (
                <GlowHalo color={palette.primary} radius={Radius.md} />
              ) : null}
              <Pressable
                onPress={() => onConfirmar(nomes)}
                disabled={nomes.length === 0}
                accessibilityRole="button"
                accessibilityLabel="Confirmar adição em lote"
                style={({ pressed }) => [
                  styles.modalPrimary,
                  {
                    backgroundColor:
                      nomes.length > 0 ? palette.primary : palette.primaryDim,
                    opacity:
                      pressed && nomes.length > 0
                        ? 0.85
                        : nomes.length > 0
                          ? 1
                          : 0.6,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  // Sombra colorida (vermelha) — receita do handoff RN. shadowColor é
  // injetado em runtime pelo AddButton porque precisa ser HEX opaco (o alpha
  // mora no shadowOpacity). elevation no Android só serve de reforço — o
  // brilho colorido propriamente vem do <GlowHalo/>.
  glowShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  glowHalo: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 8,
    bottom: -4,
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
    gap: 2,
  },
  // Pill verde mostrando "⚽ N" quando o jogador tem gols. Fundo é o tom
  // goal a ~18% (palette.goal + "2E"). Texto/ícone na cor cheia.
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginRight: Spacing.xs,
  },
  goalBadgeText: {
    fontWeight: "800",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
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
