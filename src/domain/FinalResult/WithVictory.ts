import { Match, ResultMatch } from '../Match';
import { BaseFinalResultHandler, HandleInput } from './FinalResult.handler';

/**
 * Cenário pós-partida: VITÓRIA.
 *
 * Vencedor segue jogando contra o primeiro da fila e recebe `advantageToNext`.
 * Perdedor é realocado ao fim da fila.
 */
export class WithVictory extends BaseFinalResultHandler {
  override handle(input: HandleInput): void {
    if (input.game.playing?.result === ResultMatch.VICTORY) {
      input.game.relocateTeam(input.game.playing?.loser!);
      input.game.advantageToNext = input.game.playing.winner!;
      input.game.playing = new Match(
        input.game.playing?.winner!,
        input.game.tirarDaFila(),
      );
      return;
    }
    super.handle(input);
  }
}
