import { GameManager } from '../GameManager';
import { Match, ResultMatch } from '../Match';
import { BaseUpdateDrawHandler, HandleInput } from './UpdateDraw.handler';

/**
 * Cenário pós-partida: EMPATE com **vantagem externa** (definida manualmente)
 * e fila parcial.
 *
 * Time apontado pela vantagem externa segue jogando contra o primeiro da
 * fila; o outro time da partida vai pro fim. `advantageToNext` é zerada.
 */
export class WithDrawAndExternalAdvantageAndNotTwoTeams extends BaseUpdateDrawHandler {
  override handle(input: HandleInput): void {
    if (
      input.game.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithExternalAdvantageAndNotTwoTeams(input)
    ) {
      input.game.relocateTeam(input.game.getOtherPlayingTeam(input.externalAdvantage!));
      input.game.playing = new Match(
        input.externalAdvantage!,
        input.game.removeFirstNext(),
      );
      input.game.advantageToNext = undefined;
      return;
    }
    super.handle(input);
  }

  isDrawWithExternalAdvantageAndNotTwoTeams(input: HandleInput): boolean {
    if (
      !input.game.advantageToNext &&
      input.externalAdvantage &&
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
