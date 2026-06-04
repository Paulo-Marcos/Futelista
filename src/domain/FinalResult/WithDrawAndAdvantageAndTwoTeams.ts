import { Match, ResultMatch } from '../Match';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';

/**
 * Cenário pós-partida: EMPATE com `advantageToNext` setada e fila cheia
 * (≥ 2 times completos esperando).
 *
 * Ambos os times da partida vão pro fim da fila (vantagem primeiro) e a
 * próxima partida sai dos 2 primeiros da fila restante.
 */
export class WithDrawAndAdvantageAndTwoTeams extends BaseFinalResultHandler {
  override handle(input: HandleInput): void {
    if (
      input.jogo.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithAdvantageAndTwoTeams(input)
    ) {
      input.jogo.relocateTeam(input.jogo.advantageToNext!);
      input.jogo.relocateTeam(
        input.jogo.playing?.getOtherTeam(input.jogo.advantageToNext!),
      );
      input.jogo.playing = undefined;
      input.jogo.advantageToNext = undefined;
      input.jogo.setPlayingGame();
      return;
    }
    super.handle(input);
  }

  isDrawWithAdvantageAndTwoTeams(input: HandleInput): boolean {
    return (
      !!input.jogo.advantageToNext &&
      !input.externalAdvantage &&
      this.filaTemDoisTimesCheios(input.jogo)
    );
  }
}
