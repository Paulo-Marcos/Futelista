import { GameManager } from "@/src/domain/GameManager";
import { Team } from "@/src/domain/Team";
import { createContext } from "react";

export const SoccerContext = createContext({} as { manager: GameManager });
