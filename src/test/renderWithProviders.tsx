import { render, RenderOptions, screen } from "@testing-library/react-native";
import React from "react";
import { Pressable } from "react-native";

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

/**
 * No RN 0.81 o `Pressable` passou a ser um `React.memo`, então
 * `screen.UNSAFE_getAllByType(Pressable)` deixou de casar — a árvore de
 * teste expõe o componente interno do memo, não o wrapper. Aqui
 * desembrulhamos o memo (`.type`) para voltar a encontrar todos os
 * Pressable na ordem de renderização, preservando suas props
 * (`disabled`, `accessibilityLabel`). Fallback para `Pressable` caso a
 * RN deixe de envolvê-lo em memo no futuro.
 */
const PressableComponent =
  (Pressable as unknown as { type?: React.ComponentType }).type ?? Pressable;

/** Todos os Pressable renderizados, na ordem da árvore. */
export function getAllPressables() {
  return screen.UNSAFE_getAllByType(PressableComponent as React.ComponentType);
}

/** Re-export de utilitários comuns para teste pegar de um lugar só. */
export { fireEvent, screen, waitFor, act } from "@testing-library/react-native";
