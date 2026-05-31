import { SoccerContext } from "@/contexts/soccerContext";
import { GameManager } from "@/src/domain/GameManager";
import { Rules } from "@/src/domain/Rules";
import { useEffect, useRef, useState } from "react";

export const SoccerProvider = ({ children }: { children: React.ReactNode }) => {
  // const manager: React.MutableRefObject<GameManager | null> = useRef(null);
  // if (manager.current === null) {
  //   manager.current = new GameManager("teste", new Rules());
  // }

  const manager = useRef(new GameManager("teste", new Rules()));

  const [, setValorAtual] = useState(manager.current.next);
  // console.log("valorAtualFora:", valorAtual);

  console.log("oi2");
  console.log("Total Times:", manager.current.next.length);
  useEffect(() => {
    // console.log("oi3");
    // console.log("Total Times:", manager.current?.next.length);
    manager.current?.adicionarObserver((type: string, value: any) => {
      // console.log("oi");
      if ((type = "teams")) {
        // console.log("Total Times:", value);
        // console.log("valorAtual:", valorAtual);
        setValorAtual([]);
        // console.log("valorAtual:", valorAtual);
      }
    });
  }, []);

  return (
    <SoccerContext.Provider value={{ manager: manager.current }}>
      {children}
    </SoccerContext.Provider>
  );
};
