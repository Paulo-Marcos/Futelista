import { GestorJogo } from "../GestorJogo";
import { ChoosingTeams, Rules } from "../Rules";
import { WithDrawAndNoAdvantageAndTwoTeams } from "./WithDrawAndNoAdvantageAndTwoTeams";

describe("WithDrawAndNoAdvantageAndTwoTeams", () => {
  function jogoEmpatado(nomes: string[]): GestorJogo {
    const rules = new Rules({
      playersPerTeam: 2,
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    const jogo = new GestorJogo("Pelada", rules);
    jogo.setPlayers(nomes);
    jogo.criarTimes();
    jogo.setPlayingGame();
    jogo.setResult();
    return jogo;
  }

  it("deverá mandar os dois times pro fim e iniciar a partida com os próximos", () => {
    const jogo = jogoEmpatado(["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"]);
    const { teamA, teamB } = jogo.playing!;
    const [timeC, timeD] = jogo.next;

    new WithDrawAndNoAdvantageAndTwoTeams().handle({ jogo });

    expect([jogo.playing!.teamA, jogo.playing!.teamB]).toEqual([timeC, timeD]);
    expect(jogo.next).toEqual([teamA, teamB]);
  });

  it("não deverá tratar empate quando a fila não tem dois times cheios", () => {
    const jogo = jogoEmpatado(["A1", "A2", "B1", "B2", "C1", "C2"]);
    const partida = jogo.playing;

    new WithDrawAndNoAdvantageAndTwoTeams().handle({ jogo });

    expect(jogo.playing).toBe(partida);
  });
});
