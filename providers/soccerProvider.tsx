import { SoccerContext } from "@/contexts/soccerContext";
import { GameManager } from "@/src/domain/GameManager";
import { Rules } from "@/src/domain/Rules";
import { useEffect, useRef, useState } from "react";

export const SoccerProvider = ({ children }: { children: React.ReactNode }) => {
  const manager = useRef(new GameManager("teste", new Rules()));

  // NOTE: força re-render quando o GameManager emite "teams".
  // Anti-pattern conhecido (setState com array vazio) — substituir por padrão
  // reativo (useSyncExternalStore ou store externo). Ver COMMITS_PLAN.md.
  const [, setValorAtual] = useState(manager.current.next);

  useEffect(() => {
    manager.current?.adicionarObserver((type: string, _value: unknown) => {
      if (type === "teams") {
        setValorAtual([]);
      }
    });
  }, []);

  return (
    <SoccerContext.Provider value={{ manager: manager.current }}>
      {children}
    </SoccerContext.Provider>
  );
};
