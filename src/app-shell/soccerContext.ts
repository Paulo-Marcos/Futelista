import { createContext } from "react";

import { GestorJogo } from "@/src/domain/GestorJogo";
import { Pelada } from "@/src/domain/Pelada";
import {
  RepositorioPelada,
  ResumoExecucao,
  ResumoPeladaTipo,
} from "@/src/domain/ports/RepositorioPelada";
import { DataRules } from "@/src/domain/Rules";

export type AgendaPelada = {
  dia?: string;
  hora?: string;
  local?: string;
};

export type SoccerContextValue = {
  /**
   * Execução ativa, ou null quando nenhuma execução está aberta — o app
   * volta ao "estado de gestão" (tela inicial só com peladas cadastradas).
   */
  gestor: GestorJogo | null;
  saving: boolean;

  // ----- Pelada (tipo cadastrado) ------------------------------------
  criarPelada: (
    nome: string,
    regras?: DataRules,
    agenda?: AgendaPelada,
  ) => Promise<Pelada>;
  atualizarPelada: (
    id: string,
    patch: { nome?: string; regras?: DataRules; agenda?: AgendaPelada },
  ) => Promise<Pelada>;
  excluirPelada: (id: string) => Promise<void>;
  listarPeladas: () => Promise<ResumoPeladaTipo[]>;
  carregarPelada: (id: string) => Promise<Pelada | null>;

  // ----- Execução (sessão jogada) ------------------------------------
  /**
   * Cria nova execução vinculada a uma Pelada cadastrada.
   * Regras vêm da Pelada; nome default é o nome da Pelada.
   */
  iniciarExecucao: (
    peladaId: string,
    opcoes?: { nomeExecucao?: string; herdarJogadores?: boolean },
  ) => Promise<void>;
  /**
   * Cria nova execução sem vincular a nenhuma Pelada (peladaId undefined).
   * Útil pra um jogo casual que ainda não vale cadastrar.
   */
  iniciarExecucaoAvulsa: (nome?: string, regras?: DataRules) => Promise<void>;
  /**
   * Encerra a execução ativa (status FINALIZADA + endedAt) e zera a slot
   * de ativa — volta à tela de gestão.
   */
  finalizarExecucao: () => Promise<void>;
  /**
   * Deixa a execução salva como está (sem finalizar) e volta à tela de
   * gestão. Útil pra "pausar" sem perder o trabalho.
   */
  voltarParaGestao: () => Promise<void>;
  /**
   * Converte a execução atual (esperadamente avulsa) em uma execução
   * vinculada a uma Pelada cadastrada nova com nome + regras (default:
   * as regras atuais).
   */
  salvarExecucaoAtualComoPelada: (
    nome: string,
    regras?: DataRules,
  ) => Promise<Pelada>;
  /** Limpa jogadores e times da execução atual sem encerrá-la. */
  limparJogadoresETimes: () => Promise<void>;
  /** Troca a execução ativa para outra já salva. */
  selecionarExecucao: (id: string) => Promise<void>;
  listarExecucoesDe: (peladaId: string) => Promise<ResumoExecucao[]>;

  /** Reexposto para uso avançado (telas de dev, debug). */
  repositorio: RepositorioPelada;
};

export const SoccerContext = createContext({} as SoccerContextValue);
