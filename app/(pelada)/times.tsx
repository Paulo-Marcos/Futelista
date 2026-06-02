import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GameManager } from "@/src/domain/GameManager";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { Fab } from "@/src/shared/ui/Fab";
import { PrimaryButton } from "@/src/shared/ui/PrimaryButton";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { TabHeader } from "@/src/shared/ui/TabHeader";
import { TeamCard } from "@/src/shared/ui/TeamCard";
import { confirmAcao, escolherOpcao } from "@/src/shared/ui/confirmAcao";
import { Radius, Spacing, Typography } from "@/src/shared/theme/Colors";

const AUTO_DISMISS_ERRO_MS = 5000;

export default function TimesScreen() {
  const { manager } = useSoccer();
  if (!manager) return <Redirect href="/" />;
  return <TimesInner manager={manager} />;
}

type AcaoTime = "mover-fim" | "esvaziar" | "cancelar";

function TimesInner({ manager }: { manager: GameManager }) {
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
  // Modo "trocar jogadores": guarda o id do primeiro jogador selecionado.
  // Próximo toque em jogador de outro time fecha o swap.
  const [jogadorSelecionado, setJogadorSelecionado] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!erro) return;
    const id = setTimeout(() => setErro(null), AUTO_DISMISS_ERRO_MS);
    return () => clearTimeout(id);
  }, [erro]);

  const podeMontar = totalJogadores >= 2 * playersPerTeam;
  const faltamParaIniciar = Math.max(0, 2 * playersPerTeam - totalJogadores);

  const safeAction = (fn: () => void) => {
    try {
      fn();
      setErro(null);
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

  const iniciarPartida = () =>
    safeAction(() => {
      manager.setPlayingGame();
      router.push("/partida");
    });

  const handlePlayerPress = (playerId: string) => {
    if (!jogadorSelecionado) {
      setJogadorSelecionado(playerId);
      return;
    }
    if (jogadorSelecionado === playerId) {
      setJogadorSelecionado(null);
      return;
    }
    safeAction(() => {
      const p1 = manager.players.find((p) => p.id === jogadorSelecionado);
      const p2 = manager.players.find((p) => p.id === playerId);
      if (!p1 || !p2) throw Error("Jogador não encontrado.");
      if (!p1.currentTeam || !p2.currentTeam)
        throw Error("Jogador não está em time.");
      if (p1.currentTeam === p2.currentTeam)
        throw Error("Selecione um jogador de outro time para trocar.");
      manager.switchPlayerFromTeam(p1, p2);
      setJogadorSelecionado(null);
    });
  };

  const handleActionsPress = async (team: Team, ehUltimo: boolean) => {
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
      titulo: "Ações do time",
      mensagem: "Escolha uma ação para este time.",
      opcoes,
    });
    if (!escolha || escolha === "cancelar") return;
    if (escolha === "mover-fim") {
      safeAction(() => manager.moverTimeParaFim(team));
      return;
    }
    const confirmou = await confirmAcao({
      titulo: "Esvaziar time",
      mensagem:
        "Todos os jogadores voltarão para a situação 'sem time'. Continuar?",
      textoConfirmar: "Esvaziar",
      destrutivo: true,
    });
    if (!confirmou) return;
    safeAction(() => manager.esvaziarTime(team));
  };

  const ultimoTimeCheio = next[next.length - 1]?.fullTeam ?? true;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: palette.background, paddingTop: insets.top },
      ]}
    >
      <TabHeader title="Times" />

      <BannerErro
        erro={erro}
        onFechar={() => setErro(null)}
      />

      <BannerSelecao
        ativo={!!jogadorSelecionado}
        nome={
          manager.players.find((p) => p.id === jogadorSelecionado)?.name ?? ""
        }
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
          data={next.slice(2)}
          keyExtractor={(team) => team.id}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xxl + 56 },
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
                      onPlayerPress={handlePlayerPress}
                      onActionsPress={
                        !temPartida
                          ? () =>
                              handleActionsPress(
                                next[0],
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
                      onPlayerPress={handlePlayerPress}
                      onActionsPress={
                        !temPartida
                          ? () =>
                              handleActionsPress(
                                next[1],
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
                      style={[
                        styles.hint,
                        { color: palette.onSurfaceVariant },
                      ]}
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

              {next.length > 2 ? (
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: palette.onSurfaceVariant, marginTop: Spacing.lg },
                  ]}
                >
                  Fila ({next.length - 2})
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const ehUltimo = index === next.length - 3;
            return (
              <TeamCard
                team={item}
                title={`Time ${index + 3}`}
                state="queue"
                showAdvantage={advantageId === item.id}
                selectedPlayerId={jogadorSelecionado ?? undefined}
                onPlayerPress={handlePlayerPress}
                onActionsPress={
                  !temPartida ? () => handleActionsPress(item, ehUltimo) : undefined
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

function BannerErro({
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
}

function BannerSelecao({
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
}

function BannerSemTime({
  quantidade,
  podeCriarIncompleto,
  onAlocar,
}: {
  quantidade: number;
  podeCriarIncompleto: boolean;
  onAlocar: () => void;
}) {
  const palette = usePalette();
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
      {podeCriarIncompleto ? (
        <Text
          style={[styles.bannerHint, { color: palette.onSurfaceVariant }]}
        >
          Como o último time está cheio, "Alocar agora" cria um novo time —
          que pode ficar incompleto.
        </Text>
      ) : null}
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
}

function PlaceholderTime({ faltam }: { faltam: number }) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.placeholder,
        {
          backgroundColor: palette.surfaceVariant,
          borderColor: palette.outline,
        },
      ]}
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
      {faltam > 0 ? (
        <Text
          style={[styles.placeholderHint, { color: palette.onSurfaceVariant }]}
        >
          Faltam {faltam} jogador{faltam === 1 ? "" : "es"} para formar.
        </Text>
      ) : null}
    </View>
  );
}

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
