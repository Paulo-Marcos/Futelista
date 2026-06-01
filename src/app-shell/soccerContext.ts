import { createContext } from "react";

import { GameManager } from "@/src/domain/GameManager";

export const SoccerContext = createContext({} as { manager: GameManager });
