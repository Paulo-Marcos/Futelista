import { createContext } from "react";

import { GameManager } from "@/src/domain/GameManager";
import { DataRules } from "@/src/domain/Rules";

export type SoccerContextValue = {
  manager: GameManager;
  criarNovaPelada: (nome?: string, regras?: DataRules) => Promise<void>;
  limparDados: () => Promise<void>;
};

export const SoccerContext = createContext({} as SoccerContextValue);
