import { GestorJogo } from '../GestorJogo';
import { Team } from '../Team';

/**
 * Contrato (Chain of Responsibility) para handlers pós-partida.
 *
 * Cada handler decide se "trata" o input — caso contrário delega ao próximo.
 * O encadeamento é montado em `FinalResultProcessor`. Apesar do nome do
 * arquivo, a cadeia cobre vitória + diferentes cenários de empate.
 */
export interface FinalResultHandler {
  setNextHandler(handler: FinalResultHandler): FinalResultHandler;
  handle(input: HandleInput): void;
}

/**
 * Base que implementa o encadeamento "setNextHandler + super.handle".
 * Handlers concretos sobrescrevem `handle` chamando `super.handle(input)`
 * quando o cenário não bate com o seu critério.
 */
export abstract class BaseFinalResultHandler implements FinalResultHandler {
  private nextHandler?: FinalResultHandler;

  setNextHandler(handler: FinalResultHandler): FinalResultHandler {
    this.nextHandler = handler;
    return handler;
  }

  handle(input: HandleInput): void {
    if (this.nextHandler) {
      this.nextHandler.handle(input);
    }
  }

  /**
   * `true` quando há um segundo time completo na fila — usado para
   * distinguir cenários "fila cheia" (≥ 2 times prontos) de "fila parcial"
   * em vários handlers de empate.
   */
  protected filaTemDoisTimesCheios(game: GestorJogo): boolean {
    const segundo = game.getNthNext(2);
    return !!segundo && segundo.fullTeam;
  }
}

/**
 * Entrada da cadeia de handlers — referência ao agregado e, opcionalmente,
 * um time com "vantagem externa" (definida manualmente pelo usuário).
 */
export type HandleInput = {
  game: GestorJogo;
  externalAdvantage?: Team;
};
