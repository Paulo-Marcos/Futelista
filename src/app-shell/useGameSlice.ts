import { useCallback, useSyncExternalStore } from "react";

import { useSoccer } from "@/src/app-shell/useSoccer";
import { GameManager } from "@/src/domain/GameManager";

/**
 * Le um "slice" do GameManager e re-renderiza o componente quando
 * qualquer parte do agregado muda (incluindo ticks do cronometro).
 *
 * Internamente usa useSyncExternalStore + version monotonica do
 * GameManager: o React subscribe a `manager.version` (numero estavel
 * quando nada mudou) e quando o numero incrementa, o componente
 * re-renderiza e o `selector` retorna o dado fresco.
 *
 * Use selectors que retornam primitivos ou referencias do agregado;
 * o React nao compara o resultado do selector, apenas a version.
 *
 * @example
 *   const players = useGameSlice((g) => g.players);
 *   const placar = useGameSlice((g) => g.playing?.countGoals());
 */
export function useGameSlice<T>(selector: (game: GameManager) => T): T {
  const { manager } = useSoccer();

  const subscribe = useCallback(
    (listener: () => void) => manager.subscribe(listener),
    [manager],
  );
  const getSnapshot = useCallback(() => manager.version, [manager]);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(manager);
}
