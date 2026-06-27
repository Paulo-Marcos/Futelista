import { GestorJogo } from "./GestorJogo";
import { Match } from "./Match";
import { ChoosingTeams, Rules } from "./Rules";
import { ResultMatch } from "./ResultMatch";
import { Team } from "./Team";

/**
 * Cobre `totalPartidasEncerradas` — regra "uma partida conta quando tem
 * resultado definido", trazida da tela de jogadores para o domínio.
 */
describe("GestorJogo.totalPartidasEncerradas", () => {
  function novoJogo(): GestorJogo {
    const rules = new Rules({
      playersPerTeam: 2,
      goalLimit: 1,
      choosingTeams: ChoosingTeams.BY_ORDER,
    });
    return new GestorJogo("Pelada", rules);
  }

  function partida(comResultado: boolean): Match {
    const m = new Match(new Team({ limit: 2 }), new Team({ limit: 2 }));
    if (comResultado) m.result = ResultMatch.VICTORY;
    return m;
  }

  it("retorna 0 quando nenhuma partida foi encerrada", () => {
    const jogo = novoJogo();
    expect(jogo.totalPartidasEncerradas()).toBe(0);
  });

  it("conta apenas as partidas com resultado definido", () => {
    const jogo = novoJogo();
    jogo.matches.push(partida(true), partida(true), partida(true));
    expect(jogo.totalPartidasEncerradas()).toBe(3);
  });

  it("ignora partida sem resultado (ainda em andamento) na contagem", () => {
    const jogo = novoJogo();
    jogo.matches.push(partida(true), partida(false), partida(true));
    expect(jogo.totalPartidasEncerradas()).toBe(2);
  });
});
