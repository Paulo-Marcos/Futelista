import { GameManager } from '../GameManager';
import { Team } from '../Team';

/**
 * Contrato (Chain of Responsibility) para handlers pós-partida.
 *
 * Cada handler decide se "trata" o input — caso contrário delega ao próximo.
 * O encadeamento é montado em `FinalResultProcessor`. Apesar do nome do
 * arquivo, a cadeia cobre vitória + diferentes cenários de empate.
 */
export interface UpdateDrawHandler {
  setNextHandler(handler: UpdateDrawHandler): UpdateDrawHandler;
  handle(input: HandleInput): void;
}

/**
 * Base que implementa o encadeamento "setNextHandler + super.handle".
 * Handlers concretos sobrescrevem `handle` chamando `super.handle(input)`
 * quando o cenário não bate com o seu critério.
 */
export abstract class BaseUpdateDrawHandler implements UpdateDrawHandler {
  private nextHandler?: UpdateDrawHandler;

  setNextHandler(handler: UpdateDrawHandler): UpdateDrawHandler {
    this.nextHandler = handler;
    return handler;
  }

  handle(input: HandleInput): void {
    if (this.nextHandler) {
      this.nextHandler.handle(input);
    }
  }
}

/**
 * Entrada da cadeia de handlers — referência ao agregado e, opcionalmente,
 * um time com "vantagem externa" (definida manualmente pelo usuário).
 */
export type HandleInput = {
  game: GameManager;
  externalAdvantage?: Team;
};
