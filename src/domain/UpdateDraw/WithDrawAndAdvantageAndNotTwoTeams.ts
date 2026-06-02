import { GameManager } from '../GameManager';
import { Match, ResultMatch } from '../Match';
import { BaseUpdateDrawHandler, HandleInput } from './UpdateDraw.handler';

/**
 * Cenário pós-partida: EMPATE com `advantageToNext` setada e fila parcial
 * (sem 2 times completos esperando).
 *
 * Time com vantagem permanece e enfrenta o primeiro da fila; o outro time
 * da partida vai pro fim. Vantagem é "consumida".
 */
export class WithDrawAndAdvantageAndNotTwoTeams extends BaseUpdateDrawHandler {
  override handle(input: HandleInput): void {
    if (
      input.game.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithAdvantageAndNotTwoTeams(input)
    ) {
      const loser = input.game.getOtherPlayingTeam(input.game.advantageToNext!);
      input.game.relocateTeam(loser);
      input.game.playing = new Match(
        input.game.advantageToNext!,
        input.game.removeFirstNext(),
      );
      return;
    }
    super.handle(input);
  }

  isDrawWithAdvantageAndNotTwoTeams(input: HandleInput): boolean {
    if (
      input.game.advantageToNext &&
      !input.externalAdvantage &&
      !this.hasSecondNextAndIsFull(input.game)
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
