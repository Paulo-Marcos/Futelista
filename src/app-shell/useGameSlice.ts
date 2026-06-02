import { useCallback, useSyncExternalStore } from "react";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { GameManager } from "@/src/domain/GameManager";

const noopUnsubscribe = () => {};

/**
 * Lê um "slice" do GameManager e re-renderiza o componente quando
 * qualquer parte do agregado muda (incluindo ticks do cronômetro).
 *
 * Quando `manager` no contexto é null (sem execução ativa), o seletor
 * não roda e o hook retorna undefined. Útil para componentes dual-mode
 * (gestão vs execução). Componentes que SÓ existem dentro de uma
 * execução devem usar `useGameSliceRequired`.
 */
export function useGameSlice<T>(
  selector: (game: GameManager) => T,
): T | undefined {
  const manager = useSubscribeAoManager();
  return manager ? selector(manager) : undefined;
}

/**
 * Versão estrita — lança se chamado sem execução ativa. Reservar para
 * componentes garantidos por guard de rota.
 */
export function useGameSliceRequired<T>(selector: (game: GameManager) => T): T {
  const manager = useSubscribeAoManager();
  if (!manager) {
    throw Error(
      "useGameSliceRequired usado sem execução ativa — adicione um guard.",
    );
  }
  return selector(manager);
}

/**
 * Subscreve o componente ao `manager` corrente (ou roda no-op quando
 * null). Centraliza o `useSyncExternalStore` para os dois hooks acima.
 */
function useSubscribeAoManager(): GameManager | null {
  const { manager } = useSoccer();
  const subscribe = useCallback(
    (listener: () => void) =>
      manager ? manager.subscribe(listener) : noopUnsubscribe,
    [manager],
  );
  const getSnapshot = useCallback(
    () => (manager ? manager.version : 0),
    [manager],
  );
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return manager;
}
