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
  /** Dia preferencial (ex.: "Quartas", "Sábados"). Decorativo no resumo da lista. */
  dia?: string;
  /** Horário preferencial (ex.: "21:00"). Decorativo no resumo da lista. */
  hora?: string;
  /** Local preferencial (ex.: "Quadra do CEF"). Decorativo no resumo da lista. */
  local?: string;
  /**
   * Observações livres da pelada (notas do organizador). Texto multilinha,
   * preservado entre boots. Decorativo — não afeta nenhuma regra. Trim:
   * string vazia ou só espaços vira `undefined`.
   */
  observacoes?: string;

  constructor(input: DadosPelada) {
    if (!input.nome || !input.nome.trim()) {
      throw Error("Nome da pelada é obrigatório.");
    }
    this.id = input.id ?? uuid.v4();
    this.nome = input.nome.trim();
    this.regras =
      input.regras instanceof Rules ? input.regras : new Rules(input.regras);
    this.createdAt = input.createdAt ?? Date.now();
    this.dia = trimOrUndefined(input.dia);
    this.hora = trimOrUndefined(input.hora);
    this.local = trimOrUndefined(input.local);
    this.observacoes = trimOrUndefined(input.observacoes);
  }

  atualizarAgenda(patch: {
    dia?: string;
    hora?: string;
    local?: string;
  }): void {
    if (patch.dia !== undefined) this.dia = trimOrUndefined(patch.dia);
    if (patch.hora !== undefined) this.hora = trimOrUndefined(patch.hora);
    if (patch.local !== undefined) this.local = trimOrUndefined(patch.local);
  }

  /**
   * Substitui as observações da pelada. Passar string vazia (ou só espaços)
   * remove o campo. Passar `undefined` é no-op (mantém o valor atual).
   */
  atualizarObservacoes(texto: string | undefined): void {
    if (texto === undefined) return;
    this.observacoes = trimOrUndefined(texto);
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
  dia?: string;
  hora?: string;
  local?: string;
  observacoes?: string;
};

function trimOrUndefined(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const limpo = value.trim();
  return limpo === "" ? undefined : limpo;
}
