import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { Fab, FAB_SIZE } from "@/src/shared/ui/Fab";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { TabHeader } from "@/src/shared/ui/TabHeader";
import { TeamCard } from "@/src/shared/ui/TeamCard";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

const AUTO_DISMISS_ERRO_MS = 5000;
const AUTO_DISMISS_SUCESSO_MS = 2500;

export default function TimesScreen() {
  const { manager } = useSoccer();
  if (!manager) return <Redirect href="/" />;
  return <TimesInner manager={manager} />;
}

type AcaoTime = "mover-fim" | "esvaziar" | "cancelar";

function TimesInner({ manager }: { manager: GestorJogo }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const next = useGameSliceRequired((g) => g.next);
  const advantageId = useGameSliceRequired((g) => g.advantageToNext?.id);
  const totalJogadores = useGameSliceRequired((g) => g.players.length);
  const playersPerTeam = useGameSliceRequired((g) => g.rules.playersPerTeam);
  const playersWithoutTeam = useGameSliceRequired((g) => g.playersWithoutTeam);
  const temPartida = useGameSliceRequired((g) => g.playing !== undefined);

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  // Modo "trocar jogadores": guarda o id do primeiro jogador selecionado.
  // Próximo toque em jogador de outro time fecha o swap; toque em jogador
  // do mesmo time apenas substitui a seleção.
  const [jogadorSelecionado, setJogadorSelecionado] = useState<string | null>(
    null,
  );

  // Lê o nome do jogador selecionado pelo seletor — assim subscrevemos
  // apenas a fatia mínima do agregado e evitamos `manager.players` no JSX.
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

  const montar = () => safeAction(() => manager.createTeams());

  const sortearNovamente = async () => {
    const ok = await confirmAcao({
      titulo: "Sortear novamente",
      mensagem: "Os times atuais serão refeitos. Continuar?",
      textoConfirmar: "Sortear",
      destrutivo: true,
    });
    if (!ok) return;
    safeAction(() => {
      manager.resetTimes();
      manager.createTeams();
    });
  };

  const alocarSemTime = () =>
    safeAction(() => manager.relocatePlayersWithoutTeam());

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
      manager.setPlayingGame();
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
    const p1 = manager.players.find((p) => p.id === jogadorSelecionado);
    const p2 = manager.players.find((p) => p.id === playerId);
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
      manager.switchPlayerFromTeam(p1, p2);
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
      safeAction(() => manager.moverTimeParaFim(team));
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
    safeAction(() => manager.esvaziarTime(team));
  };

  const ultimoTimeCheio = next[next.length - 1]?.fullTeam ?? true;
  // Durante uma partida em andamento, esta tela vira somente-leitura:
  // trocas e reorganização passam pela tela /partida.
  const podeInteragirComJogadores = !temPartida;
  const onPlayerPressTime = podeInteragirComJogadores
    ? handlePlayerPress
    : undefined;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <TabHeader title="Times" />

      <BannerErro erro={erro} onFechar={() => setErro(null)} />

      <BannerSucesso mensagem={sucesso} onFechar={() => setSucesso(null)} />

      <BannerSelecao
        ativo={!!jogadorSelecionado}
        nome={nomeJogadorSelecionado}
        onCancelar={() => setJogadorSelecionado(null)}
      />

      {next.length === 0 ? (
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
      ) : (
        <FlatList
          data={fila}
          keyExtractor={(team) => team.id}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xxl + FAB_SIZE },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
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
                <View style={styles.flex}>
                  {next[0] ? (
                    <TeamCard
                      team={next[0]}
                      title="Time 1"
                      state="next"
                      showAdvantage={advantageId === next[0].id}
                      selectedPlayerId={jogadorSelecionado ?? undefined}
                      onPlayerPress={onPlayerPressTime}
                      onActionsPress={
                        !temPartida
                          ? () =>
                              handleActionsPress(
                                next[0],
                                "Time 1",
                                next.length === 1,
                              )
                          : undefined
                      }
                    />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  {next[1] ? (
                    <TeamCard
                      team={next[1]}
                      title="Time 2"
                      state="next"
                      showAdvantage={advantageId === next[1].id}
                      selectedPlayerId={jogadorSelecionado ?? undefined}
                      onPlayerPress={onPlayerPressTime}
                      onActionsPress={
                        !temPartida
                          ? () =>
                              handleActionsPress(
                                next[1],
                                "Time 2",
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
              </View>

              {temPartida ? (
                <PrimaryButton
                  label="Voltar à partida"
                  icon="play-circle-outline"
                  onPress={() => router.push("/partida")}
                  fullWidth
                  accessibilityLabel="Voltar para a partida em andamento"
                />
              ) : (
                <View>
                  <PrimaryButton
                    label="Iniciar partida"
                    icon="whistle"
                    onPress={iniciarPartida}
                    disabled={next.length < 2}
                    fullWidth
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
            const numeroDoTime = index + 3;
            const titulo = `Time ${numeroDoTime}`;
            return (
              <TeamCard
                team={item}
                title={titulo}
                state="queue"
                showAdvantage={advantageId === item.id}
                selectedPlayerId={jogadorSelecionado ?? undefined}
                onPlayerPress={onPlayerPressTime}
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

      {next.length > 0 && !temPartida ? (
        <Fab
          icon="dice-multiple"
          onPress={sortearNovamente}
          accessibilityLabel="Sortear times novamente"
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

const BannerErro = memo(function BannerErro({
  erro,
  onFechar,
}: {
  erro: string | null;
  onFechar: () => void;
}) {
  const palette = usePalette();
  if (!erro) return null;
  return (
    <View
      style={[
        styles.errorBanner,
        {
          backgroundColor: palette.errorContainer,
          borderColor: palette.error,
        },
      ]}
      accessibilityRole="alert"
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
        onPress={onFechar}
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
        style={styles.iconAction}
        android_ripple={{ color: palette.error + "33" }}
      >
        <MaterialCommunityIcons name="close" size={18} color={palette.error} />
      </Pressable>
    </View>
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

const BannerSemTime = memo(function BannerSemTime({
  quantidade,
  podeCriarIncompleto,
  onAlocar,
}: {
  quantidade: number;
  podeCriarIncompleto: boolean;
  onAlocar: () => void;
}) {
  const palette = usePalette();
  // Sempre mostramos o efeito do "Alocar agora" — varia se completa o último
  // time ou cria um novo (potencialmente incompleto).
  const hint = podeCriarIncompleto
    ? 'Como o último time está cheio, "Alocar agora" cria um novo time — que pode ficar incompleto.'
    : '"Alocar agora" completa o último time com os jogadores disponíveis.';
  return (
    <Card variant="surface">
      <View style={styles.bannerRow}>
        <MaterialCommunityIcons
          name="account-question"
          size={20}
          color={palette.warning}
        />
        <Text style={[styles.bannerText, { color: palette.onSurface }]}>
          {quantidade}{" "}
          {quantidade === 1 ? "jogador sem time" : "jogadores sem time"}
        </Text>
      </View>
      <Text style={[styles.bannerHint, { color: palette.onSurfaceVariant }]}>
        {hint}
      </Text>
      <View style={{ marginTop: Spacing.sm }}>
        <SecondaryButton
          label="Alocar agora"
          onPress={onAlocar}
          fullWidth
          accessibilityLabel="Alocar jogadores sem time"
        />
      </View>
    </Card>
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
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorBanner: {
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
  errorText: {
    ...Typography.label,
    flex: 1,
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
  selectionText: {
    ...Typography.label,
    flex: 1,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  bannerText: {
    ...Typography.body,
    flex: 1,
  },
  bannerHint: {
    ...Typography.label,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nextRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
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
