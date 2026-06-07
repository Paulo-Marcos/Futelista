import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SoccerProvider } from "@/src/app-shell/soccerProvider";
import { PrefsProvider } from "@/src/shared/prefs/prefsContext";
import { ThemeProvider } from "@/src/shared/theme/themeContext";

export const MyProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PrefsProvider>
            <SoccerProvider>{children}</SoccerProvider>
          </PrefsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
