import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { usePalette } from "@/src/shared/hooks/usePalette";

/**
 * Tabs internas da pelada: Pelada (home), Jogadores e Times.
 * Header customizado é renderizado dentro de cada tela.
 */
export default function PeladaLayout() {
  const palette = usePalette();
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
