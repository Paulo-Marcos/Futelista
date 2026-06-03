import { Match, ResultMatch } from '../Match';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';

/**
 * Cenário pós-partida: EMPATE com `advantageToNext` setada e fila parcial
 * (sem 2 times completos esperando).
 *
 * Time com vantagem permanece e enfrenta o primeiro da fila; o outro time
 * da partida vai pro fim. Vantagem é "consumida".
 */
export class WithDrawAndAdvantageAndNotTwoTeams extends BaseFinalResultHandler {
  override handle(input: HandleInput): void {
    if (
      input.game.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithAdvantageAndNotTwoTeams(input)
    ) {
      const loser = input.game.getOtherPlayingTeam(input.game.advantageToNext!);
      input.game.relocateTeam(loser);
      input.game.playing = new Match(
        input.game.advantageToNext!,
        input.game.tirarDaFila(),
      );
      return;
    }
    super.handle(input);
  }

  isDrawWithAdvantageAndNotTwoTeams(input: HandleInput): boolean {
    return (
      !!input.game.advantageToNext &&
      !input.externalAdvantage &&
      !this.filaTemDoisTimesCheios(input.game)
    );
  }
}
