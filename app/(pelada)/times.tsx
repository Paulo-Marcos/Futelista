import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { useGameSliceRequired } from "@/src/app-shell/useGameSlice";
import { GestorJogo } from "@/src/domain/GestorJogo";
import { Team } from "@/src/domain/Team";
import { usePalette } from "@/src/shared/hooks/usePalette";
import { Card } from "@/src/shared/ui/Card";
import { EmptyState } from "@/src/shared/ui/EmptyState";
import { SecondaryButton } from "@/src/shared/ui/SecondaryButton";
import { TeamMini } from "@/src/shared/ui/TeamMini";
import { TeamQueue } from "@/src/shared/ui/TeamQueue";
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

  const next = useGameSliceRequired((g) => g.next);
  const advantageId = useGameSliceRequired((g) => g.advantageToNext?.id);
  const totalJogadores = useGameSliceRequired((g) => g.players.length);
  const playersPerTeam = useGameSliceRequired((g) => g.rules.playersPerTeam);
  const playersWithoutTeam = useGameSliceRequired((g) => g.playersWithoutTeam);
  const temPartida = useGameSliceRequired((g) => g.playing !== undefined);

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
    </View>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

// CTA grande "Iniciar partida" / "Voltar à partida" com glow vermelho.
// Receita do README_Times.md, mesma do PrimaryCTA da Nova pelada:
//   iOS:     shadowColor=primary HEX opaco + offset/opacity/radius.
//   Android: <GlowHalo/> (View vermelha translúcida atrás) — elevation só
//            gera relevo cinza.
//   Web:     `boxShadow` CSS via Platform.select — RN Web não traduz
//            `shadowColor` para sombra colorida.
// Desabilitado vira `primaryDim` (vermelho queimado) sem glow — mais
// próximo do CSS do handoff (`background: var(--primary)` sempre) que do
// `T.surface2` cinza do hand-off TSX. Pattern já usado em Nova pelada e
// Jogadores nesta árvore.
function PrimaryCTA({
  label,
  icon,
  disabled,
  onPress,
  palette,
  accessibilityLabel,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
  accessibilityLabel: string;
}) {
  const webGlow =
    !disabled && Platform.OS === "web"
      ? ({
          boxShadow: `0 12px 30px -8px ${palette.glow}, 0 2px 4px rgba(0,0,0,0.4)`,
        } as object)
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
      {!disabled && Platform.OS === "android" ? (
        <View
          pointerEvents="none"
          style={[styles.glowHalo, { backgroundColor: palette.primary }]}
        />
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: disabled ? palette.primaryDim : palette.primary,
            opacity: disabled ? 0.6 : 1,
          },
          pressed && !disabled && styles.pressedSoft,
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
// Editar time (F-18) — sheet de renomear + cor
// ---------------------------------------------------------------------------

/** Paleta de cores predefinidas para o usuário escolher. Hex 6 dígitos. */
const CORES_TIME: ReadonlyArray<{ hex: string; label: string }> = [
  { hex: "#E11D2A", label: "Vermelho" },
  { hex: "#2E6BE6", label: "Azul" },
  { hex: "#12A150", label: "Verde" },
  { hex: "#F4C20D", label: "Amarelo" },
  { hex: "#1C1C1E", label: "Preto" },
  { hex: "#7B3FE4", label: "Roxo" },
];

function EditarTimeSheet({
  team,
  idx,
  onClose,
  onSalvar,
}: {
  team: Team | null;
  idx: number;
  onClose: () => void;
  onSalvar: (time: Team, patch: { nome?: string; cor?: string }) => void;
}) {
  const palette = usePalette();
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!team) return;
    setNome(team.nomeCustom ?? "");
    setCor(team.corCustom);
  }, [team?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!team) return null;

  const placeholderNome = nomeDoTime(team, idx);

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetWrap} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.sheetGrab, { backgroundColor: palette.outline }]}
          />
          <View style={styles.sheetHead}>
            <View>
              <Text
                style={[
                  styles.sheetEyebrow,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                Personalizar
              </Text>
              <Text style={[styles.sheetTitle, { color: palette.onSurface }]}>
                Editar time
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar editor de time"
              style={styles.sheetCloseBtn}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={palette.onSurface}
              />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            <Text
              style={[styles.sheetLabel, { color: palette.onSurfaceVariant }]}
            >
              Nome
            </Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder={placeholderNome}
              placeholderTextColor={palette.onSurfaceVariant}
              maxLength={30}
              accessibilityLabel="Nome do time"
              style={[
                styles.sheetInput,
                {
                  color: palette.onSurface,
                  borderColor: palette.outline,
                  backgroundColor: palette.background,
                },
              ]}
            />

            <Text
              style={[
                styles.sheetLabel,
                { color: palette.onSurfaceVariant, marginTop: Spacing.md },
              ]}
            >
              Cor
            </Text>
            <View style={styles.coresGrid}>
              <Pressable
                onPress={() => setCor(undefined)}
                accessibilityRole="button"
                accessibilityLabel="Cor padrão (do escudo)"
                accessibilityState={{ selected: cor === undefined }}
                style={({ pressed }) => [
                  styles.corChip,
                  {
                    backgroundColor: palette.surfaceContainerHigh,
                    borderColor:
                      cor === undefined ? palette.primary : palette.outline,
                    borderWidth: cor === undefined ? 2 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="palette-swatch"
                  size={18}
                  color={palette.onSurfaceVariant}
                />
                <Text
                  style={[styles.corLabel, { color: palette.onSurface }]}
                >
                  Padrão
                </Text>
              </Pressable>
              {CORES_TIME.map((c) => (
                <Pressable
                  key={c.hex}
                  onPress={() => setCor(c.hex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Cor ${c.label}`}
                  accessibilityState={{ selected: cor === c.hex }}
                  style={({ pressed }) => [
                    styles.corChip,
                    {
                      backgroundColor: palette.surfaceContainerHigh,
                      borderColor:
                        cor === c.hex ? palette.primary : palette.outline,
                      borderWidth: cor === c.hex ? 2 : 1,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View
                    style={[styles.corDot, { backgroundColor: c.hex }]}
                  />
                  <Text
                    style={[styles.corLabel, { color: palette.onSurface }]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            onPress={() =>
              onSalvar(team, {
                nome: nome.trim(),
                cor: cor ?? "",
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Salvar edição do time"
            style={({ pressed }) => [
              styles.sheetSalvar,
              {
                backgroundColor: palette.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check"
              size={18}
              color={palette.onPrimary}
            />
            <Text style={[styles.sheetSalvarText, { color: palette.onPrimary }]}>
              Salvar
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
  pressedSoft: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  // CTA com glow vermelho — receita do `Times.html` linha 99:
  //   box-shadow: 0 12px 30px -8px var(--glow), 0 2px 4px rgba(0,0,0,.4)
  // shadowColor é injetado em runtime no PrimaryCTA (precisa de HEX opaco; o
  // alpha vem do shadowOpacity). elevation é só reforço Android — o brilho
  // colorido vem do <GlowHalo/>.
  ctaShadow: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaShadowOff: { shadowOpacity: 0, elevation: 0 },
  glowHalo: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 14,
    bottom: -6,
    borderRadius: Radius.md,
    opacity: 0.4,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignSelf: "stretch",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.1,
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

  // ----- Sheet "Editar time" (F-18) -----
  sheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: Spacing.sm,
  },
  sheetGrab: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
    marginBottom: Spacing.sm,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sheetEyebrow: {
    ...Typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 10,
  },
  sheetTitle: { ...Typography.headline, fontSize: 18, marginTop: 2 },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetLabel: {
    ...Typography.label,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sheetInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    ...Typography.body,
    fontSize: 15,
    borderCurve: "continuous",
  },
  coresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  corChip: {
    flexBasis: "30%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  corDot: { width: 18, height: 18, borderRadius: 9 },
  corLabel: { ...Typography.label, fontSize: 12, flex: 1 },
  sheetSalvar: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderCurve: "continuous",
  },
  sheetSalvarText: { ...Typography.title, fontSize: 15, fontWeight: "800" },
});
