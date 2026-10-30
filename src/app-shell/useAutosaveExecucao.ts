import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

import { AUTOSAVE_DEBOUNCE_MS } from "@/src/app-shell/constants";
import { GestorJogo } from "@/src/domain/GestorJogo";

/**
 * Mantém a execução ativa gravada e o cronômetro honesto com o relógio real.
 *
 *  - Grava (debounced) só quando `versaoEstado` muda: o tick do cronômetro
 *    não muda nada persistível, e serializar o grafo a cada segundo era caro.
 *  - Ao ir para segundo plano grava na hora o que estiver pendente — o SO
 *    pode matar o app sem aviso.
 *  - Ao voltar, recalcula o cronômetro pelo relógio (o tick ficou congelado).
 *  - Ao trocar/fechar a execução, solta o tick do gestor que saiu de cena.
 */
export function useAutosaveExecucao(
  gestor: GestorJogo | null,
  salvar: (gestor: GestorJogo) => void,
): void {
  useEffect(() => {
    if (!gestor) return;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let versaoSalva = gestor.versaoEstado;

    const salvarAgora = () => {
      timeoutId = undefined;
      versaoSalva = gestor.versaoEstado;
      salvar(gestor);
    };

    const aoMudar = () => {
      if (gestor.versaoEstado === versaoSalva) return;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(salvarAgora, AUTOSAVE_DEBOUNCE_MS);
    };

    const aoMudarAppState = (estado: AppStateStatus) => {
      if (estado === "active") {
        gestor.sincronizarCronometro();
        return;
      }
      if (!timeoutId) return;
      clearTimeout(timeoutId);
      salvarAgora();
    };

    // Religa o tick de um cronômetro que já corria (remontagem do efeito).
    gestor.sincronizarCronometro();
    const desinscrever = gestor.subscribe(aoMudar);
    const appState = AppState.addEventListener("change", aoMudarAppState);
    return () => {
      desinscrever();
      appState.remove();
      if (timeoutId) clearTimeout(timeoutId);
      gestor.liberarCronometro();
    };
  }, [gestor, salvar]);
}
