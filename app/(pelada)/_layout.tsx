import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { useGameSlice } from "@/src/app-shell/useGameSlice";
import { useSoccer } from "@/src/app-shell/useSoccer";
import { TimerStatus } from "@/src/domain/Timer";
import { usePalette } from "@/src/shared/hooks/usePalette";

/**
 * Tabs internas da pelada.
 *
 * Sem execução ativa (gestor null), só a tab "Pelada" aparece — as
 * tabs Jogadores e Times não fazem sentido sem um GestorJogo carregado
 * e são escondidas via `href: null`.
 */
export default function PeladaLayout() {
  const palette = usePalette();
  const { gestor } = useSoccer();
  const temExecucao = gestor !== null;
  // Indicador "partida correndo" — dot verde sobre o apito (igual ao "AO VIVO"
  // do scoreboard). Só conta partida no estado STARTED; pausa/intervalo não
  // disparam o indicador (o usuário já sabe que tá pausado dentro da tela).
  const partidaAoVivo =
    useGameSlice((g) => g.timer?.status === TimerStatus.STARTED) ?? false;
  // Tab "Partida" só aparece quando faz sentido (M-01):
  //  - há partida em andamento (`playing`), OU
  //  - há ao menos 2 times prontos pra iniciar (`next.length >= 2`).
  // Antes a aba ficava sempre visível e tocá-la sem matchup caía num
  // EmptyState — barulho visual sem ação possível.
  const matchupOuPartidaPronta =
    useGameSlice((g) => g.playing !== undefined || g.next.length >= 2) ??
    false;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Sem execução ativa a tela é "Minhas peladas" (seleção-primeiro),
        // que pelo handoff v2 não tem bottom nav.
        tabBarStyle: temExecucao
          ? {
              backgroundColor: palette.surface,
              borderTopColor: palette.outlineVariant,
              height: 64,
              paddingTop: 6,
              paddingBottom: 8,
            }
          : { display: "none" },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home"
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="jogadores"
        options={{
          title: "Jogadores",
          href: temExecucao ? "/jogadores" : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-multiple"
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="times"
        options={{
          title: "Times",
          href: temExecucao ? "/times" : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="shield-account"
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="partida"
        options={{
          title: "Partida",
          href:
            temExecucao && matchupOuPartidaPronta ? "/partida" : null,
          tabBarIcon: ({ color, size }) => {
            const s = size ?? 24;
            // Container com tamanho explícito (= tamanho do ícone) e
            // overflow visível. Sem dimensão fixa, o <View> colapsa e o dot
            // absoluto fica fora do bounding box — daí o sumiço observado.
            // pointerEvents='box-none' garante que o toque chegue na tab.
            return (
              <View
                pointerEvents="box-none"
                style={{
                  width: s + 4,
                  height: s,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="whistle" size={s} color={color} />
                {partidaAoVivo ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: palette.goal,
                      borderWidth: 1.5,
                      borderColor: palette.surface,
                    }}
                  />
                ) : null}
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          // Acessada via "ver tudo" na Home — fora da tab bar.
          href: null,
          title: "Histórico",
        }}
      />
    </Tabs>
  );
}
