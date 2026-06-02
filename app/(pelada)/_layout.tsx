import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { usePalette } from "@/src/shared/hooks/usePalette";

/**
 * Tabs internas da pelada.
 *
 * Sem execução ativa (manager null), só a tab "Pelada" aparece — as
 * tabs Jogadores e Times não fazem sentido sem um GameManager carregado
 * e são escondidas via `href: null`.
 */
export default function PeladaLayout() {
  const palette = usePalette();
  const { manager } = useSoccer();
  const temExecucao = manager !== null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.outlineVariant,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
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
          title: "Pelada",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="soccer"
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
    </Tabs>
  );
}
