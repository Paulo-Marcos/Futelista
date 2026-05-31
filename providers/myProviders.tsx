import React from "react";
import { SoccerProvider } from "./soccerProvider";

export const MyProviders = ({ children }: { children: React.ReactNode }) => {
  return <SoccerProvider>{children}</SoccerProvider>;
};
