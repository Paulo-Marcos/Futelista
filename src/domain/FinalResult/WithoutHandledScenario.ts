import { ResultMatch } from "../Match";
import { BaseFinalResultHandler, HandleInput } from "./FinalResult.handler";

/**
 * Fim da cadeia: partida encerrada que nenhum handler tratou. Antes, a
 * cadeia terminava em silêncio — a fila não girava e `playing` ficava presa
 * na partida já encerrada. Lança erro de domínio para a UI exibir.
 */
export class WithoutHandledScenario extends BaseFinalResultHandler {
  override handle(input: HandleInput): void {
    const result = input.jogo.playing?.result;
    if (result === undefined) return;
    if (result === ResultMatch.DRAW && !input.jogo.advantageToNext)
      throw Error("Empate sem vantagem: escolha o time que segue jogando.");
    throw Error(
      "Não foi possível definir a próxima partida para esse resultado.",
    );
  }
}
