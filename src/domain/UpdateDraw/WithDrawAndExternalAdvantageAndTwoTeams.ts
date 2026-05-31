import { GameManager } from '../GameManager';
import { Match, ResultMatch } from '../Match';
import { BaseUpdateDrawHandler, HandleInput } from './UpdateDraw.handler';

export class WithDrawAndExternalAdvantageAndTwoTeams extends BaseUpdateDrawHandler {
  override handle(input: HandleInput): void {
    if (
      input.game.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithExternalAdvantageAndTwoTeams(input)
    ) {
      input.game.relocateTeam(input.externalAdvantage!);
      input.game.relocateTeam(input.game.getOtherPlayingTeam(input.externalAdvantage!));
      input.game.playing = undefined;
      input.game.advantageToNext = undefined;
      input.game.setPlayingGame();
      return;
    }
    super.handle(input);
  }

  isDrawWithExternalAdvantageAndTwoTeams(input: HandleInput): boolean {
    if (
      !input.game.advantageToNext &&
      input.externalAdvantage &&
      this.hasSecondNextAndIsFull(input.game)
    )
      return true;
    return false;
  }

  hasSecondNextAndIsFull(game: GameManager): boolean {
    if (!game.getNthNext(2)) return false;
    if (!game.getNthNext(2).fullTeam) return false;
    return true;
  }
}
