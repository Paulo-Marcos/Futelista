import { useContext } from "react";

import { SoccerContext } from "@/src/app-shell/soccerContext";

export function useSoccer() {
  return useContext(SoccerContext);
}
