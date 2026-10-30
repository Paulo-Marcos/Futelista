import { HandleInput, FinalResultHandler } from "./FinalResult.handler";
import { WithDrawAndAdvantageAndNotTwoTeams } from "./WithDrawAndAdvantageAndNotTwoTeams";
import { WithDrawAndAdvantageAndTwoTeams } from "./WithDrawAndAdvantageAndTwoTeams";
import { WithDrawAndExternalAdvantageAndNotTwoTeams } from "./WithDrawAndExternalAdvantageAndNotTwoTeams";
import { WithDrawAndExternalAdvantageAndTwoTeams } from "./WithDrawAndExternalAdvantageAndTwoTeams";
import { WithDrawAndNoAdvantageAndTwoTeams } from "./WithDrawAndNoAdvantageAndTwoTeams";
import { WithoutHandledScenario } from "./WithoutHandledScenario";
import { WithVictory } from "./WithVictory";

/**
 * Encadeia os handlers pós-partida (Chain of Responsibility).
 *
 * Ordem: vitória → empate com vantagem interna (parcial/cheia) → empate
 * com vantagem externa (parcial/cheia) → empate sem vantagem (fila cheia)
 * → fallback que lança erro de domínio. Cada handler dispara apenas se
 * o cenário bate; caso contrário delega ao próximo.
 */
export class FinalResultProcessor {
  private handlerChain: FinalResultHandler;

  constructor() {
    const withVictory = new WithVictory();
    const withAdvantageAndNotTwoTeams =
      new WithDrawAndAdvantageAndNotTwoTeams();
    const withAdvantageAndTwoTeams = new WithDrawAndAdvantageAndTwoTeams();
    const withExternalAdvantageAndNotTwoTeams =
      new WithDrawAndExternalAdvantageAndNotTwoTeams();
    const withExternalAdvantageAndTwoTeams =
      new WithDrawAndExternalAdvantageAndTwoTeams();
    const withNoAdvantageAndTwoTeams = new WithDrawAndNoAdvantageAndTwoTeams();
    const withoutHandledScenario = new WithoutHandledScenario();

    withVictory
      .setNextHandler(withAdvantageAndNotTwoTeams)
      .setNextHandler(withAdvantageAndTwoTeams)
      .setNextHandler(withExternalAdvantageAndNotTwoTeams)
      .setNextHandler(withExternalAdvantageAndTwoTeams)
      .setNextHandler(withNoAdvantageAndTwoTeams)
      .setNextHandler(withoutHandledScenario);

    this.handlerChain = withVictory;
  }

  process(input: HandleInput): void {
    this.handlerChain.handle(input);
  }
}
