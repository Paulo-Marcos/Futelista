import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { ChoosingTeams } from "@/src/domain/Rules";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { ErrorToast } from "@/src/shared/ui/ErrorToast";
import { TeamMini } from "@/src/shared/ui/TeamMini";
import { TeamQueue } from "@/src/shared/ui/TeamQueue";
import { BannerSemTime } from "@/src/shared/ui/times/BannerSemTime";
import { EditarTimeSheet } from "@/src/shared/ui/times/EditarTimeSheet";
import { PartidaSemFila } from "@/src/shared/ui/times/PartidaSemFila";
import { PrimaryCTA } from "@/src/shared/ui/times/PrimaryCTA";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { nomeDoTime } from "@/src/shared/ui/teamLabel";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

const AUTO_DISMISS_ERRO_MS = 5000;
const AUTO_DISMISS_SUCESSO_MS = 2500;

export default function TimesScreen() {
  const { gestor } = useSoccer();
  if (!gestor) return <Redirect href="/" />;
  return <TimesInner gestor={gestor} />;
}

type AcaoTime = "mover-fim" | "esvaziar" | "cancelar";

function TimesInner({ gestor }: { gestor: GestorJogo }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // M-02: aceita ?scrollTo=fila vindo da Home (StatCard "na fila") para
  // rolar até a section "Fila" automaticamente assim que a tela monta.
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const flatListRef = useRef<FlatList<Team> | null>(null);

  const next = useGameSliceRequired((g) => g.next);
  const choosingTeams = useGameSliceRequired((g) => g.rules.choosingTeams);
  const advantageId = useGameSliceRequired((g) => g.advantageToNext?.id);
  const totalJogadores = useGameSliceRequired((g) => g.players.length);
  const playersPerTeam = useGameSliceRequired((g) => g.rules.playersPerTeam);
  const playersWithoutTeam = useGameSliceRequired((g) => g.playersWithoutTeam);
  const temPartida = useGameSliceRequired((g) => g.playing !== undefined);
  // Times atualmente em campo — usados na visão read-only quando a fila ficou
  // vazia (os 2 únicos times entraram em campo). Refs estáveis enquanto a
  // partida não troca.
  const partidaTeamA = useGameSliceRequired((g) => g.playing?.teamA);
  const partidaTeamB = useGameSliceRequired((g) => g.playing?.teamB);

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [editandoTime, setEditandoTime] = useState<Team | null>(null);
  // Modo "trocar jogadores": guarda o id do primeiro jogador selecionado.
  // Próximo toque em jogador de outro time fecha o swap; toque em jogador
  // do mesmo time apenas substitui a seleção.
  const [jogadorSelecionado, setJogadorSelecionado] = useState<string | null>(
    null,
  );

  // Lê o nome do jogador selecionado pelo seletor — assim subscrevemos
  // apenas a fatia mínima do agregado e evitamos `gestor.players` no JSX.
  const nomeJogadorSelecionado = useGameSliceRequired((g) =>
    jogadorSelecionado
      ? (g.players.find((p) => p.id === jogadorSelecionado)?.name ?? "")
      : "",
  );

  // Fila a partir do Time 3 — estável entre renders quando `next` não muda.
  const fila = useMemo(() => next.slice(2), [next]);

  useEffect(() => {
    if (!erro) return;
    const id = setTimeout(() => setErro(null), AUTO_DISMISS_ERRO_MS);
    return () => clearTimeout(id);
  }, [erro]);

  useEffect(() => {
    if (!sucesso) return;
    const id = setTimeout(() => setSucesso(null), AUTO_DISMISS_SUCESSO_MS);
    return () => clearTimeout(id);
  }, [sucesso]);

  // M-08: o back físico do Android cancela a seleção antes de sair da
  // tela. Sem isso o usuário precisa tocar no banner ou no mesmo
  // jogador, o que vira pegadinha em listas longas.
  useEffect(() => {
    if (!jogadorSelecionado) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setJogadorSelecionado(null);
      return true;
    });
    return () => sub.remove();
  }, [jogadorSelecionado]);

  // M-02: ?scrollTo=fila rola a FlatList até o primeiro item da fila.
  // Usamos `scrollToIndex` com viewPosition=0 (alinha topo). Quando a fila
  // está vazia caímos num scrollToOffset grande pra empurrar a seção
  // "Próxima partida" pra cima e mostrar pelo menos o título "Fila (0)".
  useEffect(() => {
    if (scrollTo !== "fila") return;
    // Espera 1 frame pro layout da ListHeaderComponent estabilizar.
    const id = setTimeout(() => {
      if (!flatListRef.current) return;
      if (fila.length > 0) {
        flatListRef.current.scrollToIndex({
          index: 0,
          animated: true,
          viewPosition: 0.1,
        });
      } else {
        flatListRef.current.scrollToOffset({
          offset: 9999,
          animated: true,
        });
      }
    }, 80);
    return () => clearTimeout(id);
  }, [scrollTo, fila.length]);

  const podeMontar = totalJogadores >= 2 * playersPerTeam;
  const faltamParaIniciar = Math.max(0, 2 * playersPerTeam - totalJogadores);

  // Mantém o `erro` anterior visível em caso de novo sucesso (auto-dismiss
  // só pelo timer): a leitura curta de uma mensagem não deve ser engolida
  // pelo próximo clique bem-sucedido.
  const safeAction = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const montar = () => safeAction(() => gestor.createTeams());

  const sortearNovamente = async () => {
    const ok = await confirmAcao({
      titulo: "Sortear novamente",
      mensagem: "Os times atuais serão refeitos. Continuar?",
      textoConfirmar: "Sortear",
      destrutivo: true,
    });
    if (!ok) return;
    safeAction(() => {
      gestor.resetTimes();
      gestor.createTeams();
    });
  };

  const alocarSemTime = () =>
    safeAction(() => gestor.relocatePlayersWithoutTeam());

  // Apenas em dev (__DEV__): sanea times de saves antigos corrompidos
  // (jogador no roster de dois times, referência de time repetida em next)
  // sem precisar fechar/reabrir a pelada. O autosave persiste o resultado.
  const repararDev = () =>
    safeAction(() => {
      gestor.repararIntegridadeDosTimes();
      setSucesso("Integridade dos times reparada.");
    });

  const iniciarPartida = async () => {
    if (playersWithoutTeam > 0) {
      const ok = await confirmAcao({
        titulo: "Iniciar com jogadores sem time?",
        mensagem: `${playersWithoutTeam} ${
          playersWithoutTeam === 1 ? "jogador está" : "jogadores estão"
        } sem time. Eles só entram quando completar um time. Iniciar mesmo assim?`,
        textoConfirmar: "Iniciar",
      });
      if (!ok) return;
    }
    safeAction(() => {
      gestor.setPlayingGame();
      router.push("/partida");
    });
  };

  const handlePlayerPress = (playerId: string) => {
    if (!jogadorSelecionado) {
      setJogadorSelecionado(playerId);
      return;
    }
    if (jogadorSelecionado === playerId) {
      setJogadorSelecionado(null);
      return;
    }
    const p1 = gestor.players.find((p) => p.id === jogadorSelecionado);
    const p2 = gestor.players.find((p) => p.id === playerId);
    if (!p1 || !p2) {
      setErro("Jogador não encontrado.");
      return;
    }
    if (!p1.currentTeam || !p2.currentTeam) {
      setErro("Jogador não está em time.");
      return;
    }
    // Mesmo time → não é erro: o usuário só está reconsiderando a seleção.
    // Substituímos silenciosamente o p1 pelo recém-tocado.
    if (p1.currentTeam === p2.currentTeam) {
      setJogadorSelecionado(playerId);
      return;
    }
    safeAction(() => {
      gestor.switchPlayerFromTeam(p1, p2);
      setJogadorSelecionado(null);
      setSucesso(`${p1.name} ↔ ${p2.name} trocados.`);
    });
  };

  const handleActionsPress = async (
    team: Team,
    tituloDoTime: string,
    ehUltimo: boolean,
  ) => {
    const opcoes: {
      label: string;
      valor: AcaoTime;
      estilo?: "destructive" | "cancel";
    }[] = [];
    if (!ehUltimo)
      opcoes.push({ label: "Mover para o fim", valor: "mover-fim" });
    opcoes.push({
      label: "Esvaziar time",
      valor: "esvaziar",
      estilo: "destructive",
    });
    opcoes.push({ label: "Cancelar", valor: "cancelar", estilo: "cancel" });

    const escolha = await escolherOpcao<AcaoTime>({
      titulo: `Ações do ${tituloDoTime}`,
      mensagem: `Escolha uma ação para o ${tituloDoTime}.`,
      opcoes,
    });
    if (!escolha || escolha === "cancelar") return;
    if (escolha === "mover-fim") {
      safeAction(() => gestor.moverTimeParaFim(team));
      return;
    }
    const confirmou = await confirmAcao({
      titulo: `Esvaziar ${tituloDoTime}`,
      mensagem:
        "Todos os jogadores voltarão para a situação 'sem time'. Continuar?",
      textoConfirmar: "Esvaziar",
      destrutivo: true,
    });
    if (!confirmou) return;
    safeAction(() => gestor.esvaziarTime(team));
  };

  const ultimoTimeCheio = next[next.length - 1]?.fullTeam ?? true;
  // Durante uma partida em andamento, esta tela vira somente-leitura:
  // trocas e reorganização passam pela tela /partida.
  const podeInteragirComJogadores = !temPartida;
  const onPlayerPressTime = podeInteragirComJogadores
    ? handlePlayerPress
    : undefined;

  // Botão dice fica embutido no header do Times (handoff `Times.html` linha
  // 63-71: `.tabheader` é row flex-end com title à esquerda + iconbtn 40×40
  // à direita), substituindo o Fab antigo. O accessibilityLabel é o mesmo
  // pelo qual a suíte filtra ("Sortear times novamente"), então a condição
  // de render (com times montados e sem partida em andamento) é preservada.
  const mostraDice = next.length > 0 && !temPartida;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCol}>
          <Text style={[styles.headerTitle, { color: palette.onSurface }]}>
            Times
          </Text>
          <Text
            style={[styles.headerSub, { color: palette.onSurfaceVariant }]}
            numberOfLines={1}
          >
            Vencedor fica · perdedor sai
          </Text>
        </View>
        {__DEV__ ? (
          <Pressable
            onPress={repararDev}
            accessibilityRole="button"
            accessibilityLabel="DEV: reparar integridade dos times"
            style={({ pressed }) => [
              styles.headerIconBtn,
              {
                backgroundColor: palette.surfaceContainerHigh,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            android_ripple={{ color: palette.primary + "22" }}
          >
            <MaterialCommunityIcons
              name="wrench-outline"
              size={20}
              color={palette.warning}
            />
          </Pressable>
        ) : null}
        {mostraDice ? (
          <Pressable
            onPress={sortearNovamente}
            accessibilityRole="button"
            accessibilityLabel="Sortear times novamente"
            style={({ pressed }) => [
              styles.headerIconBtn,
              {
                backgroundColor: palette.surfaceContainerHigh,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            android_ripple={{ color: palette.primary + "22" }}
          >
            <MaterialCommunityIcons
              name="dice-multiple"
              size={20}
              color={palette.onSurface}
            />
          </Pressable>
        ) : null}
      </View>

      {mostraDice ? (
        <RegraTimesChip
          choosingTeams={choosingTeams}
          onPress={() => router.push("/regras")}
        />
      ) : null}

      <BannerSucesso mensagem={sucesso} onFechar={() => setSucesso(null)} />

      <BannerSelecao
        ativo={!!jogadorSelecionado}
        nome={nomeJogadorSelecionado}
        onCancelar={() => setJogadorSelecionado(null)}
      />

      {next.length === 0 && !temPartida ? (
        <EmptyState
          icon="shield-outline"
          title="Times ainda não foram montados"
          description={
            podeMontar
              ? "Use o botão abaixo para sortear os times de acordo com as regras."
              : `Adicione pelo menos ${2 * playersPerTeam} jogadores para montar 2 times.`
          }
          actionLabel="Montar times"
          onAction={montar}
          actionDisabled={!podeMontar}
        />
      ) : next.length === 0 && temPartida ? (
        // Partida em andamento com a fila vazia (os 2 únicos times entraram em
        // campo). NÃO oferecemos "Montar times" — recriar os times duplicaria
        // quem está jogando. Mostramos os times em campo (read-only) e, se a
        // galera chegou no meio do rolê, o banner pra formar o próximo time.
        <PartidaSemFila
          teamA={partidaTeamA}
          teamB={partidaTeamB}
          playersWithoutTeam={playersWithoutTeam}
          podeCriarIncompleto={ultimoTimeCheio}
          onAlocar={alocarSemTime}
          onVoltar={() => router.push("/partida")}
          insets={insets}
          palette={palette}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={fila}
          keyExtractor={(team) => team.id}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            <View style={{ gap: Spacing.md }}>
              {playersWithoutTeam > 0 ? (
                <BannerSemTime
                  quantidade={playersWithoutTeam}
                  podeCriarIncompleto={ultimoTimeCheio}
                  onAlocar={alocarSemTime}
                />
              ) : null}

              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.onSurfaceVariant },
                ]}
                accessibilityRole="header"
              >
                Próxima partida
              </Text>
              <View style={styles.nextRow}>
                {next[0] ? (
                  <TeamMini
                    team={next[0]}
                    idx={0}
                    tone="A"
                    selectedPlayerId={jogadorSelecionado ?? undefined}
                    onPlayerPress={onPlayerPressTime}
                    comVantagem={next[0].id === advantageId}
                    onLongPress={
                      !temPartida ? () => setEditandoTime(next[0]) : undefined
                    }
                    onActionsPress={
                      !temPartida
                        ? () =>
                            handleActionsPress(
                              next[0],
                              nomeDoTime(next[0], 0),
                              next.length === 1,
                            )
                        : undefined
                    }
                  />
                ) : null}
                {next[1] ? (
                  <TeamMini
                    team={next[1]}
                    idx={1}
                    tone="B"
                    selectedPlayerId={jogadorSelecionado ?? undefined}
                    onPlayerPress={onPlayerPressTime}
                    comVantagem={next[1].id === advantageId}
                    onLongPress={
                      !temPartida ? () => setEditandoTime(next[1]) : undefined
                    }
                    onActionsPress={
                      !temPartida
                        ? () =>
                            handleActionsPress(
                              next[1],
                              nomeDoTime(next[1], 1),
                              next.length === 2,
                            )
                        : undefined
                    }
                  />
                ) : (
                  <PlaceholderTime
                    faltam={playersPerTeam - (next[0]?.players.length ?? 0)}
                  />
                )}
              </View>

              {temPartida ? (
                <PrimaryCTA
                  label="Voltar à partida"
                  icon="play-circle-outline"
                  onPress={() => router.push("/partida")}
                  palette={palette}
                  accessibilityLabel="Voltar para a partida em andamento"
                />
              ) : (
                <View>
                  <PrimaryCTA
                    label="Iniciar partida"
                    icon="whistle"
                    onPress={iniciarPartida}
                    disabled={next.length < 2}
                    palette={palette}
                    accessibilityLabel="Iniciar a próxima partida"
                  />
                  {next.length < 2 ? (
                    <Text
                      style={[styles.hint, { color: palette.onSurfaceVariant }]}
                    >
                      {faltamParaIniciar > 0
                        ? `Faltam ${faltamParaIniciar} jogador${
                            faltamParaIniciar === 1 ? "" : "es"
                          } para iniciar.`
                        : "Aguardando jogadores serem alocados ao 2º time."}
                    </Text>
                  ) : null}
                </View>
              )}

              {fila.length > 0 ? (
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: palette.onSurfaceVariant, marginTop: Spacing.lg },
                  ]}
                  accessibilityRole="header"
                >
                  Fila ({fila.length})
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const ehUltimoDaFila = index === fila.length - 1;
            const idx = index + 2;
            const titulo = nomeDoTime(item, idx);
            return (
              <TeamQueue
                team={item}
                idx={idx}
                onActionsPress={
                  !temPartida
                    ? () => handleActionsPress(item, titulo, ehUltimoDaFila)
                    : undefined
                }
              />
            );
          }}
        />
      )}

      <EditarTimeSheet
        team={editandoTime}
        idx={editandoTime ? next.indexOf(editandoTime) : -1}
        onClose={() => setEditandoTime(null)}
        onSalvar={(time, patch) => {
          safeAction(() => gestor.editarTime(time, patch));
          setEditandoTime(null);
        }}
      />

      {/* M-11: erro como toast flutuante no rodapé (sem empurrar conteúdo).
          Offset = 60 pra ficar acima do FAB Cancelar quando os dois
          aparecem juntos. */}
      <ErrorToast
        erro={erro}
        onFechar={() => setErro(null)}
        bottomOffset={jogadorSelecionado ? 60 : 0}
      />

      {/* M-08: FAB "Cancelar" persistente quando há jogador selecionado.
          O banner no topo ainda está lá com contexto (qual jogador), mas
          em listas longas o usuário não vê o X do banner — esse FAB
          fica sempre alcançável. */}
      {jogadorSelecionado ? (
        <Pressable
          onPress={() => setJogadorSelecionado(null)}
          accessibilityRole="button"
          accessibilityLabel="Cancelar troca de jogadores"
          style={({ pressed }) => [
            styles.cancelFab,
            {
              backgroundColor: palette.surface,
              borderColor: palette.error,
              shadowColor: palette.shadow,
              bottom: insets.bottom + Spacing.lg,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={palette.error}
          />
          <Text style={[styles.cancelFabText, { color: palette.error }]}>
            Cancelar
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

// Chip informativo: mostra qual regra de montagem de times está em uso, pra o
// usuário entender o resultado do sorteio antes de ficar apertando o dado.
// Toque leva às Regras pra trocar a estratégia.
function rotuloRegraTimes(c: ChoosingTeams): string {
  switch (c) {
    case ChoosingTeams.BY_ORDER:
      return "Por ordem de chegada";
    case ChoosingTeams.BY_ORDER_MIXING_TOP_TWO_TEAMS:
      return "Sorteia os 2 primeiros times";
    case ChoosingTeams.BY_MIXING_TEAMS:
      return "Sorteio geral (embaralha todos)";
  }
}

const RegraTimesChip = memo(function RegraTimesChip({
  choosingTeams,
  onPress,
}: {
  choosingTeams: ChoosingTeams;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Regra de sorteio: ${rotuloRegraTimes(choosingTeams)}. Toque para mudar nas regras.`}
      style={({ pressed }) => [
        styles.regraChip,
        {
          backgroundColor: palette.surfaceContainerHigh,
          borderColor: palette.outlineVariant,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="shuffle-variant"
        size={14}
        color={palette.primary}
      />
      <Text
        style={[styles.regraChipLabel, { color: palette.onSurfaceVariant }]}
      >
        Sorteio:
      </Text>
      <Text
        style={[styles.regraChipText, { color: palette.onSurface }]}
        numberOfLines={1}
      >
        {rotuloRegraTimes(choosingTeams)}
      </Text>
      <MaterialCommunityIcons
        name="pencil-outline"
        size={13}
        color={palette.onSurfaceVariant}
      />
    </Pressable>
  );
});

const BannerSucesso = memo(function BannerSucesso({
  mensagem,
  onFechar,
}: {
  mensagem: string | null;
  onFechar: () => void;
}) {
  const palette = usePalette();
  if (!mensagem) return null;
  return (
    <View
      style={[
        styles.successBanner,
        {
          backgroundColor: palette.secondaryContainer,
          borderColor: palette.secondary,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons
        name="check-circle"
        size={16}
        color={palette.onSecondaryContainer}
      />
      <Text
        style={[styles.successText, { color: palette.onSecondaryContainer }]}
        selectable
      >
        {mensagem}
      </Text>
      <Pressable
        onPress={onFechar}
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
        style={styles.iconAction}
        android_ripple={{ color: palette.secondary + "33" }}
      >
        <MaterialCommunityIcons
          name="close"
          size={18}
          color={palette.onSecondaryContainer}
        />
      </Pressable>
    </View>
  );
});

const BannerSelecao = memo(function BannerSelecao({
  ativo,
  nome,
  onCancelar,
}: {
  ativo: boolean;
  nome: string;
  onCancelar: () => void;
}) {
  const palette = usePalette();
  if (!ativo) return null;
  return (
    <View
      style={[
        styles.selectionBanner,
        {
          backgroundColor: palette.primaryContainer,
          borderColor: palette.primary,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons
        name="swap-horizontal"
        size={18}
        color={palette.onPrimaryContainer}
      />
      <Text
        style={[styles.selectionText, { color: palette.onPrimaryContainer }]}
      >
        {`Trocar "${nome}" — toque em outro jogador`}
      </Text>
      <Pressable
        onPress={onCancelar}
        accessibilityRole="button"
        accessibilityLabel="Cancelar troca"
        style={styles.iconAction}
        android_ripple={{ color: palette.primary + "33" }}
      >
        <MaterialCommunityIcons
          name="close"
          size={18}
          color={palette.onPrimaryContainer}
        />
      </Pressable>
    </View>
  );
});

const PlaceholderTime = memo(function PlaceholderTime({
  faltam,
}: {
  faltam: number;
}) {
  const palette = usePalette();
  const hint =
    faltam > 0
      ? `Faltam ${faltam} jogador${faltam === 1 ? "" : "es"} para formar.`
      : undefined;
  return (
    <View
      style={[
        styles.placeholder,
        {
          backgroundColor: palette.surfaceVariant,
          borderColor: palette.outline,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={
        hint ? `Aguardando 2º time. ${hint}` : "Aguardando 2º time."
      }
    >
      <MaterialCommunityIcons
        name="account-clock-outline"
        size={28}
        color={palette.onSurfaceVariant}
      />
      <Text
        style={[styles.placeholderTitle, { color: palette.onSurfaceVariant }]}
      >
        Aguardando 2º time
      </Text>
      {hint ? (
        <Text
          style={[styles.placeholderHint, { color: palette.onSurfaceVariant }]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // Header inline (handoff `.tabheader`): row flex-end, paddingHorizontal=lg,
  // paddingTop=md, paddingBottom=xs. Sem bg surface (no handoff o `.screen` é
  // uniforme `--bg`); título 30/800/-0.6 + sub 13 dim — mesma escala do
  // hand-off de Jogadores quando o subtitle entra.
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerCol: { flex: 1, minWidth: 0 },
  // Chip "Sorteio: <regra>" — fica logo abaixo do header, alinhado à margem.
  regraChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderCurve: "continuous",
    maxWidth: "92%",
  },
  regraChipLabel: {
    ...Typography.label,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  regraChipText: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  // Botão dice no canto direito do header — 40×40, bg surface2.
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  // `.screen { padding: 2px 16px 18px; gap: 14px }` do Times.html — gap de 14
  // (entre Spacing.md=12 e Spacing.lg=16) é específico desse handoff, então
  // vai cru. A lista de fila herda o mesmo container.
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: 14,
  },
  successBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  successText: {
    ...Typography.label,
    flex: 1,
  },
  selectionBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  // M-08: FAB de "Cancelar" do modo trocar jogadores. Pílula
  // arredondada com sombra elevada — fica sobre o conteúdo sem
  // depender do banner ainda estar visível.
  cancelFab: {
    position: "absolute",
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelFabText: {
    ...Typography.label,
    fontWeight: "600",
  },
  selectionText: {
    ...Typography.label,
    flex: 1,
  },
  // Hand-off `.label`: 11/700, letter-spacing .06em, uppercase, dim.
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  nextRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  hint: {
    ...Typography.label,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    minHeight: 140,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  placeholderTitle: {
    ...Typography.title,
    fontSize: 14,
  },
  placeholderHint: {
    ...Typography.label,
    textAlign: "center",
  },
});
