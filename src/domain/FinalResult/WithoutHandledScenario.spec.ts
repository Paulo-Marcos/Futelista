import { GestorJogo } from "../GestorJogo";
import { ChoosingTeams, Rules } from "../Rules";
import { WithoutHandledScenario } from "./WithoutHandledScenario";

describe("WithoutHandledScenario", () => {
  function jogoEmAndamento(): GestorJogo {
    const rules = new Rules({
      playersPerTeam: 2,
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    const jogo = new GestorJogo("Pelada", rules);
    jogo.setPlayers(["A1", "A2", "B1", "B2", "C1", "C2"]);
    jogo.criarTimes();
    jogo.setPlayingGame();
    return jogo;
  }

  it("deverá lançar erro de domínio para empate sem vantagem", () => {
    const jogo = jogoEmAndamento();
    jogo.setResult();

    expect(() => new WithoutHandledScenario().handle({ jogo })).toThrow(
      "Empate sem vantagem: escolha o time que segue jogando.",
    );
  });

  it("deverá lançar erro genérico de domínio para empate com as duas vantagens", () => {
    const jogo = jogoEmAndamento();
    jogo.setResult();
    jogo.advantageToNext = jogo.playing!.teamA;

    expect(() =>
      new WithoutHandledScenario().handle({
        jogo,
        externalAdvantage: jogo.playing!.teamB,
      }),
    ).toThrow("Não foi possível definir a próxima partida para esse resultado.");
  });

  it("não deverá fazer nada quando a partida ainda não tem resultado", () => {
    const jogo = jogoEmAndamento();

    expect(() => new WithoutHandledScenario().handle({ jogo })).not.toThrow();
  });
});
