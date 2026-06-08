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
import { PlayerAvatar } from "@/src/shared/ui/PlayerAvatar";
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
  // Total de partidas com resultado definido — usado para calcular % de
  // presença individual dos jogadores no sheet de estatísticas.
  const totalPartidasEncerradas = useGameSliceRequired(
    (g) => g.matches.filter((m) => m.result !== undefined).length,
  );

  const [novoNome, setNovoNome] = useState("");
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
              onVerStats={() => setStatsAberto(item)}
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

      <EstatisticasJogadorSheet
        player={statsAberto}
        totalPartidasEncerradas={totalPartidasEncerradas}
        onFechar={() => setStatsAberto(null)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

/**
 * Botão "+" para adicionar jogador.
 *
 * **Sem glow vermelho**: é uma ação corriqueira (qualquer linha de
 * jogador adicionada usa esse botão) e tem 48×48 — competir
 * visualmente com o CTA principal da pelada ("Iniciar partida") deixa
 * a tela confusa. Estilo: fundo primary sólido + ripple, sem sombra
 * colorida. Convenção do app: glow só em CTA principal da tela.
 */
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
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.addButton,
        {
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
  );
}


function LinhaJogador({
  player,
  mostrarSituacao,
  onEditar,
  onRemover,
  onVerStats,
}: {
  player: Player;
  mostrarSituacao: boolean;
  onEditar: () => void;
  onRemover: () => void;
  onVerStats: () => void;
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
        onPress={onVerStats}
        accessibilityRole="button"
        accessibilityLabel={`Ver estatísticas de ${player.name}`}
        style={styles.iconAction}
        android_ripple={{ color: palette.primary + "33" }}
      >
        <MaterialCommunityIcons
          name="chart-bar"
          size={20}
          color={palette.onSurfaceVariant}
        />
      </Pressable>
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
            {/* Sem glow no botão de modal — convenção: glow só em CTA
                principal da tela. Modal já está sobreposto ao fundo, não
                precisa competir visualmente. */}
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
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sheet de estatísticas individuais do jogador (F-04)
// ---------------------------------------------------------------------------

/**
 * Bottom sheet de leitura — não persiste nada, só agrega o que o domínio
 * já expõe via `Player.stats()`. Aparece quando `player !== null`; o
 * próprio componente lida com renderização condicional pra evitar
 * destruir o Modal a cada open/close (mantém o RN feliz).
 */
function EstatisticasJogadorSheet({
  player,
  totalPartidasEncerradas,
  onFechar,
}: {
  player: Player | null;
  totalPartidasEncerradas: number;
  onFechar: () => void;
}) {
  const palette = usePalette();
  const stats = player?.stats();
  const presencaPct =
    stats && totalPartidasEncerradas > 0
      ? Math.round(
          // Conta como "partida disputada" só as que terminaram —
          // partidas em andamento não entram no denominador.
          (somaResultados(stats) / totalPartidasEncerradas) * 100,
        )
      : null;
  return (
    <Modal
      visible={player !== null}
      animationType="slide"
      transparent
      onRequestClose={onFechar}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: palette.shadow }]}>
        <View
          style={[styles.sheetCard, { backgroundColor: palette.surface }]}
        >
          {player ? (
            <>
              <View style={styles.sheetHeader}>
                <PlayerAvatar player={player} size={56} />
                <View style={styles.sheetHeaderText}>
                  <Text
                    style={[styles.sheetName, { color: palette.onSurface }]}
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  <Text
                    style={[
                      styles.sheetSubtitle,
                      { color: palette.onSurfaceVariant },
                    ]}
                  >
                    Estatísticas nesta execução
                  </Text>
                </View>
                <Pressable
                  onPress={onFechar}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar estatísticas"
                  style={({ pressed }) => [
                    styles.sheetClose,
                    {
                      backgroundColor: palette.surfaceContainerHigh,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color={palette.onSurface}
                  />
                </Pressable>
              </View>

              {stats ? (
                <View style={styles.sheetStatsGrid}>
                  <StatTile
                    icon="soccer"
                    label="Gols"
                    value={stats.gols}
                    accent="goal"
                  />
                  <StatTile
                    icon="whistle"
                    label="Partidas"
                    value={stats.partidas}
                  />
                  <StatTile
                    icon="trophy-outline"
                    label="Vitórias"
                    value={stats.vitorias}
                    accent="tertiary"
                  />
                  <StatTile
                    icon="equal"
                    label="Empates"
                    value={stats.empates}
                  />
                  <StatTile
                    icon="close-octagon-outline"
                    label="Derrotas"
                    value={stats.derrotas}
                  />
                  {presencaPct !== null ? (
                    <StatTile
                      icon="account-check-outline"
                      label="Presença"
                      value={`${presencaPct}%`}
                    />
                  ) : (
                    <StatTile
                      icon="account-check-outline"
                      label="Presença"
                      value="—"
                    />
                  )}
                </View>
              ) : null}

              <Text
                style={[
                  styles.sheetFootnote,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                {totalPartidasEncerradas === 0
                  ? "Nenhuma partida encerrada ainda nesta execução."
                  : `${totalPartidasEncerradas} ${
                      totalPartidasEncerradas === 1 ? "partida" : "partidas"
                    } encerrada${totalPartidasEncerradas === 1 ? "" : "s"} na execução.`}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Tile de uma estatística — ícone + valor grande + label.
 *
 * `accent` colore o ícone com um token específico da paleta — usado para
 * dar destaque visual a "Gols" (goal/verde) e "Vitórias" (tertiary/dourado),
 * mantendo o resto neutro.
 */
function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number | string;
  accent?: "goal" | "tertiary";
}) {
  const palette = usePalette();
  const iconColor =
    accent === "goal"
      ? palette.goal
      : accent === "tertiary"
        ? palette.tertiary
        : palette.onSurfaceVariant;
  return (
    <View
      style={[
        styles.sheetTile,
        {
          backgroundColor: palette.surfaceContainerHigh,
          borderColor: palette.outlineVariant,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      <Text style={[styles.sheetTileValue, { color: palette.onSurface }]}>
        {value}
      </Text>
      <Text
        style={[styles.sheetTileLabel, { color: palette.onSurfaceVariant }]}
      >
        {label}
      </Text>
    </View>
  );
}

function somaResultados(stats: {
  vitorias: number;
  empates: number;
  derrotas: number;
}): number {
  return stats.vitorias + stats.empates + stats.derrotas;
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

  // ----- Sheet de estatísticas (F-04) -----
  sheetCard: {
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sheetHeaderText: { flex: 1 },
  sheetName: { ...Typography.headline, fontSize: 20 },
  sheetSubtitle: { ...Typography.label, fontSize: 11, marginTop: 2 },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sheetTile: {
    // 3 colunas no card largo, ~1 coluna num device estreito. Calculo flex
    // base ~30% para garantir 3 por linha em qualquer largura comum.
    flexBasis: "30%",
    flexGrow: 1,
    minHeight: 80,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderCurve: "continuous",
  },
  // `Typography.number` é `as const` (readonly fontVariant) — copiamos os
  // campos manualmente para satisfazer o tipo mutável esperado por `TextStyle`.
  sheetTileValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    fontVariant: ["tabular-nums" as const],
  },
  sheetTileLabel: {
    ...Typography.label,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  sheetFootnote: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0,
    textTransform: "none",
    textAlign: "center",
  },
});
