import { HandleInput, UpdateDrawHandler } from './UpdateDraw.handler';
import { WithDrawAndAdvantageAndNotTwoTeams } from './WithDrawAndAdvantageAndNotTwoTeams';
import { WithDrawAndAdvantageAndTwoTeams } from './WithDrawAndAdvantageAndTwoTeams';
import { WithDrawAndExternalAdvantageAndNotTwoTeams } from './WithDrawAndExternalAdvantageAndNotTwoTeams';
import { WithVictory } from './WithVictory';

export class FinalResultProcessor {
  private handlerChain: UpdateDrawHandler;

  constructor() {
    const withAdvantageAndNotTwoTeams = new WithDrawAndAdvantageAndNotTwoTeams();
    const withAdvantageAndTwoTeams = new WithDrawAndAdvantageAndTwoTeams();
    const withExternalAdvantage = new WithDrawAndExternalAdvantageAndNotTwoTeams();
    const withVictory = new WithVictory();

    withVictory
      .setNextHandler(withAdvantageAndNotTwoTeams)
      .setNextHandler(withAdvantageAndTwoTeams)
      .setNextHandler(withExternalAdvantage);

    this.handlerChain = withVictory;
  }

  process(input: HandleInput): void {
    this.handlerChain.handle(input);
  }
}
