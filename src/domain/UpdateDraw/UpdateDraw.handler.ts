import { GameManager } from '../GameManager';
import { Team } from '../Team';

export interface UpdateDrawHandler {
  setNextHandler(handler: UpdateDrawHandler): UpdateDrawHandler;
  handle(input: HandleInput): void;
}

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

export type HandleInput = {
  game: GameManager;
  externalAdvantage?: Team;
};
