import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SoccerProvider } from "@/src/app-shell/soccerProvider";
import { PrefsProvider } from "@/src/shared/prefs/prefsContext";
import { ThemeProvider } from "@/src/shared/theme/themeContext";

/**
 * Versão `.web.tsx`: omite o `BottomSheetModalProvider` do
 * `@gorhom/bottom-sheet` porque a lib não roda sob o Static Rendering
 * do Expo Router web. O fallback `AppBottomSheet.web.tsx` usa `<Modal>`
 * direto e não precisa do provider.
 */
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
