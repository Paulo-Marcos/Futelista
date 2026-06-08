import React from "react";

import { SoccerContext, SoccerContextValue } from "@/src/app-shell/soccerContext";
import type { GestorJogo } from "@/src/domain/GestorJogo";

/**
 * Factory de um SoccerContextValue completo, com todos os métodos
 * sendo jest.fn() resolvendo para um default razoável.
 *
 * O teste pode sobrescrever campos específicos via parâmetro overrides.
 */
export function buildSoccerContextValue(
  overrides: Partial<SoccerContextValue> = {},
): SoccerContextValue {
  const noop = jest.fn<Promise<any>, any[]>().mockResolvedValue(undefined);

  return {
    gestor: null as GestorJogo | null,
    saving: false,

    criarPelada: jest.fn().mockResolvedValue({ id: "pelada-1", nome: "Stub" }),
    atualizarPelada: jest
      .fn()
      .mockResolvedValue({ id: "pelada-1", nome: "Stub" }),
    excluirPelada: noop,
    arquivarPelada: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
    desarquivarPelada: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
    listarPeladas: jest.fn().mockResolvedValue([]),
    carregarPelada: jest.fn().mockResolvedValue(null),

    iniciarExecucao: noop,
    iniciarExecucaoAvulsa: noop,
    finalizarExecucao: noop,
    voltarParaGestao: noop,
    salvarExecucaoAtualComoPelada: jest
      .fn()
      .mockResolvedValue({ id: "pelada-1", nome: "Stub" }),
    limparJogadoresETimes: noop,
    selecionarExecucao: noop,
    listarExecucoesDe: jest.fn().mockResolvedValue([]),
    carregarExecucoesDe: jest.fn().mockResolvedValue([]),
    exportarBackup: jest
      .fn()
      .mockResolvedValue('{"version":1,"app":"FuteLista","exportadoEm":0,"items":[]}'),
    setFotoDoJogador: noop,

    // Repositório bruto — só pra satisfazer o tipo. Sobrescreva nos testes
    // que dependem dele.
    repositorio: {} as SoccerContextValue["repositorio"],

    ...overrides,
  };
}

export function SoccerStubProvider({
  value,
  children,
}: {
  value: SoccerContextValue;
  children: React.ReactNode;
}) {
  return (
    <SoccerContext.Provider value={value}>{children}</SoccerContext.Provider>
  );
}
