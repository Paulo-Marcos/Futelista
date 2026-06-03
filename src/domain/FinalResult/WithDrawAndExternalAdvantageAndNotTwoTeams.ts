import { Match, ResultMatch } from '../Match';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';

/**
 * Cenário pós-partida: EMPATE com **vantagem externa** (definida manualmente)
 * e fila parcial.
 *
 * Time apontado pela vantagem externa segue jogando contra o primeiro da
 * fila; o outro time da partida vai pro fim. `advantageToNext` é zerada.
 */
export class WithDrawAndExternalAdvantageAndNotTwoTeams extends BaseFinalResultHandler {
  override handle(input: HandleInput): void {
    if (
      input.game.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithExternalAdvantageAndNotTwoTeams(input)
    ) {
      input.game.relocateTeam(input.game.getOtherPlayingTeam(input.externalAdvantage!));
      input.game.playing = new Match(
        input.externalAdvantage!,
        input.game.tirarDaFila(),
      );
      input.game.advantageToNext = undefined;
      return;
    }
    super.handle(input);
  }

  isDrawWithExternalAdvantageAndNotTwoTeams(input: HandleInput): boolean {
    return (
      !input.game.advantageToNext &&
      !!input.externalAdvantage &&
      !this.filaTemDoisTimesCheios(input.game)
    );
  }
}
