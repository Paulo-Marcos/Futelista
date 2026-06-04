import { useCallback, useSyncExternalStore } from "react";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { GestorJogo } from "@/src/domain/GestorJogo";

const noopUnsubscribe = () => {};

/**
 * Lê um "slice" do GestorJogo e re-renderiza o componente quando
 * qualquer parte do agregado muda (incluindo ticks do cronômetro).
 *
 * Quando `gestor` no contexto é null (sem execução ativa), o seletor
 * não roda e o hook retorna undefined. Útil para componentes dual-mode
 * (gestão vs execução). Componentes que SÓ existem dentro de uma
 * execução devem usar `useGameSliceRequired`.
 */
export function useGameSlice<T>(
  selector: (game: GestorJogo) => T,
): T | undefined {
  const gestor = useSubscribeAoManager();
  return gestor ? selector(gestor) : undefined;
}

/**
 * Versão estrita — lança se chamado sem execução ativa. Reservar para
 * componentes garantidos por guard de rota.
 */
export function useGameSliceRequired<T>(selector: (game: GestorJogo) => T): T {
  const gestor = useSubscribeAoManager();
  if (!gestor) {
    throw Error(
      "useGameSliceRequired usado sem execução ativa — adicione um guard.",
    );
  }
  return selector(gestor);
}

/**
 * Subscreve o componente ao `gestor` corrente (ou roda no-op quando
 * null). Centraliza o `useSyncExternalStore` para os dois hooks acima.
 */
function useSubscribeAoManager(): GestorJogo | null {
  const { gestor } = useSoccer();
  const subscribe = useCallback(
    (listener: () => void) =>
      gestor ? gestor.subscribe(listener) : noopUnsubscribe,
    [gestor],
  );
  const getSnapshot = useCallback(
    () => (gestor ? gestor.version : 0),
    [gestor],
  );
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return gestor;
}
