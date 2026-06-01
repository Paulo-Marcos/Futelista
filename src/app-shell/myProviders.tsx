import React from "react";

import { SoccerProvider } from "@/src/app-shell/soccerProvider";

export const MyProviders = ({ children }: { children: React.ReactNode }) => {
  return <SoccerProvider>{children}</SoccerProvider>;
};
