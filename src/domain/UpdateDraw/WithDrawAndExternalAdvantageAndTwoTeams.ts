import { Match, ResultMatch } from '../Match';
import { BaseUpdateDrawHandler, HandleInput } from './UpdateDraw.handler';

/**
 * Cenário pós-partida: EMPATE com **vantagem externa** (definida manualmente)
 * e fila cheia (≥ 2 times completos esperando).
 *
 * Ambos os times da partida vão pro fim da fila (com vantagem externa
 * primeiro) e a próxima partida sai dos 2 primeiros da fila restante.
 * Espelha o cenário com vantagem interna, mas com `externalAdvantage`
 * em vez de `advantageToNext`.
 */
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
    return (
      !input.game.advantageToNext &&
      !!input.externalAdvantage &&
      this.filaTemDoisTimesCheios(input.game)
    );
  }
}
