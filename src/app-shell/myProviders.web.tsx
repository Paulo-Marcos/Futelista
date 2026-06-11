import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SoccerProvider } from "@/src/app-shell/soccerProvider";
import { PrefsProvider } from "@/src/shared/prefs/prefsContext";
import { ThemeProvider } from "@/src/shared/theme/themeContext";
import { ConfirmAcaoHost } from "@/src/shared/ui/ConfirmAcaoHost";
import { WebPhoneFrame } from "@/src/shared/ui/WebPhoneFrame";

/**
 * Versão `.web.tsx`: omite o `BottomSheetModalProvider` do
 * `@gorhom/bottom-sheet` porque a lib não roda sob o Static Rendering
 * do Expo Router web. O fallback `AppBottomSheet.web.tsx` usa `<Modal>`
 * direto e não precisa do provider.
 *
 * `WebPhoneFrame` envolve todo o app: na web ele renderiza a UI numa moldura
 * de celular redimensionável (e contém os modais). Em telas estreitas ou no
 * Static Rendering ele é transparente e o app ocupa tudo.
 */
export const MyProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WebPhoneFrame>
        <SafeAreaProvider>
          <ThemeProvider>
            <PrefsProvider>
              <SoccerProvider>{children}</SoccerProvider>
              <ConfirmAcaoHost />
            </PrefsProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </WebPhoneFrame>
    </GestureHandlerRootView>
  );
};
