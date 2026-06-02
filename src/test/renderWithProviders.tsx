import { render, RenderOptions } from "@testing-library/react-native";
import React from "react";

import type { SoccerContextValue } from "@/src/app-shell/soccerContext";

import {
  buildSoccerContextValue,
  SoccerStubProvider,
} from "./soccerContextStub";

type Options = Omit<RenderOptions, "wrapper"> & {
  /** Overrides aplicados ao SoccerContextValue do teste. */
  soccer?: Partial<SoccerContextValue>;
};

/**
 * Render padrão para componentes/telas do FuteLista.
 *
 * Empacota o componente num SoccerContext.Provider com os métodos
 * mockados. Retorna `soccer` (o value efetivamente usado) pra que o
 * teste possa fazer assertions sobre chamadas (ex.: expect(soccer.criarPelada).toHaveBeenCalled()).
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: Options = {},
) {
  const { soccer: soccerOverrides, ...renderOptions } = options;
  const soccer = buildSoccerContextValue(soccerOverrides);

  const utils = render(
    <SoccerStubProvider value={soccer}>{ui}</SoccerStubProvider>,
    renderOptions,
  );

  return { ...utils, soccer };
}

/** Re-export de utilitários comuns para teste pegar de um lugar só. */
export { fireEvent, screen, waitFor, act } from "@testing-library/react-native";
