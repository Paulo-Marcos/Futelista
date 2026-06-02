import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { MyProviders } from "@/src/app-shell/myProviders";
import { useColorScheme } from "@/src/shared/hooks/useColorScheme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <MyProviders>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(pelada)" />
          <Stack.Screen
            name="partida"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="resultado"
            options={{
              presentation: "formSheet",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="regras"
            options={{
              presentation: "formSheet",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="peladas"
            options={{
              presentation: "formSheet",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="pelada-nova"
            options={{
              presentation: "formSheet",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="salvar-como-pelada"
            options={{
              presentation: "formSheet",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="dev"
            options={{
              presentation: "formSheet",
              headerShown: false,
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </MyProviders>
    </ThemeProvider>
  );
}
