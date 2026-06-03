import { HandleInput, UpdateDrawHandler } from './UpdateDraw.handler';
import { WithDrawAndAdvantageAndNotTwoTeams } from './WithDrawAndAdvantageAndNotTwoTeams';
import { WithDrawAndAdvantageAndTwoTeams } from './WithDrawAndAdvantageAndTwoTeams';
import { WithDrawAndExternalAdvantageAndNotTwoTeams } from './WithDrawAndExternalAdvantageAndNotTwoTeams';
import { WithDrawAndExternalAdvantageAndTwoTeams } from './WithDrawAndExternalAdvantageAndTwoTeams';
import { WithVictory } from './WithVictory';

/**
 * Encadeia os handlers pós-partida (Chain of Responsibility).
 *
 * Ordem: vitória → empate com vantagem interna (parcial/cheia) → empate
 * com vantagem externa (parcial/cheia). Cada handler dispara apenas se
 * o cenário bate; caso contrário delega ao próximo.
 */
export class FinalResultProcessor {
  private handlerChain: UpdateDrawHandler;

  constructor() {
    const withVictory = new WithVictory();
    const withAdvantageAndNotTwoTeams = new WithDrawAndAdvantageAndNotTwoTeams();
    const withAdvantageAndTwoTeams = new WithDrawAndAdvantageAndTwoTeams();
    const withExternalAdvantageAndNotTwoTeams =
      new WithDrawAndExternalAdvantageAndNotTwoTeams();
    const withExternalAdvantageAndTwoTeams =
      new WithDrawAndExternalAdvantageAndTwoTeams();

    withVictory
      .setNextHandler(withAdvantageAndNotTwoTeams)
      .setNextHandler(withAdvantageAndTwoTeams)
      .setNextHandler(withExternalAdvantageAndNotTwoTeams)
      .setNextHandler(withExternalAdvantageAndTwoTeams);

    this.handlerChain = withVictory;
  }

  process(input: HandleInput): void {
    this.handlerChain.handle(input);
  }
}
