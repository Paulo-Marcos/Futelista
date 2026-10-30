import { ResultMatch } from "../Match";
import { BaseFinalResultHandler, HandleInput } from "./FinalResult.handler";

/**
 * Cenário pós-partida: EMPATE sem vantagem nenhuma (nem prévia, nem externa)
 * e fila cheia (≥ 2 times completos esperando).
 *
 * Ninguém tem direito de ficar: os dois times da partida vão pro fim da
 * fila e a próxima partida sai dos 2 primeiros da fila restante.
 */
export class WithDrawAndNoAdvantageAndTwoTeams extends BaseFinalResultHandler {
  override handle(input: HandleInput): void {
    if (
      input.jogo.playing?.result === ResultMatch.DRAW &&
      this.isDrawWithNoAdvantageAndTwoTeams(input)
    ) {
      const { teamA, teamB } = input.jogo.playing;
      input.jogo.realocarTime(teamA);
      input.jogo.realocarTime(teamB);
      input.jogo.playing = undefined;
      input.jogo.setPlayingGame();
      return;
    }
    super.handle(input);
  }

  isDrawWithNoAdvantageAndTwoTeams(input: HandleInput): boolean {
    return (
      !input.jogo.advantageToNext &&
      !input.externalAdvantage &&
      this.filaTemDoisTimesCheios(input.jogo)
    );
  }
}
