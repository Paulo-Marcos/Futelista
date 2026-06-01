import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SoccerProvider } from "@/src/app-shell/soccerProvider";

export const MyProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaProvider>
      <SoccerProvider>{children}</SoccerProvider>
    </SafeAreaProvider>
  );
};
