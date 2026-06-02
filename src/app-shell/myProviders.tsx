import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SoccerProvider } from "@/src/app-shell/soccerProvider";

export const MyProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SoccerProvider>{children}</SoccerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
