import { Match, ResultMatch } from '../Match';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';

/**
 * Cenário pós-partida: EMPATE com **vantagem externa** (definida manualmente)
 * e fila cheia (≥ 2 times completos esperando).
 *
 * Ambos os times da partida vão pro fim da fila (com vantagem externa
 * primeiro) e a próxima partida sai dos 2 primeiros da fila restante.
 * Espelha o cenário com vantagem interna, mas com `externalAdvantage`
 * em vez de `advantageToNext`.
 */
export class WithDrawAndExternalAdvantageAndTwoTeams extends BaseFinalResultHandler {
  override handle(input: HandleInput): void {
    if (
      input.jogo.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithExternalAdvantageAndTwoTeams(input)
    ) {
      input.jogo.relocateTeam(input.externalAdvantage!);
      input.jogo.relocateTeam(input.jogo.getOtherPlayingTeam(input.externalAdvantage!));
      input.jogo.playing = undefined;
      input.jogo.advantageToNext = undefined;
      input.jogo.setPlayingGame();
      return;
    }
    super.handle(input);
  }

  isDrawWithExternalAdvantageAndTwoTeams(input: HandleInput): boolean {
    return (
      !input.jogo.advantageToNext &&
      !!input.externalAdvantage &&
      this.filaTemDoisTimesCheios(input.jogo)
    );
  }
}
