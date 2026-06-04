import "react-native-get-random-values";
import * as uuid from "uuid";

import { DataRules, Rules } from "./Rules";

/**
 * Pelada — o **tipo** cadastrado pelo usuário (ex.: "Fute CEF", "Fute BB").
 *
 * Não confunda com `GestorJogo`, que representa uma **execução** específica
 * (uma sessão jogada num dia). A Pelada agrupa execuções que compartilham
 * nome e regras default.
 *
 * Pelada é um Aggregate Root simples: nome + regras default + id estável.
 * Mudanças de regras criam um snapshot novo (regras viajam por valor).
 */
export class Pelada {
  readonly id: string;
  nome: string;
  regras: Rules;
  readonly createdAt: number;

  constructor(input: DadosPelada) {
    if (!input.nome || !input.nome.trim()) {
      throw Error("Nome da pelada é obrigatório.");
    }
    this.id = input.id ?? uuid.v4();
    this.nome = input.nome.trim();
    this.regras =
      input.regras instanceof Rules ? input.regras : new Rules(input.regras);
    this.createdAt = input.createdAt ?? Date.now();
  }

  /**
   * Renomeia a pelada validando que o nome não fica vazio.
   */
  renomear(novoNome: string): void {
    const limpo = novoNome.trim();
    if (!limpo) throw Error("Nome da pelada é obrigatório.");
    this.nome = limpo;
  }

  /**
   * Substitui as regras default da pelada. A próxima execução iniciada a
   * partir desta pelada já nasce com as regras novas; execuções antigas
   * mantêm as regras com que foram criadas (regras viajam por valor).
   */
  atualizarRegras(novas: DataRules): void {
    this.regras = this.regras.merge(novas);
  }
}

export type DadosPelada = {
  id?: string;
  nome: string;
  regras?: Rules | DataRules;
  createdAt?: number;
};
