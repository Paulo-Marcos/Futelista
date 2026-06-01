import { useRef } from "react";

import { SoccerContext } from "@/src/app-shell/soccerContext";
import { GameManager } from "@/src/domain/GameManager";
import { Rules } from "@/src/domain/Rules";

/**
 * Cria uma unica instancia de GameManager que vive pelo lifetime do app.
 * A reatividade fica em useGameSlice (useSyncExternalStore + version).
 */
export const SoccerProvider = ({ children }: { children: React.ReactNode }) => {
  const manager = useRef(new GameManager("teste", new Rules())).current;

  return (
    <SoccerContext.Provider value={{ manager }}>
      {children}
    </SoccerContext.Provider>
  );
};
