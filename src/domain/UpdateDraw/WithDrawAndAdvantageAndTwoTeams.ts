import { GameManager } from '../GameManager';
import { Match, ResultMatch } from '../Match';
import { BaseUpdateDrawHandler, HandleInput } from './UpdateDraw.handler';

export class WithDrawAndAdvantageAndTwoTeams extends BaseUpdateDrawHandler {
  override handle(input: HandleInput): void {
    if (
      input.game.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithAdvantageAndTwoTeams(input)
    ) {
      input.game.relocateTeam(input.game.advantageToNext!);
      input.game.relocateTeam(
        input.game.playing?.getOtherTeam(input.game.advantageToNext!),
      );
      input.game.playing = undefined;
      input.game.advantageToNext = undefined;
      input.game.setPlayingGame();
      return;
    }
    super.handle(input);
  }

  isDrawWithAdvantageAndTwoTeams(input: HandleInput): boolean {
    if (
      input.game.advantageToNext &&
      !input.externalAdvantage &&
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
