import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from "@expo-google-fonts/archivo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { MyProviders } from "@/src/app-shell/myProviders";
import { useTheme } from "@/src/shared/theme/themeContext";
import { Splash } from "@/src/shared/ui/Splash";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (loaded) {
      // Esconde a splash nativa do Expo assim que as fontes carregam;
      // nosso Splash JS controla a transição visual para a Home.
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <MyProviders>
      <NavigationThemeBridge>
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
            name="pelada-editar"
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
          <Stack.Screen
            name="splash-preview"
            options={{ headerShown: false, animation: "fade" }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        {!splashDone ? <Splash onDone={() => setSplashDone(true)} /> : null}
      </NavigationThemeBridge>
    </MyProviders>
  );
}

/**
 * Casa o `effectiveMode` do nosso ThemeProvider com o tema do React
 * Navigation, garantindo que cabeçalhos, fundos e cores de transição
 * fiquem alinhados com a paleta escolhida.
 */
function NavigationThemeBridge({ children }: { children: React.ReactNode }) {
  const { effectiveMode } = useTheme();
  return (
    <NavigationThemeProvider
      value={effectiveMode === "dark" ? DarkTheme : DefaultTheme}
    >
      {children}
    </NavigationThemeProvider>
  );
}
