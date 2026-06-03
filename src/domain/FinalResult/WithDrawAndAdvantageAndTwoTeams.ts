import { Match, ResultMatch } from '../Match';
import { BaseUpdateDrawHandler, HandleInput } from './FinalResult.handler';

/**
 * Cenário pós-partida: EMPATE com `advantageToNext` setada e fila cheia
 * (≥ 2 times completos esperando).
 *
 * Ambos os times da partida vão pro fim da fila (vantagem primeiro) e a
 * próxima partida sai dos 2 primeiros da fila restante.
 */
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
    return (
      !!input.game.advantageToNext &&
      !input.externalAdvantage &&
      this.filaTemDoisTimesCheios(input.game)
    );
  }
}
