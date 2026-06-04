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
    if (input.jogo.playing?.result === ResultMatch.VICTORY) {
      input.jogo.relocateTeam(input.jogo.playing?.loser!);
      input.jogo.advantageToNext = input.jogo.playing.winner!;
      input.jogo.playing = new Match(
        input.jogo.playing?.winner!,
        input.jogo.tirarDaFila(),
      );
      return;
    }
    super.handle(input);
  }
}
